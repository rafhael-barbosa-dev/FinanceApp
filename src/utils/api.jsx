// src/utils/api.jsx

/**
 * Envia dados para o servidor proxy (Backend Node.js/Render).
 * @param {string} backendUrl - O URL base do seu servidor Render (ex: https://proxy-app-xxxx.onrender.com).
 * @param {object} finalData - O objeto de dados a ser enviado (já formatado para a planilha).
 * @returns {object} O resultado da resposta do servidor.
 */
export const postDataToBackend = async (backendUrl, finalData) => {
    
    // O endpoint de escrita no seu servidor Node.js é /api/add-registro
    const endpoint = `${backendUrl}/api/add-registro`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors', // Necessário para evitar problemas de CORS entre GitHub Pages e Render
            headers: {
                'Content-Type': 'application/json',
            },
            // Envia o objeto de dados diretamente, conforme o backend Node.js espera
            body: JSON.stringify(finalData), 
        });

        // Verifica se a resposta HTTP é 2xx (Sucesso)
        if (!response.ok) {
            // Se o servidor retornar 4xx ou 5xx, lança um erro com o status
            throw new Error(`Erro na requisição POST: Status ${response.status} (${response.statusText})`);
        }

        const result = await response.json();
        
        // Verifica a flag de sucesso definida pelo seu backend Node.js
        if (!result.success) {
            // Se a requisição HTTP for 200, mas o servidor Node.js retornar {success: false}
            throw new Error(`Erro do Servidor Proxy: ${result.message || 'Falha desconhecida.'}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar dados para o Backend:", error);
        throw error;
    }
};


// IMPORTANTE: Se você tiver outras funções de API, elas devem ser adaptadas aqui.
// Remova ou comente a função original 'postDataToAppsScript' para evitar conflitos.