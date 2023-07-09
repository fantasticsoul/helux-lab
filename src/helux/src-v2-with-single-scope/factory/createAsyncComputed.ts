import type { Dict, IAsyncTaskParams, IFnParams, IFnCtx, ScopeType } from '../typing';
import { attachStaticProxyResult, createFnCtx } from './common/computed';

function getResult(fnCtx: IFnCtx) {
  if (fnCtx.returnUpstreamResult) {
    return fnCtx.result; // 返回上游结果，此结果已被代理
  }

  const proxyResult = attachStaticProxyResult(fnCtx);
  return proxyResult;
}

interface IOptions {
  careComputeStatus?: boolean;
  scopeType?: ScopeType;
  fnCtxBase?: IFnCtx;
  allowTransfer?: boolean;
  runAsync?: boolean;
  returnUpstreamResult?: boolean;
}

export function createAsyncComputedLogic<S extends any = any, R extends Dict = Dict>(
  sourceFn: () => { source: S, initial: R },
  computeFn: (taskParams: IAsyncTaskParams) => Promise<R>,
  options?: IOptions,
) {
  const fnCtx = createFnCtx({ ...(options || {}), sourceFn, computeFn, isAsync: true, asyncType: 'source' });
  return fnCtx;
}

export function createAsyncComputed<S extends any = any, R extends Dict = Dict>(
  sourceFn: () => { source: S, initial: R },
  computeFn: (taskParams: IAsyncTaskParams<S>) => Promise<R>,
): R {
  const fnCtx = createAsyncComputedLogic<S, R>(sourceFn, computeFn);
  return getResult(fnCtx);
}

export function createAsyncTask<R extends Dict = Dict>(
  computeFn: (taskParams: IFnParams) => {
    initial: R;
    task: () => Promise<R>;
  },
): R {
  const fnCtx = createFnCtx({ computeFn, isAsync: true, asyncType: 'task' });
  return getResult(fnCtx);
}
