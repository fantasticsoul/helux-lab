import React from 'react';
import { useObject } from '../helux/src';
import { delay } from 'utils/timer';

async function mockCall() {
  await delay(3000);
  return Date.now();
}

function Bad1Fix() {
  console.log('Render Bad1Fix');
  const [state, setState] = useObject({ num: 1 });
  const isExecuteRef = React.useRef(false);
  if (!isExecuteRef.current) {
    isExecuteRef.current = true;
    mockCall().then((num) => {
      setState({ num });
    });
  }

  return <div>
    num is {state.num}
  </div>
}

export default Bad1Fix;
