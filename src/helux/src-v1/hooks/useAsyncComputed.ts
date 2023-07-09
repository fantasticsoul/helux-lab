import { ComputedResult, Dict, ComputedFn } from '../typing';
import { useComputedLogic } from './useComputed';

export function useAsyncComputed<T extends Dict = Dict>(
  resultOrFn: ComputedResult<T> | ComputedFn<T>,
  enableRecordResultDep?: boolean,
): [T, boolean] {
  const resultPair = useComputedLogic(resultOrFn, { enableRecordResultDep, careComputeStatus: true });
  return resultPair;
}
