import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AstroProvider } from './context/AstroContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AstroProvider>
      <App />
    </AstroProvider>
  </React.StrictMode>
);
