import { useRef, useState, useEffect } from 'react';
import { ComputedResult, Dict, ComputedFn, IFnCtx, AsyncType, IsComputing, ScopeType } from '../typing';
import { isFn, isObj, noop } from '../utils';
import { buildFnCtx, getFnCtxByObj, recoverDep, delFnCtx } from '../helpers/fndep';
import { attachInsComputedResult } from '../helpers/ins';
import { createComputedLogic } from '../factory/createComputed';
import { createComputedAsyncLogic } from '../factory/createComputedAsync';
import { createComputedTaskLogic } from '../factory/createComputedTask';
import { RENDER_END, RENDER_START, MOUNTED } from '../consts';
import { useForceUpdate } from './useForceUpdate';

const InvalidInput = 'ERR_NON_COMPUTED_FN_OR_RESULT: useComputed only accept a static computed result or computed fn';

interface IUseComputedOptions {
  fn: any;
  sourceFn?: any;
  asyncType?: AsyncType;
  careComputeStatus?: boolean;
  enableRecordResultDep?: boolean;
}

interface ICreateOptions extends IUseComputedOptions {
  fnRef: React.MutableRefObject<any>;
  fnCtx: IFnCtx;
}

function createComputed(options: ICreateOptions) {
  const { fnRef, fn, sourceFn, fnCtx, careComputeStatus, asyncType } = options;
  let isAsync = false;
  let upstreamFnCtx: IFnCtx | null = null;
  const scopeType: ScopeType = 'hook';

  if (fnRef.current) {
    return;
  }

  // 传入了局部的临时计算函数
  if (asyncType === 'normal') {
    if (isFn(fn)) {
      fnRef.current = fn;
    } else if (isObj(fn)) {
      // may a static computed result
      upstreamFnCtx = getFnCtxByObj(fn);
      if (!upstreamFnCtx) {
        throw new Error(InvalidInput);
      }
      const ensuredFnCtx = upstreamFnCtx;
      isAsync = upstreamFnCtx.isAsync;
      // 做结果中转
      fnRef.current = () => ensuredFnCtx.result;
    } else {
      throw new Error(InvalidInput);
    }

    if (isAsync && upstreamFnCtx) {
      const ensuredFnCtx = upstreamFnCtx;
      createComputedAsyncLogic(
        () => ({ source: ensuredFnCtx.result, initial: ensuredFnCtx.result }),
        async () => ensuredFnCtx.result,
        {
          scopeType, fnCtxBase: fnCtx, allowTransfer: true,
          runAsync: false, returnUpstreamResult: true, careComputeStatus,
        }
      );
    } else {
      createComputedLogic(fnRef.current, { scopeType, fnCtxBase: fnCtx });
    }
  } else {
    // source or task
    fnRef.current = fn;
    if (asyncType === 'source') {
      createComputedAsyncLogic(sourceFn, fn, { scopeType, fnCtxBase: fnCtx, careComputeStatus });
    } else {
      createComputedTaskLogic(fn, { scopeType, fnCtxBase: fnCtx, careComputeStatus });
    }
  }

  attachInsComputedResult(fnCtx);
}

export function useComputedLogic<T extends Dict = Dict>(
  options: IUseComputedOptions,
): [T, IsComputing] {
  const { fn, sourceFn = noop, enableRecordResultDep = false, careComputeStatus, asyncType = 'normal' } = options;
  const fnRef = useRef<any>(null);
  const updater = useForceUpdate();
  const [fnCtx] = useState(() => buildFnCtx({ updater, enableRecordResultDep, scopeType: 'hook' }));
  fnCtx.renderStatus = RENDER_START;
  createComputed({ fnRef, careComputeStatus, fn, sourceFn, fnCtx, asyncType });

  if (fnCtx.enableRecordResultDep) {
    fnCtx.isResultReaded = false; // 待到 proxy 里产生读取行为时，会被置为 true
  }
  if (fnCtx.shouldReplaceResult) {
    attachInsComputedResult(fnCtx);
    fnCtx.shouldReplaceResult = false;
  }

  useEffect(() => {
    fnCtx.renderStatus = RENDER_END;
  });

  useEffect(() => {
    fnCtx.mountStatus = MOUNTED;
    recoverDep(fnCtx);
    return () => {
      delFnCtx(fnCtx);
    };
  }, [fnCtx]);

  return [fnCtx.proxyResult, fnCtx.isComputing];
}

export function useComputed<T extends Dict = Dict>(
  resultOrFn: ComputedResult<T> | ComputedFn<T>,
  enableRecordResultDep?: boolean,
): [T, IsComputing] {
  const resultPair = useComputedLogic({ fn: resultOrFn, enableRecordResultDep });
  return resultPair;
}
