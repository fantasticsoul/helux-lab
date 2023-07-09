import React, { useState } from 'react';
import { useEffect } from 'react';
// import { useEffect } from '../helux/src/hooks/useEffect';

function Child(props: any) {
  const { len = 0 } = props;
  const list = new Array(len);
  const copy = [];
  for (const item of list) {
    copy.push(item || Date.now()); // simulate heavy compute
  }
  return <div style={{ height: '60px', overflowY: 'scroll', padding: '10px', border: '1px solid red', margin: '8px' }}>
    {copy.map((item, idx) => <div key={idx}>{item}</div>)}
  </div>
}

function TestDoubleMount(props: any) {
  console.log('TestDoubleMount');
  const { len = 0, name } = props;

  const [now, setNow] = useState(() => {
    const now = Date.now();
    return now;
  })
  useEffect(() => {
    console.log(`mount ${name}`, now);
    return () => {
      console.log(`unmount ${name}`);
    };
  }, [name, now]);

  return <div onClick={() => setNow(Date.now())}>
    <h1>{name}</h1>
    test double mount {now}
    <br />
    <Child len={len} />
  </div>
}


let insKey = 0;
const MOUNT_MAP = new Map<number, { count: number }>();

function getInsKey() {
  insKey++;
  return insKey;
}

function useMyHook(tag: string) {
  const [insKey] = useState(() => getInsKey());
  console.log(`TestDoubleMount ${tag} ${insKey}`);
  React.useEffect(() => {
    console.log(`mount ${tag} ${insKey}`);
    return () => console.log(`clean up ${tag} ${insKey}`);
  }, [insKey]);
}

function TestDoubleMount2(props: any) {
  useMyHook('tag1');
  useMyHook('tag2');
  return <div>TestDoubleMount2</div>
}


export default function Test() {
  return (
    <div>
      <TestDoubleMount2 name="Order11" len={10000} />
      {/* <TestDoubleMount name="Order22" /> */}
    </div>
  );
}
