const SPREADSHEET_ID = '149RuLSboaZ-thzioPCpDxuQINU38JQarmkt4hT6fsys'; // SEU ID DA PLANILHA
const CLIENT_ID = '238812906130-opesdsnklslqtrb22bk9cpnb5f52jlih.apps.googleusercontent.com'; // SEU CLIENT ID

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'; 
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Variáveis de estado
let isAuthorized = false; 
let gisInited = false;
let tokenClient; 
let allRecords = []; 
let currentRecords = []; 
let currentMetas = []; 
let currentTags = []; 
let currentFormasPagamento = []; 

let filterState = {
    selectedTag: "ALL", 
    startDate: null,
    endDate: null
};

// --- 2. INICIALIZAÇÃO E AUTORIZAÇÃO (COM LOGS DE DIAGNÓSTICO) ---

window.gapiLoaded = () => { gapi.load('client', initializeGapiClient); };

window.gisLoaded = () => {
    console.log("LOG A: GIS carregado e iniciando token client.");
    
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            const authStatus = document.getElementById('auth-status');
            
            if (tokenResponse && tokenResponse.access_token) {
                console.log("LOG B: Autorização BEM-SUCEDIDA! isAuthorized = true.");
                gapi.client.setToken(tokenResponse);
                isAuthorized = true;
                if (authStatus) authStatus.style.display = 'none'; 
                loadAndRenderData(); 
            } else {
                console.log("LOG B: Autorização FALHOU/NEGADA.");
                isAuthorized = false;
                if (authStatus) {
                    authStatus.textContent = 'ERRO DE CONEXÃO. Clique para logar no Google.';
                    authStatus.style.cursor = 'pointer';
                    authStatus.onclick = handleAuthClick;
                    authStatus.style.display = 'block';
                }
                loadAndRenderData(); 
            }
        },
    });

    // Tenta obter o token imediatamente (modo silencioso)
    tokenClient.requestAccessToken({prompt: ''});
};

function initializeGapiClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gisInited = true;
    }, (error) => {
        console.error('Erro ao inicializar gapi.client:', error);
    });
}

function handleAuthClick() {
    if (gisInited && tokenClient) {
        // ESSA É A CHAVE DA PERSISTÊNCIA: Força o consentimento e a seleção de conta.
        tokenClient.requestAccessToken({prompt: 'consent select_account'}); 
    } else {
        alert('A API do Google ainda não foi inicializada.');
    }
}

// --- 3. FUNÇÕES DE SUPORTE E INICIALIZAÇÃO DO DOM (Mantidas) ---

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFilterListeners();
});

function populateSelect(elementId, optionsArray, includeNone = false) {
    const select = document.getElementById(elementId);
    if (!select) return; 

    select.innerHTML = '';
    
    if (elementId === 'filter-tag') {
        const allOption = document.createElement('option');
        allOption.value = "ALL";
        allOption.textContent = "Todas as Tags";
        select.appendChild(allOption);
    }

    if (includeNone && elementId !== 'filter-tag') {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Nenhuma";
        select.appendChild(defaultOption);
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
            
            if (targetPage === 'graficos') {
                renderCharts();
            }
            if (targetPage === 'tabela') {
                renderTable(currentRecords); 
            }
        });
    });
}

// --- 4. LÓGICA DE FILTRAGEM (Mantida) ---

function setupFilterListeners() {
    const applyButton = document.getElementById('apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            saveFilterState();
            applyFilters();
        });
    }
    restoreFilterState();
}

function saveFilterState() {
    const tagSelect = document.getElementById('filter-tag');
    
    filterState = {
        selectedTag: tagSelect.value, 
        startDate: document.getElementById('filter-start-date').value,
        endDate: document.getElementById('filter-end-date').value
    };
    
    localStorage.setItem('financeAppFilter', JSON.stringify(filterState));
}

function restoreFilterState() {
    const savedState = localStorage.getItem('financeAppFilter');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        filterState.selectedTag = parsedState.selectedTag || "ALL"; 
        filterState.startDate = parsedState.startDate || null;
        filterState.endDate = parsedState.endDate || null;
    }
    
    const tagSelect = document.getElementById('filter-tag');
    if (tagSelect) {
        tagSelect.value = filterState.selectedTag;
    }
    
    document.getElementById('filter-start-date').value = filterState.startDate || '';
    document.getElementById('filter-end-date').value = filterState.endDate || '';
}

function applyFilters() {
    let filteredData = allRecords; 

    if (filterState.selectedTag !== "ALL" && filterState.selectedTag !== "") {
        filteredData = filteredData.filter(record => 
            record.tag_1 === filterState.selectedTag
        );
    }

    const start = filterState.startDate ? new Date(filterState.startDate + 'T00:00:00') : null;
    const end = filterState.endDate ? new Date(filterState.endDate + 'T23:59:59') : null;

    if (start || end) {
        filteredData = filteredData.filter(record => {
            const recordDate = new Date(record.data + 'T00:00:00');
            let passesStart = true;
            let passesEnd = true;

            if (start) { passesStart = recordDate >= start; }
            if (end) { passesEnd = recordDate <= end; }
            return passesStart && passesEnd;
        });
    }

    currentRecords = filteredData; 
    
    const activePage = document.querySelector('.page.active').id;
    const resumo = calculateSummary(currentRecords);
    updateSummaryUI(resumo);

    if (activePage === 'graficos') {
        renderCharts();
    } else if (activePage === 'tabela') {
        renderTable(currentRecords);
    }
}

// --- 5. FUNÇÕES DE LEITURA (GET) DA API DO GOOGLE SHEETS COM DIAGNÓSTICO) ---

async function readSheetData(range) {
    if (!isAuthorized) {
        return [];
    }
    
    console.log(`LOG C: Tentando ler a aba: ${range}`);
    
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        
        console.log(`LOG D: Leitura de ${range} BEM-SUCEDIDA! ${response.result.values ? response.result.values.length : 0} linhas lidas.`);
        return response.result.values || [];
        
    } catch (err) {
        // Se este erro ocorrer, significa que a permissão foi negada APÓS o login (GCP/Compartilhamento) ou URL/ID incorreto.
        console.error('ERRO API DE LEITURA (FAILURE):', err);
        
        const authStatus = document.getElementById('auth-status');
        if (authStatus) {
            authStatus.textContent = `ERRO API! Verifique o NOME DA ABA e o COMPARTILHAMENTO da planilha.`;
            authStatus.style.cursor = 'pointer';
            authStatus.onclick = handleAuthClick;
            authStatus.style.display = 'block';
        }
        return [];
    }
}

async function loadAndRenderData() {
    console.log("LOG E: Iniciando loadAndRenderData."); 
    
    // 1. Carrega Organizadores (A:C)
    const orgData = await readSheetData('Organizadores!A:C');
    if (orgData.length > 1) {
        // A=Tag, B=Forma de pagamento, C=Tipo
        currentTags = orgData.slice(1).map(row => row[0]).filter(t => t && t !== 'Null' && t !== 'Recebimentos');
        currentFormasPagamento = orgData.slice(1).map(row => row[1]).filter(f => f);
        currentFormasPagamento = [...new Set(currentFormasPagamento)];

        populateSelect('tag_1', currentTags);
        populateSelect('tag_2', currentTags, true);
        document.getElementById('tag_2').value = "";
        populateSelect('forma_pagamento', currentFormasPagamento);
        
        populateSelect('filter-tag', currentTags);
        restoreFilterState(); 
        
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
            const valorString = row[1] || 'R$ 0,00'; 
            const valorNumerico = parseFloat(valorString.replace('R$', '').replace('.', '').replace(',', '.').trim() || 0);
            
            return {
                sheetRowIndex: index + 2, 
                data: row[0], 
                valor: valorNumerico,
                tag_1: row[2], 
                tag_2: row[3] || '',
                descricao: row[6] || '',
                forma_pagamento: row[7], 
                tipo: row[8] ? row[8].toLowerCase() : 'despesa', 
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

// --- 6. FUNÇÕES DE ESCRITA (Mantidas e verificadas com sua estrutura) ---

async function saveRecordToGoogleSheets(data) {
    if (!isAuthorized) {
        alert("Não autorizado. Conecte-se antes de salvar.");
        return false;
    }
    
    // Ordem das colunas: Data; Valor; Tag_1; Tag_2; Tag_3; Tag_4; Descrição; Forma do pagamento; Tipo
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

function editRecord(sheetRowIndex) {
    alert(`EDITAR: A funcionalidade de Edição (sheets.spreadsheets.values.update) ainda não foi implementada. Linha da planilha: ${sheetRowIndex}`);
}

async function removeRecord(sheetRowIndex) {
    if (confirm(`Tem certeza que deseja remover o registro da linha ${sheetRowIndex} da planilha? A remoção exige implementação complexa na API.`)) {
        alert(`REMOÇÃO PENDENTE: Implementar sheets.spreadsheets.batchUpdate.`);
    }
}


// --- 7, 8, 9. RESUMO, GRÁFICOS, TABELA (Mantidas) ---
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

let metasChart, fluxoChart;

function renderCharts() {
    if (metasChart) metasChart.destroy();
    if (fluxoChart) fluxoChart.destroy();

    const resumo = calculateSummary(currentRecords);
    
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

function renderTable(data) {
    const tbody = document.querySelector('#registros-table tbody');
    tbody.innerHTML = ''; 

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