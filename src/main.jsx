// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'; // Importa o Router
import App from './App.jsx'
import './index.css'

// Detecta o base path baseado na URL atual
const getBasename = () => {
  // Se estiver rodando localmente, não usa basename
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/';
  }
  // Se a URL contém /FinanceApp/, usa esse basename
  if (window.location.pathname.startsWith('/FinanceApp')) {
    return '/FinanceApp';
  }
  // Caso contrário, usa raiz
  return '/';
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolve o App com o Router com basename dinâmico */}
    <Router basename={getBasename()}>
      <App />
    </Router>
  </React.StrictMode>,
)