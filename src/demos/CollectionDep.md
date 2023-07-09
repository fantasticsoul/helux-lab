
## 不稳定对抗
- useEvent

```ts
function useEvent(handler) {
  const handlerRef = useRef(null);

  // DOM更新之后，视图渲染完成后之前更新`handlerRef.current`指向
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  // 用useCallback包裹，使得render时返回的函数引用一致
  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []);
}
```

## symbol

对象唯一：
Symbol('key') === Symbol('key');

key path 记录
1 ['a', 'b', 'c'] a.b.c
['a.b', 'c']


## useSharedObject流程

firstRender: 构建稳定对象

everyRender: 收集依赖

mount: 还原依赖（双调用机制会导致一次依赖丢失）

unmount: 清除依赖

## 小结
使用 useObject 管理单个组件的内部对象

```ts
export function uesStableProps(props: any) {
  // trust me, just for give props a ref
  // eslint-disable-next-line
  const propsRef = React.useRef(props);
  propsRef.current = props;
  return useCallback(() => propsRef.current,[]);
}

/**
 *  return stable state props 
 */
export function uesStableSP<T extends Dict = Dict>(initialState: T | ()=>T, props?:any) {
  const [ state, setState ] = React.useState(initialState);
  const stateRef = React.useRef(state);
  const propsRef = React.useRef(null);
  stateRef.current = state;
  propsRef.current = props || {};
  return useCallback(() => ({
    state: stateRef.current,
    props: propsRef.current,
    setState,
  }),[]);
}
```

用 useCallback 配合 getCtx 句柄消除依赖冗余或漏传

```ts
const getCtx = uesStableSP({a:1}, props);
const methods = useCallback(()=>({
  func1(){
    // call getCtx get stable state props if needed
    // const { state, props } = getCtx;

    // ... logic code here
  },
  // another func
  func2(){},
}), [ getCtx ]);
```


