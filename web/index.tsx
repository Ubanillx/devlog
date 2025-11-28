import React from 'react';
import ReactDOM from 'react-dom/client';
// 必须最先导入，初始化 API 配置
import './services/api';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);