// src/utils/dataProcessor.jsx - CORRIGIDO PARA FORMATO YYYY-MM-DD

// (Mantendo cleanValue e processRegistroData idênticos ao passo anterior, pois estão corretos)

const cleanValue = (valorInput) => {
    // ... (código da cleanValue) ...
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};

const processRegistroData = (records) => {
    // ... (código da processRegistroData) ...
    const totalByType = {};
    const expensesByCategory = {};
    records.forEach(record => {
        const valorNumerico = cleanValue(record.Valor); 
        const tipo = record.Tipo; 
        const categoria = record.Tag_1;

        if (tipo) {
            if (!totalByType[tipo]) totalByType[tipo] = 0;
            totalByType[tipo] += valorNumerico;
        }

        if (tipo === 'Despesa' && categoria) {
            if (!expensesByCategory[categoria]) expensesByCategory[categoria] = 0;
            expensesByCategory[categoria] += valorNumerico;
        }
    });
    return { totalByType, expensesByCategory };
};

// --- FUNÇÃO CORRIGIDA PARA DATA YYYY-MM-DD ---
const processMetasAcompanhamento = (registro, metas) => {
    const realizadoPorMesTag = {};
    const TAG_COLUMNS = ['Tag_1', 'Tag_2', 'Tag_3', 'Tag_4']; 
    
    registro.forEach(rec => {
        if (rec.Tipo !== 'Despesa') return; 
        
        const valorNumerico = cleanValue(rec.Valor); 
        const dataStr = rec.Data; // Recebido como YYYY-MM-DD

        if (!dataStr || typeof dataStr !== 'string' || dataStr.length < 10) return;

        // ########## CORREÇÃO APLICADA AQUI ##########
        const year = dataStr.substring(0, 4); // Ex: 2025
        const month = dataStr.substring(5, 7); // Ex: 12
        const mesAno = `${month}/${year}`; // Resultado: 12/2025
        // ############################################

        if (!realizadoPorMesTag[mesAno]) {
            realizadoPorMesTag[mesAno] = {};
        }

        TAG_COLUMNS.forEach(tagKey => {
            const tag = rec[tagKey];
            if (tag && tag.toString().trim() !== '') { 
                if (!realizadoPorMesTag[mesAno][tag]) {
                    realizadoPorMesTag[mesAno][tag] = 0;
                }
                realizadoPorMesTag[mesAno][tag] += valorNumerico;
            }
        });
    });

    // 2. Cruza com as Metas (Esta parte não mudou, pois já convertia Metas para MM/YYYY)
    const acompanhamentoFinal = {};
    
    metas.forEach(metaItem => {
        const mesMeta = metaItem.Mes; // Ex: 01/25 (MM/AA)
        const metaValor = cleanValue(metaItem.Meta); 
        const tag = metaItem.Tag;
        
        // Cria a chave MM/YYYY para comparação (Ex: 01/2025)
        const mesAnoCompleto = mesMeta && mesMeta.length === 5 
                             ? `${mesMeta.substring(0, 3)}20${mesMeta.substring(3, 5)}` 
                             : null;

        if (!mesAnoCompleto || !tag) return;
        
        if (!acompanhamentoFinal[mesAnoCompleto]) {
            acompanhamentoFinal[mesAnoCompleto] = {};
        }
        
        const realizado = realizadoPorMesTag[mesAnoCompleto] 
                          ? realizadoPorMesTag[mesAnoCompleto][tag] || 0 
                          : 0;
        
        acompanhamentoFinal[mesAnoCompleto][tag] = {
            meta: metaValor,
            realizado: realizado,
            porcentagem: (metaValor > 0) ? (realizado / metaValor) : (realizado > 0 ? Infinity : 0)
        };
    });

    return acompanhamentoFinal;
};

const processOrganizadoresData = (organizadores) => {
    // 1. Extrai a lista de Tags (Coluna 'Tag')
    const availableTags = organizadores
        .map(org => org.Tag)
        .filter(tag => tag && tag.toString().trim() !== '');

    // 2. Extrai a lista de Tipos (Coluna 'Tipo')
    const availableTypes = organizadores
        .map(org => org.Tipo)
        // Filtra para remover vazios/nulos e garante que sejam únicos
        .filter((type, index, self) => type && type.toString().trim() !== '' && self.indexOf(type) === index);

    return {
        allTags: [...new Set(availableTags)], // Lista de todas as tags disponíveis
        tipos: availableTypes, // Lista de tipos (Receita, Despesa, etc.)
    };
};

export const processAllData = (rawData) => {
    const registroAggregated = processRegistroData(rawData.registro);
    const metasAcompanhamento = processMetasAcompanhamento(rawData.registro, rawData.metas); 
    
    // NOVO: Processa as opções de Tags e Tipos
    const organizadoresOptions = processOrganizadoresData(rawData.organizadores);

    return {
        rawData: rawData,
        registro: registroAggregated,
        metasAcompanhamento: metasAcompanhamento, 
        organizadores: rawData.organizadores,
        options: organizadoresOptions // NOVO: Opções de Tags e Tipos
    };
};