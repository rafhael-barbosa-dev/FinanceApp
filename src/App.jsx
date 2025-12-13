// src/App.jsx - ATUALIZADO PARA RECARREGA DE DADOS
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { processAllData } from './utils/dataProcessor.jsx';
import Navigation from './components/Navigation.jsx';
import HomePage from './pages/HomePage.jsx'; 
import RegistrosPage from './pages/RegistrosPage.jsx'; 
import './App.css' 

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqGzf85y0vzefvr4uQ98YoS2BxYIrxZ5-BQnq5iD0vBOZRfisEbHKMechZFPNY-N2X/exec'; 

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null); 
  const location = useLocation();

  const activePage = location.pathname === '/' ? 'Home' : 
                     location.pathname.startsWith('/registros') ? 'Registros' : 
                     location.pathname === '/metas' ? 'Metas' : 
                     '';

  // 1. FUNÇÃO ESTÁVEL DE BUSCA DE DADOS
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (APPS_SCRIPT_URL === 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI') {
        setError("ERRO DE CONFIGURAÇÃO: Por favor, substitua a URL real.");
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
        
        const result = await response.json(); 
        if (result.error) throw new Error(result.error);

        const rawData = {
            registro: result.registro || [],
            metas: result.metas || [],
            organizadores: result.organizadores || []
        }
        
        const processed = processAllData(rawData);
        setAggregatedData(processed);

    } catch (err) {
        console.error("Falha ao carregar dados:", err);
        setError(`Falha ao carregar dados: ${err.message}. Verifique o Apps Script.`);
    } finally {
        setLoading(false);
    }
  }, [APPS_SCRIPT_URL]); 

  // 2. FUNÇÃO ESTÁVEL DE RELOAD (passada para RegistrosPage)
  const reloadData = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // 3. CARREGAMENTO INICIAL
  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando dados da planilha...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;

  return (
    <div className="App" style={{ paddingBottom: '70px' }}>
      <Routes>
        <Route path="/" element={<HomePage aggregatedData={aggregatedData} />} />
        
        {/* PASSANDO A FUNÇÃO RELOADDATA AQUI */}
        <Route path="/registros" element={<RegistrosPage aggregatedData={aggregatedData} reloadData={reloadData} />} />

        <Route path="/metas" element={<div>Página Metas (Em Construção)</div>} />
        <Route path="/tags" element={<div>Página Tags (Em Construção)</div>} />
        <Route path="/caixinhas" element={<div>Página Caixinhas (Em Construção)</div>} />
        <Route path="*" element={<div>Página Não Encontrada</div>} />
      </Routes>
      <Navigation active={activePage} />
    </div>
  );
}

export default App;