import './factory/root';
import { createReactiveSharedObject, createShared, createSharedObject } from './factory/createShared';
import { createComputed } from './factory/createComputed';
import { createComputedAsync } from './factory/createComputedAsync';
import { createComputedTask } from './factory/createComputedTask';
import { createWatch } from './factory/createWatch';
import * as advance from './helpers/advance';
import { useEffect, useLayoutEffect } from './hooks/useEffect';
import { useForceUpdate } from './hooks/useForceUpdate';
import { useObject } from './hooks/useObject';
import { useService } from './hooks/useService';
import { useShared, useSharedObject } from './hooks/useShared';
import { useComputed } from './hooks/useComputed';
import { useComputedAsync } from './hooks/useComputedAsync';
import { useComputedTask } from './hooks/useComputedTask';
import { useWatch } from './hooks/useWatch';

const derive = createComputed;
const deriveAsync = createComputedAsync;
const deriveTask = createComputedTask;

export {
  advance,
  useShared,
  useComputed,
  useComputedAsync,
  useComputedTask,
  useWatch,
  useObject,
  useService,
  useForceUpdate,
  useSharedObject,
  useEffect,
  useLayoutEffect,
  createShared,
  createSharedObject,
  createReactiveSharedObject,
  createComputed,
  createComputedAsync,
  createComputedTask,
  createWatch,
  derive,
  deriveAsync,
  deriveTask,
};

const toExport = {
  advance,
  useShared,
  useComputed,
  useComputedAsync,
  useComputedTask,
  useWatch,
  useObject,
  useService,
  useForceUpdate,
  useSharedObject,
  useEffect,
  useLayoutEffect,
  createShared,
  createSharedObject,
  createReactiveSharedObject,
  createComputed,
  createComputedAsync,
  createComputedTask,
  createWatch,
  derive,
  deriveAsync,
  deriveTask,
};

export default toExport;
