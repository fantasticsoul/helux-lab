import helMicro from 'hel-micro';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactIs from 'react-is';

helMicro.bindReactRuntime({ React, ReactDOM, ReactIs });

// @ts-ignore
// const ins = helMicro.createOriginInstance('hel', {
//   semverApi: false,
//   apiPrefix: 'https://hel.woa.com',
//   trustAppNames: ['remote-lib-tpl'],
// });
const ins = helMicro;

helMicro.isSubApp();
async function main() {
  console.log('start main');

  // custom.enable 可根据情况自己设定，此处表示处于本地调试开发时 custom 配置才生效
  // 解开下面注释，需要 clone 以下两个项目并启动起来

  const tcss = 'https://unpkg.com/hel-tdesign-react@1.1.4/hel_dist/static/css/css.c808c7c2.chunk.css';
  const result = await Promise.all([
    ins.preFetchLib('hel-tpl-remote-lib'),
    // ins.preFetchLib('hel-tpl-remote-lib', { custom: { host: 'http://localhost:3001' } }),

    ins.preFetchLib('hel-tdesign-react'),
    // ins.preFetchLib('hel-tdesign-react', { custom: { host: 'http://localhost:3008' }, extraCssList: [tcss] }),

    // ins.preFetchLib('remote-lib-tpl', { strictMatchVer: false }),
    // ins.preFetchLib('remote-tdesign-react', { strictMatchVer: false }),
  ]);
  console.log('------ result ', result);

  await import('./loadApp18');
  // await import('./loadApp');
  // console.log('loadApp');
}

main().catch((err: any) => {
  alert(`Oops, something must he wrong! ${err.message}`);
  console.error(err);
});
