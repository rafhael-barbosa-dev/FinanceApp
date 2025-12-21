// src/components/DirectEditForm.jsx - ADAPTADO PARA ATUALIZAÇÃO UNITÁRIA

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

// Funções de formatação (mantidas)
const cleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};
const dateToInput = (dateObj) => dateObj ? dateObj.toISOString().split('T')[0] : '';
const formatDateDisplay = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return '';
    return dateStr.substring(8, 10) + '/' + dateStr.substring(5, 7) + '/' + dateStr.substring(0, 4);
};


const DirectEditForm = ({ record, column, options, onSave, isSaving }) => {
    // Obtém o valor original baseado na coluna
    // IMPORTANTE: Backend retorna 'Descricao' (sem til), mas o frontend usa 'Descrição' (com til) para exibição
    let originalValue;
    if (column === 'Tags') {
        // Para Tags, monta o array a partir das colunas Tag_1, Tag_2, Tag_3, Tag_4
        originalValue = [
            record.Tag_1 || '',
            record.Tag_2 || '',
            record.Tag_3 || '',
            record.Tag_4 || ''
        ].filter(tag => tag && tag.toString().trim() !== '');
    } else if (column === 'Descrição') {
        // Backend retorna 'Descricao' (sem til)
        originalValue = record.Descricao || record.Descrição || '';
    } else {
        originalValue = record[column] || '';
    }
    
    const [localValue, setLocalValue] = useState(() => {
        if (column === 'Valor' && typeof originalValue !== 'object') {
            return cleanValue(originalValue);
        } else if (column === 'Tags') {
            return originalValue || [];
        } else {
            return originalValue;
        }
    });

    // Função de save que dispara a ação UPDATE_RECORD
    const saveDirectEdit = () => {
        if (column === 'Tags') {
            // Para Tags, precisamos atualizar todas as 4 colunas (Tag_1, Tag_2, Tag_3, Tag_4)
            const tagsArray = Array.isArray(localValue) ? localValue : [];
            
            // Preenche o array até 4 elementos
            const newTags = [...tagsArray];
            while (newTags.length < 4) {
                newTags.push('');
            }
            
            // Atualiza cada tag individualmente (o backend atualiza uma célula por vez)
            // Faz as atualizações sequencialmente para garantir ordem
            const updateTags = async () => {
                for (let i = 0; i < 4; i++) {
                    const tagColumn = `Tag_${i + 1}`;
                    const newTagValue = newTags[i] || '';
                    const currentTagValue = record[tagColumn] || '';
                    
                    // Só atualiza se o valor mudou
                    if (newTagValue !== currentTagValue) {
                        try {
                            await onSave(
                                {...record, [tagColumn]: newTagValue}, 
                                'UPDATE_RECORD', 
                                tagColumn
                            );
                        } catch (err) {
                            console.error(`Erro ao atualizar ${tagColumn}:`, err);
                        }
                    }
                }
            };
            
            updateTags();

        } else {
            // Mapeamento correto dos nomes das colunas do frontend para a planilha
            let columnToUpdate = column;
            let valueToSave = localValue;
            
            // Tratamento especial para cada tipo de coluna
            if (column === 'Data') {
                columnToUpdate = 'Data';
                valueToSave = dateToInput(localValue); // Converte para YYYY-MM-DD
            } else if (column === 'Valor') {
                columnToUpdate = 'Valor';
                valueToSave = cleanValue(localValue); // Converte para número
            } else if (column === 'Descrição' || column === 'Descricao') {
                // Backend agora espera 'Descrição' (com til) conforme COLUMN_MAP
                columnToUpdate = 'Descrição';
                valueToSave = localValue || '';
            } else if (column === 'Tipo') {
                columnToUpdate = 'Tipo';
                valueToSave = localValue || '';
            } else if (column === 'Mês') {
                // Para Metas, mapeia 'Mês' para 'Mes'
                columnToUpdate = 'Mes';
                valueToSave = localValue || '';
            } else if (column === 'Valor' && record.Meta !== undefined) {
                // Para Metas, mapeia 'Valor' para 'Meta'
                columnToUpdate = 'Meta';
                valueToSave = cleanValue(localValue);
            }
            
            // Determina a ação baseado no contexto (se tem Meta, é UPDATE_META, senão UPDATE_RECORD)
            const action = record.Meta !== undefined ? 'UPDATE_META' : 'UPDATE_RECORD';
            
            onSave(
                {...record, [columnToUpdate]: valueToSave}, 
                action, 
                columnToUpdate // Envia o nome correto da coluna da planilha
            );
        }
    }
    
    // 2. Renderização de Input Específico (UX AVANÇADA)
    let inputComponent;

    switch (column) {
        case 'Data':
            // Calendar Picker
            inputComponent = (
                <DatePicker
                    selected={localValue}
                    onChange={(date) => setLocalValue(date)}
                    dateFormat="dd/MM/yyyy"
                    inline
                />
            );
            break;
        case 'Tipo':
            // Lightbox de Opções (Tipo)
            inputComponent = (
                <div style={styles.optionContainer}>
                    {options.tipos.map(tipo => (
                        <button key={tipo} style={tipo === localValue ? styles.selectedOption : styles.optionButton} 
                                onClick={() => setLocalValue(tipo)}>
                            {tipo}
                        </button>
                    ))}
                </div>
            );
            break;
        case 'Valor':
             // Input para Valor (usado tanto em Registros quanto em Metas)
            inputComponent = (
                <input type="number" step="0.01" 
                       value={localValue} 
                       onChange={(e) => setLocalValue(e.target.value)}
                       style={styles.inputField} autoFocus />
            );
            break;
        case 'Mês':
            // Input para Mês (formato MM/AA)
            inputComponent = (
                <input type="text" 
                       value={localValue || ''} 
                       onChange={(e) => {
                           let val = e.target.value.replace(/\D/g, '');
                           if (val.length >= 2) {
                               val = val.substring(0, 2) + '/' + val.substring(2, 4);
                           }
                           setLocalValue(val);
                       }}
                       placeholder="MM/AA"
                       maxLength={5}
                       style={styles.inputField} autoFocus />
            );
            break;
        case 'Tag':
        case 'Tag_1':
        case 'Tag_2':
        case 'Tag_3':
        case 'Tag_4':
            // Lightbox de Seleção de Tag (para Metas ou Tags individuais) - COM CORES
            const tagsWithColors = options?.tagsWithColors || {};
            inputComponent = (
                <div style={styles.tagOptionContainer}>
                    {options.allTags.map(tag => {
                        const tagColor = tagsWithColors[tag] || '#4bc0c0';
                        const isSelected = localValue === tag;
                        return (
                            <button 
                                key={tag} 
                                style={{
                                    ...(isSelected ? styles.selectedTagColored : styles.tagButtonColored),
                                    backgroundColor: isSelected ? tagColor : '#f0f0f0',
                                    borderColor: tagColor,
                                    color: isSelected ? '#fff' : '#333',
                                    textShadow: isSelected ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
                                }}
                                onClick={() => setLocalValue(tag)} 
                                disabled={isSaving}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            );
            break;
        case 'Descrição':
            // Textarea para Descrição (a coluna na planilha é 'Descricao' sem til)
            inputComponent = (
                <textarea rows="3" 
                       value={localValue || ''} 
                       onChange={(e) => setLocalValue(e.target.value)} 
                       style={styles.inputField} autoFocus />
            );
            break;
        case 'Tags':
            // Lightbox de Seleção Múltipla (Tags) - COM CORES
            const toggleTag = (tag) => {
                const currentTags = Array.isArray(localValue) ? localValue : [];
                let newTags;
                if (currentTags.includes(tag)) {
                    newTags = currentTags.filter(t => t !== tag);
                } else if (currentTags.length < 4) { // Limite de 4 Tags
                    newTags = [...currentTags, tag];
                } else {
                    newTags = currentTags;
                }
                setLocalValue(newTags); 
            };
            
            const tagsArray = Array.isArray(localValue) ? localValue : [];
            const tagsWithColorsForTags = options?.tagsWithColors || {};
            
            inputComponent = (
                <div style={{ ...styles.tagOptionContainer, justifyContent: 'flex-start' }}>
                    {options.allTags.map(tag => {
                        const tagColor = tagsWithColorsForTags[tag] || '#4bc0c0';
                        const isSelected = tagsArray.includes(tag);
                        return (
                            <button 
                                key={tag} 
                                style={{
                                    ...(isSelected ? styles.selectedTagColored : styles.tagButtonColored),
                                    backgroundColor: isSelected ? tagColor : '#f0f0f0',
                                    borderColor: tagColor,
                                    color: isSelected ? '#fff' : '#333',
                                    textShadow: isSelected ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
                                }}
                                onClick={() => toggleTag(tag)} 
                                disabled={isSaving}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            );
            break;
        default:
            inputComponent = <p>Campo indisponível para edição.</p>;
    }

    // Formata o valor original para exibição
    const getOriginalValueDisplay = () => {
        if (column === 'Data') {
            return formatDateDisplay(dateToInput(originalValue));
        } else if (column === 'Valor') {
            return `R$ ${cleanValue(originalValue).toFixed(2).replace('.', ',')}`;
        } else if (column === 'Tags') {
            const tagsArray = Array.isArray(originalValue) ? originalValue : [];
            return tagsArray.length > 0 ? tagsArray.join(', ') : 'Nenhuma tag';
        } else {
            return originalValue?.toString() || '';
        }
    };

    return (
        <div>
            <p style={{marginBottom: '10px'}}>
                **Editando:** {column}. Valor atual: {getOriginalValueDisplay()}
            </p>
            
            {inputComponent}
            
            <button style={styles.nextButton} 
                    onClick={saveDirectEdit} 
                    disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alteração'}
            </button>
        </div>
    );
};

export default DirectEditForm;

// Estilos (mantidos)
const styles = {
    inputField: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    optionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    tagOptionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    optionButton: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '14px' },
    selectedOption: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #4bc0c0', backgroundColor: '#4bc0c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    tagButton: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#f0f8ff', cursor: 'pointer', fontSize: '12px' },
    selectedTag: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    // Novos estilos para tags com cores
    tagButtonColored: { 
        padding: '8px 12px', 
        borderRadius: '12px', 
        border: '2px solid', 
        cursor: 'pointer', 
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
    },
    selectedTagColored: { 
        padding: '8px 12px', 
        borderRadius: '12px', 
        border: '2px solid', 
        cursor: 'pointer', 
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
    },
    nextButton: { padding: '10px 15px', backgroundColor: '#4bc0c0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' },
};