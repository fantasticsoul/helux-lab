import React, { useEffect } from 'react';
import {
  useSharedObject, useObject, createShared, useComputed, createComputedAsync,
} from '../helux/src';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const ret = createShared({ a: 10, b: 1 }, true);
const ret2 = createShared({ a: 50, b: 2 }, { enableReactive: true, moduleName: 'st2' });
const obj = ret2.state;


const cu1Ret = createComputedAsync(
  () => {
    // return { source: obj, initial: { val: 0 } };
    return { source: obj.a, initial: { val: 0 } };
  },
  // @ts-ignore
  async (params) => {
    // const num = params.source.a + 1000;
    const num = params.source + 1000;
    await delay(3000);
    return { val: num, mark: 'cu1Ret' };
  },
);


const TestCu = React.memo((props: any) => {
  console.log('render TestCu');
  const { cu1 } = props;
  return <h1 style={{ color: 'red' }}>TestCu: {cu1.val}</h1>
});

const TestHelux = React.memo(function TestHelux(props: any) {
  console.log('Render TestHelux Component');
  const [state, setState] = useSharedObject(obj, false);
  const [tmp, setTmp] = useObject({ show: true });

  const cu1 = useComputed(cu1Ret, true); // TestCu will not update !!!

  return <div style={{ padding: '10px', margin: '10px', border: '1px solid blue' }}>
    <button onClick={() => setTmp({ show: !tmp.show })}>switch h1 display status</button><br />
    <button onClick={() => setState({ a: state.a + 100 })}>add a</button><br />
    <TestCu cu1={cu1} />
  </div>;
});

function Entry(props: any) {
  console.log('Render Entry');
  const [show, setShow] = React.useState(true);
  const showRef = React.useRef(show);
  const [state] = useSharedObject(obj);
  const [cu1] = useComputed(cu1Ret);
  showRef.current = show;

  return <div>
    <button onClick={() => setShow(!show)}>switch show</button>
    <button onClick={() => ret2.setState({ a: obj.a + 100 })}>add a</button>
    <button onClick={() => ret2.setState({ b: obj.b + 100 })}>add b</button>
    <button onClick={() => ret2.setState({ a: obj.a + 100, b: obj.b + 50 })}>add a and b</button>
    {show && <>
      <TestHelux />
      {/* <TestHelux /> */}
    </>}
    <div>
      <h3>state.a: {state.a}</h3>
      <h3>state.b: {state.b}</h3>
      <h3>cu1.val: {cu1.val}</h3>
    </div>
  </div>
}


export default Entry;
