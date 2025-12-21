// src/components/GoalCard.jsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registra os elementos necessários para o Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Componente para o Gráfico de Rosca com o Percentual no Centro
const ChartWithCenterText = ({ meta, realizado }) => {
    // 1. Calcular o percentual de progresso
    const porcentagem = meta > 0 ? (realizado / meta) * 100 : (realizado > 0 ? 100 : 0);
    const progresso = Math.min(porcentagem, 100); // Limita o preenchimento a 100%
    const restante = 100 - progresso;
    
    // 2. Definir as cores
    // Vermelho (ff6384) se o realizado for maior que a meta (progresso > 100)
    const corRealizado = porcentagem > 100 ? '#ff6384' : '#4bc0c0'; 
    const corRestante = '#e0e0e0';

    const data = {
        labels: ['Realizado', 'Restante'],
        datasets: [{
            data: [progresso, restante],
            backgroundColor: [corRealizado, corRestante],
            borderColor: [corRealizado.replace('0.8', '1'), corRestante],
            borderWidth: 1,
        }],
    };

    // 3. Plugin para mostrar o texto central (porcentagem)
    const textCenter = {
        id: 'textCenter',
        beforeDatasetsDraw(chart, args, pluginOptions) {
            const { ctx } = chart;
            ctx.save();
            ctx.font = 'bolder 14px sans-serif';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Encontra o centro do gráfico
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            
            // Exibe a porcentagem, limitada a 999% para não quebrar o layout
            ctx.fillText(`${Math.min(porcentagem, 999).toFixed(0)}%`, x, y);
            ctx.restore();
        }
    };

    const options = {
        cutout: '70%', // Espessura da rosca
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
        }
    };

    return <Doughnut data={data} options={options} plugins={[textCenter]} />;
};

// Componente principal do Cartão (Card)
const GoalCard = ({ tag, meta, realizado, tagColor }) => {
    const diferenca = meta - realizado;
    const isEstourado = diferenca < 0;
    const color = tagColor || '#4bc0c0'; // Cor padrão se não fornecida

    // Lógica da Diferença Inteligente
    const smartDiferenca = () => {
        const valorAbsoluto = Math.abs(diferenca).toFixed(2).replace('.', ',');
        
        if (isEstourado) {
            return `O limite estourou em R$ ${valorAbsoluto}`;
        } else if (diferenca === 0) {
            return `Meta alcançada exatamente.`;
        } else {
            return `Ainda temos R$ ${valorAbsoluto} para gastar`;
        }
    };
    
    const cardStyle = {
        flex: '0 0 180px', // Largura fixa, não cresce nem encolhe
        width: '180px', // Largura fixa para mobile e rolagem horizontal
        minWidth: '180px', // Garante largura mínima
        maxWidth: '180px', // Garante largura máxima
        padding: '15px',
        marginRight: '10px', // Espaço entre os cartões
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        // Borda para destacar o estouro de limite
        border: isEstourado ? '2px solid #ff6384' : '1px solid #4bc0c0',
        boxSizing: 'border-box', // Inclui padding e border no cálculo da largura
    };
    
    const diferencaStyle = {
        fontSize: '12px',
        fontWeight: 'bold',
        color: isEstourado ? '#ff6384' : '#4bc0c0',
        marginTop: '10px',
    };

    // Estilo do título com highlight da cor da tag
    const titleStyle = {
        margin: '0 0 10px 0',
        fontSize: '16px',
        color: '#333',
        padding: '5px 10px',
        borderRadius: '5px',
        backgroundColor: color,
        color: '#fff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        fontWeight: 'bold'
    };

    return (
        <div style={cardStyle}>
            <h3 style={titleStyle}>{tag}</h3>
            
            <div style={{ width: '100px', height: '100px', marginBottom: '10px' }}>
                <ChartWithCenterText meta={meta} realizado={realizado} />
            </div>
            
            <p style={{ margin: '3px 0', fontSize: '12px' }}>
                Meta: <strong style={{color: '#36a2eb'}}>R$ {meta.toFixed(2).replace('.', ',')}</strong>
            </p>
            <p style={{ margin: '3px 0', fontSize: '12px' }}>
                Realizado: <strong style={{color: '#333'}}>R$ {realizado.toFixed(2).replace('.', ',')}</strong>
            </p>
            
            <div style={diferencaStyle}>
                {smartDiferenca()}
            </div>
        </div>
    );
};

export default GoalCard;