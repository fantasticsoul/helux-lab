// @ts-nocheck
import React from 'react';
import ReactDOMLegacy from "react-dom";
import ReactDOM from "react-dom/client";
import './index.css';
import App from './App';
// import App from './AppDemos';
import reportWebVitals from './reportWebVitals';

let rootNode = document.getElementById('root') as HTMLElement;
if (!rootNode) {
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
  rootNode = div;
}

function renderBy16() {
  ReactDOMLegacy.render(<App />, rootNode);
}

function renderBy18() {
  ReactDOM.createRoot(rootNode).render(
    <App />
  );
}

function renderBy18Strict() {
  ReactDOM.createRoot(rootNode).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// renderBy16();
// renderBy18();
renderBy18Strict();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

<script charset="utf-8"
  data-webpack="hel-tpl-remote-react-comps-ts:undefined"
  src="http://localhost:3103/main.4f368e79ea0346ecfc19.hot-update.js"
>
</script>
