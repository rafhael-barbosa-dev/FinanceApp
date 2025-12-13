// src/components/DirectEditForm.jsx - CORREÇÃO UX E SALVAMENTO

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

// Função de limpeza de valor (copiada para garantir a exibição correta)
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
    // O valor ORIGINAL do registro, NUNCA MUDA, usado para exibição estática
    const originalValue = record[column]; 
    
    // 1. ESTADO LOCAL: Usado para o valor que o usuário está digitando
    // Inicializa com o valor limpo para o input de número
    const [localValue, setLocalValue] = useState(
        column === 'Valor' ? cleanValue(originalValue) : originalValue
    );

    // Função de save 
    const saveDirectEdit = () => {
        onSave(
            {...record, [column]: localValue}, 
            'UPDATE_RECORD', 
            column
        );
    }
    
    // 2. Renderização de Input Específico
    let inputComponent;

    switch (column) {
        case 'Data':
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
            inputComponent = (
                <input type="number" step="0.01" 
                       // Usa o localValue para rastrear a digitação
                       value={localValue} 
                       onChange={(e) => setLocalValue(e.target.value)}
                       style={styles.inputField} autoFocus />
            );
            break;
        case 'Descrição':
            inputComponent = (
                <textarea rows="3" defaultValue={originalValue} 
                       onChange={(e) => setLocalValue(e.target.value)} 
                       style={styles.inputField} autoFocus />
            );
            break;
        case 'Tags':
            const toggleTag = (tag) => {
                const currentTags = localValue || [];
                let newTags;
                if (currentTags.includes(tag)) {
                    newTags = currentTags.filter(t => t !== tag);
                } else if (currentTags.length < 4) {
                    newTags = [...currentTags, tag];
                } else {
                    newTags = currentTags;
                }
                setLocalValue(newTags); 
            };
            
            inputComponent = (
                <div style={{ ...styles.tagOptionContainer, justifyContent: 'flex-start' }}>
                    {options.allTags.map(tag => (
                        <button key={tag} style={localValue.includes(tag) ? styles.selectedTag : styles.tagButton}
                                onClick={() => toggleTag(tag)} disabled={isSaving}>
                            {tag}
                        </button>
                    ))}
                </div>
            );
            break;
        default:
            inputComponent = <p>Campo indisponível para edição.</p>;
    }

    return (
        <div>
            {/* FIX UX: Mostrar o Valor ORIGINAL, sem o state local */}
            <p style={{marginBottom: '10px'}}>
                Valor Atual: **{
                    column === 'Data' 
                    ? formatDateDisplay(dateToInput(originalValue)) 
                    : column === 'Valor' 
                      ? `R$ ${cleanValue(originalValue).toFixed(2).replace('.', ',')}` // Formata o valor original para exibição
                      : originalValue?.toString() || ''
                }**
            </p>
            
            {inputComponent}
            
            {/* Botão de salvar para edição direta */}
            <button style={styles.nextButton} 
                    onClick={saveDirectEdit} 
                    disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alteração'}
            </button>
        </div>
    );
};

export default DirectEditForm;

// Estilos (copiados do RegistrosPage para este componente)
const styles = {
    inputField: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    optionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    tagOptionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    optionButton: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '14px' },
    selectedOption: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #4bc0c0', backgroundColor: '#4bc0c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    tagButton: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#f0f8ff', cursor: 'pointer', fontSize: '12px' },
    selectedTag: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    nextButton: { padding: '10px 15px', backgroundColor: '#4bc0c0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' },
};