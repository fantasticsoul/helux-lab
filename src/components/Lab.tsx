import React, { useEffect } from 'react';
import {
  useSharedObject, createSharedObject, useObject, useService,
  createReactiveSharedObject, createShared,
  createComputed, useComputed, createComputedAsync, useComputedAsync,
  createWatch, useWatch,
} from '../helux/src';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const ret = createShared({ a: 1, b: 1 }, true);
const ret2 = createShared({ a: 100, b: 2 }, { enableReactive: true, moduleName: 'st2' });
const obj = ret2.state;
// const obj = createSharedObject({ a: 100, b: 2 }, true);
// const obj = createSharedObject({ a: 100, b: 2 });
// const [obj] = createReactiveSharedObject({ a: 100, b: 2 });

const add100Cu = createComputed(() => {
  console.log('call add100Cu');
  const { a } = obj;
  return { val: a + 100 };
});
// @ts-ignore
window.oo = add100Cu;

const asyncCu = createComputedAsync(
  () => {
    return { source: obj, initial: { asyncVal: 0 } };
  },
  // @ts-ignore
  async (params) => {
    const num = params.source.a + 1000;
    await delay(3000);
    console.error('trigger asyncCu');
    return { asyncVal: num };
  },
);

const asyncCuB = createComputedAsync(
  () => {
    return { source: obj.b, initial: { asyncValB: 0 } };
  },
  // @ts-ignore
  async (params) => {
    const num = params.source + 1000;
    await delay(6000);
    console.error('trigger asyncCuB');
    return { asyncValB: num };
  },
);

const asyncCu2 = createComputedAsync(
  () => {
    const { asyncVal } = asyncCu;
    const { asyncValB } = asyncCuB;
    return { source: { asyncVal, asyncValB }, initial: { asyncVal: 0, mark: 'asyncCu2' } };
  },
  // @ts-ignore
  async (params) => {
    const { asyncVal, asyncValB } = params.source;
    await delay(1000);
    console.error('trigger asyncCu2');
    return { asyncVal: asyncVal + asyncValB + 3, mark: 'asyncCu2' };
  },
);

console.log('asyncCu.asyncVal', asyncCu.asyncVal);
setTimeout(() => {
  console.log('asyncCu.asyncVal', asyncCu.asyncVal);
}, 0)

const add100Back = createComputed(() => {
  console.log(obj.a);
  console.log('test reuse add100Cu');
  return add100Cu;
});
const add100Back2 = createComputed(() => {
  console.log('test reuse add100Back');
  return add100Back;
});

// FIXME: 未驱动
// const add100CuChild = createComputed(() => {
//   console.log('call add100CuChild');
//   const { b } = obj;
//   const { val } = add100Cu;
//   console.log(`b ${b} val ${val}`);
//   return { val: b + 1000 + val };
// });

// createWatch((params) => {
//   const { a: a1 } = ret.state;
//   const { a: a2 } = ret2.state;
//   // console.log('a1 change ', a1);
//   // console.log('a2 change ', a2);
//   console.log(params.isFirstCall);
// });

// const addAB = createComputed(() => {
//   console.log('call addAB');
//   const { b, a } = obj;
//   return { val: b + a + 2 };
// });

function changeA(a: number, b: number) {
  ret.call(async function (ctx) {
    // const { args, state, setState } = ctx;
    const [a, b] = ctx.args;
    console.log('changeA', a, b);
    return { a, b };
  }, a, b);
}

function changeAv2(a: number, b: number) {
  console.log('changeAv2', a, b);
  ret.setState({ a, b });
}

// setTimeout(() => {
//   changeA(10111, 10111);
// }, 3000);

// setTimeout(() => {
//   changeAv2(2000, 20000);
// }, 6000);


// @ts-ignore
window.__OBJ__ = ret2.state;

function Demo() {
  const onClick = () => obj.a = Date.now();
  return <button onClick={onClick}>change a to see reactive</button>
}

function DemoUseService(props: any) {
  const [state, setState] = useSharedObject(obj);
  const srv = useService({ props, state, setState }, {
    change(a: number) {
      srv.ctx.setState({ a });
    },
  });
  return <div>
    DemoUseService:
    <button onClick={() => srv.change(Date.now())}>change a</button>
  </div>;
}

function TestHelux2(props: any) {
  const [state, setState] = useSharedObject(ret2.state);
  console.log('Render TestHelux2', state);

  return <div style={{ padding: '10px', margin: '10px', border: '1px solid red' }}>
    <h1>TestHelux2: a is {state.a}</h1>
    <button onClick={() => setState({ a: Date.now() })}>change a</button>
  </div>;
}


const TestCu = React.memo((props: any) => {
  console.log('render TestCu');
  const { cu1 } = props;
  return <h1 style={{ color: 'red' }}>TestCu: {cu1.val}</h1>
});

function TestHelux(props: any) {
  console.log('Render TestHelux');
  const [state, setState] = useSharedObject(obj, false);
  const [tmp, setTmp] = useObject({ show: true });
  // console.log('Render TestHelux', state);
  // // setInterval(()=>{
  // // state.a = Date.now(); 
  // // }, 2000);

  const [cu1] = useComputed(add100Cu);
  const [asyncCuTmp] = useComputed(asyncCu);
  const [asyncCu2Tmp] = useComputed(asyncCu2);
  const [acu, isCu] = useComputed(asyncCu2); // FIXME
  // const cu1Bak = useComputed(add100Back);
  // const cu1Bak2 = useComputed(add100Back2);
  // const cu2 = useComputed(add100Cu);
  // const cu3 = useComputed(add100Cu);
  // const cu4 = useComputed(add100Cu);
  // const cu5 = useComputed(add100CuChild);
  // const cu2Cust = useComputed(() => {
  //   const { a } = obj;
  //   // console.log('run cu2, a is ', a);
  //   return { val: a + 10000 };
  // });
  // const cu3Cust = useComputed(() => {
  //   const { a } = state;
  //   return { val: a + 20000 };
  // });

  // const cu1Bak2Cust = useComputed(() => {
  //   const { val } = add100Back2;
  //   return { val: val + 1000000 };
  // });

  // useWatch(() => {
  //   // console.log(`watch state.a change ${state.a}`);
  // });
  // useWatch(() => {
  //   // console.log(`watch obj.a change ${obj.a}`);
  // });

  return <div style={{ padding: '10px', margin: '10px', border: '1px solid blue' }}>
    <button onClick={() => setTmp({ show: !tmp.show })}>switch h1 display status</button><br />
    <button onClick={() => setState({ a: state.a + 100 })}>add a</button><br />
    {/* {tmp.show && <h1>TestHelux: a is {state.a}</h1>}
    <button onClick={() => setState({ a: Date.now() })}>change a</button> <br /> */}
    {tmp.show && <div>
      {/* <h3>cu1.val: {cu1.val}</h3><br /> */}
      {/* <h3>cu1.cu1Bak: {cu1Bak.val}</h3><br />
      <h3>cu1.cu1Bak2: {cu1Bak2.val}</h3><br />
      <h3>cu1.cu1Bak2Cust: {cu1Bak2Cust.val}</h3><br /> */}
      {/* <h3>state.a: {state.a}</h3><br />
      <h3>cu2.val: {cu2.val}</h3><br />
      <h3>cu3.val: {cu3.val}</h3><br /> */}
      {/* <h3>cu5.val: {cu5.val}</h3><br /> */}
      {/* <h3>cu2Cust.val: {cu2Cust.val}</h3><br /> */}
      {/* <h3>cu3Cust.val: {cu3Cust.val}</h3><br /> */}
      <h3>asyncCuTmp.asyncVal: {asyncCuTmp.asyncVal}</h3>
      <h3>asyncCu2Tmp.asyncVal: {asyncCu2Tmp.asyncVal}</h3>
      <h3>acu.asyncVal: {isCu ? 'computing' : acu.asyncVal}</h3>
      <h3>acu.asyncVal: {acu.asyncVal}</h3>
    </div>}
    <TestCu cu1={cu1} />
  </div>;
}

let count = 0;
function Entry(props: any) {
  const [show, setShow] = React.useState(true);
  const showRef = React.useRef(show);
  showRef.current = show;
  // useEffect(() => {
  //   setInterval(() => {
  //     count += 1;
  //     console.log(`call switchShow ${count} time`);
  //     setShow(!showRef.current);
  //   }, 50);
  // }, []);

  return <div>
    <button onClick={() => setShow(!show)}>switch show</button>
    <button onClick={() => ret2.setState({ a: obj.a + 100 })}>add a</button>
    <button onClick={() => ret2.setState({ b: obj.b + 100 })}>add b</button>
    {/* <TestHelux /> */}
    {show && <>
      <TestHelux />
      <TestHelux />
      {/* <TestHelux /> */}
      {/* <Ts */}
    </>}
    {/* <Demo />
    <DemoUseService /> */}
  </div>
}

// setInterval(() => {
//   ret2.setState({ a: obj.a + 100 });
// }, 200);


export default Entry;
