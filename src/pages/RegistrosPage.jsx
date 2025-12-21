// src/pages/RegistrosPage.jsx - FINAL COM CORREÇÃO DE BUG E NOVA UX

import React, { useState, useMemo } from 'react';

// Importa as novas funções de API separadas
import { addDataToBackend, updateDataInBackend, deleteMultipleRecordsFromBackend } from '../utils/api'; 

import FloatingButton from '../components/FloatingButton.jsx'; 
import Modal from '../components/Modal.jsx'; 
import NewRecordForm from '../components/NewRecordForm.jsx'; 
import DirectEditForm from '../components/DirectEditForm.jsx'; 
import SummaryCards from '../components/SummaryCards.jsx';
import DatePicker from 'react-datepicker'; // Usado para edição direta de Data
import "react-datepicker/dist/react-datepicker.css";

// --- UTILS LOCAIS ---
// Funções de formatação (mantidas)
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


// Mapa de Mês/Ano (MM/YYYY) para Nome do Mês
const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// --- COMPONENTE PRINCIPAL: REGISTROS PAGE ---
const RegistrosPage = ({ aggregatedData, reloadData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const [currentRecord, setCurrentRecord] = useState(null); 
    const [modalMode, setModalMode] = useState(null); // 'NEW', 'EDIT', 'GUIDED'
    const [lastSelectedDate, setLastSelectedDate] = useState(new Date()); // Persistência de Data
    
    // Estados para modo seleção
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [touchStartPos, setTouchStartPos] = useState(null);
    const [touchStartRow, setTouchStartRow] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);

    const records = aggregatedData?.rawData?.registro || [];
    const options = aggregatedData?.options || { allTags: [], tipos: [] };
    const columns = ['Data', 'Tipo', 'Valor', 'Descrição', 'Tags']; 

    // Extrai meses disponíveis dos registros
    const mesesDisponiveis = useMemo(() => {
        const mesesSet = new Set();
        records.forEach(record => {
            const dataStr = record.Data;
            if (dataStr && typeof dataStr === 'string' && dataStr.length >= 10) {
                const month = dataStr.substring(5, 7);
                const year = dataStr.substring(0, 4);
                mesesSet.add(`${month}/${year}`);
            }
        });
        return Array.from(mesesSet).sort().reverse(); // Mais recente primeiro
    }, [records]);

    const [mesAnoSelecionado, setMesAnoSelecionado] = useState(mesesDisponiveis[0] || '');

    // Atualiza o mês selecionado quando os dados carregam
    React.useEffect(() => {
        if (mesesDisponiveis.length > 0 && !mesAnoSelecionado) {
            setMesAnoSelecionado(mesesDisponiveis[0]);
        }
    }, [mesesDisponiveis]);

    // Filtra registros por mês e calcula totais
    const { filteredRecords, totalReceita, totalDespesa } = useMemo(() => {
        let receita = 0;
        let despesa = 0;
        const filtered = records.filter(r => {
            if (!mesAnoSelecionado) return true;
            const dataStr = r.Data;
            if (!dataStr || typeof dataStr !== 'string' || dataStr.length < 10) return false;
            const month = dataStr.substring(5, 7);
            const year = dataStr.substring(0, 4);
            const recordMesAno = `${month}/${year}`;
            return recordMesAno === mesAnoSelecionado;
        });

        filtered.forEach(r => {
            const valorNumerico = cleanValue(r.Valor);
            if (r.Tipo === 'Receita') {
                receita += valorNumerico;
            } else if (r.Tipo === 'Despesa') {
                despesa += valorNumerico;
            }
        });

        return {
            filteredRecords: filtered,
            totalReceita: receita,
            totalDespesa: despesa
        };
    }, [records, mesAnoSelecionado]);

    const mappedRecords = useMemo(() => {
        return filteredRecords.map(r => ({
            ...r,
            Data: r.Data ? new Date(r.Data) : new Date(),
            Tags: [r.Tag_1, r.Tag_2, r.Tag_3, r.Tag_4].filter(tag => tag && tag.toString().trim() !== '')
        })).reverse(); 
    }, [filteredRecords]);


    // ---------------------------------------------
    // --- LÓGICA DE SALVAMENTO (ADD E UPDATE) ---
    // ---------------------------------------------
    
    // Função unificada de salvamento
    const handleSaveRecord = async (dataToSave, action, columnToUpdate = null) => {
        setIsSaving(true);
        setMessage('Salvando registro...');
        
        try {
            let successMsg;
            let response;

            if (action === 'ADD_RECORD' || action === 'GUIDED_ADD') {
                
                // 1. Lógica de ADIÇÃO (POST /api/add-registro)
                const tags = dataToSave.Tags || [];
                const finalData = {
                    Data: dateToInput(dataToSave.Data), 
                    Tipo: dataToSave.Tipo || '',
                    Valor: cleanValue(dataToSave.Valor),
                    Descrição: dataToSave.Descrição || dataToSave.Descricao || '', // Backend agora espera 'Descrição' (com til)
                    Tag_1: tags[0] || '',
                    Tag_2: tags[1] || '',
                    Tag_3: tags[2] || '',
                    Tag_4: tags[3] || '',
                };
                
                response = await addDataToBackend(finalData); 
                successMsg = `Sucesso! Novo registro adicionado.`;
                setLastSelectedDate(dataToSave.Data); // Persiste a data
                
            } else if (action === 'UPDATE_RECORD') {

                // 2. Lógica de ATUALIZAÇÃO (POST /api/update-registro)
                
                // IMPORTANTE: O columnToUpdate já vem do DirectEditForm com o nome correto da coluna da planilha
                // (ex: 'Valor', 'Data', 'Descricao', 'Tipo', 'Tag_1', etc.)
                let newValue;
                let columnName = columnToUpdate;
                
                // Tratamento especial para cada tipo de coluna
                if (columnToUpdate === 'Data') {
                    // dataToSave já tem o valor correto em dataToSave.Data ou dataToSave[columnToUpdate]
                    newValue = dateToInput(dataToSave.Data || dataToSave[columnToUpdate]);
                    columnName = 'Data';
                } else if (columnToUpdate.startsWith('Tag_')) {
                    // Para Tags (Tag_1, Tag_2, Tag_3, Tag_4), usa o valor diretamente
                    newValue = dataToSave[columnToUpdate] || '';
                    columnName = columnToUpdate; // Mantém o nome da coluna (Tag_1, Tag_2, etc.)
                } else if (columnToUpdate === 'Valor') {
                    // Garante que o valor seja extraído corretamente
                    const valorSource = dataToSave.Valor !== undefined ? dataToSave.Valor : dataToSave[columnToUpdate];
                    newValue = cleanValue(valorSource);
                    columnName = 'Valor';
                } else if (columnToUpdate === 'Descrição' || columnToUpdate === 'Descricao') {
                    // Backend agora espera 'Descrição' (com til) conforme COLUMN_MAP
                    newValue = dataToSave.Descrição || dataToSave.Descricao || dataToSave[columnToUpdate] || '';
                    columnName = 'Descrição'; // Backend usa 'Descrição' no COLUMN_MAP
                } else if (columnToUpdate === 'Tipo') {
                    // Para Tipo, usa o valor como string
                    newValue = dataToSave.Tipo || dataToSave[columnToUpdate] || '';
                    columnName = 'Tipo';
                } else {
                    // Para outras colunas, usa o valor como string
                    newValue = dataToSave[columnToUpdate] || '';
                    columnName = columnToUpdate;
                }
                
                response = await updateDataInBackend({
                    rowNumber: dataToSave.ROW_NUMBER,
                    column: columnName, // Nome correto da coluna na planilha (deve corresponder ao COLUMN_MAP do backend)
                    value: newValue,
                }); 

                successMsg = `Sucesso! Atualização salva na linha ${dataToSave.ROW_NUMBER}.`;

            } else {
                 throw new Error("Ação de salvamento inválida.");
            }
            
            setMessage(successMsg);
            
            if (reloadData) {
                await reloadData();
            }
            
            setTimeout(() => {
                setIsModalOpen(false);
                setCurrentRecord(null);
                setMessage('');
                setModalMode(null);
            }, 500);
            
        } catch (err) {
            setMessage(`Erro no salvamento: ${err.message}. Verifique a conexão com o servidor.`);
        } finally {
            setIsSaving(false);
        }
    };


    // ---------------------------------------------
    // --- LÓGICA DE ABERTURA DE MODAIS ---
    // ---------------------------------------------

    // Abre o Modal para Edição Direta de Célula (UX da Tabela Editável)
    const startDirectEdit = (record, column) => {
        setModalMode('EDIT');
        setCurrentRecord({
            ...record,
            column: column, 
        });
        setIsModalOpen(true);
        setMessage('');
    };

    // Abre o Modal para Novo Registro Rápido
    const startNewRecord = () => {
        setModalMode('NEW'); 
        setCurrentRecord({
            Data: lastSelectedDate, // Data Persistente
            Tipo: 'Despesa', 
            Valor: 0, 
            Descricao: '',
            Tags: [], 
        });
        setIsModalOpen(true);
        setMessage('');
    };
    
    // Abre o Modal para Fluxo Guiado
    const startGuidedRecord = () => {
        setModalMode('GUIDED');
        setCurrentRecord({
            Data: lastSelectedDate, // Data Persistente
            Tipo: 'Despesa', 
            Valor: 0, 
            Descricao: '',
            Tags: [], 
        });
        setIsModalOpen(true);
        setMessage('');
    };
    
    // ---------------------------------------------
    // --- LÓGICA DE SELEÇÃO DE LINHAS (MOBILE) ---
    // ---------------------------------------------
    
    // Detecta swipe horizontal (arrastar para direita) para entrar em modo seleção
    const handleTouchStart = (e, rowNumber) => {
        if (isSelectionMode) {
            // Se já está em modo seleção, não faz nada no touchStart
            // O onClick vai lidar com a alternância
            return;
        }
        
        const touch = e.touches[0];
        setTouchStartPos({ x: touch.clientX, y: touch.clientY });
        setTouchStartRow(rowNumber);
        setIsScrolling(false);
    };
    
    const handleTouchMove = (e) => {
        if (!touchStartPos || isSelectionMode) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        
        // Se o movimento vertical for maior que o horizontal, é rolagem
        if (deltaY > deltaX && deltaY > 10) {
            setIsScrolling(true);
            setTouchStartPos(null);
            setTouchStartRow(null);
        }
    };
    
    const handleTouchEnd = (e, rowNumber) => {
        if (!touchStartPos || touchStartRow !== rowNumber || isScrolling) {
            setTouchStartPos(null);
            setTouchStartRow(null);
            setIsScrolling(false);
            return;
        }
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartPos.x;
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        
        // Swipe horizontal para direita (pelo menos 50px) e movimento vertical mínimo
        const SWIPE_THRESHOLD = 50;
        if (deltaX > SWIPE_THRESHOLD && deltaY < 30) {
            // Entra em modo seleção
            setIsSelectionMode(true);
            setSelectedRows(new Set([rowNumber]));
            e.preventDefault();
        }
        
        setTouchStartPos(null);
        setTouchStartRow(null);
        setIsScrolling(false);
    };
    
    const handleTouchCancel = () => {
        setTouchStartPos(null);
        setTouchStartRow(null);
        setIsScrolling(false);
    };
    
    // Alterna seleção de uma linha
    const toggleRowSelection = (rowNumber) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowNumber)) {
                newSet.delete(rowNumber);
            } else {
                newSet.add(rowNumber);
            }
            return newSet;
        });
    };
    
    // Cancela modo seleção
    const cancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedRows(new Set());
    };
    
    // Deleta registros selecionados
    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) return;
        
        if (!window.confirm(`Tem certeza que deseja deletar ${selectedRows.size} registro(s)?`)) {
            return;
        }
        
        setIsSaving(true);
        setMessage('Deletando registros...');
        
        try {
            const rowNumbers = Array.from(selectedRows);
            
            // Tenta deletar múltiplos registros (pode falhar se o endpoint não existir ainda)
            try {
                await deleteMultipleRecordsFromBackend({ rowNumbers });
                setMessage(`${selectedRows.size} registro(s) deletado(s) com sucesso!`);
            } catch (deleteError) {
                // Se o endpoint não existir, mostra mensagem informativa
                if (deleteError.message.includes('404') || deleteError.message.includes('not found')) {
                    setMessage(`Endpoint de deleção múltipla ainda não implementado no backend. ${selectedRows.size} registro(s) selecionado(s).`);
                } else {
                    throw deleteError;
                }
            }
            
            // Limpa seleção
            cancelSelection();
            
            // Recarrega dados
            if (reloadData) {
                await reloadData();
            }
            
        } catch (err) {
            setMessage(`Erro ao deletar registros: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Renderização Principal ---
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Registros</h1>

            {/* Filtro de Data - Usando o mesmo estilo da Home */}
            {mesesDisponiveis.length > 0 && (
                <div style={styles.filterContainer}>
                    <label htmlFor="mesFiltro" style={styles.filterLabel}>
                        Visualizando:
                    </label>
                    <select 
                        id="mesFiltro" 
                        value={mesAnoSelecionado} 
                        onChange={(e) => setMesAnoSelecionado(e.target.value)}
                        style={styles.filterSelect}
                    >
                        {mesesDisponiveis.map(mesAno => {
                            const [m, a] = mesAno.split('/');
                            const nome = MONTH_NAMES_PT[parseInt(m, 10) - 1] || m;
                            return (
                                <option key={mesAno} value={mesAno}>
                                    {nome} de {a}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}

            {/* Cartões Fixos de Receita/Despesa e Barra de Balanço - Usando SummaryCards da Home */}
            {mesAnoSelecionado && (
                <div style={{ 
                    width: '100%', 
                    maxWidth: '100%',
                    marginBottom: '20px',
                    boxSizing: 'border-box',
                    overflowX: 'hidden'
                }}>
                    <SummaryCards 
                        receita={totalReceita} 
                        despesa={totalDespesa} 
                    />
                </div>
            )}

            {message && <p style={{textAlign: 'center', fontWeight: 'bold', color: isSaving ? 'blue' : (message.includes('Erro') ? 'red' : 'green')}}>{message}</p>}

            {/* Barra de ações do modo seleção */}
            {isSelectionMode && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                        {selectedRows.size} registro(s) selecionado(s)
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={cancelSelection}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabela de Registros */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col} style={styles.th}>{col}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {mappedRecords.map((record) => {
                            const isSelected = selectedRows.has(record.ROW_NUMBER);
                            return (
                                <tr 
                                    key={record.ROW_NUMBER} 
                                    style={{
                                        ...styles.tr,
                                        backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                                        userSelect: 'none',
                                        position: 'relative'
                                    }}
                                    onTouchStart={(e) => !isSelectionMode && handleTouchStart(e, record.ROW_NUMBER)}
                                    onTouchMove={!isSelectionMode ? handleTouchMove : undefined}
                                    onTouchEnd={(e) => !isSelectionMode && handleTouchEnd(e, record.ROW_NUMBER)}
                                    onTouchCancel={!isSelectionMode ? handleTouchCancel : undefined}
                                    onClick={(e) => {
                                        if (isSelectionMode) {
                                            e.preventDefault();
                                            toggleRowSelection(record.ROW_NUMBER);
                                        }
                                    }}
                                    onTouchEndCapture={(e) => {
                                        // Se está em modo seleção, alterna a seleção no toque
                                        if (isSelectionMode) {
                                            e.preventDefault();
                                            toggleRowSelection(record.ROW_NUMBER);
                                        }
                                    }}
                                >
                                {columns.map(col => {
                                    // Mapeamento correto para acessar os dados do record
                                    let displayValue;
                                    if (col === 'Data') {
                                        displayValue = formatDateDisplay(dateToInput(record.Data));
                                    } else if (col === 'Tags') {
                                        // Renderiza tags com suas cores
                                        const tagsWithColors = aggregatedData?.options?.tagsWithColors || {};
                                        displayValue = (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                {record.Tags.map((tag, idx) => {
                                                    const tagColor = tagsWithColors[tag] || '#4bc0c0';
                                                    return (
                                                        <span
                                                            key={idx}
                                                            style={{
                                                                backgroundColor: tagColor,
                                                                color: '#fff',
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                                            }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        );
                                    } else if (col === 'Valor') {
                                        displayValue = `R$ ${cleanValue(record.Valor).toFixed(2).replace('.', ',')}`;
                                    } else if (col === 'Descrição') {
                                        // Backend retorna 'Descricao' (sem til), mas exibimos como 'Descrição'
                                        displayValue = record.Descricao || record.Descrição || '';
                                    } else {
                                        // Para Tipo e outras colunas, acessa diretamente
                                        displayValue = record[col] || '';
                                    }
                                    
                                    // Se displayValue é um componente React, renderiza diretamente
                                    if (React.isValidElement(displayValue)) {
                                        return (
                                            <td key={col} style={styles.td} onClick={() => startDirectEdit(record, col)}>
                                                {displayValue}
                                            </td>
                                        );
                                    }
                                    
                                    // Se displayValue é um componente React, renderiza diretamente
                                    if (React.isValidElement(displayValue)) {
                                        return (
                                            <td 
                                                key={col} 
                                                style={styles.td} 
                                                onClick={() => {
                                                    if (!isSelectionMode) {
                                                        startDirectEdit(record, col);
                                                    }
                                                }}
                                            >
                                                {displayValue}
                                            </td>
                                        );
                                    }
                                    
                                    return (
                                        <td 
                                            key={col} 
                                            style={styles.td} 
                                            onClick={() => {
                                                if (!isSelectionMode) {
                                                    startDirectEdit(record, col);
                                                }
                                            }}
                                        >
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
                {mappedRecords.length === 0 && <p style={{textAlign: 'center', margin: '20px 0'}}>Nenhum registro encontrado.</p>}
            </div>

            {/* BOTÃO FLUTUANTE - Muda conforme o modo */}
            {isSelectionMode ? (
                <FloatingButton 
                    onClick={handleDeleteSelected}
                    mode="delete"
                    disabled={selectedRows.size === 0 || isSaving}
                />
            ) : (
                <FloatingButton onClick={startGuidedRecord} />
            )} 

            {/* -------------------------------------
                MODAL PRINCIPAL PARA UX AVANÇADA
            ------------------------------------- */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    if (isSaving) return; 
                    setIsModalOpen(false); 
                    setCurrentRecord(null);
                    setMessage('');
                    setModalMode(null);
                }} 
                title={modalMode === 'NEW' ? "Novo Registro Rápido" : 
                       modalMode === 'GUIDED' ? "Registro Guiado (Etapa 1)" : 
                       `Editar ${currentRecord?.column || 'Item'}`}
            >
                {/* 1. Modal para Novo Registro Rápido (Antigo) */}
                {modalMode === 'NEW' && currentRecord && (
                    <NewRecordForm 
                        initialData={currentRecord} 
                        options={options} 
                        onSave={handleSaveRecord} 
                        isSaving={isSaving} 
                        guidedMode={false}
                    />
                )}

                {/* 2. Modal para Fluxo Guiado (NOVO) */}
                {modalMode === 'GUIDED' && currentRecord && (
                    <NewRecordForm 
                        initialData={currentRecord} 
                        options={options} 
                        onSave={handleSaveRecord} 
                        isSaving={isSaving}
                        guidedMode={true} // Ativa o modo guiado
                    />
                )}
                
                {/* 3. Modal para Edição Direta (UX da Tabela Editável) */}
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

// --- ESTILOS MOBILE-FIRST ---
const styles = {
    container: { 
        padding: '15px', 
        fontFamily: 'Arial, sans-serif', 
        backgroundColor: '#f4f4f9', 
        minHeight: 'calc(100vh - 70px)',
        width: '100%',
        maxWidth: '100vw', // Limita à largura da viewport
        boxSizing: 'border-box',
        overflowX: 'hidden', // Previne scroll horizontal no container principal
        position: 'relative',
    },
    header: { 
        fontSize: '24px', 
        textAlign: 'center', 
        marginBottom: '15px', 
        color: '#333',
        fontWeight: 'bold',
    },
    filterContainer: {
        marginBottom: '20px',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        width: '100%', 
        boxSizing: 'border-box'
    },
    filterLabel: {
        display: 'block',
        marginBottom: '10px',
        fontWeight: 'bold'
    },
    filterSelect: {
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        width: '100%',
        fontSize: '16px',
        boxSizing: 'border-box'
    },
    tableWrapper: { 
        overflowX: 'auto', 
        overflowY: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        WebkitOverflowScrolling: 'touch',
        width: '100%',
        maxWidth: '100%', // Não ultrapassa o container pai
        boxSizing: 'border-box',
        // Garante que o scroll seja apenas dentro deste container
        marginLeft: 0,
        marginRight: 0,
    },
    table: { 
        width: '100%', 
        borderCollapse: 'collapse', 
        minWidth: '600px',
        tableLayout: 'auto'
    },
    th: { 
        padding: '10px 8px', 
        textAlign: 'left', 
        backgroundColor: '#007bff', 
        color: 'white', 
        fontSize: '13px', 
        borderBottom: '2px solid #ddd', 
        whiteSpace: 'nowrap' 
    },
    td: { 
        padding: '8px', 
        textAlign: 'left', 
        borderBottom: '1px solid #eee', 
        fontSize: '13px', 
        cursor: 'pointer', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' 
    },
    tr: { 
        '&:hover': { backgroundColor: '#f9f9f9' } 
    },
};