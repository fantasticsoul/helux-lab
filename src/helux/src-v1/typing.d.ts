export type PrimitiveItem = number | string;

export type PrimitiveSymItem = PrimitiveItem | symbol;

export type Dict<T extends any = any> = Record<PrimitiveSymItem, T>;

export type DictN<T extends any = any> = Record<number, T>;

export type Fn<T extends any = any> = (...args: any[]) => T;

export type SharedObject<T extends Dict = any> = T;

export type EenableReactive = boolean;

export interface ICreateOptionsFull {
  /** default: false，是否创建响应式状态，true：是，false：否 */
  enableReactive: EenableReactive;
  /** 模块名称，不传递的话内部会生成 symbol 作为key */
  moduleName: string;
  /** default: false，直接读取 sharedObj 时是否记录依赖，目前用于满足 helux-solid 库的需要，enableReactive 为 true 时 ，设置此参数才有意义 */
  enableRecordDep: boolean;
  /**
   * default: false
   * 是否对传入进来的 obj 做浅拷贝
   * ```
   * const originalObj = { a:1, b: 2 };
   * const { state } = createShared(originalObj, { copyObj: true } );
   * // 若 copyObj === true, 则 getRawState(state) === originalObj 结果为 false
   * // 若 copyObj === false, 则 getRawState(state) === originalObj 结果为 true
   * ```
   */
  copyObj: boolean;
  /**
   * defaut: true, 修改的状态值是否同步到原始状态
   * 注意此参数仅在 copyObj=true 时设置才有意义
   * ```
   * const originalObj = { a:1, b: 2 };
   * const { state, setState } = createShared(originalObj);
   * // 为 true 时，任何 setState 调用都会同步到 originalObj 上
   * ```
   */
  enableSyncOriginal: boolean;
}

export type ICreateOptions = Partial<ICreateOptionsFull>;

export type ModuleName = string;

export type ICreateOptionsType = ModuleName | EenableReactive | ICreateOptions;

export type CleanUpCb = () => void;

export type EffectCb = () => void | CleanUpCb;

export interface IFnParams {
  isFirstCall: boolean;
}

export interface IAsyncTaskParams<S extends any = any> extends IFnParams {
  source: S;
}

export type ComputedResult<T extends Dict = Dict> = T;

export type ComputedFn<T extends Dict = Dict> = (params: IFnParams) => T;

export interface IUnmountInfo {
  t: number;
  /** mount count, 第一次挂载或第二次挂载 */
  c: 1 | 2;
  /**
   * @deprecated
   * 前一个实例 id，已无意义，后续会移除
   */
  prev: number;
}

export type FnType = 'watch' | 'computed';

export type ScopeType = 'static' | 'hook';

export type AsyncType = 'source' | 'task' | 'normal';

export type ReanderStatus = '1' | '2';

export type KeyUse = 'sync' | 'async' | 'both';

export type MountStatus = 1 | 2 | 3;

export interface IFnCtx {
  fn: Fn;
  sourceFn: Fn;
  fnKey: string;
  isComputing: boolean;
  remainRunCount: number;
  careComputeStatus: boolean;
  /** default: false ，是否对计算结果开启记录读依赖功能，此功能仅针对 hook 里使用 useComputed 有效 */
  enableRecordResultDep: boolean;
  /**
   * 下游函数列表，即其他依赖此函数的函数列表，通常直接返回此函数结果的函数（相当于中转返回结果）会被记录到这里
   */
  downstreamFnKeys: string[];
  /** 上游函数列表，即此函数依赖的其他函数列表 */
  upstreamFnKeys: string[];
  /**
   * default：null，
   * null 表示还没有计算过
   * true 有依赖上游的异步计算函数
   * false 没有
   */
  hasAsyncUpstreamFnDep: null | boolean;
  /** 未挂载 已挂载 已卸载 */
  mountStatus: MountStatus;
  depKeys: string[];
  /** 计算函数返回的原始结果 */
  result: Dict;
  /** work for hook computed fnCtx */
  proxyResult: Dict;
  fnType: FnType;
  scopeType: ScopeType;
  /** work for hook computed fnCtx */
  updater: Fn;
  /** work for hook computed fnCtx */
  isResultReaded: boolean;
  /** 只要结果曾经读取过就记录为 true */
  isResultReadedOnce: boolean;
  /**
   * 是否返回了上游的计算结算，方便为计算结果中转机制服务
   * work for computed result transfer mechanism
   */
  returnUpstreamResult: boolean;
  /** work for hook computed fnCtx */
  renderStatus: ReanderStatus;
  /** fn ctx created timestamp */
  createTime: number;
  /** work for hook computed fnCtx  */
  shouldReplaceResult: boolean;
  /** 是否是异步的计算函数 */
  isAsync: boolean;
  /** 是否是第一个异步函数，此值在isAsync=true时才有意义，使用了其他异步计算结果的异步函数，isFirstAsync 被标记为 false */
  isFirstAsync: boolean;
  /** 是否是一个中转结果的异步函数，内部用的标记 */
  isAsyncTransfer: boolean;
  transferFnCtx?: IFnCtx;
  asyncType: AsyncType,
}

export interface IInsCtx {
  /** 当前渲染完毕所依赖的 key 记录 */
  readMap: Dict;
  /** 上一次渲染完毕所依赖的 key 记录 */
  readMapPrev: Dict;
  /** StrictMode 下辅助 resetDepMap 函数能够正确重置 readMapPrev 值 */
  readMapStrict: null | Dict;
  insKey: number;
  internal: Dict;
  rawState: Dict;
  sharedState: Dict;
  proxyState: Dict;
  setState: Fn;
  /** 未挂载 已挂载 已卸载 */
  mountStatus: MountStatus;
  renderStatus: ReanderStatus;
  /** ins ctx created timestamp */
  createTime: number;
}
