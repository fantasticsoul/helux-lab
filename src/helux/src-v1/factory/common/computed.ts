import type { Dict, IFnCtx, ScopeType, Fn, AsyncType } from '../../typing';
import { isObj, isPromise, warn, dedupList, noop, isFn, nodupPush } from '../../utils';
import { recordFnDep, getDepApi, hookApi, staticApi } from '../../helpers/fndep';
import { getSharedKey } from '../../helpers/state';
import { createOb, injectHeluxProto } from '../../helpers/obj';

function checkResult(fnCtx: IFnCtx, result: Dict) {
  if (!isObj(result) || isPromise(result)) {
    throw new Error('ERR_NON_OBJ: result must be an plain json object!');
  }
  const { isAsync, isAsyncTransfer } = fnCtx;
  // 未标记是异步中转函数时，不允许异步计算函数做结果、共享状态中转
  if (isAsync && !isAsyncTransfer) {
    const hookFnKey = hookApi.getFnKey(result);
    const staticFnKey = staticApi.getFnKey(result);
    const sharedKey = getSharedKey(result);
    if (hookFnKey || staticFnKey || sharedKey) {
      throw new Error('ERR_NON_OBJ: can not transfer another computed result or shared state');
    }
  }
}

export function attachStaticProxyResult(fnCtx: IFnCtx) {
  const proxyResult = createOb(fnCtx.result,
    // setter
    () => {
      warn('changing computed result is invalid');
      return false;
    },
    // getter
    (target: Dict, key: any) => {
      // copy dep keys
      recordFnDep(fnCtx.depKeys, null, fnCtx);
      return target[key];
    },
  );
  fnCtx.proxyResult = proxyResult;
  return proxyResult;
}

interface IMapFnCtxOptions {
  computeFn: Fn,
  careComputeStatus?: boolean;
  sourceFn?: Fn,
  scopeType?: ScopeType;
  resultScopeType?: ScopeType;
  fnCtxBase?: IFnCtx;
  isAsync?: boolean;
  asyncType?: AsyncType,
  allowTransfer?: boolean;
  returnUpstreamResult?: boolean;
  runAsync?: boolean;
}

export function createFnCtx(
  options: IMapFnCtxOptions,
) {
  const { sourceFn = noop, computeFn, isAsync = false, scopeType = 'static',
    resultScopeType = 'static', fnCtxBase, allowTransfer = false, asyncType = 'normal',
    returnUpstreamResult, runAsync = true, careComputeStatus = false,
  } = options;
  if (!isFn(sourceFn) || !isFn(computeFn)) {
    throw new Error('ERR_NON_FN: only accpet function arg!');
  }
  const depApi = getDepApi(scopeType);
  const fnCtx = depApi.mapFn(
    computeFn,
    { specificProps: { fnType: 'computed', isAsync, asyncType, isAsyncTransfer: allowTransfer, careComputeStatus }, fnCtxBase },
  );

  let source = null;
  let result = {};
  if (!isAsync) {
    result = computeFn({ isFirstCall: true });
    source = result;
  } else {
    if (asyncType === 'source') {
      const wrap = sourceFn({ isFirstCall: true });
      fnCtx.sourceFn = sourceFn;
      source = wrap.source;
      result = wrap.initial;
    } else if (asyncType === 'task') {
      const wrap = computeFn({ isFirstCall: true });
      result = wrap.initial;
    }
  }
  const curFnKey = fnCtx.fnKey;
  depApi.delRunninFnKey();
  checkResult(fnCtx, result);

  // 特殊处理计算结果中转行为
  // const cu1 = createComputed(...);
  // const cu2 = createComputed(()=>cu1); // 此处产生结果中转
  if (source) {
    const resultDepApi = getDepApi(resultScopeType);
    const upstreamFnCtx = resultDepApi.getFnCtxByObj(source);
    // 关联上下游函数
    if (upstreamFnCtx) {
      fnCtx.depKeys = dedupList(fnCtx.depKeys.concat(upstreamFnCtx.depKeys));
      fnCtx.depKeys.forEach(key => depApi.setKeyUse(key, curFnKey, upstreamFnCtx.isAsync));
      // 异步函数已在 checkResult 里保证不能产生结果中转行为，此处只需要针对处于非异步函数场景时赋值为 true 即可
      fnCtx.returnUpstreamResult = returnUpstreamResult ?? !isAsync;
      fnCtx.transferFnCtx = upstreamFnCtx;
      nodupPush(upstreamFnCtx.downstreamFnKeys, fnCtx.fnKey);
      nodupPush(fnCtx.upstreamFnKeys, upstreamFnCtx.fnKey);
      if (upstreamFnCtx.isAsync) {
        fnCtx.isFirstAsync = false;
      }
    } else if (getSharedKey(source)) {
      // 直接用某个共享状态作为输入源
      fnCtx.depKeys = Object.keys(source);
      fnCtx.depKeys.forEach(key => depApi.setKeyUse(key, curFnKey, false));
    }
    depApi.recordValKeyDep(fnCtx); // 人工补录 valKey 和 fn 的依赖关系
  }

  if (!fnCtx.returnUpstreamResult) {
    // 给 result 和 fn 标记相同的 key
    injectHeluxProto(result);
    depApi.markFnKey(result, curFnKey);
  }

  if (runAsync && (asyncType === 'source' || asyncType === 'task')) {
    depApi.runFn(curFnKey, { force: true, isFirstCall: true });
  }

  fnCtx.result = result;
  return fnCtx;
}
