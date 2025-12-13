// src/components/SummaryCards.jsx
import React from 'react';

// Componente para a Barra de Progresso (Despesa vs Receita)
const BalanceProgressBar = ({ receita, despesa }) => {
    const totalDespesa = despesa || 0;
    const totalReceita = receita || 0;
    
    // Calcula o percentual de despesa em relação à receita
    let percentage = 0;
    if (totalReceita > 0) {
        percentage = (totalDespesa / totalReceita) * 100;
    }
    
    // Limita o progresso visual a 100% (mesmo que estoure)
    const progressBarWidth = Math.min(percentage, 100);
    
    // --- LÓGICA DE COR DINÂMICA (VERDE 0% -> AMARELO 50% -> VERMELHO 100%+) ---
    let barColor;
    
    if (percentage >= 100) {
        // Cor estática Vermelha se estourar
        barColor = 'hsl(0, 70%, 50%)'; 
    } else {
        // Interpolação de HUE (Matiz) de 120 (Verde) até 0 (Vermelho)
        // A escala de mudança é de 1.2 graus por porcento (120/100 = 1.2)
        const hue = 120 - (progressBarWidth * 1.2); 
        barColor = `hsl(${hue}, 70%, 50%)`;
    }
    // -------------------------------------------------------------------------
    
    // Calcula o saldo
    const saldo = totalReceita - totalDespesa;
    const saldoColor = saldo >= 0 ? '#4bc0c0' : '#ff6384'; // Verde se positivo/zero, Vermelho se negativo

    const barContainerStyle = {
        width: '100%',
        height: '15px',
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        marginTop: '10px',
        overflow: 'hidden',
    };
    
    const barStyle = {
        height: '100%',
        width: `${progressBarWidth}%`,
        backgroundColor: barColor, // Usa a cor dinâmica calculada
        transition: 'width 0.5s ease-in-out',
    };
    
    const subtitleStyle = {
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '5px',
        fontWeight: 'bold',
        color: saldoColor,
    };
    
    return (
        <div style={{ marginTop: '20px', padding: '10px', borderTop: '1px solid #eee' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', textAlign: 'center' }}>
                Balanço Mensal: <span style={{ color: saldoColor }}>R$ {saldo.toFixed(2).replace('.', ',')}</span>
            </p>
            <div style={barContainerStyle}>
                <div style={barStyle}></div>
            </div>
            <p style={subtitleStyle}>
                Despesa utilizada: {percentage.toFixed(1)}% da Receita
            </p>
        </div>
    );
};


// Componente para um Cartão de Resumo Individual
const SummaryCard = ({ title, value, color }) => {
    const cardStyle = {
        flex: 1,
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        margin: '0 5px', // Espaço entre os cartões
        border: `2px solid ${color}`,
        minWidth: '120px', // Mínimo para mobile
    };
    
    return (
        <div style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#555' }}>{title}</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: color }}>
                R$ {value.toFixed(2).replace('.', ',')}
            </p>
        </div>
    );
};


// Componente Principal de Sumário (SummaryCards)
const SummaryCards = ({ receita, despesa }) => {
    const containerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        margin: '0 -5px', // Compensa a margem dos cartões internos
    };

    return (
        <div style={{ marginBottom: '30px' }}>
            <div style={containerStyle}>
                <SummaryCard title="Total Receita" value={receita} color="#4bc0c0" />
                <SummaryCard title="Total Despesa" value={despesa} color="#ff6384" />
            </div>
            <BalanceProgressBar receita={receita} despesa={despesa} />
        </div>
    );
};

export default SummaryCards;