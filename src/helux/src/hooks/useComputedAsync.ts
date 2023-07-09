import { IAsyncTaskParams, Dict, IsComputing } from '../typing';
import { useComputedLogic } from './useComputed';

export function useComputedAsync<S extends any = any, R extends Dict = Dict>(
  sourceFn: () => { source: S, initial: R },
  computeFn: (taskParams: IAsyncTaskParams<S>) => Promise<R>,
  enableRecordResultDep?: boolean,
): [R, IsComputing] {
  const resultPair = useComputedLogic({ fn: computeFn, sourceFn, enableRecordResultDep, careComputeStatus: true, asyncType: 'source' });
  return resultPair;
}
