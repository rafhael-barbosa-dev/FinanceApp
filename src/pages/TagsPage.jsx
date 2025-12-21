// src/pages/TagsPage.jsx - Página de Gerenciamento de Tags

import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import { addOrganizadorToBackend, updateOrganizadorInBackend, deleteOrganizadorFromBackend } from '../utils/api';
import FloatingButton from '../components/FloatingButton.jsx';

// --- COMPONENTE PRINCIPAL: TAGS PAGE ---
const TagsPage = ({ aggregatedData, reloadData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [currentTag, setCurrentTag] = useState(null);
    const [modalMode, setModalMode] = useState(null); // 'NEW' ou 'EDIT'
    
    const organizadores = aggregatedData?.rawData?.organizadores || [];
    const tagsWithColors = aggregatedData?.options?.tagsWithColors || {};
    
    // Extrai tags únicas da coluna A (Tag) dos organizadores e ordena alfabeticamente
    const uniqueTags = React.useMemo(() => {
        const tagsMap = new Map();
        organizadores.forEach(org => {
            const tagName = org.Tag;
            if (tagName && tagName.toString().trim() !== '') {
                if (!tagsMap.has(tagName)) {
                    tagsMap.set(tagName, {
                        name: tagName,
                        color: tagsWithColors[tagName] || '#4bc0c0',
                        rowNumber: org.ROW_NUMBER
                    });
                }
            }
        });
        // Ordena alfabeticamente de A-Z
        return Array.from(tagsMap.values()).sort((a, b) => 
            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );
    }, [organizadores, tagsWithColors]);

    // Abre modal para editar tag
    const openTagModal = (tagData) => {
        setCurrentTag({
            ...tagData,
            originalName: tagData.name
        });
        setIsModalOpen(true);
        setMessage('');
        setModalMode('EDIT');
    };

    // Abre modal para criar nova tag
    const openNewTagModal = () => {
        setCurrentTag({
            name: '',
            color: '#4bc0c0',
            originalName: '',
            rowNumber: null
        });
        setIsModalOpen(true);
        setMessage('');
        setModalMode('NEW');
    };

    // Função de salvamento
    const handleSaveTag = async (action) => {
        if (!currentTag) return;
        
        setIsSaving(true);
        setMessage('Salvando tag...');
        
        try {
            if (action === 'CREATE') {
                const tagData = {
                    Tag: currentTag.name,
                    Cor: currentTag.color,
                    Tipo: '', // Pode ser preenchido depois
                    'Forma do pagamento': '' // Pode ser preenchido depois
                };
                
                await addOrganizadorToBackend(tagData);
                setMessage('Tag criada com sucesso!');
                
            } else if (action === 'UPDATE') {
                // Atualiza o nome da tag se mudou
                if (currentTag.name !== currentTag.originalName) {
                    await updateOrganizadorInBackend({
                        rowNumber: currentTag.rowNumber,
                        column: 'Tag',
                        value: currentTag.name
                    });
                }
                
                // Atualiza a cor se mudou
                if (currentTag.color !== tagsWithColors[currentTag.originalName]) {
                    await updateOrganizadorInBackend({
                        rowNumber: currentTag.rowNumber,
                        column: 'Cor',
                        value: currentTag.color
                    });
                }
                
                setMessage('Tag atualizada com sucesso!');
                
            } else if (action === 'DELETE') {
                await deleteOrganizadorFromBackend({
                    rowNumber: currentTag.rowNumber
                });
                setMessage('Tag deletada com sucesso!');
            } else {
                throw new Error("Ação inválida.");
            }
            
            if (reloadData) {
                await reloadData();
            }
            
            setTimeout(() => {
                setIsModalOpen(false);
                setCurrentTag(null);
                setMessage('');
                setModalMode(null);
            }, 1500);
            
        } catch (err) {
            setMessage(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTagNameChange = (newName) => {
        setCurrentTag(prev => ({ ...prev, name: newName }));
    };

    const handleTagColorChange = (newColor) => {
        setCurrentTag(prev => ({ ...prev, color: newColor }));
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gerenciar Tags</h1>
            
            {message && (
                <p style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: message.includes('Erro') ? 'red' : 'green',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: message.includes('Erro') ? '#ffebee' : '#e8f5e9',
                    borderRadius: '5px'
                }}>
                    {message}
                </p>
            )}

            {/* Tags como Badges lado a lado */}
            <div style={styles.tagsContainer}>
                {uniqueTags.length > 0 ? (
                    uniqueTags.map((tagData, index) => (
                        <span
                            key={index}
                            style={{
                                ...styles.tagBadge,
                                backgroundColor: tagData.color,
                            }}
                            onClick={() => openTagModal(tagData)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                            }}
                        >
                            {tagData.name}
                        </span>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#666', width: '100%' }}>
                        Nenhuma tag encontrada na planilha.
                    </p>
                )}
            </div>

            {/* Botão Flutuante para Criar Nova Tag */}
            <FloatingButton onClick={openNewTagModal} />

            {/* Modal de Edição de Tag */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    if (isSaving) return;
                    setIsModalOpen(false);
                    setCurrentTag(null);
                    setMessage('');
                    setModalMode(null);
                }}
                title={modalMode === 'NEW' ? 'Criar Nova Tag' : `Editar Tag: ${currentTag?.originalName || ''}`}
            >
                {currentTag && (
                    <div style={styles.modalContent}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nome da Tag:</label>
                            <input
                                type="text"
                                value={currentTag.name}
                                onChange={(e) => handleTagNameChange(e.target.value)}
                                style={styles.input}
                                disabled={isSaving}
                                placeholder="Digite o nome da tag"
                            />
                        </div>

                        <ColorPicker
                            value={currentTag.color}
                            onChange={handleTagColorChange}
                        />

                        <div style={styles.buttonGroup}>
                            {modalMode === 'NEW' ? (
                                <button
                                    style={{...styles.button, ...styles.createButton}}
                                    onClick={() => handleSaveTag('CREATE')}
                                    disabled={isSaving || !currentTag.name.trim()}
                                >
                                    {isSaving ? 'Criando...' : 'Criar Tag'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        style={{...styles.button, ...styles.updateButton}}
                                        onClick={() => handleSaveTag('UPDATE')}
                                        disabled={isSaving || !currentTag.name.trim()}
                                    >
                                        {isSaving ? 'Salvando...' : 'Atualizar Tag'}
                                    </button>
                                    
                                    <button
                                        style={{...styles.button, ...styles.deleteButton}}
                                        onClick={() => {
                                            if (window.confirm(`Tem certeza que deseja deletar a tag "${currentTag.name}"?`)) {
                                                handleSaveTag('DELETE');
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        Deletar Tag
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TagsPage;

// --- ESTILOS MOBILE-FIRST ---
const styles = {
    container: {
        padding: '15px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f4f4f9',
        minHeight: 'calc(100vh - 70px)',
        maxWidth: '100%',
        boxSizing: 'border-box'
    },
    header: {
        fontSize: '24px',
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
        fontWeight: 'bold'
    },
    tagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '10px 0',
        alignItems: 'flex-start'
    },
    tagBadge: {
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
        display: 'inline-block',
        userSelect: 'none',
    },
    modalContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontWeight: 'bold',
        fontSize: '14px',
        color: '#333'
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        fontSize: '16px',
        boxSizing: 'border-box'
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    },
    button: {
        padding: '12px 20px',
        borderRadius: '5px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    updateButton: {
        backgroundColor: '#4bc0c0',
        color: 'white'
    },
    deleteButton: {
        backgroundColor: '#ff6384',
        color: 'white'
    },
    createButton: {
        backgroundColor: '#4bc0c0',
        color: 'white'
    }
};

