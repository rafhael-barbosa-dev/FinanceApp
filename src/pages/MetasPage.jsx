// src/pages/MetasPage.jsx - Página de Gerenciamento de Metas

import React, { useState, useMemo, useEffect } from 'react';
import { addMetaToBackend, updateMetaInBackend, deleteMetaFromBackend } from '../utils/api'; 

import FloatingButton from '../components/FloatingButton.jsx'; 
import Modal from '../components/Modal.jsx'; 
import DirectEditForm from '../components/DirectEditForm.jsx'; 
import "react-datepicker/dist/react-datepicker.css";

// Mapa de Mês/Ano (MM/YYYY) para Nome do Mês
const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// --- UTILS LOCAIS ---
const cleanValue = (valorInput) => {
    if (typeof valorInput === 'number') { return valorInput; }
    if (!valorInput || typeof valorInput !== 'string') { return 0; }
    const cleaned = valorInput
        .replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};

const formatMesDisplay = (mesStr) => {
    // Converte MM/AA para apenas "Mês"
    if (!mesStr || mesStr.length !== 5) return mesStr;
    const month = mesStr.substring(0, 2);
    const monthName = MONTH_NAMES_PT[parseInt(month, 10) - 1] || month;
    return monthName;
};

// Componente para formulário de nova meta
const NewMetaForm = ({ initialData, options, onSave, isSaving }) => {
    const [formData, setFormData] = useState(initialData);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = formData.Mes && formData.Tag && formData.Meta > 0;

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <label style={{fontWeight: 'bold'}}>Mês (MM/AA):</label>
            <input 
                type="text" 
                placeholder="Ex: 01/25" 
                value={formData.Mes || ''} 
                onChange={(e) => handleFormChange('Mes', e.target.value)} 
                style={styles.inputField} 
                maxLength={5}
            />
            
            <label style={{fontWeight: 'bold'}}>Tag:</label>
            <div style={styles.tagOptionContainer}>
                {options.allTags.map(tag => (
                    <button 
                        key={tag} 
                        style={formData.Tag === tag ? styles.selectedTag : styles.tagButton}
                        onClick={() => handleFormChange('Tag', tag)} 
                        disabled={isSaving}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <label style={{fontWeight: 'bold'}}>Valor da Meta (R$):</label>
            <input 
                type="number" 
                step="0.01" 
                value={formData.Meta || ''} 
                onChange={(e) => handleFormChange('Meta', e.target.value)} 
                style={styles.inputField} 
            />
            
            <button 
                style={styles.saveButton} 
                onClick={() => onSave(formData, 'ADD_META')} 
                disabled={isSaving || !isFormValid}
            >
                {isSaving ? 'Salvando...' : 'Criar Meta'}
            </button>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL: METAS PAGE ---
const MetasPage = ({ aggregatedData, reloadData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const [currentRecord, setCurrentRecord] = useState(null); 
    const [modalMode, setModalMode] = useState(null); // 'NEW', 'EDIT'
    
    const metas = aggregatedData?.rawData?.metas || [];
    const options = aggregatedData?.options || { allTags: [], tipos: [] };
    const columns = ['Mês', 'Tag', 'Valor'];

    // Extrai meses disponíveis das metas
    const mesesDisponiveis = useMemo(() => {
        const mesesSet = new Set();
        metas.forEach(meta => {
            if (meta.Mes) {
                // Converte MM/AA para MM/YYYY para ordenação
                const month = meta.Mes.substring(0, 2);
                const year = meta.Mes.substring(3, 5);
                mesesSet.add(`${month}/20${year}`);
            }
        });
        return Array.from(mesesSet).sort().reverse(); // Mais recente primeiro
    }, [metas]);

    const [mesAnoSelecionado, setMesAnoSelecionado] = useState(mesesDisponiveis[0] || '');

    useEffect(() => {
        if (mesesDisponiveis.length > 0 && !mesAnoSelecionado) {
            setMesAnoSelecionado(mesesDisponiveis[0]);
        }
    }, [mesesDisponiveis]);

    // Filtra metas por mês
    const filteredMetas = useMemo(() => {
        if (!mesAnoSelecionado) return metas;
        
        const [month, year] = mesAnoSelecionado.split('/');
        const yearShort = year.substring(2, 4); // Pega os últimos 2 dígitos
        const mesFormatado = `${month}/${yearShort}`;
        
        return metas.filter(meta => meta.Mes === mesFormatado);
    }, [metas, mesAnoSelecionado]);

    // Função de salvamento
    const handleSaveMeta = async (dataToSave, action, columnToUpdate = null) => {
        setIsSaving(true);
        setMessage('Salvando meta...');
        
        try {
            let successMsg;
            let response;

            if (action === 'ADD_META') {
                // Mapeia os dados para o formato esperado pelo backend
                const metaData = {
                    Mes: dataToSave.Mes || '',
                    Tag: dataToSave.Tag || '',
                    Meta: cleanValue(dataToSave.Meta || dataToSave.Valor || 0)
                };
                
                response = await addMetaToBackend(metaData);
                successMsg = 'Meta criada com sucesso!';
                
            } else if (action === 'UPDATE_META') {
                // Mapeia o nome da coluna do frontend para o backend
                let columnName = columnToUpdate;
                let valueToSave = dataToSave[columnToUpdate];
                
                if (columnToUpdate === 'Valor') {
                    columnName = 'Meta';
                    valueToSave = cleanValue(valueToSave);
                } else if (columnToUpdate === 'Mês') {
                    columnName = 'Mes';
                }
                
                response = await updateMetaInBackend({
                    rowNumber: dataToSave.ROW_NUMBER,
                    column: columnName,
                    value: valueToSave
                });
                successMsg = `Meta atualizada com sucesso!`;
                
            } else if (action === 'DELETE_META') {
                response = await deleteMetaFromBackend({
                    rowNumber: dataToSave.ROW_NUMBER
                });
                successMsg = 'Meta deletada com sucesso!';
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

    // Abre o Modal para Edição Direta
    const startDirectEdit = (record, column) => {
        setModalMode('EDIT');
        setCurrentRecord({
            ...record,
            column: column, 
        });
        setIsModalOpen(true);
        setMessage('');
    };

    // Abre o Modal para Nova Meta
    const startNewMeta = () => {
        setModalMode('NEW'); 
        setCurrentRecord({
            Mes: '', 
            Tag: '', 
            Meta: 0, 
        });
        setIsModalOpen(true);
        setMessage('');
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Metas</h1>

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

            {message && <p style={{textAlign: 'center', fontWeight: 'bold', color: isSaving ? 'blue' : (message.includes('Erro') ? 'red' : 'green')}}>{message}</p>}

            {/* Tabela de Metas */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col} style={styles.th}>{col}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMetas.map((meta) => (
                            <tr key={meta.ROW_NUMBER} style={styles.tr}>
                                {columns.map(col => {
                                    let displayValue;
                                    if (col === 'Mês') {
                                        displayValue = formatMesDisplay(meta.Mes);
                                    } else if (col === 'Valor') {
                                        displayValue = `R$ ${cleanValue(meta.Meta).toFixed(2).replace('.', ',')}`;
                                    } else if (col === 'Tag') {
                                        // Renderiza tag com sua cor
                                        const tagsWithColors = aggregatedData?.options?.tagsWithColors || {};
                                        const tagColor = tagsWithColors[meta.Tag] || '#4bc0c0';
                                        displayValue = (
                                            <span
                                                style={{
                                                    backgroundColor: tagColor,
                                                    color: '#fff',
                                                    padding: '5px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                {meta.Tag}
                                            </span>
                                        );
                                    } else {
                                        displayValue = meta[col] || '';
                                    }
                                    
                                    // Se displayValue é um componente React, renderiza diretamente
                                    if (React.isValidElement(displayValue)) {
                                        return (
                                            <td key={col} style={styles.td} onClick={() => startDirectEdit(meta, col)}>
                                                {displayValue}
                                            </td>
                                        );
                                    }
                                    
                                    return (
                                        <td key={col} style={styles.td} onClick={() => startDirectEdit(meta, col)}>
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredMetas.length === 0 && <p style={{textAlign: 'center', margin: '20px 0'}}>Nenhuma meta encontrada.</p>}
            </div>

            {/* BOTÃO FLUTUANTE PARA NOVA META */}
            <FloatingButton onClick={startNewMeta} /> 

            {/* MODAL */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    if (isSaving) return; 
                    setIsModalOpen(false); 
                    setCurrentRecord(null);
                    setMessage('');
                    setModalMode(null);
                }} 
                title={modalMode === 'NEW' ? "Nova Meta" : `Editar ${currentRecord?.column || 'Item'}`}
            >
                {modalMode === 'NEW' && currentRecord && (
                    <NewMetaForm 
                        initialData={currentRecord} 
                        options={options} 
                        onSave={handleSaveMeta} 
                        isSaving={isSaving} 
                    />
                )}
                
                {modalMode === 'EDIT' && currentRecord && currentRecord.column && (
                    <DirectEditForm
                        record={currentRecord}
                        column={currentRecord.column}
                        options={options}
                        onSave={handleSaveMeta}
                        isSaving={isSaving}
                    />
                )}
            </Modal>
        </div>
    );
};

export default MetasPage;

// --- ESTILOS MOBILE-FIRST ---
const styles = {
    container: {
        padding: '15px',
        paddingTop: '80px', // Espaço para o título fixo
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f4f4f9',
        padding: '15px',
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
        minWidth: '400px',
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
    inputField: { 
        width: '100%', 
        padding: '10px', 
        boxSizing: 'border-box', 
        borderRadius: '5px', 
        border: '1px solid #ccc', 
        fontSize: '16px' 
    },
    tagOptionContainer: { 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px', 
        justifyContent: 'flex-start', 
        padding: '10px 0', 
        maxHeight: '150px', 
        overflowY: 'auto' 
    },
    tagButton: { 
        padding: '6px 10px', 
        borderRadius: '5px', 
        border: '1px solid #007bff', 
        backgroundColor: '#f0f8ff', 
        cursor: 'pointer', 
        fontSize: '12px' 
    },
    selectedTag: { 
        padding: '6px 10px', 
        borderRadius: '5px', 
        border: '1px solid #007bff', 
        backgroundColor: '#007bff', 
        color: 'white', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        fontSize: '12px' 
    },
    saveButton: { 
        padding: '10px 15px', 
        backgroundColor: '#4bc0c0', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
};

