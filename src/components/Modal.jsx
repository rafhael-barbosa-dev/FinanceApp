// src/components/Modal.jsx
import React from 'react';

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '95%', // Adaptação mobile
        maxHeight: '90%',
        overflowY: 'auto',
        position: 'relative',
        minWidth: '300px',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#555',
    },
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={onClose} style={styles.closeButton}>X</button>
                <h2 style={{marginTop: '0', fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>{title}</h2>
                {children}
            </div>
        </div>
    );
};

export default Modal;