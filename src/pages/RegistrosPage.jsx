// src/pages/RegistrosPage.jsx - FINAL COM CORREÇÃO DE HOOKS
import React, { useState, useMemo } from 'react';
import { postDataToAppsScript } from '../utils/api'; 
import FloatingButton from '../components/FloatingButton.jsx'; 
import Modal from '../components/Modal.jsx'; 
import NewRecordForm from '../components/NewRecordForm.jsx'; 
import DirectEditForm from '../components/DirectEditForm.jsx'; // NOVO IMPORT
import "react-datepicker/dist/react-datepicker.css"; // Mantém o CSS do DatePicker

// Para fins de demonstração e teste:
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqGzf85y0vzefvr4uQ98YoS2BxYIrxZ5-BQnq5iD0vBOZRfisEbHKMechZFPNY-N2X/exec'; 

// --- UTILS LOCAIS ---
const formatDateDisplay = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return '';
    return dateStr.substring(8, 10) + '/' + dateStr.substring(5, 7) + '/' + dateStr.substring(0, 4);
};
const dateToInput = (dateObj) => {
    return dateObj ? dateObj.toISOString().split('T')[0] : '';
};
const cleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};


// --- COMPONENTE PRINCIPAL: REGISTROS PAGE ---
const RegistrosPage = ({ aggregatedData, reloadData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const [currentRecord, setCurrentRecord] = useState(null); 
    const [modalMode, setModalMode] = useState(null); 
    const [lastSelectedDate, setLastSelectedDate] = useState(new Date()); 

    const records = aggregatedData?.rawData?.registro || [];
    const options = aggregatedData?.options || { allTags: [], tipos: [] };
    const columns = ['Data', 'Tipo', 'Valor', 'Descrição', 'Tags']; 

    const mappedRecords = useMemo(() => {
        return records.map(r => ({
            ...r,
            Data: r.Data ? new Date(r.Data) : new Date(),
            Tags: [r.Tag_1, r.Tag_2, r.Tag_3, r.Tag_4].filter(tag => tag && tag.toString().trim() !== '')
        })).reverse(); 
    }, [records]);


    // --- LÓGICA DE SALVAMENTO (POST) ---
    const handleSaveRecord = async (dataToSave, action, columnToUpdate = null) => {
        setIsSaving(true);
        setMessage('Salvando registro...');
        
        const tags = dataToSave.Tags || [];
        const finalData = {
            ...dataToSave,
            Data: dateToInput(dataToSave.Data), 
            Valor: cleanValue(dataToSave.Valor),
            Tag_1: tags[0] || '',
            Tag_2: tags[1] || '',
            Tag_3: tags[2] || '',
            Tag_4: tags[3] || '',
        };

        try {
            if (APPS_SCRIPT_URL === 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI') {
                throw new Error("URL do Apps Script não configurada.");
            }
            
            // FIX: Garante que a data persistente seja atualizada
            if (action === 'ADD_RECORD') {
                setLastSelectedDate(dataToSave.Data);
            }

            const response = await postDataToAppsScript(APPS_SCRIPT_URL, action, finalData); 
            
            const successMsg = action === 'ADD_RECORD' ? `Sucesso! Novo registro adicionado.` : `Sucesso! Atualização salva.`;
            setMessage(successMsg);
            
            if (reloadData) {
                await reloadData();
            }
            
            setTimeout(() => {
                setIsModalOpen(false);
                setCurrentRecord(null);
                setMessage('');
            }, 500);
            
        } catch (err) {
            setMessage(`Erro no salvamento: ${err.message}. Verifique a implantação do Apps Script.`);
        } finally {
            setIsSaving(false);
        }
    };


    // --- LÓGICA DE EDIÇÃO DIRETA POR CÉLULA ---
    const startDirectEdit = (record, column) => {
        setModalMode('EDIT');
        setCurrentRecord({
            ...record,
            column: column, // Armazena a coluna para o Modal saber o que renderizar
        });
        setIsModalOpen(true);
        setMessage('');
    };

    // --- LÓGICA DE NOVO REGISTRO SIMPLES ---
    const startNewRecord = () => {
        setModalMode('NEW'); 
        setCurrentRecord({
            Data: lastSelectedDate, 
            Tipo: 'Despesa', 
            Valor: 0, 
            Descrição: '',
            Tags: [], 
        });
        setIsModalOpen(true);
        setMessage('');
    };
    
    // --- Renderização Principal ---
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Registros</h1>

            {message && <p style={{textAlign: 'center', fontWeight: 'bold', color: isSaving ? 'blue' : (message.includes('Erro') ? 'red' : 'green')}}>{message}</p>}

            {/* Tabela de Registros */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col} style={styles.th}>{col}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {mappedRecords.map((record) => (
                            <tr key={record.ROW_NUMBER} style={styles.tr}>
                                {columns.map(col => (
                                    <td key={col} style={styles.td} onClick={() => startDirectEdit(record, col)}>
                                        {col === 'Data' ? formatDateDisplay(dateToInput(record.Data)) :
                                         col === 'Tags' ? record.Tags.join(', ') :
                                         col === 'Valor' ? `R$ ${cleanValue(record.Valor).toFixed(2).replace('.', ',')}` :
                                         record[col]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {mappedRecords.length === 0 && <p style={{textAlign: 'center', margin: '20px 0'}}>Nenhum registro encontrado.</p>}
            </div>

            <FloatingButton onClick={startNewRecord} />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    // Impede o fechamento durante o salvamento
                    if (isSaving) return; 
                    setIsModalOpen(false); 
                    setCurrentRecord(null);
                    setMessage('');
                }} 
                title={modalMode === 'NEW' ? "Novo Registro Rápido" : `Editar ${currentRecord?.column || 'Item'}`}
            >
                {/* 1. Modal para Novo Registro Rápido */}
                {modalMode === 'NEW' && currentRecord && (
                    <NewRecordForm 
                        initialData={currentRecord} 
                        options={options} 
                        // Corrigido: Passando handleSaveRecord corretamente
                        onSave={handleSaveRecord} 
                        isSaving={isSaving} 
                    />
                )}
                
                {/* 2. Modal para Edição Direta (usa o novo componente seguro) */}
                {modalMode === 'EDIT' && currentRecord && currentRecord.column && (
                    <DirectEditForm
                        record={currentRecord}
                        column={currentRecord.column}
                        options={options}
                        onSave={handleSaveRecord}
                        isSaving={isSaving}
                    />
                )}
                
            </Modal>
        </div>
    );
};

export default RegistrosPage;

// --- ESTILOS ---
const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f9', minHeight: 'calc(100vh - 70px)' },
    header: { fontSize: '28px', textAlign: 'center', marginBottom: '20px', color: '#333' },
    tableWrapper: { overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff', borderRadius: '8px' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    th: { padding: '12px 10px', textAlign: 'left', backgroundColor: '#007bff', color: 'white', fontSize: '14px', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' },
    td: { padding: '10px', textAlign: 'left', borderBottom: '1px solid #eee', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    tr: { '&:hover': { backgroundColor: '#f9f9f9' } },
};