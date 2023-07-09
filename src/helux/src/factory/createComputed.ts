import type { Dict, IFnParams, IFnCtx, ScopeType } from '../typing';
import { createFnCtx } from './common/computed';

export function createComputedLogic<T extends Dict = Dict>(
  computeFn: (params: IFnParams) => T,
  options?: { scopeType?: ScopeType, fnCtxBase?: IFnCtx },
) {
  const fnCtx = createFnCtx({ ...(options || {}), sourceFn: computeFn, computeFn, isAsync: false });
  return fnCtx;
}

/**
 * 创建一个普通的计算任务
 */
export function createComputed<T extends Dict = Dict>(computedFn: (params: IFnParams) => T): T {
  const fnCtx = createComputedLogic<T>(computedFn);
  return fnCtx.proxyResult;
}

