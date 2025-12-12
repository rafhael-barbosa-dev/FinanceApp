// --- 1. DADOS DE REFERÊNCIA (Extraídos do Organizadores.csv) ---
// Estes dados seriam carregados via API se a conexão com Google Sheets estivesse ativa.
const CATEGORIAS = ['Casa', 'Investimento', 'Transporte', 'Mercado', 'Fabricia', 'Rafhael', 'Pet', 'Saúde', 'Lazer', 'Recebimentos', 'Moradia', 'Consumo', 'Manutenção', 'Imprevisto', 'Salário', 'Free lance', 'Crédito', 'Débito', 'Imposto'];
const FORMAS_PAGAMENTO = ['Débito', 'Crédito'];

// --- 2. CONFIGURAÇÃO INICIAL E POPULAÇÃO DE DROPDOWNS ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Configuração da Navegação
    setupNavigation();

    // B. Preencher os Dropdowns
    populateSelect('tag_1', CATEGORIAS);
    // Para a Tag 2, adicionamos a opção 'Nenhuma'
    const tag2Select = document.getElementById('tag_2');
    populateSelect('tag_2', CATEGORIAS, true); // O 'true' indica para adicionar a opção "Nenhuma"
    tag2Select.value = ""; // Define o valor padrão como "Nenhuma"

    populateSelect('forma_pagamento', FORMAS_PAGAMENTO);

    // C. Configuração do Formulário
    document.getElementById('registro-form').addEventListener('submit', handleFormSubmit);

    // D. Carregar e Renderizar Dados (Simulação por enquanto)
    loadAndRenderData();
});

/**
 * Função utilitária para preencher elementos <select>
 * @param {string} elementId - ID do elemento select
 * @param {string[]} optionsArray - Array de strings para as opções
 * @param {boolean} includeNone - Incluir opção "Nenhuma"
 */
function populateSelect(elementId, optionsArray, includeNone = false) {
    const select = document.getElementById(elementId);
    
    if (includeNone) {
        // A opção 'Nenhuma' já existe no HTML, mas podemos garantir se o array for Tag 2/3/4
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Nenhuma";
        select.appendChild(defaultOption);
    }

    optionsArray.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

// --- 3. LÓGICA DA NAVEGAÇÃO ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            // 1. Alternar a classe 'active' na navegação
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Alternar a visibilidade da página
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
            
            // 3. Se for a página de gráficos, garantir que os gráficos sejam atualizados
            if (targetPage === 'graficos') {
                renderCharts();
            }
            if (targetPage === 'tabela') {
                renderTable(DADOS_SIMULADOS); // Atualiza a tabela com os dados
            }
        });
    });
}

// --- 4. MANIPULAÇÃO DO FORMULÁRIO (REGISTRO) ---
function handleFormSubmit(event) {
    event.preventDefault();

    const data = {
        data: document.getElementById('data').value,
        tipo: document.getElementById('tipo').value,
        valor: parseFloat(document.getElementById('valor').value).toFixed(2),
        tag_1: document.getElementById('tag_1').value,
        tag_2: document.getElementById('tag_2').value,
        forma_pagamento: document.getElementById('forma_pagamento').value,
        descricao: document.getElementById('descricao').value,
    };

    console.log("Dados a serem salvos:", data);
    
    // CHAMADA DE API: ESSA É A FUNÇÃO CRÍTICA
    // Você precisa implementar aqui a lógica para enviar 'data' para o Google Sheets.
    // Exemplo: saveRecordToGoogleSheets(data);
    
    // SIMULAÇÃO DE SUCESSO
    alert(`Registro de ${data.tipo} (R$ ${data.valor}) salvo com sucesso! (API TO DO)`);
    
    // Limpar e recarregar
    document.getElementById('registro-form').reset();
    loadAndRenderData(); // Recarrega os dados (simulados)
}

// --- 5. LÓGICA DE DADOS (SIMULAÇÃO) ---
// Em um app real, estas seriam chamadas de API do Google Sheets.

const DADOS_SIMULADOS = [
    { data: '2025-12-01', tipo: 'despesa', valor: 200.00, tag_1: 'Moradia', forma_pagamento: 'Débito' },
    { data: '2025-12-05', tipo: 'despesa', valor: 150.00, tag_1: 'Mercado', forma_pagamento: 'Crédito' },
    { data: '2025-12-10', tipo: 'despesa', valor: 200.00, tag_1: 'Transporte', forma_pagamento: 'Débito' },
    { data: '2025-12-15', tipo: 'receita', valor: 3500.00, tag_1: 'Salário', forma_pagamento: 'Débito' },
    { data: '2025-12-20', tipo: 'despesa', valor: 400.00, tag_1: 'Investimento', forma_pagamento: 'Débito' },
    { data: '2025-12-25', tipo: 'despesa', valor: 120.00, tag_1: 'Lazer', forma_pagamento: 'Crédito' },
    { data: '2025-12-30', tipo: 'despesa', valor: 150.00, tag_1: 'Consumo', forma_pagamento: 'Crédito' },
];

const METAS_SIMULADAS = [
    { tag: 'Moradia', meta: 1200.00 },
    { tag: 'Consumo', meta: 300.00 },
    { tag: 'Imprevisto', meta: 100.00 },
    { tag: 'Mercado', meta: 500.00 },
    { tag: 'Lazer', meta: 200.00 },
];

function loadAndRenderData() {
    // 1. Processar dados
    const resumo = calculateSummary(DADOS_SIMULADOS);
    
    // 2. Atualizar Resumo
    updateSummaryUI(resumo);

    // 3. Renderizar Tabela (apenas na inicialização ou após alteração)
    // Se a página de Tabela estiver ativa, ela será atualizada pelo JS de navegação
}

function calculateSummary(data) {
    let totalGastos = 0;
    let totalReceitas = 0;
    const gastosPorCategoria = {};

    data.forEach(item => {
        if (item.tipo === 'despesa') {
            totalGastos += item.valor;
            gastosPorCategoria[item.tag_1] = (gastosPorCategoria[item.tag_1] || 0) + item.valor;
        } else if (item.tipo === 'receita') {
            totalReceitas += item.valor;
        }
    });

    return {
        totalGastos: totalGastos,
        totalReceitas: totalReceitas,
        saldoLiquido: totalReceitas - totalGastos,
        gastosPorCategoria: gastosPorCategoria
    };
}

function updateSummaryUI(resumo) {
    document.getElementById('total-gastos').textContent = `R$ ${resumo.totalGastos.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-receitas').textContent = `R$ ${resumo.totalReceitas.toFixed(2).replace('.', ',')}`;
    const saldoElement = document.getElementById('saldo-liquido');
    saldoElement.textContent = `R$ ${resumo.saldoLiquido.toFixed(2).replace('.', ',')}`;
    saldoElement.style.color = resumo.saldoLiquido >= 0 ? '#28a745' : '#dc3545'; // Verde se positivo, vermelho se negativo
}


// --- 6. RENDERIZAÇÃO DE GRÁFICOS (Chart.js) ---
let metasChart, fluxoChart;

function renderCharts() {
    const resumo = calculateSummary(DADOS_SIMULADOS);
    const categoriasComMetas = METAS_SIMULADAS.map(m => m.tag);
    
    const labels = [];
    const dadosGastos = [];
    const dadosMetas = [];

    // Preenche os arrays de dados
    categoriasComMetas.forEach(tag => {
        labels.push(tag);
        dadosGastos.push(resumo.gastosPorCategoria[tag] || 0);
        
        const meta = METAS_SIMULADAS.find(m => m.tag === tag);
        dadosMetas.push(meta ? meta.meta : 0);
    });
    
    // 1. Gráfico de Metas vs. Gastos (Barra)
    if (metasChart) metasChart.destroy();
    
    metasChart = new Chart(document.getElementById('metasChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gasto Real (R$)',
                data: dadosGastos,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
            {
                label: 'Meta (R$)',
                data: dadosMetas,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                }
            }
        }
    });

    // 2. Gráfico de Fluxo de Caixa (Simplesmente Saldo Líquido no Mês)
    // Para simplificar a simulação, vamos apenas mostrar a receita vs despesa.
    if (fluxoChart) fluxoChart.destroy();

    fluxoChart = new Chart(document.getElementById('fluxoChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [resumo.totalReceitas, resumo.totalGastos],
                backgroundColor: ['#28a745', '#dc3545'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição de Fluxo de Caixa'
                }
            }
        }
    });
}

// --- 7. RENDERIZAÇÃO DA TABELA (Visualização) ---
function renderTable(data) {
    const tbody = document.querySelector('#registros-table tbody');
    tbody.innerHTML = ''; // Limpa a tabela

    data.forEach((registro, index) => {
        const row = tbody.insertRow();
        
        // Data
        row.insertCell().textContent = new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        // Valor
        const valorCell = row.insertCell();
        valorCell.textContent = `R$ ${registro.valor.toFixed(2).replace('.', ',')}`;
        valorCell.style.color = registro.tipo === 'receita' ? '#28a745' : '#dc3545';
        
        // Tag 1
        row.insertCell().textContent = registro.tag_1;
        
        // Forma de Pagamento
        row.insertCell().textContent = registro.forma_pagamento;

        // Ações (Editar/Remover)
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button class="btn-acao btn-editar" onclick="editRecord(${index})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-acao btn-remover" onclick="removeRecord(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    });
}

// Funções de Ação (Ainda dependem da API)
function editRecord(index) {
    // Lógica para carregar o registro na tela de formulário e mudar o botão para "Atualizar"
    alert(`EDITAR: Abrir registro de índice ${index} no formulário. (API TO DO)`);
}

function removeRecord(index) {
    // Lógica para confirmar e enviar o comando de remoção para o Google Sheets
    if (confirm(`Tem certeza que deseja remover o registro de índice ${index}?`)) {
        alert(`REMOVER: Registro ${index} removido. (API TO DO)`);
        // loadAndRenderData();
    }
}