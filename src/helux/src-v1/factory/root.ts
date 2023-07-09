import { VER } from '../consts';
import { getInternal, getInternalMap, getSharedKey } from '../helpers/state';
import type { Dict } from '../typing';

function createRoot() {
  const root = {
    VER,
    rootState: {} as Dict,
    setState: (moduleName: string, partialState: Dict) => {
      const modData = root.help.mod[moduleName];
      if (!modData) {
        throw new Error(`moduleName ${moduleName} not found`);
      }
      modData.setState(partialState);
    },
    help: {
      mod: {} as Dict, // 与模块相关的辅助信息
      internalMap: getInternalMap(),
      fnDep: {
        static: {},
        hook: {},
      } as Dict,
      insDep: {} as Dict,
    },
  };
  return root;
}

export function getHeluxRoot(): ReturnType<typeof createRoot> {
  // @ts-ignore
  return window.__HELUX__;
}

export function ensureHeluxRoot() {
  // @ts-ignore
  if (!window.__HELUX__) {
    // @ts-ignore
    window.__HELUX__ = createRoot();
  }
}

export function record(moduleName: string, sharedState: Dict) {
  const { rootState, help } = getHeluxRoot();
  const treeKey = moduleName || getSharedKey(sharedState);
  if (rootState[treeKey] && !window.location.port) {
    return console.error(`moduleName ${moduleName} duplicate!`);
  }
  // may hot replace for dev mode or add new mod
  rootState[treeKey] = sharedState;
  help.mod[treeKey] = { setState: getInternal(sharedState).setState };
}

ensureHeluxRoot();
