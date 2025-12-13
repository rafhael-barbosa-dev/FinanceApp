// src/components/NewRecordForm.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

const styles = {
    // Estilos do formulário
    inputField: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    optionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    tagOptionContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', padding: '10px 0', maxHeight: '150px', overflowY: 'auto' },
    optionButton: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '14px' },
    selectedOption: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #4bc0c0', backgroundColor: '#4bc0c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    tagButton: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#f0f8ff', cursor: 'pointer', fontSize: '12px' },
    selectedTag: { padding: '6px 10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    nextButton: { padding: '10px 15px', backgroundColor: '#4bc0c0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' },
};

const NewRecordForm = ({ initialData, options, onSave, isSaving }) => {
    // O estado do formulário AGORA É SEGURO, pois está em um componente separado
    const [formData, setFormData] = useState(initialData);

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

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
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
            <input type="text" value={formData.Descrição || ''} 
                   onChange={(e) => handleFormChange('Descrição', e.target.value)} 
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