import type { Dict, IFnParams, IFnCtx, ScopeType } from '../typing';
import { isFn } from '../utils';
import { attachStaticProxyResult, createFnCtx } from './common/computed';

export function createComputedLogic<T extends Dict = Dict>(
  computeFn: (params: IFnParams) => T,
  options?: { scopeType?: ScopeType, resultScopeType?: ScopeType, fnCtxBase?: IFnCtx },
) {
  if (!isFn(computeFn)) {
    throw new Error('ERR_NON_FN: pass an non-function to createComputed!');
  }

  const fnCtx = createFnCtx({ ...(options || {}), sourceFn: computeFn, computeFn, isAsync: false });
  return fnCtx;
}

export function createComputed<T extends Dict = Dict>(computedFn: (params: IFnParams) => T): T {
  const fnCtx  = createComputedLogic<T>(computedFn);
  if (fnCtx.returnUpstreamResult) {
    return fnCtx.result; // 返回上游结果，此结果已被代理
  }
  const proxyResult = attachStaticProxyResult(fnCtx);
  return proxyResult;
}

