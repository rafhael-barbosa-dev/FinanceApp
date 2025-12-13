// src/utils/api.js

// Assumimos que o App.jsx passará a URL correta
export const postDataToAppsScript = async (appsScriptUrl, action, data) => {
    const payload = {
        action: action,
        data: data
    };

    try {
        const response = await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'cors', // Necessário para evitar problemas no POST
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição POST: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Erro do Servidor: ${result.error}`);
        }
        
        return result;

    } catch (error) {
        console.error("Erro ao enviar dados para Apps Script:", error);
        throw error;
    }
};