// src/pages/HomePage.jsx - ATUALIZADO
import React, { useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard.jsx'; 
import SummaryCards from '../components/SummaryCards.jsx'; // NOVO IMPORT

// Mapa de Mês/Ano (MM/YYYY) para Nome do Mês (Para o filtro)
const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Função para limpar e converter o valor (copiada do dataProcessor para uso local seguro)
 * @param {string | number} valorInput - O valor.
 * @returns {number} O valor numérico (float).
 */
const localCleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};


const HomePage = ({ aggregatedData }) => {
    const metasAcompanhamento = aggregatedData?.metasAcompanhamento || {};
    const registroRawData = aggregatedData?.rawData?.registro || []; // Dados brutos de Registro
    
    // 1. Encontra todos os Meses/Anos disponíveis e ordena (MM/YYYY)
    const mesesDisponiveis = Object.keys(metasAcompanhamento).sort();
    
    // 2. Define o estado para o mês/ano selecionado (começa no mês mais recente)
    const [mesAnoSelecionado, setMesAnoSelecionado] = useState(mesesDisponiveis[mesesDisponiveis.length - 1] || '');

    // 3. Atualiza o estado quando os dados são carregados/alterados
    useEffect(() => {
        if (!mesAnoSelecionado && mesesDisponiveis.length > 0) {
            setMesAnoSelecionado(mesesDisponiveis[mesesDisponiveis.length - 1]);
        }
    }, [mesesDisponiveis, mesAnoSelecionado]);

    // 4. Lógica para calcular os totais mensais (Receita/Despesa)
    const { receitaMensal, despesaMensal } = React.useMemo(() => {
        let receita = 0;
        let despesa = 0;

        // Filtra os registros para o mês/ano selecionado
        registroRawData.forEach(record => {
            const dataStr = record.Data; 
            if (!dataStr || typeof dataStr !== 'string' || dataStr.length < 10) return;
            
            // Assume formato YYYY-MM-DD e converte para MM/YYYY
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

    // 5. Dados de metas filtrados
    const dadosDoMes = metasAcompanhamento[mesAnoSelecionado] || {};
    
    // Converte o objeto de metas em uma lista (Array)
    const listaMetas = Object.entries(dadosDoMes).map(([tag, dados]) => ({
        tag,
        ...dados
    }));
    
    // 6. Formata o título para o filtro
    const [mesStr, anoStr] = mesAnoSelecionado.split('/');
    const mesNome = MONTH_NAMES_PT[parseInt(mesStr, 10) - 1] || 'Mês Inválido';
    const tituloFiltro = `${mesNome} de ${anoStr}`;
    
    const handleFilterChange = (e) => {
        setMesAnoSelecionado(e.target.value);
    };

    // --- ESTILOS ---
    const containerStyle = {
        padding: '20px',
        fontFamily: 'Arial',
        minHeight: '100vh',
        backgroundColor: '#f4f4f9',
    };
    
    const headerStyle = {
        fontSize: '28px',
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
    };
    
    const filterContainerStyle = {
        marginBottom: '30px',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        width: '100%', 
        boxSizing: 'border-box' // Garante que padding não afete a largura total
    };
    
    const cardsContainerStyle = {
        display: 'flex',
        overflowX: 'scroll', 
        paddingBottom: '20px', 
        scrollbarWidth: 'none', 
        WebkitOverflowScrolling: 'touch', // Melhor rolagem no iOS
        // Esconde a barra de rolagem no Webkit (Chrome, Safari)
        '&::-webkit-scrollbar': { display: 'none' } 
    };

    if (mesesDisponiveis.length === 0) {
        return (
            <div style={containerStyle}>
                <h1 style={headerStyle}>Home Dashboard</h1>
                <p style={{ textAlign: 'center', color: '#ff6384' }}>Ainda não há dados de "Registro" ou "Metas" para calcular o acompanhamento por mês.</p>
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
                    // CORREÇÃO: Garante 100% de largura para adaptação mobile
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
            
            {/* NOVO: Cartões Fixos de Receita/Despesa e Barra de Balanço */}
            <SummaryCards 
                receita={receitaMensal} 
                despesa={despesaMensal} 
            />
            
            {/* Cartões de Meta com Rolagem Horizontal */}
            <div style={{ padding: '10px 0' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Metas de {tituloFiltro}:</h2>
                
                <div style={cardsContainerStyle}>
                    {listaMetas.length > 0 ? (
                        listaMetas.map((item) => (
                            <GoalCard
                                key={item.tag}
                                tag={item.tag}
                                meta={item.meta}
                                realizado={item.realizado}
                            />
                        ))
                    ) : (
                        <p style={{ paddingLeft: '10px', color: '#777' }}>Nenhuma meta definida para o mês selecionado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;