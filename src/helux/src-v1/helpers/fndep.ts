import {
  FN_KEY, SHARED_KEY, PROTO_KEY, RENDER_START, NOT_MOUNT, UNMOUNT, EXPIRE_MS, SIZE_LIMIT,
  KEY_SYNC, KEY_ASYNC, KEY_BOTH,
} from '../consts';
import type { Dict, Fn, ScopeType, IFnCtx, IUnmountInfo, KeyUse } from '../typing';
import { getHeluxRoot } from '../factory/root';
import { nodupPush, safeMapGet, isFn, isObj, dedupList, noop } from '../utils';
import { injectHeluxProto } from '../helpers/obj';


function buildApi(scopeType: ScopeType) {
  let cuFnKeySeed = 0;
  let currentRunningFnKey: any = null;
  const FNKEY_CTX_MAP = new Map<string, IFnCtx>();
  const VALKEY_FNKEYS_MAP = new Map<string, string[]>();
  const VALKEY_FNKEYUSE_MAP = new Map<string, Dict<KeyUse>>();
  const UNMOUNT_INFO_MAP = new Map<string, IUnmountInfo>();
  const prefix = scopeType === 'static' ? 's' : 'h';

  getHeluxRoot().help.fnDep[scopeType] = {
    FNKEY_CTX_MAP,
    VALKEY_FNKEYS_MAP,
    VALKEY_FNKEYUSE_MAP,
    UNMOUNT_INFO_MAP,
  }

  const api = {
    markFnKey(fnOrObj: Dict, fnKey?: string) {
      let fnKeyStr = '';
      let fnKeyNum = 0;
      if (!fnKey) {
        cuFnKeySeed = cuFnKeySeed === Number.MAX_SAFE_INTEGER ? 1 : cuFnKeySeed + 1;
        fnKeyNum = cuFnKeySeed;
        fnKeyStr = `${prefix}${fnKeyNum}`;
      } else {
        fnKeyStr = fnKey;
      }

      if (isFn(fnOrObj)) {
        // @ts-ignore
        fnOrObj[FN_KEY] = fnKeyStr;
      } else {
        fnOrObj.__proto__[FN_KEY] = fnKeyStr;
      }
      return fnKeyStr;
    },

    getFnKey(fnOrObj: Dict): string {
      if (isFn(fnOrObj)) {
        // @ts-ignore
        return fnOrObj[FN_KEY];
      }
      if (isObj(fnOrObj)) {
        // @ts-ignore
        return fnOrObj.__proto__[FN_KEY];
      }
      return '';
    },

    buildFnCtx(specificProps?: Partial<IFnCtx>): IFnCtx {
      return Object.assign({
        fn: noop,
        sourceFn: noop,
        fnKey: '',
        isComputing: false,
        remainRunCount: 0,
        careComputeStatus: false,
        enableRecordResultDep: false,
        downstreamFnKeys: [],
        upstreamFnKeys: [],
        hasAsyncUpstreamFnDep: null,
        mountStatus: NOT_MOUNT,
        depKeys: [],
        result: {}, // works for type='computed', always ref to first time returned result by computed fn
        fnType: 'watch',
        isResultReaded: false,
        isResultReadedOnce: false,
        returnUpstreamResult: false,
        scopeType,
        renderStatus: RENDER_START,
        proxyResult: {},
        updater: noop,
        createTime: Date.now(),
        shouldReplaceResult: false,
        isAsync: false,
        isFirstAsync: true,
        isAsyncTransfer: false,
        asyncType: 'normal',
      }, specificProps || {})
    },

    mapFn(fn: Fn, options: { specificProps?: Partial<IFnCtx>, fnCtxBase?: IFnCtx }) {
      const { specificProps = {}, fnCtxBase } = options;
      injectHeluxProto(fn);
      const fnKey = api.markFnKey(fn);
      const props = { fn, fnKey, ...specificProps };
      currentRunningFnKey = fnKey;
      let fnCtx = api.buildFnCtx(props);
      if (fnCtxBase) { // 指向用户透传的 fnCtxBase
        fnCtx = Object.assign(fnCtxBase, props);
      }
      FNKEY_CTX_MAP.set(fnKey, fnCtx);

      return fnCtx;
    },

    delFn(fn: Fn) {
      const fnKey = api.getFnKey(fn);
      if (!fnKey) return;

      const fnCtx = FNKEY_CTX_MAP.get(fnKey);
      fnCtx && api.delFnCtx(fnCtx);
    },

    delUnmoutFnCtx() {
      if (scopeType === 'hook' && FNKEY_CTX_MAP.size >= SIZE_LIMIT) {
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
    },

    delFnCtx(fnCtx: IFnCtx) {
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
      api.delUnmoutFnCtx();
    },

    getFnCtx(fnKey: string) {
      return FNKEY_CTX_MAP.get(fnKey);
    },

    getFnCtxByObj(obj: Dict) {
      const fnKey = api.getFnKey(obj);
      return FNKEY_CTX_MAP.get(fnKey) || null;
    },

    delRunninFnKey() {
      currentRunningFnKey = null;
    },

    getRunninFnCtx() {
      if (!currentRunningFnKey) {
        return null;
      }
      return api.getFnCtx(currentRunningFnKey);
    },

    /**
     * @param belongCtx - 读取 valKey 时，valKey 的所属函数上下文
     */
    setKeyUse(valKey: string, useInFnKey: string, isAsync: boolean = false) {
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
    },

    /**
     * 自动记录当前正在运行的函数对 valKey 的依赖
     * 以及 valKey 对应的函数记录
     */
    recordFnDep(valKey: string | string[], specificCtx?: IFnCtx | null, belongCtx?: IFnCtx) {
      const runningFnCtx = api.getRunninFnCtx();
      const fnCtx: IFnCtx | null | undefined = specificCtx || runningFnCtx;
      if (!fnCtx) {
        return;
      }

      if (runningFnCtx && belongCtx) {
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
          api.setKeyUse(valKey, fnCtx.fnKey, belongCtx.isAsync);
        }
        nodupPush(fnKeys, fnCtx.fnKey);
      };

      if (Array.isArray(valKey)) {
        valKey.forEach(doRecord);
      } else {
        doRecord(valKey);
      }
    },

    recordValKeyDep(fnCtx?: IFnCtx) {
      if (fnCtx) {
        fnCtx.depKeys.forEach((valKey: string) => api.recordFnDep(valKey, fnCtx));
      }
    },

    getUseStats(valKey: string, fnKeys: string[]) {
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
    },

    getDepFnKeys(valKey: string, needDedup = true) {
      const fnKeys = VALKEY_FNKEYS_MAP.get(valKey) || [];
      let finalFnKeys: string[] = [];
      let isConcat = false;

      fnKeys.forEach((fnKey) => {
        finalFnKeys.push(fnKey);
        const fnCtx = api.getFnCtx(fnKey);
        if (fnCtx) {
          const { downstreamFnKeys } = fnCtx;
          finalFnKeys = finalFnKeys.concat(downstreamFnKeys);
          isConcat = true;
        }
      });

      if (needDedup && isConcat) {
        finalFnKeys = dedupList(finalFnKeys);
      }

      return finalFnKeys;
    },

    getDepApi(fnKey: string) {
      return fnKey[0] === 's' ? staticApi : hookApi;
    },

    triggerComputing(fnKey: string, runCount: number) {
      const fnCtx = api.getFnCtx(fnKey);
      if (fnCtx?.careComputeStatus) {
        fnCtx.isComputing = true;
        fnCtx.remainRunCount += runCount;

        if (fnKey === 'h4') {
          console.log('triggerComputing fnCtx.remainRunCount ', fnCtx.remainRunCount);
        }

        fnCtx.updater();
      }
    },

    runFn(fnKey: string, options?: { force?: boolean, isFirstCall?: boolean }) {
      const { force, isFirstCall = false } = options || {};
      const fnCtx = api.getFnCtx(fnKey);
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

      let hasAsyncUpstreamFnDep = fnCtx.hasAsyncUpstreamFnDep;
      const { isAsync, upstreamFnKeys, fn, sourceFn, isAsyncTransfer } = fnCtx;
      if (isAsync) {
        // 没有计算过是否有上游异步依赖
        if (hasAsyncUpstreamFnDep === null) {
          hasAsyncUpstreamFnDep = false;
          // 自身是异步计算函数，且还有上游依赖函数，就查询
          for (const key of upstreamFnKeys) {
            const depApi = api.getDepApi(key);
            const upstreamFnCtx = depApi.getFnCtx(key);
            if (upstreamFnCtx?.isAsync) {
              hasAsyncUpstreamFnDep = true;
              break;
            }
          }
          fnCtx.hasAsyncUpstreamFnDep = hasAsyncUpstreamFnDep;
        }
        // 如没有标记强制执行，则当前函数不计算，等待上游函数触发自己计算
        if (!force && hasAsyncUpstreamFnDep) {
          return;
        }
      }

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
        const drillDownToRun = (data?: any) => {
          assignResult(data);
          if (fnCtx.remainRunCount === 0) {
            fnCtx.isComputing = false;
          }
          triggerUpdate();
          if (fnCtx)
            fnCtx.downstreamFnKeys.forEach(key => {
              const depApi = api.getDepApi(key);
              depApi.runFn(key, { force: true });
            });
        };

        if (isAsyncTransfer) {
          drillDownToRun();
        } else {
          if (fnCtx.asyncType === 'source') {
            fn({ isFirstCall, source: sourceFn({ isFirstCall: false }).source }).then((data: any) => {
              drillDownToRun(data);
            });
          } else if (fnCtx.asyncType === 'task') {
            fn({ isFirstCall }).task({ isFirstCall: false }).then((data: any) => {
              drillDownToRun(data);
            });
          } else {
            const result = fn({ isFirstCall: false });
            drillDownToRun(result);
          }
        }
      } else {
        const result = fn({ isFirstCall: false });
        assignResult(result);
        triggerUpdate();
      }
    },

    recoverDep(fnCtx: IFnCtx) {
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
        const fnCtx = api.getFnCtx(fnKey);
        fnCtx && api.recordValKeyDep(fnCtx);
      }
    }
  };

  return api;
}

// for static createComputed, createWatch
export const staticApi = buildApi('static');

// for hook's useComputed, useWatch
export const hookApi = buildApi('hook');

export function getDepApi(scopeType: ScopeType) {
  return scopeType === 'hook' ? hookApi : staticApi;
}

export function recordFnDep(valKey: string | string[], specificCtx?: IFnCtx | null, sourceCtx?: IFnCtx) {
  staticApi.recordFnDep(valKey, specificCtx, sourceCtx);
  hookApi.recordFnDep(valKey, specificCtx, sourceCtx);
}
