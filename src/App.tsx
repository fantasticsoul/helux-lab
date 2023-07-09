import React from 'react';
import './App.css';
import PreLoadDemo from './components/PreLoadDemo';
import LazyLoadDemo from './components/LazyLoadDemo';
import TestOtherComp from './components/TestOtherComp';
import TestOtherCompLocalDebug from './components/TestOtherCompLocalDebug';
// import Lab from './components/Lab';
import Lab from './components/PreLoadDemo';
import Lab2 from './components/Lab2';
import TestDoubleMount from './components/TestDoubleMount';

const stLabel: React.CSSProperties = { padding: '0 12px' };

function App() {
  const [curView, setView] = React.useState('view7');
  const isView1 = curView === 'view1';
  const isView2 = curView === 'view2';
  const isView3 = curView === 'view3';
  const isView4 = curView === 'view4';
  const isView5 = curView === 'view5';
  const isView6 = curView === 'view6';
  const isView7 = curView === 'view7';
  const changeView: React.ChangeEventHandler<HTMLInputElement> = (e) => setView(e.target.value);

  return (
    <div>
      <div style={{ padding: '12px' }}>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView6} value="view6" onChange={changeView} />
          TestDoubleMount
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView5} value="view5" onChange={changeView} />
          see Lab
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView7} value="view7" onChange={changeView} />
          see Lab2
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView1} value="view1" onChange={changeView} />
          预加载 hel-tdesign-react
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView2} value="view2" onChange={changeView} />
          懒加载 hel-tdesign-react
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView3} value="view3" onChange={changeView} />
          查看 hel-tpl-remote-react-comp 远程组件
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView4} value="view4" onChange={changeView} />
          预览 remote-react-lib-tpl 项目远程组件
        </label>
      </div>
      {isView1 && <PreLoadDemo />}
      {isView2 && <LazyLoadDemo>{undefined}</LazyLoadDemo>}
      {isView3 && <TestOtherComp />}
      {isView4 && <TestOtherCompLocalDebug />}
      {isView5 && <Lab />}
      {isView6 && <TestDoubleMount />}
      {isView7 && <Lab2 />}
    </div>
  );
}


export default App;
