// src/utils/api.jsx - AGORA SUPORTA GET, ADD E UPDATE

// ***** CERTIFIQUE-SE QUE ESTA URL É A SUA URL ATIVA DO RENDER *****
const BACKEND_RENDER_URL = 'https://financeapp-backend-6iv3.onrender.com';

// -------------------------------------------------------------------------
// 1. FUNÇÃO DE LEITURA (GET) - Usada em App.jsx
// -------------------------------------------------------------------------

export const fetchDataFromBackend = async () => {
    const endpoint = `${BACKEND_RENDER_URL}/api/get-all-data`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Erro de rede: Status ${response.status}`);
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Erro ao buscar dados do Backend:", error);
        throw new Error(`Falha ao carregar dados: ${error.message}. Verifique o servidor Render.`);
    }
};


// -------------------------------------------------------------------------
// 2. FUNÇÃO DE ADIÇÃO (POST /api/add-registro) - Usada em RegistrosPage.jsx
// -------------------------------------------------------------------------

export const addDataToBackend = async (data) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/add-registro`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor Proxy: ${result.message || 'Falha na adição de registro.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar dados para o Backend (ADD):", error);
        throw error;
    }
};


// -------------------------------------------------------------------------
// 3. FUNÇÃO DE ATUALIZAÇÃO (POST /api/update-registro) - Usada em RegistrosPage.jsx
// -------------------------------------------------------------------------

export const updateDataInBackend = async ({ rowNumber, column, value }) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/update-registro`;
    
    const payload = { 
        ROW_NUMBER: rowNumber,
        column: column,
        value: value 
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor Proxy: ${result.message || 'Falha na atualização de registro.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar dados para o Backend (UPDATE):", error);
        throw error;
    }
};

// -------------------------------------------------------------------------
// 4. FUNÇÕES PARA METAS
// -------------------------------------------------------------------------

export const addMetaToBackend = async (data) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/add-meta`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na adição de meta.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar meta para o Backend (ADD):", error);
        throw error;
    }
};

export const updateMetaInBackend = async ({ rowNumber, column, value }) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/update-meta`;
    
    const payload = { 
        ROW_NUMBER: rowNumber,
        column: column,
        value: value 
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na atualização de meta.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao atualizar meta no Backend (UPDATE):", error);
        throw error;
    }
};

export const deleteMetaFromBackend = async ({ rowNumber }) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/delete-meta`;
    
    const payload = { ROW_NUMBER: rowNumber };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na deleção de meta.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao deletar meta no Backend (DELETE):", error);
        throw error;
    }
};

// -------------------------------------------------------------------------
// 5. FUNÇÕES PARA ORGANIZADORES/TAGS
// -------------------------------------------------------------------------

export const addOrganizadorToBackend = async (data) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/add-organizador`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na adição de tag.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar tag para o Backend (ADD):", error);
        throw error;
    }
};

export const updateOrganizadorInBackend = async ({ rowNumber, column, value }) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/update-organizador`;
    
    const payload = { 
        ROW_NUMBER: rowNumber,
        column: column,
        value: value 
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na atualização de tag.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao atualizar tag no Backend (UPDATE):", error);
        throw error;
    }
};

export const deleteOrganizadorFromBackend = async ({ rowNumber }) => {
    const endpoint = `${BACKEND_RENDER_URL}/api/delete-organizador`;
    
    const payload = { ROW_NUMBER: rowNumber };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na deleção de tag.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao deletar tag no Backend (DELETE):", error);
        throw error;
    }
};

// -------------------------------------------------------------------------
// 6. FUNÇÃO PARA DELETAR MÚLTIPLOS REGISTROS (PREPARADO PARA BACKEND)
// -------------------------------------------------------------------------

export const deleteMultipleRecordsFromBackend = async ({ rowNumbers }) => {
    // TODO: Implementar endpoint no backend: POST /api/delete-multiple-registros
    // Por enquanto, retorna erro informando que precisa ser implementado
    const endpoint = `${BACKEND_RENDER_URL}/api/delete-multiple-registros`;
    
    const payload = { rowNumbers: Array.from(rowNumbers) };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.message || 'Falha na deleção de registros.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao deletar múltiplos registros no Backend (DELETE):", error);
        throw error;
    }
};