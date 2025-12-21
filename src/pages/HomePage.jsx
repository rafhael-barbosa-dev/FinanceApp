// src/pages/HomePage.jsx - CORRIGIDO: Tratamento de Nullish Coalescing e Dados Vazios

import React, { useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard.jsx'; 
import SummaryCards from '../components/SummaryCards.jsx'; 

// Mapa de Mês/Ano (MM/YYYY) para Nome do Mês
const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const localCleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};


const HomePage = ({ aggregatedData }) => {
    // CRÍTICO: Usar o operador ?. e garantir arrays/objetos vazios como fallback
    const metasAcompanhamento = aggregatedData?.metasAcompanhamento || {};
    const registroRawData = aggregatedData?.rawData?.registro || []; 
    
    // 1. Encontra todos os Meses/Anos disponíveis e ordena (MM/YYYY)
    // Também extrai meses dos registros caso não haja metas
    const mesesDasMetas = Object.keys(metasAcompanhamento).sort();
    const mesesDosRegistros = React.useMemo(() => {
        const mesesSet = new Set();
        registroRawData.forEach(record => {
            const dataStr = record.Data;
            if (dataStr && typeof dataStr === 'string' && dataStr.length >= 10) {
                const month = dataStr.substring(5, 7);
                const year = dataStr.substring(0, 4);
                mesesSet.add(`${month}/${year}`);
            }
        });
        return Array.from(mesesSet).sort();
    }, [registroRawData]);
    
    // Combina ambos os arrays e remove duplicatas
    const mesesDisponiveis = React.useMemo(() => {
        const todosMeses = [...new Set([...mesesDasMetas, ...mesesDosRegistros])].sort();
        return todosMeses;
    }, [mesesDasMetas, mesesDosRegistros]);
    
    const [mesAnoSelecionado, setMesAnoSelecionado] = useState('');

    // 2. Atualiza o estado quando os dados são carregados/alterados
    useEffect(() => {
        if (mesesDisponiveis.length > 0 && !mesAnoSelecionado) {
            // Seleciona o mês mais recente
            setMesAnoSelecionado(mesesDisponiveis[mesesDisponiveis.length - 1]);
        }
    }, [mesesDisponiveis]);

    // 3. Lógica para calcular os totais mensais
    const { receitaMensal, despesaMensal } = React.useMemo(() => {
        let receita = 0;
        let despesa = 0;

        if (!mesAnoSelecionado) return { receitaMensal: 0, despesaMensal: 0 };
        
        registroRawData.forEach(record => {
            const dataStr = record.Data; 
            if (!dataStr || typeof dataStr !== 'string' || dataStr.length < 10) return;
            
            const month = dataStr.substring(5, 7); 
            const year = dataStr.substring(0, 4); 
            const recordMesAno = `${month}/${year}`; 

            if (recordMesAno === mesAnoSelecionado) {
                const valorNumerico = localCleanValue(record.Valor);
                if (record.Tipo === 'Receita') {
                    receita += valorNumerico;
                } else if (record.Tipo === 'Despesa') {
                    despesa += valorNumerico;
                }
            }
        });

        return { receitaMensal: receita, despesaMensal: despesa };
    }, [registroRawData, mesAnoSelecionado]);

    // 4. Dados de metas filtrados
    const dadosDoMes = metasAcompanhamento[mesAnoSelecionado] || {};
    
    // Converte o objeto de metas em uma lista (Array)
    const listaMetas = Object.entries(dadosDoMes).map(([tag, dados]) => ({
        tag,
        ...dados
    }));
    
    // 5. Formata o título para o filtro
    const [mesStr, anoStr] = mesAnoSelecionado.split('/');
    const mesNome = MONTH_NAMES_PT[parseInt(mesStr, 10) - 1] || 'Mês Inválido';
    const tituloFiltro = `${mesNome} de ${anoStr}`;
    
    const handleFilterChange = (e) => {
        setMesAnoSelecionado(e.target.value);
    };

    // --- ESTILOS MOBILE-FIRST ---
    const containerStyle = {
        padding: '15px',
        fontFamily: 'Arial, sans-serif',
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: '#f4f4f9',
        width: '100%',
        maxWidth: '100vw', // Limita à largura da viewport
        boxSizing: 'border-box',
        overflowX: 'hidden', // Previne scroll horizontal no container principal
        position: 'relative',
    };
    
    const headerStyle = {
        fontSize: '24px',
        textAlign: 'center',
        marginBottom: '15px',
        color: '#333',
        fontWeight: 'bold',
    };
    
    const filterContainerStyle = {
        marginBottom: '20px',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        width: '100%', 
        boxSizing: 'border-box'
    };
    
    const cardsContainerStyle = {
        display: 'flex',
        overflowX: 'auto', 
        overflowY: 'hidden',
        paddingBottom: '20px',
        gap: '10px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        width: '100%',
        maxWidth: '100%', // Garante que não ultrapasse o container pai
        boxSizing: 'border-box',
        // Remove qualquer margem que possa causar overflow
        marginLeft: 0,
        marginRight: 0,
    };

    // Se não há dados ou mês selecionado, mostra mensagem de carregamento
    if (!aggregatedData || mesesDisponiveis.length === 0) {
        return (
            <div style={containerStyle}>
                <h1 style={headerStyle}>Home Dashboard</h1>
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    {!aggregatedData ? 'Carregando dados...' : 'Nenhuma informação encontrada na planilha.'}
                </p>
            </div>
        );
    }
    
    if (!mesAnoSelecionado) {
        return (
            <div style={containerStyle}>
                <h1 style={headerStyle}>Home Dashboard</h1>
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Carregando...</p>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h1 style={headerStyle}>Acompanhamento de Metas</h1>
            
            {/* Filtro de Data */}
            <div style={filterContainerStyle}>
                <label htmlFor="mesFiltro" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Visualizando:
                </label>
                <select 
                    id="mesFiltro" 
                    value={mesAnoSelecionado} 
                    onChange={handleFilterChange}
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', fontSize: '16px', boxSizing: 'border-box' }}
                >
                    {mesesDisponiveis.map(mesAno => {
                        const [m, a] = mesAno.split('/');
                        const nome = MONTH_NAMES_PT[parseInt(m, 10) - 1] || m;
                        return (
                            <option key={mesAno} value={mesAno}>
                                {nome} de {a}
                            </option>
                        );
                    })}
                </select>
            </div>
            
            {/* Cartões Fixos de Receita/Despesa e Barra de Balanço - FORA da rolagem */}
            <div style={{ 
                width: '100%', 
                maxWidth: '100%',
                marginBottom: '20px',
                boxSizing: 'border-box',
                overflowX: 'hidden' // Garante que não cause scroll horizontal
            }}>
                <SummaryCards 
                    receita={receitaMensal} 
                    despesa={despesaMensal} 
                />
            </div>
            
            {/* Cartões de Meta com Rolagem Horizontal - APENAS ESTES TÊM SCROLL */}
            <div style={{ 
                padding: '10px 0', 
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden' // Previne overflow do container pai
            }}>
                <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Metas de {tituloFiltro}:</h2>
                
                <div style={cardsContainerStyle}>
                    {listaMetas.length > 0 ? (
                        listaMetas.map((item) => {
                            const tagColor = aggregatedData?.options?.tagsWithColors?.[item.tag] || '#4bc0c0';
                            return (
                                <GoalCard
                                    key={item.tag}
                                    tag={item.tag}
                                    meta={item.meta}
                                    realizado={item.realizado}
                                    tagColor={tagColor}
                                />
                            );
                        })
                    ) : (
                        <p style={{ paddingLeft: '10px', color: '#777' }}>Nenhuma meta definida para o mês selecionado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;