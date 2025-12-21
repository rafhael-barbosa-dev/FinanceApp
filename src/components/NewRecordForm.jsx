// src/components/NewRecordForm.jsx - ADAPTADO PARA FLUXO GUIADO E PERSISTÊNCIA

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

// Estilos (mantidos)
const styles = {
    inputField: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    optionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    tagOptionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    optionButton: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '14px' },
    selectedOption: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #4bc0c0', backgroundColor: '#4bc0c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    tagButton: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#f0f8ff', cursor: 'pointer', fontSize: '12px' },
    selectedTag: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    // Botões de navegação/salvar
    buttonGroup: { display: 'flex', justifyContent: 'space-between', marginTop: '15px' },
    nextButton: { padding: '10px 15px', backgroundColor: '#4bc0c0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    skipButton: { padding: '10px 15px', backgroundColor: '#aaa', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
};

const NewRecordForm = ({ initialData, options, onSave, isSaving, guidedMode }) => {
    const [formData, setFormData] = useState(initialData);
    const [step, setStep] = useState(guidedMode ? 1 : 99); // 99 é o modo "rápido"

    const handleFormChange = (field, value) => {
         setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    const toggleTag = (tag) => {
        const currentTags = formData.Tags || [];
        let newTags;
        if (currentTags.includes(tag)) {
            newTags = currentTags.filter(t => t !== tag);
        } else if (currentTags.length < 4) {
            newTags = [...currentTags, tag];
        } else {
            newTags = currentTags;
        }
        handleFormChange('Tags', newTags);
    };

    const isFormValid = formData.Data && formData.Tipo && formData.Valor > 0;
    
    // Lógica para avançar a etapa no modo guiado
    const handleNextStep = (skip = false) => {
        if (!skip) {
            // Validações básicas antes de avançar
            if (step === 1 && !formData.Data) return;
            if (step === 2 && !formData.Tipo) return;
            if (step === 3 && (formData.Valor <= 0 || !formData.Valor)) return;
        }

        // Se for a última etapa, salva. Senão, avança.
        if (step >= 5) { 
             onSave(formData, 'ADD_RECORD'); // Salva o registro
        } else {
            setStep(prev => prev + 1);
        }
    }

    // Mapeamento de Títulos e Etapas para o modo guiado
    const steps = [
        { id: 1, title: 'Selecione a Data', field: 'Data' },
        { id: 2, title: 'Selecione o Tipo', field: 'Tipo' },
        { id: 3, title: 'Qual é o Valor?', field: 'Valor' },
        { id: 4, title: 'Descrição (Opcional)', field: 'Descricao' },
        { id: 5, title: 'Selecione as Tags (Máx. 4)', field: 'Tags' },
    ];
    
    const currentStep = steps.find(s => s.id === step);
    
    // Renderização do passo atual
    const renderStepContent = (stepId) => {
        switch (stepId) {
            case 1:
                return (
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        {/* Calendário com data persistente */}
                        <DatePicker 
                            selected={formData.Data} 
                            onChange={(date) => handleFormChange('Data', date)} 
                            dateFormat="dd/MM/yyyy" 
                            inline 
                        />
                    </div>
                );
            case 2:
                return (
                    <div style={styles.optionContainer}>
                        {options.tipos.map(tipo => (
                            <button key={tipo} style={tipo === formData.Tipo ? styles.selectedOption : styles.optionButton} 
                                    onClick={() => handleFormChange('Tipo', tipo)}>
                                {tipo}
                            </button>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <input type="number" step="0.01" 
                           value={formData.Valor || ''} 
                           onChange={(e) => handleFormChange('Valor', e.target.value)} 
                           style={styles.inputField} autoFocus />
                );
            case 4:
                return (
                    <input type="text" value={formData.Descricao || ''} 
                           onChange={(e) => handleFormChange('Descricao', e.target.value)} 
                           style={styles.inputField} autoFocus />
                );
            case 5:
                return (
                    <div style={styles.tagOptionContainer}>
                        {options.allTags.map(tag => (
                            <button key={tag} style={formData.Tags?.includes(tag) ? styles.selectedTag : styles.tagButton}
                                    onClick={() => toggleTag(tag)} disabled={isSaving}>
                                {tag}
                            </button>
                        ))}
                    </div>
                );
            default:
                return null; // Modo Rápido (99) usa o render completo abaixo
        }
    }


    // --- RENDERIZAÇÃO ---
    if (guidedMode) {
        return (
            <div>
                <h3 style={{textAlign: 'center', marginBottom: '15px'}}>{currentStep.title}</h3>
                
                {renderStepContent(step)}
                
                <div style={styles.buttonGroup}>
                    {step > 1 && <button style={styles.skipButton} onClick={() => setStep(prev => prev - 1)}>Anterior</button>}
                    
                    {/* Botão de Pular/Registrar/Próximo */}
                    <button 
                        style={styles.nextButton} 
                        onClick={() => handleNextStep(currentStep.field === 'Descricao' || currentStep.field === 'Tags')}
                        disabled={isSaving || (step < 5 && !formData[currentStep.field])} // Desabilita se for obrigatório e vazio
                    >
                        {isSaving ? 'Salvando...' : 
                         step === 5 ? 'Finalizar & Registrar' : 
                         'Próximo'}
                    </button>
                </div>
            </div>
        );
    }
    
    // --- MODO RÁPIDO (NON-GUIDED MODE) ---
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {/* ... (Renderização completa do formulário não guiado) ... */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <p style={{fontWeight: 'bold'}}>Data:</p>
                <DatePicker selected={formData.Data} onChange={(date) => handleFormChange('Data', date)} dateFormat="dd/MM/yyyy" />
            </div>
            
            <label style={{fontWeight: 'bold'}}>Tipo:</label>
            <div style={styles.optionContainer}>
                {options.tipos.map(tipo => (
                    <button key={tipo} style={tipo === formData.Tipo ? styles.selectedOption : styles.optionButton} 
                            onClick={() => handleFormChange('Tipo', tipo)}>
                        {tipo}
                    </button>
                ))}
            </div>

            <label style={{fontWeight: 'bold'}}>Valor (R$):</label>
            <input type="number" step="0.01" value={formData.Valor || ''} 
                   onChange={(e) => handleFormChange('Valor', e.target.value)} 
                   style={styles.inputField} />

            <label style={{fontWeight: 'bold'}}>Descrição:</label>
            <input type="text" value={formData.Descricao || ''} 
                   onChange={(e) => handleFormChange('Descricao', e.target.value)} 
                   style={styles.inputField} />
            
            <label style={{fontWeight: 'bold'}}>Tags ({formData.Tags?.length || 0}/4):</label>
            <div style={styles.tagOptionContainer}>
                {options.allTags.map(tag => (
                    <button key={tag} style={formData.Tags?.includes(tag) ? styles.selectedTag : styles.tagButton}
                            onClick={() => toggleTag(tag)} disabled={isSaving}>
                        {tag}
                    </button>
                ))}
            </div>
            
            <button style={styles.nextButton} onClick={() => onSave(formData, 'ADD_RECORD')} disabled={isSaving || !isFormValid}>
                {isSaving ? 'Salvando...' : 'Registrar'}
            </button>
        </div>
    );
};

export default NewRecordForm;