
import React from 'react';

/**
 * 使用 useObject 有两个好处
 * ```txt
 * 1 方便定义多个状态值时，少写很多 useState
 * 2 内部做了 unmount 判断，让异步函数也可以安全的调用 setState，避免 react 出现警告 :
 * "Called SetState() on an Unmounted Component" Errors
 * ```
 * @param initialState
 * @returns
 */
export default function useObject<T extends Record<string, any> = Record<string, any>>(initialState: T): [
  T, (partialState: Partial<T>) => void,
] {
  const [state, setFullState] = React.useState(initialState);
  const unmountRef = React.useRef(false);
  React.useEffect(
    () => {
      unmountRef.current = false; // 防止 StrictMode 写为 true
      // cleanup callback，标记组件已卸载
      return () => {
        unmountRef.current = true;
      }
    },
    [],
  );
  return [
    state,
    (partialState: Partial<T>) => {
      if (!unmountRef.current) {
        setFullState(state => ({ ...state, ...partialState }));
      }
    },
  ];
}

// 此处类型可后续继续优化
export function useService(childCtx: { state: any, setState: any }) {
  return {
    change(label: string) { // 封装逻辑
      // your logic
      childCtx.setState({ label });
    },
    getCtx() {
      return childCtx; // 如果暴露这个，表示让父亲节点直接操控孩子的状态
    }
  }
}

type ChildSrv = ReturnType<typeof useService>;

function Father() {
  // 保持孩子的服务
  const childSrv = React.useRef<{ srv?: ChildSrv }>({});

  return <div>
    <button onClick={() => childSrv.current.srv?.change(`${Date.now()}`)}>call child logic</button>
    <Child exposeService={srv => childSrv.current.srv = srv} />
  </div>
}

export function Child(props: { exposeService?: (srv: ChildSrv) => void }) {
  const { exposeService } = props;
  const [state, setState] = useObject({
    label: '',
    time: Date.now(),
  });
  const srv = useService({ state, setState });

  React.useEffect(() => {
    exposeService?.(srv);
    // ban react-hooks/exhaustive-deps, state seState is stable ref
    // eslint-disable-next-line
  }, []);

  return <h1>{state.label}</h1>;
}