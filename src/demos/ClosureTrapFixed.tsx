


import React from 'react';

function ClosureTrap(props: any) {
  const [state, setState] = React.useState({ num: 1 });
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // handler stable
  // const handler = React.useEvent(() => { 
  //   console.log(state);
  // });
  // const clickbtn = () => {

  // };

  React.useEffect(() => {
    return () => {
      console.log('report ', stateRef.current.num);
    };
  }, []);

  return <div>
    num is : {state.num}
    <hr />
    <button onClick={() => setState({ num: state.num + 1 })}>add</button>
  </div>
}

export default ClosureTrap;
