import React from 'react';
import helMicro from 'hel-micro';
import lib from 'hel-tpl-remote-lib';
import { useRemoteComp } from 'hel-micro-react';
import ShadowView from 'shadow-view-react';
import logo from '../logo.svg';
// import t, { Button, DatePicker } from 'hel-tdesign-react';


// MyDatePicker (preFetch(remote-tdesign-react))
// DatePicker

function PreLoadDemo(props: any) {
  const newProps = { ...props, new: 1 };
  console.log('newProps', newProps);
  const [num, setNum] = React.useState(0);
  const [data, setData] = React.useState('');
  const [str, setStr] = React.useState('');
  const [shadow, setShadow] = React.useState<boolean>(true);
  const ref = React.useRef<any>(null);
  const changeNum = () => {
    setNum(lib.num.random(666));
  };

  const test = async () => {
    // 懒加载 zk-libtest 库
    const lib = await helMicro.preFetchLib('zk-libtest', {
      onFetchMetaFailed(params) {
        console.log(' --->onFetchMetaFailed ', params);
      },
      hook: {
        onFetchMetaFailed(params) {
          console.log(' --->onFetchMetaFailed 222', params);
        }
      }
    });
    console.log('lib result', lib.num.random(333));
  };

  const testRemoteLibTpl = async () => {
    // 调用预加载好的 hel-lodash 库方法
    setNum(lib.num.random(888));
  };

  const tcss = 'https://unpkg.com/hel-tdesign-react@1.1.4/hel_dist/static/css/css.c808c7c2.chunk.css';
  const Comp = useRemoteComp('hel-tdesign-react', 'MyComp', {
    custom: { host: 'http://localhost:3008' },
    // custom: { host: 'https://unpkg.com/hel-lodash/hel_dist/hel-meta.json', trust: true },
    extraCssList: [tcss],
    cssListToStr: true,
    mountShadowBodyForRef: false,
    shadow,
    hook: {
      beforeAppendAssetNode(params) {
        const newUrl = params.url.replace('https://unpkg.com', 'https://cdn.jsdelivr.net/npm');
        params.setAssetUrl(newUrl);
      },
    },
    onFetchMetaFailed(params) {
      console.log(' onFetchMetaFailed ', params);
    },
    // 4ts-ignore
    // ShadowViewImpl: ShadowView,
  });

  React.useEffect(() => {
    // @ts-ignore
    ref.current?.hello();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={testRemoteLibTpl}>test remote-lib-tpl {num}</button>
        <button onClick={test}>test zk-libtest and see log</button>
        {/* <Test /> */}
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <br />
        <button onClick={() => ref.current?.hello()}>trigger ref</button>
        <button onClick={() => setData(`${Date.now()}`)}>change data {data}</button>
        <button onClick={() => setShadow(!shadow)}>change show</button>
        <input value={str} onChange={(e) => setStr(e.target.value)} />
        {/* @ts-ignore */}
        <Comp ref={ref} a={1} refxx={ref} data={data}>
          {/* <h1>i an children gogogo</h1>
          <h2>i an children gogogo</h2>
          <h3>i an children gogogo</h3> */}
        </Comp>
        {/* <t.Button theme="danger">prefetched remote tdesign button 1 </t.Button>
        <t.Divider />
        <DatePicker />
        <Button theme="danger">prefetched remote tdesign button 2 </Button>
        <t.Divider />
        <Button theme="danger" onClick={changeNum}> call remote fn get result {num} </Button> */}
      </header>
    </div>
  );
}

export default PreLoadDemo;
