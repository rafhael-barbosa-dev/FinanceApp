// src/pages/RegistrosPage.jsx - FINAL COM CONEXÃO AO BACKEND RENDER
import React, { useState, useMemo } from 'react';

// Corrigido: Agora importamos a função com o novo nome
import { postDataToBackend } from '../utils/api'; 

import FloatingButton from '../components/FloatingButton.jsx'; 
import Modal from '../components/Modal.jsx'; 
import NewRecordForm from '../components/NewRecordForm.jsx'; 
import DirectEditForm from '../components/DirectEditForm.jsx';
import "react-datepicker/dist/react-datepicker.css"; 

// --- CRUCIAL: URL DO SEU BACKEND RENDER ---
const BACKEND_RENDER_URL = 'https://financeapp-backend-6iv3.onrender.com'; 


// --- UTILS LOCAIS ---
const formatDateDisplay = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return '';
    return dateStr.substring(8, 10) + '/' + dateStr.substring(5, 7) + '/' + dateStr.substring(0, 4);
};
const dateToInput = (dateObj) => {
    // Retorna a data no formato YYYY-MM-DD, que o backend Node.js espera
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
            // Mapeia Tags de volta para um array para facilitar a edição no frontend
            Tags: [r.Tag_1, r.Tag_2, r.Tag_3, r.Tag_4].filter(tag => tag && tag.toString().trim() !== '')
        })).reverse(); 
    }, [records]);


    // --- LÓGICA DE SALVAMENTO (POST) ---
    const handleSaveRecord = async (dataToSave, action, columnToUpdate = null) => {
        setIsSaving(true);
        setMessage('Salvando registro...');
        
        // Formata os dados no formato que o backend Node.js espera
        const tags = dataToSave.Tags || [];
        const finalData = {
            // Data é crucial no formato YYYY-MM-DD
            Data: dateToInput(dataToSave.Data), 
            Valor: cleanValue(dataToSave.Valor),
            // Outros campos simples
            Descricao: dataToSave.Descricao || '', 
            Tipo: dataToSave.Tipo || '',
            
            // As Tags são expandidas nas colunas esperadas pela planilha
            Tag_1: tags[0] || '',
            Tag_2: tags[1] || '',
            Tag_3: tags[2] || '',
            Tag_4: tags[3] || '',
        };
        
        // Se for uma atualização, o backend precisa saber a linha
        if (action === 'UPDATE_RECORD' && dataToSave.ROW_NUMBER) {
            finalData.ROW_NUMBER = dataToSave.ROW_NUMBER;
            finalData.columnToUpdate = columnToUpdate; // (Se necessário para granularidade)
        }
        
        // O backend do Render só tem o endpoint /api/add-registro.
        // O tratamento para UPDATE_RECORD deve ser feito no servidor, 
        // mas aqui tratamos as tags e o ROW_NUMBER (se houver).
        
        try {
            if (!BACKEND_RENDER_URL || BACKEND_RENDER_URL.includes('onrender.com') === false) {
                throw new Error("URL do Backend Render não configurada ou inválida.");
            }
            
            // CHAMADA AO NOVO BACKEND DO RENDER
            const response = await postDataToBackend(BACKEND_RENDER_URL, finalData); 
            
            // FIX: Garante que a data persistente seja atualizada
            if (action === 'ADD_RECORD') {
                setLastSelectedDate(dataToSave.Data);
            }

            const successMsg = action === 'ADD_RECORD' ? `Sucesso! Novo registro adicionado.` : `Sucesso! Atualização salva.`;
            setMessage(successMsg);
            
            if (reloadData) {
                // Recarrega os dados da planilha para atualizar a tabela
                await reloadData();
            }
            
            setTimeout(() => {
                setIsModalOpen(false);
                setCurrentRecord(null);
                setMessage('');
            }, 500);
            
        } catch (err) {
            setMessage(`Erro no salvamento: ${err.message}. Verifique o servidor Render.`);
        } finally {
            setIsSaving(false);
        }
    };


    // --- LÓGICA DE EDIÇÃO DIRETA POR CÉLULA ---
    const startDirectEdit = (record, column) => {
        // A edição direta é um UPDATE, mas o backend atual só tem ADD.
        // Vamos permitir apenas o ADD por enquanto, até que o backend seja estendido para UPDATE.
        // Para manter a funcionalidade de UPDATE:
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
            Descricao: '', // Campo Descrição deve ser 'Descricao'
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
                                    // AÇÃO: Abre o modal de edição ao clicar na célula
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