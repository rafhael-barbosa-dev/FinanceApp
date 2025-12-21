// src/App.jsx - REFORÇO NA VERIFICAÇÃO DE DADOS

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { processAllData } from './utils/dataProcessor.jsx';
import { fetchDataFromBackend } from './utils/api'; 
import Navigation from './components/Navigation.jsx';
import HomePage from './pages/HomePage.jsx'; 
import RegistrosPage from './pages/RegistrosPage.jsx';
import MetasPage from './pages/MetasPage.jsx';
import TagsPage from './pages/TagsPage.jsx'; 
import './App.css' 


function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null); 
  const location = useLocation();

  const activePage = location.pathname === '/' ? 'Home' : 
                     location.pathname.startsWith('/registros') ? 'Registros' : 
                     location.pathname === '/metas' ? 'Metas' : 
                     location.pathname === '/tags' ? 'Tags' : 
                     '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
        const rawData = await fetchDataFromBackend(); 
        
        // VERIFICAÇÃO DE SEGURANÇA: Garante que o objeto retornado tenha as chaves esperadas
        if (!rawData || !rawData.registro || !rawData.metas) {
             throw new Error("O Backend retornou dados incompletos ou vazios.");
        }
        
        const processed = processAllData(rawData);
        setAggregatedData(processed);

    } catch (err) {
        console.error("Falha ao carregar dados do Backend:", err);
        setError(`Falha ao carregar dados: ${err.message}. Verifique o console do navegador e os logs do Render.`);
    } finally {
        setLoading(false);
    }
  }, []); 

  const reloadData = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando dados da planilha via Render...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red', whiteSpace: 'pre-wrap' }}>{error}</div>;

  return (
    <div className="App" style={{ paddingBottom: '70px' }}>
      <Routes>
        <Route path="/" element={<HomePage aggregatedData={aggregatedData} />} />
        <Route path="/registros" element={<RegistrosPage aggregatedData={aggregatedData} reloadData={reloadData} />} />
        <Route path="/metas" element={<MetasPage aggregatedData={aggregatedData} reloadData={reloadData} />} />
        <Route path="/tags" element={<TagsPage aggregatedData={aggregatedData} reloadData={reloadData} />} />
        <Route path="/caixinhas" element={<div>Página Caixinhas (Em Construção)</div>} />
        <Route path="*" element={<div>Página Não Encontrada</div>} />
      </Routes>
      <Navigation active={activePage} />
    </div>
  );
}

export default App;