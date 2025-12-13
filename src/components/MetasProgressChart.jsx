// src/components/MetasProgressChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MetasProgressChart = ({ data, mesAno, numMetas }) => {
    // Transforma os dados processados em formato de gráfico
    const labels = Object.keys(data);
    const metas = labels.map(tag => data[tag].meta);
    const realizados = labels.map(tag => data[tag].realizado);
    const porcentagens = labels.map(tag => data[tag].porcentagem);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Meta Definida (Fundo)',
                data: metas,
                backgroundColor: 'rgba(54, 162, 235, 0.3)', // Azul claro
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: 'Realizado',
                data: realizados,
                // Cor do realizado: muda para vermelho se estourar a meta
                backgroundColor: porcentagens.map(p => p > 1 ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)'), 
                borderColor: porcentagens.map(p => p > 1 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'),
                borderWidth: 1,
            }
        ],
    };
    
    const options = {
        indexAxis: 'y', // Barras horizontais
        responsive: true,
        plugins: {
            legend: { position: 'top', },
            title: { display: true, text: `Acompanhamento de ${numMetas} Metas - Mês ${mesAno}` },
            tooltip: { // Adiciona o percentual no tooltip
                callbacks: {
                    afterLabel: function(context) {
                        const tag = context.label;
                        const progresso = data[tag].porcentagem * 100;
                        return `Progresso: ${progresso.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: false,
                title: { display: true, text: 'Valor (R$)' }
            },
            y: {
                stacked: false,
            }
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default MetasProgressChart;