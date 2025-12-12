// ====================================================================
// --- 1. CONFIGURAÇÃO DA API GOOGLE SHEETS (SUBSTITUA ESTES VALORES!) ---
// ====================================================================

// ⚠️ SUBSTITUA PELO ID DA SUA PLANILHA (o que está na URL)
const SPREADSHEET_ID = '149RuLSboaZ-thzioPCpDxuQINU38JQarmkt4hT6fsys'; 
// ⚠️ SUBSTITUA PELO SEU CLIENT ID OAUTH (do Google Cloud Console)
const CLIENT_ID = '238812906130-opesdsnklslqtrb22bk9cpnb5f52jlih.apps.googleusercontent.com'; 

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'; 
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Variáveis de estado da aplicação
let isAuthorized = false; 
let gisInited = false;
let tokenClient; 
let allRecords = []; // Armazena TODOS os registros lidos da planilha
let currentRecords = []; // Armazena os registros FILTRADOS
let currentMetas = []; 
let currentTags = []; 
let currentFormasPagamento = []; 

// Variáveis de Estado do Filtro
let filterState = {
    selectedTags: [],
    startDate: null,
    endDate: null
};

// --- 2. INICIALIZAÇÃO E AUTORIZAÇÃO ---

window.gapiLoaded = () => {
    gapi.load('client', initializeGapiClient);
};

window.gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                gapi.client.setToken(tokenResponse);
                isAuthorized = true;
                document.getElementById('auth-status').textContent = 'Conectado';
                loadAndRenderData(); 
            } else {
                isAuthorized = false;
                document.getElementById('auth-status').textContent = 'Desconectado';
                console.error('Falha ao obter token.');
            }
        },
    });
};

function initializeGapiClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gisInited = true;
        
        const authButton = document.getElementById('authorize_button');
        if (authButton) authButton.onclick = handleAuthClick;
        
        loadAndRenderData(); 

    }, (error) => {
        console.error('Erro ao inicializar gapi.client:', error);
        document.getElementById('auth-status').textContent = `Erro: ${error.message}`;
    });
}

function handleAuthClick() {
    if (gisInited && tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        alert('A API do Google ainda não foi inicializada. Tente novamente em instantes.');
    }
}

// --- 3. FUNÇÕES DE SUPORTE E INICIALIZAÇÃO DO DOM ---

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFilterListeners();
    // O formulário de registro só é configurado depois que as tags são carregadas
});

function populateSelect(elementId, optionsArray, includeNone = false) {
    const select = document.getElementById(elementId);
    if (!select) return; 

    select.innerHTML = '';
    
    if (includeNone && !select.multiple) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Nenhuma";
        select.appendChild(defaultOption);
    }

    if (select.multiple) {
        const allOption = document.createElement('option');
        allOption.value = "ALL";
        allOption.textContent = "Todas as Tags";
        select.appendChild(allOption);
    }

    optionsArray.forEach(option => {
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

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
            
            // Re-renderiza a página ativa
            if (targetPage === 'graficos') {
                renderCharts();
            }
            if (targetPage === 'tabela') {
                renderTable(currentRecords); 
            }
        });
    });
}

// --- 4. LÓGICA DE FILTRAGEM ---

function setupFilterListeners() {
    const applyButton = document.getElementById('apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            saveFilterState();
            applyFilters();
        });
    }

    const tagSelect = document.getElementById('filter-tag');
    if (tagSelect) {
        restoreFilterState();
        tagSelect.addEventListener('change', () => {
            const options = Array.from(tagSelect.options);
            const selectedOptions = options.filter(opt => opt.selected);
            const allOption = options.find(opt => opt.value === 'ALL');

            if (selectedOptions.length > 1 && allOption && allOption.selected) {
                // Se 'ALL' foi selecionado junto com outros, deseleciona 'ALL'
                allOption.selected = false;
            } else if (selectedOptions.length === 0 && allOption) {
                 // Se nada foi selecionado, seleciona 'ALL' por padrão
                 allOption.selected = true;
            }
        });
    }
}

function saveFilterState() {
    const tagSelect = document.getElementById('filter-tag');
    
    let selectedTags = Array.from(tagSelect.selectedOptions)
                            .map(option => option.value)
                            .filter(value => value !== 'ALL');
    
    // Se a opção 'ALL' estiver selecionada (ou se selectedTags estiver vazio), o filtro é por todas.
    if (tagSelect.querySelector('option[value="ALL"]').selected && selectedTags.length === 0) {
        selectedTags = []; 
    }
    
    filterState = {
        selectedTags: selectedTags,
        startDate: document.getElementById('filter-start-date').value,
        endDate: document.getElementById('filter-end-date').value
    };
    
    localStorage.setItem('financeAppFilter', JSON.stringify(filterState));
}

function restoreFilterState() {
    const savedState = localStorage.getItem('financeAppFilter');
    if (savedState) {
        filterState = JSON.parse(savedState);
    }
    
    const tagSelect = document.getElementById('filter-tag');
    if (tagSelect) {
        Array.from(tagSelect.options).forEach(option => option.selected = false);
        
        if (filterState.selectedTags.length === 0) {
            const allOption = tagSelect.querySelector('option[value="ALL"]');
            if (allOption) allOption.selected = true;
        } else {
            filterState.selectedTags.forEach(tag => {
                const option = tagSelect.querySelector(`option[value="${tag}"]`);
                if (option) option.selected = true;
            });
        }
    }
    
    document.getElementById('filter-start-date').value = filterState.startDate || '';
    document.getElementById('filter-end-date').value = filterState.endDate || '';
}

function applyFilters() {
    let filteredData = allRecords; 

    // 1. Filtrar por Tags
    if (filterState.selectedTags.length > 0) {
        filteredData = filteredData.filter(record => 
            filterState.selectedTags.includes(record.tag_1)
        );
    }

    // 2. Filtrar por Data
    const start = filterState.startDate ? new Date(filterState.startDate + 'T00:00:00') : null;
    const end = filterState.endDate ? new Date(filterState.endDate + 'T23:59:59') : null;

    if (start || end) {
        filteredData = filteredData.filter(record => {
            const recordDate = new Date(record.data + 'T00:00:00');
            let passesStart = true;
            let passesEnd = true;

            if (start) {
                passesStart = recordDate >= start;
            }
            if (end) {
                passesEnd = recordDate <= end;
            }
            return passesStart && passesEnd;
        });
    }

    currentRecords = filteredData; 
    
    // 3. Renderizar o conteúdo da aba ativa
    const activePage = document.querySelector('.page.active').id;
    const resumo = calculateSummary(currentRecords);
    updateSummaryUI(resumo);

    if (activePage === 'graficos') {
        renderCharts();
    } else if (activePage === 'tabela') {
        renderTable(currentRecords);
    }
}

// --- 5. FUNÇÕES DE LEITURA (GET) DA API DO GOOGLE SHEETS ---

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
        return response.result.values || [];
        
    } catch (err) {
        console.error('Erro ao ler dados da planilha:', err);
        return [];
    }
}

async function loadAndRenderData() {
    // 1. Carrega Organizadores (A:C)
    // A=Tag, B=Forma de pagamento, C=Tipo
    const orgData = await readSheetData('Organizadores!A:C');
    if (orgData.length > 1) {
        // Tag está em row[0]
        currentTags = orgData.slice(1).map(row => row[0]).filter(t => t && t !== 'Null' && t !== 'Recebimentos');
        // Forma de pagamento está em row[1]
        currentFormasPagamento = orgData.slice(1).map(row => row[1]).filter(f => f);
        currentFormasPagamento = [...new Set(currentFormasPagamento)];

        // Popular selects do formulário e do filtro
        populateSelect('tag_1', currentTags);
        populateSelect('tag_2', currentTags, true);
        document.getElementById('tag_2').value = "";
        populateSelect('forma_pagamento', currentFormasPagamento);
        
        populateSelect('filter-tag', currentTags);
        restoreFilterState(); 
        
        // Configura o formulário APÓS o carregamento das tags
        const form = document.getElementById('registro-form');
        if (form) {
            form.removeEventListener('submit', handleFormSubmit);
            form.addEventListener('submit', handleFormSubmit);
        }
    }
    
    if (!isAuthorized) {
        updateSummaryUI({ totalGastos: 0, totalReceitas: 0, saldoLiquido: 0 });
        return;
    }

    // 2. Carrega Registros (A:I)
    // Colunas: Data[0]; Valor[1]; Tag_1[2]; Tag_2[3]; Tag_3[4]; Tag_4[5]; Descrição[6]; Forma do pagamento[7]; Tipo[8]
    const registroData = await readSheetData('Registro!A:I'); 
    
    if (registroData.length > 1) {
        allRecords = registroData.slice(1).map((row, index) => {
            const valorString = row[1] || 'R$ 0,00'; // Valor agora é row[1]
            const valorNumerico = parseFloat(valorString.replace('R$', '').replace('.', '').replace(',', '.').trim() || 0);
            
            return {
                sheetRowIndex: index + 2, 
                data: row[0], // Data agora é row[0]
                valor: valorNumerico,
                tag_1: row[2], // Tag 1 agora é row[2]
                tag_2: row[3] || '',
                descricao: row[6] || '',
                forma_pagamento: row[7], // Pagamento agora é row[7]
                tipo: row[8] ? row[8].toLowerCase() : 'despesa', // Tipo agora é row[8]
            };
        });
        
        // 3. Carrega Metas (A:C)
        const metasData = await readSheetData('Metas!A:C');
        if (metasData.length > 1) {
            currentMetas = metasData.slice(1).map(row => ({
                mes: row[0],
                meta: parseFloat((row[1] || 'R$ 0,00').replace('R$', '').replace('.', '').replace(',', '.').trim() || 0),
                tag: row[2]
            }));
        }

        applyFilters(); 
    } else {
        allRecords = [];
        currentRecords = [];
        updateSummaryUI({ totalGastos: 0, totalReceitas: 0, saldoLiquido: 0 });
    }
}

// --- 6. FUNÇÕES DE ESCRITA (POST/PUT/DELETE) DA API DO GOOGLE SHEETS ---

async function saveRecordToGoogleSheets(data) {
    if (!isAuthorized) {
        alert("Não autorizado. Conecte-se antes de salvar.");
        return false;
    }
    
    // Ordem das colunas na planilha: Data; Valor; Tag_1; Tag_2; Tag_3; Tag_4; Descrição; Forma do pagamento; Tipo
    const rowData = [
        data.data, 
        `R$ ${data.valor}`, 
        data.tag_1,
        data.tag_2 || '',
        '', // Tag 3
        '', // Tag 4
        data.descricao,
        data.forma_pagamento,
        data.tipo.charAt(0).toUpperCase() + data.tipo.slice(1),
    ];

    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
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
        alert(`Erro ao salvar registro: ${err.message}`);
        return false;
    }
}

async function handleFormSubmit(event) {
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
    
    if (data.tag_1 === '') {
        alert('Selecione pelo menos a Tag Principal.');
        return;
    }
    
    const success = await saveRecordToGoogleSheets(data);
    
    if (success) {
        document.getElementById('registro-form').reset();
        await loadAndRenderData(); 
    }
}

// Funções de Ação (Ainda dependem de implementação complexa)
function editRecord(sheetRowIndex) {
    alert(`EDITAR: A funcionalidade de Edição (sheets.spreadsheets.values.update) ainda não foi implementada. Linha da planilha: ${sheetRowIndex}`);
}

async function removeRecord(sheetRowIndex) {
    if (confirm(`Tem certeza que deseja remover o registro da linha ${sheetRowIndex} da planilha? A remoção exige implementação complexa na API.`)) {
        alert(`REMOÇÃO PENDENTE: Implementar sheets.spreadsheets.batchUpdate.`);
    }
}


// --- 7. LÓGICA DE CÁLCULO DE RESUMO ---

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
    if (metasChart) metasChart.destroy();
    if (fluxoChart) fluxoChart.destroy();

    const resumo = calculateSummary(currentRecords);
    
    // A. Gráfico de Metas vs. Gastos (Barra)
    const categoriasComMetas = currentMetas.map(m => m.tag);
    const labels = [];
    const dadosGastos = [];
    const dadosMetas = [];

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
    tbody.innerHTML = ''; 

    // Reverte a ordem para mostrar os mais recentes primeiro
    data.slice().reverse().forEach((registro) => {
        const row = tbody.insertRow();
        
        row.insertCell().textContent = new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        const valorCell = row.insertCell();
        valorCell.textContent = `R$ ${registro.valor.toFixed(2).replace('.', ',')}`;
        valorCell.style.color = registro.tipo === 'receita' ? '#28a745' : '#dc3545';
        
        row.insertCell().textContent = registro.tag_1;
        row.insertCell().textContent = registro.forma_pagamento;

        const acoesCell = row.insertCell();
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