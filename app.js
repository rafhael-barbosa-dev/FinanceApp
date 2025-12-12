// ====================================================================
// --- 1. CONFIGURAÇÃO DA API GOOGLE SHEETS (SUBSTITUA ESTES VALORES!) ---
// ====================================================================

// ⚠️ SUBSTITUA PELO ID DA SUA PLANILHA (o que está na URL)
const SPREADSHEET_ID = '149RuLSboaZ-thzioPCpDxuQINU38JQarmkt4hT6fsys'; 
// ⚠️ SUBSTITUA PELO SEU CLIENT ID OAUTH (do Google Cloud Console)
const CLIENT_ID = '238812906130-opesdsnklslqtrb22bk9cpnb5f52jlih.apps.googleusercontent.com'; 

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'; // Permite LEITURA e ESCRITA
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Variáveis de estado da aplicação
let isAuthorized = false; 
let gisInited = false;
let tokenClient; 
let currentRecords = []; // Armazena os registros lidos para uso na tabela/gráficos
let currentMetas = []; // Armazena as metas lidas
let currentTags = []; // Armazena as tags disponíveis
let currentFormasPagamento = []; // Armazena as formas de pagamento disponíveis

// --- 2. INICIALIZAÇÃO E AUTORIZAÇÃO (CHAMADO PELOS SCRIPTS DO GOOGLE) ---

/**
 * Função chamada quando a biblioteca de APIs do Google (gapi) é carregada.
 */
window.gapiLoaded = () => {
    // 1. Carrega a biblioteca de cliente GAPI
    gapi.load('client', initializeGapiClient);
};

/**
 * Função chamada quando a biblioteca de autenticação do Google (GIS) é carregada.
 */
window.gisLoaded = () => {
     // Cria o cliente de token para lidar com a autenticação de usuário
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                // Token obtido com sucesso.
                gapi.client.setToken(tokenResponse);
                isAuthorized = true;
                console.log('Autorização bem-sucedida.');
                document.getElementById('auth-status').textContent = 'Conectado';
                // Carrega os dados APÓS a conexão bem-sucedida
                loadAndRenderData(); 
            } else {
                isAuthorized = false;
                document.getElementById('auth-status').textContent = 'Desconectado';
                console.error('Falha ao obter token.');
            }
        },
    });
};

/**
 * Inicializa o cliente da GAPI.
 */
function initializeGapiClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gisInited = true;
        
        // Insere o botão de autorização e o status na interface
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            document.getElementById('app-content').insertAdjacentHTML('afterbegin', 
                `<div id="auth-container" style="text-align: center; margin-bottom: 15px; background-color: #fff; padding: 10px; border-radius: 8px;">
                    <button id="authorize_button" style="padding: 10px; border: none; border-radius: 4px; background-color: #007bff; color: white; cursor: pointer; font-size: 1em;">
                        Conectar com Google Sheets
                    </button>
                    <p id="auth-status" style="margin-top: 5px; font-weight: bold; color: #dc3545;">Desconectado</p>
                </div>`
            );
        }
        document.getElementById('authorize_button').onclick = handleAuthClick;
        
        // Tenta carregar dados (usuário pode já estar autenticado de uma sessão anterior)
        loadAndRenderData(); 

    }, (error) => {
        console.error('Erro ao inicializar gapi.client:', error);
        document.getElementById('auth-status').textContent = `Erro: ${error.message}`;
    });
}

function handleAuthClick() {
    if (gisInited && tokenClient) {
        // Solicita o token de acesso (inicia o fluxo de login OAuth)
        tokenClient.requestAccessToken();
    } else {
        alert('A API do Google ainda não foi inicializada. Tente novamente em instantes.');
    }
}

// --- 3. FUNÇÕES DE SUPORTE E INICIALIZAÇÃO DO DOM ---

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
});

/**
 * Função utilitária para preencher elementos <select>
 */
function populateSelect(elementId, optionsArray, includeNone = false) {
    const select = document.getElementById(elementId);
    if (!select) return; 

    // Limpa opções antigas para recarregar
    select.innerHTML = '';
    
    if (includeNone) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Nenhuma";
        select.appendChild(defaultOption);
    }

    optionsArray.forEach(option => {
        // Garante que o valor não é nulo ou vazio
        if (option) { 
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        }
    });
}

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
            
            // 3. Renderizar o conteúdo específico da página
            if (targetPage === 'graficos') {
                renderCharts();
            }
            if (targetPage === 'tabela') {
                renderTable(currentRecords); 
            }
        });
    });

    // Configuração inicial do formulário APÓS o DOM carregar.
    // O submit só é habilitado após o carregamento dos dados da API, mas a estrutura precisa estar aqui.
    const form = document.getElementById('registro-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// --- 4. FUNÇÕES DE LEITURA (GET) DA API DO GOOGLE SHEETS ---

/**
 * Função para ler dados de uma aba específica da planilha.
 * @param {string} range - Ex: 'Registro!A:I'
 * @returns {Promise<Array<Array<any>>>} - Os valores lidos.
 */
async function readSheetData(range) {
    if (!isAuthorized) {
        console.warn("Não autorizado para ler dados. Por favor, conecte-se.");
        return [];
    }
    
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        
        // Retorna os valores lidos (exclui a linha de cabeçalho na próxima etapa)
        return response.result.values || [];
        
    } catch (err) {
        console.error('Erro ao ler dados da planilha:', err);
        return [];
    }
}

/**
 * Carrega e processa todos os dados das três planilhas.
 */
async function loadAndRenderData() {
    // 1. Carrega Organizadores para configurar os dropdowns (não requer autorização para as tags/formas)
    const orgData = await readSheetData('Organizadores!A:B');
    if (orgData.length > 1) {
        // A: Tag, B: Forma de pagamento
        currentTags = orgData.slice(1).map(row => row[0]).filter(t => t && t !== 'Null' && t !== 'Recebimentos');
        currentFormasPagamento = orgData.slice(1).map(row => row[1]).filter(f => f);
        
        // Remove duplicatas nas formas de pagamento
        currentFormasPagamento = [...new Set(currentFormasPagamento)];

        // Popular os selects com dados da planilha
        populateSelect('tag_1', currentTags);
        populateSelect('tag_2', currentTags, true);
        document.getElementById('tag_2').value = "";
        populateSelect('forma_pagamento', currentFormasPagamento);
    }
    
    // Se não estiver autorizado, não podemos carregar Registros e Metas
    if (!isAuthorized) {
        updateSummaryUI({ totalGastos: 0, totalReceitas: 0, saldoLiquido: 0 });
        return;
    }

    // 2. Carrega Registros
    const registroData = await readSheetData('Registro!A:I');
    
    if (registroData.length > 1) {
        // Linha de cabeçalho: Mês, Data, Valor, Tag_1, Tag_2, Tag_3, Tag_4, Descrição, Forma do pagamento
        currentRecords = registroData.slice(1).map((row, index) => {
            const valorString = row[2] || 'R$ 0,00';
            const valorNumerico = parseFloat(valorString.replace('R$', '').replace('.', '').replace(',', '.').trim() || 0);
            const tag1 = row[3] || '';
            
            // Determina o tipo (Receita vs Despesa). 
            // ⚠️ CRÍTICO: SE NÃO HOUVER UMA COLUNA 'TIPO', ESTA É UMA REGRA INFERIDA. 
            // Assumimos que 'Salário' e 'Free lance' são receitas.
            const tipo = (tag1.includes('Salário') || tag1.includes('Free lance') || tag1.includes('Recebimentos')) ? 'receita' : 'despesa';

            return {
                // O +2 é porque removemos a linha de cabeçalho (1) e o índice é baseado em zero (1)
                sheetRowIndex: index + 2, 
                data: row[1],
                valor: valorNumerico,
                tipo: tipo,
                tag_1: tag1,
                forma_pagamento: row[8],
                descricao: row[7] || '',
            };
        });
        
        // 3. Carrega Metas
        const metasData = await readSheetData('Metas!A:C');
        if (metasData.length > 1) {
            currentMetas = metasData.slice(1).map(row => ({
                // Mes, Meta, Tag
                mes: row[0],
                meta: parseFloat((row[1] || 'R$ 0,00').replace('R$', '').replace('.', '').replace(',', '.').trim() || 0),
                tag: row[2]
            }));
        }

        // Processa os dados
        const resumo = calculateSummary(currentRecords);
        updateSummaryUI(resumo);
        
        // Renderiza gráficos e tabela se a aba estiver ativa
        if (document.getElementById('graficos').classList.contains('active')) {
             renderCharts();
        }
        if (document.getElementById('tabela').classList.contains('active')) {
             renderTable(currentRecords);
        }

    } else {
        updateSummaryUI({ totalGastos: 0, totalReceitas: 0, saldoLiquido: 0 });
    }
}

// --- 5. FUNÇÕES DE ESCRITA (POST/PUT/DELETE) DA API DO GOOGLE SHEETS ---

/**
 * Adiciona um novo registro na planilha 'Registro'.
 */
async function saveRecordToGoogleSheets(data) {
    if (!isAuthorized) {
        alert("Não autorizado. Conecte-se antes de salvar.");
        return false;
    }
    
    // O array de valores DEVE seguir a ordem exata das colunas na sua aba 'Registro'
    // Mês, Data, Valor, Tag_1, Tag_2, Tag_3, Tag_4, Descrição, Forma do pagamento
    const rowData = [
        // Mês (Calcula o Mês/Ano: ex: 12/2025 -> 12/25)
        `${new Date(data.data + 'T00:00:00').getMonth() + 1}/${new Date(data.data + 'T00:00:00').getFullYear().toString().slice(-2)}`, 
        data.data, // Data (como string, ex: YYYY-MM-DD)
        `R$ ${data.valor}`, // Valor (Formato R$ para que o Sheets interprete como moeda)
        data.tag_1,
        data.tag_2 || '',
        '', // Tag 3
        '', // Tag 4
        data.descricao,
        data.forma_pagamento,
    ];

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            // A1 garante que ele procurará a primeira linha vazia
            range: 'Registro!A1', 
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [rowData],
            },
        });

        alert(`Registro salvo com sucesso!`);
        return true;
        
    } catch (err) {
        console.error('Erro ao salvar registro:', err);
        alert(`Erro ao salvar registro: Verifique as permissões ou se o Client ID está correto.`);
        return false;
    }
}

// ⚠️ FALTA IMPLEMENTAR: A exclusão requer o 'sheetRowIndex' e o método `sheets.spreadsheets.batchUpdate`
// que é mais complexo. Por enquanto, só alerta.
async function removeRecordFromSheets(sheetRowIndex) {
    if (!isAuthorized) {
         alert("Não autorizado para remover.");
         return false;
    }
    // Para remover/editar é necessário usar o `batchUpdate` com o método `deleteDimension` ou `updateCells`
    alert(`FUNCIONALIDADE PENDENTE: Para remover o registro na linha ${sheetRowIndex} da planilha, é necessário implementar o método sheets.spreadsheets.batchUpdate.`);
    return false; // Simula falha
}

// --- 6. MANIPULAÇÃO DO FORMULÁRIO ---
async function handleFormSubmit(event) {
    event.preventDefault();

    const data = {
        data: document.getElementById('data').value,
        tipo: document.getElementById('tipo').value, // Receita/Despesa (Usado localmente)
        valor: parseFloat(document.getElementById('valor').value).toFixed(2),
        tag_1: document.getElementById('tag_1').value,
        tag_2: document.getElementById('tag_2').value,
        forma_pagamento: document.getElementById('forma_pagamento').value,
        descricao: document.getElementById('descricao').value,
    };
    
    if (data.tag_1 === '') {
        alert('Selecione pelo menos a Tag Principal.');
        return;
    }
    
    // Chama a função real de salvamento
    const success = await saveRecordToGoogleSheets(data);
    
    if (success) {
        document.getElementById('registro-form').reset();
        await loadAndRenderData(); // Recarrega os dados do Sheets
    }
}

// --- 7. LÓGICA DE CÁLCULO DE RESUMO ---

function calculateSummary(data) {
    let totalGastos = 0;
    let totalReceitas = 0;
    const gastosPorCategoria = {};

    data.forEach(item => {
        // O tipo é inferido na função loadAndRenderData
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
    const formatValue = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    document.getElementById('total-gastos').textContent = formatValue(resumo.totalGastos);
    document.getElementById('total-receitas').textContent = formatValue(resumo.totalReceitas);
    
    const saldoElement = document.getElementById('saldo-liquido');
    saldoElement.textContent = formatValue(resumo.saldoLiquido);
    saldoElement.style.color = resumo.saldoLiquido >= 0 ? '#28a745' : '#dc3545'; 
}


// --- 8. RENDERIZAÇÃO DE GRÁFICOS (Chart.js) ---
let metasChart, fluxoChart;

function renderCharts() {
    // Destrói os gráficos anteriores para evitar duplicação ou erros de atualização
    if (metasChart) metasChart.destroy();
    if (fluxoChart) fluxoChart.destroy();

    const resumo = calculateSummary(currentRecords);
    
    // A. Gráfico de Metas vs. Gastos (Barra)
    const categoriasComMetas = currentMetas.map(m => m.tag);
    const labels = [];
    const dadosGastos = [];
    const dadosMetas = [];

    // Preenche os arrays de dados
    categoriasComMetas.forEach(tag => {
        labels.push(tag);
        dadosGastos.push(resumo.gastosPorCategoria[tag] || 0);
        
        const meta = currentMetas.find(m => m.tag === tag);
        dadosMetas.push(meta ? meta.meta : 0);
    });
    
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
                y: { beginAtZero: true }
            },
            plugins: { legend: { position: 'top' } }
        }
    });

    // B. Gráfico de Fluxo de Caixa (Pizza/Donut)
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
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição de Fluxo de Caixa' }
            }
        }
    });
}

// --- 9. RENDERIZAÇÃO DA TABELA (Visualização) ---
function renderTable(data) {
    const tbody = document.querySelector('#registros-table tbody');
    tbody.innerHTML = ''; // Limpa a tabela

    // Reverte a ordem para mostrar os mais recentes primeiro
    data.slice().reverse().forEach((registro) => {
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
        // Passamos o sheetRowIndex que é a linha real na planilha (index + 2)
        acoesCell.innerHTML = `
            <button class="btn-acao btn-editar" onclick="editRecord(${registro.sheetRowIndex})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-acao btn-remover" onclick="removeRecord(${registro.sheetRowIndex})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    });
}

// Funções de Ação (que chamam a API de escrita)
function editRecord(sheetRowIndex) {
    alert(`EDITAR: A funcionalidade de Edição (sheets.spreadsheets.values.update) ainda não foi implementada. Linha da planilha: ${sheetRowIndex}`);
}

async function removeRecord(sheetRowIndex) {
    if (confirm(`Tem certeza que deseja remover o registro da linha ${sheetRowIndex} da planilha? A remoção exige implementação complexa na API.`)) {
        const success = await removeRecordFromSheets(sheetRowIndex);
        if (success) {
            await loadAndRenderData();
        }
    }
}