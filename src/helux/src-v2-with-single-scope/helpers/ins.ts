import type { Dict, IFnCtx, IInsCtx } from '../typing';
import { NOT_MOUNT, RENDER_END, RENDER_START, EXPIRE_MS } from '../consts';
import { createOb } from './obj';
import * as depApi from '../helpers/fndep';
import { getInternal, getRawState } from '../helpers/state';
import { warn } from '../utils';
import { clearDep } from './insdep';

let insKeySeed = 0;
export function getInsKey() {
  insKeySeed = insKeySeed === Number.MAX_SAFE_INTEGER ? 1 : insKeySeed + 1;
  return insKeySeed;
}

export function runInsUpdater(insCtx: IInsCtx | undefined, partialState: Dict) {
  if (!insCtx) return;
  const { setState, mountStatus, createTime } = insCtx;
  if (mountStatus === NOT_MOUNT && Date.now() - createTime > EXPIRE_MS) {
    return clearDep(insCtx);
  }

  setState(partialState);
}

export function buildInsCtx(options: any): IInsCtx {
  const { setState, sharedState, enableReactive } = options;
  const insKey = getInsKey();
  const rawState = getRawState(sharedState);
  const internal = getInternal(sharedState);
  if (!internal) {
    throw new Error('ERR_OBJ_NOT_SHARED: input object is not a result returned by createShared');
  }

  const insCtx: IInsCtx = {
    readMap: {},
    readMapPrev: {},
    readMapStrict: null,
    insKey,
    internal,
    rawState,
    sharedState,
    proxyState: {},
    setState,
    mountStatus: NOT_MOUNT,
    renderStatus: RENDER_START,
    createTime: Date.now(),
  };

  insCtx.proxyState = createOb(
    rawState,
    // setter
    (target: Dict, key: string, val: any) => {
      // @ts-ignore
      target[key] = val;
      if (enableReactive) {
        internal.setState({ [key]: val });
      }
      return true;
    },
    // getter
    (target: Dict, key: string) => {
      insCtx.readMap[key] = 1;
      if (insCtx.renderStatus !== RENDER_END) {
        internal.recordDep(key, insCtx.insKey);
      }
      // record computed/watch dep
      depApi.recordFnDep(key);

      return target[key];
    },
  );

  internal.mapInsCtx(insKey, insCtx);
  return insCtx;
}

export function buildInsComputedResult(fnCtx: IFnCtx) {
  const { result } = fnCtx;
  fnCtx.proxyResult = createOb(
    result,
    // setter
    () => {
      warn('changing computed result is invalid');
      return false;
    },
    // getter
    (target: Dict, resultKey: string) => {
      if (RENDER_START === fnCtx.renderStatus) {
        depApi.recordValKeyDep(fnCtx);
        fnCtx.isResultReaded = true;
        fnCtx.isResultReadedOnce = true;
      }

      return result[resultKey];
    },
  );
}
