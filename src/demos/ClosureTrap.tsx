


import React from 'react';

function ClosureTrap() {
  const [state, setState] = React.useState({ num: 1 });
  React.useEffect(() => {
    return () => {
      console.log('report ', state.num);
    };
  }, []);

  return <div>
    num is : {state.num}
    <hr />
    <button onClick={() => setState({ num: state.num + 1 })}>add</button>
  </div>
}

export default ClosureTrap;
