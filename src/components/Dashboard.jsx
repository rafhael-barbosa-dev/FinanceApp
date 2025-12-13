// src/components/Dashboard.js
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registrar os elementos do Chart.js que serão usados
ChartJS.register(ArcElement, Tooltip, Legend);

// Paleta de cores para os gráficos
const COLORS = {
    RECEITA: 'rgba(75, 192, 192, 0.8)', // Verde Água
    DESPESA: 'rgba(255, 99, 132, 0.8)', // Vermelho
    OUTROS: [
        'rgba(255, 159, 64, 0.8)', // Laranja
        'rgba(54, 162, 235, 0.8)', // Azul
        'rgba(153, 102, 255, 0.8)', // Roxo
        'rgba(201, 203, 207, 0.8)', // Cinza
        'rgba(255, 205, 86, 0.8)', // Amarelo
        'rgba(255, 120, 200, 0.8)', // Rosa
        'rgba(100, 255, 100, 0.8)', // Verde Limão
    ]
};

// --- Componente de Gráfico de Pizza (Receita vs. Despesa) ---
const ChartReceitaDespesa = ({ data }) => {
    const labels = Object.keys(data);
    const dataValues = Object.values(data);
    const totalReceita = data.Receita || 0;
    const totalDespesa = data.Despesa || 0;
    const saldo = totalReceita - totalDespesa;

    const chartData = {
        labels: labels,
        datasets: [{
            data: dataValues,
            backgroundColor: labels.map(label => COLORS[label.toUpperCase()] || COLORS.OUTROS[0]),
            borderColor: labels.map(label => COLORS[label.toUpperCase()] ? COLORS[label.toUpperCase()].replace('0.8', '1') : COLORS.OUTROS[0].replace('0.8', '1')),
            borderWidth: 1,
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: `Balanço Total: R$ ${saldo.toFixed(2).replace('.', ',')}`,
                font: {
                    size: 16
                }
            }
        }
    };

    return (
        <div style={styles.chartWrapper}>
            <h3>Receita vs. Despesa</h3>
            <Pie data={chartData} options={options} />
        </div>
    );
};

// --- Componente de Gráfico de Pizza (Despesas por Categoria) ---
const ChartDespesasCategoria = ({ data }) => {
    const labels = Object.keys(data);
    const dataValues = Object.values(data);
    const totalDespesa = dataValues.reduce((sum, current) => sum + current, 0);

    const chartData = {
        labels: labels,
        datasets: [{
            data: dataValues,
            // Rotaciona as cores para as categorias
            backgroundColor: labels.map((_, index) => COLORS.OUTROS[index % COLORS.OUTROS.length]),
            borderWidth: 1,
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: `Total de Despesas: R$ ${totalDespesa.toFixed(2).replace('.', ',')}`,
                font: {
                    size: 16
                }
            }
        }
    };

    return (
        <div style={styles.chartWrapper}>
            <h3>Despesas por Categoria (Tag_1)</h3>
            <Pie data={chartData} options={options} />
        </div>
    );
};

// --- Componente de Dashboard Principal ---
const Dashboard = ({ aggregatedData }) => {
    // 1. Desestruturar os dados de 'registro' do objeto principal
    const registroData = aggregatedData?.registro;

    // 2. Usar a checagem correta para a aba 'registro'
    if (!registroData || Object.keys(registroData.totalByType).length === 0) {
        return <div style={{...styles.container, textAlign: 'center', paddingTop: '50px'}}>
                   <h1 style={styles.header}>Dashboard Financeiro</h1>
                   <p style={{ color: '#555' }}>Nenhum dado encontrado para gerar gráficos.</p>
               </div>;
    }

    // 3. O componente é renderizado se houver dados
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Dashboard Financeiro</h1>
            <div style={styles.chartContainer}>
                {/* GRÁFICOS: Agora passamos 'registroData.totalByType' e 'registroData.expensesByCategory' */}
                <ChartReceitaDespesa data={registroData.totalByType} />
                
                {Object.keys(registroData.expensesByCategory).length > 0 && (
                    <ChartDespesasCategoria data={registroData.expensesByCategory} />
                )}
            </div>
        </div>
    );
};

export default Dashboard;

// Estilos básicos para mobile-first (usando React inline styles)
const styles = {
    container: {
        padding: '10px 20px',
        fontFamily: 'Arial, sans-serif',
        // Define o layout básico
        minHeight: '100vh', 
        backgroundColor: '#f4f4f9',
    },
    header: {
        fontSize: '28px',
        textAlign: 'center',
        marginBottom: '25px',
        color: '#333',
    },
    chartContainer: {
        display: 'flex',
        flexDirection: 'column', // Empilha no mobile (padrão)
        alignItems: 'center',
        gap: '40px', // Espaço entre os gráficos
    },
    chartWrapper: {
        maxWidth: '100%',
        width: '400px', // Limita a largura máxima para desktop
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
    }
    // Para um aplicativo real, você usaria um arquivo CSS separado
    // com Media Queries para alinhar lado a lado em telas maiores.
};