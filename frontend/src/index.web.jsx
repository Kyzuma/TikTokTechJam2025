// src/index.web.jsx (Web)
import React from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import '@lynx-js/web-core/index.css';
import '@lynx-js/web-elements/index.css';
import '@lynx-js/web-core';
import '@lynx-js/web-elements/all';

function AppWeb() {
  return <lynx-view style={{height:'100vh',width:'100vw'}} url="/main.web.bundle" />;
}
createRoot(document.getElementById('root')).render(<AppWeb />);
