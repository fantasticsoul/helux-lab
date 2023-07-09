import { useRemoteComp } from 'hel-micro-react';

function TestOtherComp() {
  console.log('see HelloRemoteReactComp');
  const HelloRemoteReactComp = useRemoteComp('hel-tpl-remote-react-comps-ts', 'HelloRemoteReactComp', {
    shadow: true,
    appendCss: true,
    custom: {
      host: 'http://localhost:3103',
      enable: true,
      trust: true,
    }
  });

  return <HelloRemoteReactComp />;
  // return <div />;
}

export default TestOtherComp;
