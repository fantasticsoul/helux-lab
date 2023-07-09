import {
  FN_KEY, SHARED_KEY, PROTO_KEY, RENDER_START, NOT_MOUNT, UNMOUNT, EXPIRE_MS, SIZE_LIMIT,
  KEY_SYNC, KEY_ASYNC, KEY_BOTH,
} from '../consts';
import type { Dict, Fn, ScopeType, IFnCtx, IUnmountInfo, KeyUse } from '../typing';
import { getHeluxRoot } from '../factory/root';
import { nodupPush, safeMapGet, isFn, isObj, dedupList, noop } from '../utils';
import { injectHeluxProto } from '../helpers/obj';


function getScope() {
  return getHeluxRoot().help.depScope;
}

const scope = getScope();
const { VALKEY_FNKEYS_MAP, FNKEY_CTX_MAP, UNMOUNT_INFO_MAP, VALKEY_FNKEYUSE_MAP } = scope;

function getKeySeed(scopeType: ScopeType) {
  let keySeed = scope.keySeed[scopeType];
  keySeed = keySeed === Number.MAX_SAFE_INTEGER ? 1 : keySeed + 1;
  scope.keySeed[scopeType] = keySeed;
  return keySeed;
}

export function markFnKey(fnOrObj: Dict, scopeType: ScopeType, fnKey?: string) {
  const prefix = scopeType === 'static' ? 's' : 'h';
  const fnKeyStr = fnKey || `${prefix}${getKeySeed(scopeType)}`;
  if (isFn(fnOrObj)) {
    // @ts-ignore
    fnOrObj[FN_KEY] = fnKeyStr;
  } else {
    fnOrObj.__proto__[FN_KEY] = fnKeyStr;
  }
  return fnKeyStr;
}

export function getFnKey(fnOrObj: Dict): string {
  if (isFn(fnOrObj)) {
    // @ts-ignore
    return fnOrObj[FN_KEY];
  }
  if (isObj(fnOrObj)) {
    // @ts-ignore
    return fnOrObj.__proto__[FN_KEY];
  }
  return '';
}

export function buildFnCtx(specificProps?: Partial<IFnCtx>): IFnCtx {
  const base: IFnCtx = {
    fnKey: '',
    fn: noop,
    isFirstLevel: true,
    sourceFn: noop,
    isComputing: false,
    remainRunCount: 0,
    careComputeStatus: false,
    enableRecordResultDep: false,
    downstreamFnKeys: [],
    upstreamFnKeys: [],
    mountStatus: NOT_MOUNT,
    depKeys: [],
    result: {}, // works for type='computed', always ref to first time returned result by computed fn
    fnType: 'watch',
    isResultReaded: false,
    isResultReadedOnce: false,
    returnUpstreamResult: false,
    scopeType: 'static',
    renderStatus: RENDER_START,
    proxyResult: {},
    updater: noop,
    createTime: Date.now(),
    shouldReplaceResult: false,
    isAsync: false,
    isFirstAsync: true,
    isAsyncTransfer: false,
    asyncType: 'normal',
  };
  return Object.assign(base, specificProps || {})
}

export function mapFn(fn: Fn, options: { specificProps: Partial<IFnCtx> & { scopeType: ScopeType }, fnCtxBase?: IFnCtx }) {
  const { specificProps, fnCtxBase } = options;
  injectHeluxProto(fn);
  const fnKey = markFnKey(fn, specificProps.scopeType);
  const props = { fn, fnKey, ...specificProps };
  scope.currentRunningFnKey = fnKey;
  let fnCtx = buildFnCtx(props);
  if (fnCtxBase) { // 指向用户透传的 fnCtxBase
    fnCtx = Object.assign(fnCtxBase, props);
  }
  scope.FNKEY_CTX_MAP.set(fnKey, fnCtx);
  return fnCtx;
}

export function delFn(fn: Fn) {
  const fnKey = getFnKey(fn);
  if (!fnKey) return;

  const fnCtx = getFnCtx(fnKey);
  fnCtx && delFnCtx(fnCtx);
}

export function delUnmoutFnCtx() {
  const { FNKEY_CTX_MAP } = scope;
  if (FNKEY_CTX_MAP.size >= SIZE_LIMIT) {
    // const toDelKeys: number[] = [];
    console.error('trigger delelte');
    FNKEY_CTX_MAP.forEach((fnCtx) => {
      const { mountStatus, createTime, fnKey } = fnCtx;
      if ([NOT_MOUNT, UNMOUNT].includes(mountStatus) && Date.now() - createTime > EXPIRE_MS) {
        // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach
        // deleting item in map.forEach is doable
        FNKEY_CTX_MAP.delete(fnKey);
        // toDelKeys.push(fnKey);
      }
    });
    // toDelKeys.forEach(fnKey => {
    //   console.error('trigger delelte ', fnKey);
    //   debugger;
    //   FNKEY_CTX_MAP.delete(fnKey)
    // });
  }
}

export function delFnCtx(fnCtx: IFnCtx) {
  const { depKeys, fnKey } = fnCtx;
  depKeys.forEach(key => {
    const fnKeys = VALKEY_FNKEYS_MAP.get(key) || [];
    const idx = fnKeys.indexOf(fnKey);
    if (idx >= 0) {
      fnKeys.splice(idx, 1);
    }
  });
  FNKEY_CTX_MAP.delete(fnKey);

  if (UNMOUNT_INFO_MAP.get(fnKey)?.c === 2) {
    UNMOUNT_INFO_MAP.delete(fnKey);
  }
  delUnmoutFnCtx();
}

export function getFnCtx(fnKey: string) {
  return FNKEY_CTX_MAP.get(fnKey);
}

export function getFnCtxByObj(obj: Dict) {
  const fnKey = getFnKey(obj);
  return FNKEY_CTX_MAP.get(fnKey) || null;
}

export function delRunninFnKey() {
  scope.currentRunningFnKey = '';
}

export function getRunninFnCtx() {
  if (!scope.currentRunningFnKey) {
    return null;
  }
  return getFnCtx(scope.currentRunningFnKey);
}

/**
 * @param belongCtx - 读取 valKey 时，valKey 的所属函数上下文
 */
export function setKeyUse(valKey: string, useInFnKey: string, isAsync: boolean = false) {
  const keyUseDict: Dict<KeyUse> = safeMapGet(VALKEY_FNKEYUSE_MAP, valKey, {});
  const storedUse = keyUseDict[useInFnKey];
  const curUse: KeyUse = isAsync ? 'async' : 'sync';
  if (KEY_BOTH === storedUse || curUse === storedUse) {
    return;
  }
  if (!storedUse) {
    keyUseDict[useInFnKey] = curUse;
    return;
  }
  keyUseDict[useInFnKey] = 'both';
}

/**
 * 自动记录当前正在运行的函数对 valKey 的依赖
 * 以及 valKey 对应的函数记录
 */
export function recordFnDep(valKey: string | string[], specificCtx?: IFnCtx | null, belongCtx?: IFnCtx) {
  const runningFnCtx = getRunninFnCtx();
  const fnCtx: IFnCtx | null | undefined = specificCtx || runningFnCtx;
  if (!fnCtx) {
    return;
  }

  if (runningFnCtx && belongCtx) {
    runningFnCtx.isFirstLevel = false;
    if (belongCtx.isAsync) {
      runningFnCtx.isAsync = true;
      runningFnCtx.isFirstAsync = false;
    }
    const fnKey = belongCtx.fnKey;
    nodupPush(fnCtx.upstreamFnKeys, fnKey);
    nodupPush(belongCtx.downstreamFnKeys, runningFnCtx.fnKey);
  }

  const doRecord = (valKey: string) => {
    if ([SHARED_KEY, PROTO_KEY].includes(valKey)) {
      return;
    }
    nodupPush(fnCtx.depKeys, valKey);
    const fnKeys = safeMapGet(VALKEY_FNKEYS_MAP, valKey, []);
    if (belongCtx) {
      setKeyUse(valKey, fnCtx.fnKey, belongCtx.isAsync);
    }
    nodupPush(fnKeys, fnCtx.fnKey);
  };

  if (Array.isArray(valKey)) {
    valKey.forEach(doRecord);
  } else {
    doRecord(valKey);
  }
}

export function recordValKeyDep(fnCtx?: IFnCtx) {
  if (fnCtx) {
    fnCtx.depKeys.forEach((valKey: string) => recordFnDep(valKey, fnCtx));
  }
}

export function getUseStats(valKey: string, fnKeys: string[]) {
  const useMap = VALKEY_FNKEYUSE_MAP.get(valKey) || {};
  const staticUseStats = {
    sync: [] as string[],
    async: [] as string[],
    both: [] as string[],
  };
  const hookUseStats = {
    sync: [] as string[],
    async: [] as string[],
    both: [] as string[],
  };
  fnKeys.forEach((fnKey) => {
    const use = useMap[fnKey] || 'sync';
    const targetStats = fnKey[0] === 's' ? staticUseStats : hookUseStats;
    targetStats[use].push(fnKey);
  });
  return { staticUseStats, hookUseStats };
}

export function getDepFnStats(valKey: string, runCountStats: Dict<number>) {
  const fnKeys = VALKEY_FNKEYS_MAP.get(valKey) || [];
  const firstLevelFnKeys: string[] = [];
  const asyncFnKeys: string[] = [];

  fnKeys.forEach((fnKey) => {
    const fnCtx = getFnCtx(fnKey);
    if (!fnCtx) return;
    if (fnCtx.isFirstLevel) {
      firstLevelFnKeys.push(fnKey);
    }
    if (fnCtx.isAsync) {
      asyncFnKeys.push(fnKey);
    }
    const count = runCountStats[fnKey];
    runCountStats[fnKey] = count === undefined ? 1 : count + 1;
  });

  return { firstLevelFnKeys, asyncFnKeys };
}

export function triggerComputing(fnKey: string, runCount: number) {
  const fnCtx = getFnCtx(fnKey);
  if (fnCtx) {
    fnCtx.isComputing = true;
    fnCtx.remainRunCount += runCount;
    fnCtx.updater();
  }
}

export function runFn(fnKey: string, options?: { force?: boolean, isFirstCall?: boolean }) {
  const { isFirstCall = false } = options || {};
  const fnCtx = getFnCtx(fnKey);
  if (!fnCtx) {
    return;
  }
  if (fnCtx.fnKey === 'h4') {
    console.log('setp1 fnCtx.remainRunCount ', fnCtx.remainRunCount);
  }

  if (fnCtx.remainRunCount > 0) {
    fnCtx.remainRunCount -= 1;
  }

  if (fnCtx.fnKey === 'h4') {
    console.log('setp2 fnCtx.remainRunCount ', fnCtx.remainRunCount);
  }

  const { isAsync, fn, sourceFn, isAsyncTransfer } = fnCtx;
  const assignResult = (data: Dict) => {
    // 是计算函数
    if (fnCtx.fnType === 'computed' && data) {
      // 非中转结果
      if (!fnCtx.returnUpstreamResult) {
        Object.assign(fnCtx.result, data);
      }
      // 需生成新的代理对象，让直接透传结果给 memo 组件的场景也能够正常工作
      if (fnCtx.scopeType === 'hook') {
        fnCtx.shouldReplaceResult = true;
      }
    }
  };
  const triggerUpdate = () => {
    // 开启读依赖功能时，实例读取了计算结果才执行更新
    if (fnCtx.enableRecordResultDep) {
      fnCtx.isResultReaded && fnCtx.updater();
    } else {
      // 未开启读依赖功能时，实例曾读取过计算结果就执行更新
      fnCtx.isResultReadedOnce && fnCtx.updater();
    }
  };

  if (isAsync) {
    /** 下钻执行其他函数 */
    const updateAndDrillDown = (data?: any) => {
      assignResult(data);
      if (fnCtx.remainRunCount === 0) {
        fnCtx.isComputing = false;
      }
      triggerUpdate();
      fnCtx.downstreamFnKeys.forEach(key => runFn(key));
    };

    if (isAsyncTransfer) {
      updateAndDrillDown();
    } else {
      if (fnCtx.asyncType === 'source') {
        fn({ isFirstCall, source: sourceFn({ isFirstCall: false }).source }).then((data: any) => {
          updateAndDrillDown(data);
        });
      } else if (fnCtx.asyncType === 'task') {
        fn({ isFirstCall }).task({ isFirstCall: false }).then((data: any) => {
          updateAndDrillDown(data);
        });
      } else {
        const result = fn({ isFirstCall: false });
        updateAndDrillDown(result);
      }
    }
  } else {
    const result = fn({ isFirstCall: false });
    assignResult(result);
    triggerUpdate();
  }
}

export function recoverDep(fnCtx: IFnCtx) {
  const { fnKey } = fnCtx;
  FNKEY_CTX_MAP.set(fnKey, fnCtx);

  let info = UNMOUNT_INFO_MAP.get(fnKey);
  if (info) {
    info.c = 2;
  } else {
    info = { c: 1, t: Date.now(), prev: 0 };
    UNMOUNT_INFO_MAP.set(fnKey, info);
  }

  const { c: mountCount } = info;
  if (mountCount === 2) {
    // 因为双调用导致第二次 mount，需把前一刻已触发了 unmount 行为导致的依赖丢失还原回来
    const fnCtx = getFnCtx(fnKey);
    fnCtx && recordValKeyDep(fnCtx);
  }
}
