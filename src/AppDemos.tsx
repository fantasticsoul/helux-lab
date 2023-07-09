import React from 'react';
import './App.css';
import Lab from './components/Lab';
import Bad1 from './demos/Bad1';
import Bad1Fix from './demos/Bad1Fix';
import ClosureTrap from './demos/ClosureTrap';
import ClosureTrapFixed from './demos/ClosureTrapFixed';

const stLabel: React.CSSProperties = { padding: '0 12px' };

function App() {
  const [curView, setView] = React.useState('view1');
  const isView1 = curView === 'view1';
  const isView2 = curView === 'view2';
  const isView3 = curView === 'view3';
  const isView4 = curView === 'view4';
  const changeView: React.ChangeEventHandler<HTMLInputElement> = (e) => setView(e.target.value);

  return (
    <div>
      <div style={{ padding: '12px' }}>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView1} value="view1" onChange={changeView} />
          see Lab
        </label>
        {/* <label style={stLabel}>
          <input name="demo" type="radio" checked={isView2} value="view2" onChange={changeView} />
          see early fetch fixed
        </label> */}
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView3} value="view3" onChange={changeView} />
          see ClosureTrap
        </label>
        <label style={stLabel}>
          <input name="demo" type="radio" checked={isView4} value="view4" onChange={changeView} />
          see ClosureTrapFixed
        </label>
      </div>
      {isView1 && <Lab />}
      {/* {isView2 && <Bad1Fix />} */}
      {isView3 && <ClosureTrap />}
      {isView4 && <ClosureTrapFixed />}
    </div>
  );
}


export default App;

