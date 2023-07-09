import { useRef, useState, useEffect } from 'react';
import { ComputedResult, Dict, ComputedFn, ScopeType, IFnCtx } from '../typing';
import { isFn, isObj } from '../utils';
import { hookApi, staticApi } from '../helpers/fndep';
import { buildInsComputedResult } from '../helpers/ins';
import { createComputedLogic } from '../factory/createComputed';
import { createAsyncComputedLogic } from '../factory/createAsyncComputed';
import { RENDER_END, RENDER_START, MOUNTED } from '../consts';
import { useForceUpdate } from './useForceUpdate';

const InvalidInputErr = new Error('ERR_NON_COMPUTED_FN_OR_RESULT: useComputed only accept a static computed result or computed fn');

export function useComputedLogic<T extends Dict = Dict>(
  resultOrFn: ComputedResult<T> | ComputedFn<T>,
  options: { enableRecordResultDep?: boolean, careComputeStatus?: boolean },
): [T, boolean] {
  const { enableRecordResultDep, careComputeStatus } = options;
  const fnRef = useRef<any>(null);
  const updater = useForceUpdate();
  const [fnCtx] = useState(() => hookApi.buildFnCtx({ updater, enableRecordResultDep }));
  fnCtx.renderStatus = RENDER_START;
  let resultScopeType: ScopeType = 'hook';
  let isAsync = false;
  let upstreamFnCtx: IFnCtx | null = null;

  if (!fnRef.current) {
    // 传入了局部的临时计算函数
    if (isFn(resultOrFn)) {
      fnRef.current = resultOrFn;
    } else if (isObj(resultOrFn)) {
      // 可能传入了静态计算函数
      // may a static computed result
      const result = resultOrFn;
      upstreamFnCtx = staticApi.getFnCtxByObj(result);
      if (!upstreamFnCtx) {
        // debugger;
        throw InvalidInputErr;
      }
      const ensuredFnCtx = upstreamFnCtx;
      isAsync = upstreamFnCtx.isAsync;
      resultScopeType = upstreamFnCtx.scopeType;
      // 转移输入函数的依赖列表
      fnCtx.depKeys = upstreamFnCtx.depKeys.slice();
      // 做结果中转
      fnRef.current = () => ensuredFnCtx.result;
    } else {
      throw InvalidInputErr;
    }

    if (isAsync && upstreamFnCtx) {
      const ensuredFnCtx = upstreamFnCtx;
      createAsyncComputedLogic(
        () => ({ source: ensuredFnCtx.result, initial: ensuredFnCtx.result }),
        async () => ensuredFnCtx.result,
        {
          scopeType: 'hook' as const, resultScopeType, fnCtxBase: fnCtx, allowTransfer: true,
          runAsync: false, returnUpstreamResult: true, careComputeStatus
        }
      );
    } else {
      createComputedLogic(fnRef.current, { scopeType: 'hook', resultScopeType, fnCtxBase: fnCtx });
    }
    buildInsComputedResult(fnCtx);
  }

  if (fnCtx.enableRecordResultDep) {
    fnCtx.isResultReaded = false; // 待到 proxy 里产生读取行为时，会被置为 true
  }
  if (fnCtx.shouldReplaceResult) {
    buildInsComputedResult(fnCtx);
    fnCtx.shouldReplaceResult = false;
  }

  useEffect(() => {
    fnCtx.renderStatus = RENDER_END;
  });

  useEffect(() => {
    fnCtx.mountStatus = MOUNTED;
    hookApi.recoverDep(fnCtx);
    return () => {
      hookApi.delFnCtx(fnCtx);
    };
  }, [fnCtx]);

  // let isComputing = fnCtx.isComputing;
  // if (fnCtx.transferFnCtx) {
  //   isComputing = fnCtx.transferFnCtx.isComputing;
  // }

  // return [fnCtx.proxyResult, isComputing];
  return [fnCtx.proxyResult, fnCtx.isComputing];
}

export function useComputed<T extends Dict = Dict>(
  resultOrFn: ComputedResult<T> | ComputedFn<T>,
  enableRecordResultDep?: boolean,
): T {
  const [result] = useComputedLogic(resultOrFn, { enableRecordResultDep });
  return result;
}
