import React from 'react';
import { useRemoteComp } from 'hel-micro-react';
import lib from 'hel-tpl-remote-lib';

function TestOtherCompLocalDebug() {
  const [num, setNum] = React.useState(0);
  const changeNum = () => {
    setNum(lib.num.random(100));
  };
  const compRef = React.useRef<any>();

  // git clone https://github.com/hel-eco/hel-tpl-remote-react-comp-ts.git
  // cd hel-eco/hel-tpl-remote-react-comp-ts
  // npm run build_cust
  // cd hel_dist
  // http-server -p 8103 --cors （如未安装 http-server 需提前全局安装一下）
  const HelloRemoteReactComp = useRemoteComp('hel-tpl-remote-react-comps-ts', 'HelloRemoteReactComp', {
    custom: {
      // host: 'http://localhost:3103',
      host: 'http://127.0.0.1:8103',
      enable: false,
      extraCssList: [],
    },
  });

  return <div>
    <button onClick={() => compRef.current.sayHello()}>sey hello</button>
    <button onClick={changeNum}>num {num}</button>
    <HelloRemoteReactComp ref={compRef} />
  </div>
}

export default TestOtherCompLocalDebug;
