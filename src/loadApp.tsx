import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import App from './AppDemos';
import reportWebVitals from './reportWebVitals';

let rootNode = document.getElementById('root') as HTMLElement;
if (!rootNode) {
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
  rootNode = div;
}

function renderBy16() {
  ReactDOM.render(<App />, rootNode);
}

renderBy16();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
