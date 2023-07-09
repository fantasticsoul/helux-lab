import type { IFnParams, IFnCtx } from '../typing';
import { isFn } from '../utils';
import * as depApi from '../helpers/fndep';

export function createWatchLogic(
  watchFn: (fnParams: IFnParams) => void,
  options: { scopeType: 'static' | 'hook', fnCtxBase?: IFnCtx },
) {
  const { scopeType, fnCtxBase } = options;

  if (!isFn(watchFn)) {
    throw new Error('ERR_NON_FN: pass an non-function to createWatch!');
  }

  const fnCtx = depApi.mapFn(watchFn, { specificProps: { scopeType, fnType: 'watch' }, fnCtxBase });
  watchFn({ isFirstCall: true });
  depApi.delRunninFnKey();

  return fnCtx;
}

export function createWatch(watchFn: (fnParams: IFnParams) => void) {
  createWatchLogic(watchFn, { scopeType: 'static' });
}
