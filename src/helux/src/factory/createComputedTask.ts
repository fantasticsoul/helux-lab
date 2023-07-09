import type { Dict, IFnParams, ICreateComputedLogicOptions } from '../typing';
import { createFnCtx } from './common/computed';


export function createComputedTaskLogic<R extends Dict = Dict>(
  computeFn: (taskParams: IFnParams) => {
    initial: R;
    task: () => Promise<R>;
  },
  options?: ICreateComputedLogicOptions,
) {
  const fnCtx = createFnCtx({ ...(options || {}), computeFn, isAsync: true, asyncType: 'task' });
  return fnCtx;
}


export function createComputedTask<R extends Dict = Dict>(
  computeFn: (taskParams: IFnParams) => {
    initial: R;
    task: () => Promise<R>;
  },
): R {
  const fnCtx = createComputedTaskLogic(computeFn);
  return fnCtx.proxyResult;
}
