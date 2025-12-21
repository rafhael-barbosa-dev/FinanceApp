// src/utils/dataProcessor.jsx - REFORÇADO E NORMALIZADO PARA NOVOS DADOS

const cleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};

// --- FUNÇÃO DE PROCESSAMENTO DE REGISTRO ---
const processRegistroData = (records) => {
    const totalByType = {};
    const expensesByCategory = {};

    // 1. Tratamento e Normalização da Descrição
    records.forEach(record => {
        // Normaliza a coluna Descrição (com ou sem til) para 'Descricao' no código
        const descricao = record.Descrição || record.Descricao || '';
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

// --- FUNÇÃO DE PROCESSAMENTO DE METAS (Acompanhamento) ---
const processMetasAcompanhamento = (registro, metas) => {
    const realizadoPorMesTag = {};
    const TAG_COLUMNS = ['Tag_1', 'Tag_2', 'Tag_3', 'Tag_4']; 
    
    // 1. Calcula o Realizado por Mês/Tag
    registro.forEach(rec => {
        if (rec.Tipo !== 'Despesa') return; 
        
        const valorNumerico = cleanValue(rec.Valor); 
        const dataStr = rec.Data; 

        if (!dataStr || typeof dataStr !== 'string' || dataStr.length < 10) return;

        // Extrai MM/YYYY do formato YYYY-MM-DD
        const year = dataStr.substring(0, 4); 
        const month = dataStr.substring(5, 7);
        const mesAno = `${month}/${year}`; 

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

    // 2. Cruza com as Metas
    const acompanhamentoFinal = {};
    
    metas.forEach(metaItem => {
        const mesMeta = metaItem.Mes; // Ex: 01/25 (MM/AA)
        const metaValor = cleanValue(metaItem.Meta); 
        const tag = metaItem.Tag;
        
        // Converte MM/AA para MM/YYYY
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

// --- FUNÇÃO DE PROCESSAMENTO DE ORGANIZADORES (Opções) ---
const processOrganizadoresData = (organizadores) => {
    // Garante que o array não seja nulo
    if (!organizadores) return { allTags: [], tipos: [], tagsWithColors: {} };
    
    // 1. Extrai a lista de Tags
    const availableTags = organizadores
        .map(org => org.Tag)
        .filter(tag => tag && tag.toString().trim() !== '');
    
    // 2. Extrai a lista de Tipos (Coluna 'Tipo' do organizadores)
    const availableTypes = organizadores
        .map(org => org.Tipo)
        .filter((type, index, self) => type && type.toString().trim() !== '' && self.indexOf(type) === index);
    
    // 3. Cria um mapa de tags com suas cores
    // Assumindo que a cor está em uma coluna chamada 'Cor' ou pode ser extraída do background da célula
    // Por enquanto, vamos usar uma coluna 'Cor' se existir, senão usa cor padrão
    const tagsWithColors = {};
    organizadores.forEach(org => {
        if (org.Tag && org.Tag.toString().trim() !== '') {
            // Tenta ler a cor da coluna 'Cor', se não existir usa cor padrão
            const cor = org.Cor || org.cor || '#4bc0c0'; // Cor padrão azul
            tagsWithColors[org.Tag] = cor;
        }
    });
    
    return {
        allTags: [...new Set(availableTags)], 
        tipos: availableTypes,
        tagsWithColors: tagsWithColors, // Mapa de tag -> cor
    };
};

// --- FUNÇÃO PRINCIPAL ---
export const processAllData = (rawData) => {
    // CRÍTICO: Garante que rawData não seja nulo e que cada propriedade seja um array.
    const registro = rawData?.registro || [];
    const metas = rawData?.metas || [];
    const organizadores = rawData?.organizadores || [];

    const registroAggregated = processRegistroData(registro);
    const metasAcompanhamento = processMetasAcompanhamento(registro, metas); 
    const organizadoresOptions = processOrganizadoresData(organizadores);

    return {
        rawData: rawData, // Mantém os dados brutos
        registro: registroAggregated,
        metasAcompanhamento: metasAcompanhamento, 
        organizadores: organizadores,
        options: organizadoresOptions 
    };
};