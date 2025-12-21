// src/components/FloatingButton.jsx
import React from 'react';

const styles = {
    fab: {
        position: 'fixed',
        bottom: '80px', // Acima da navegação
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4bc0c0', // Cor principal
        color: 'white',
        fontSize: '30px',
        border: 'none',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0, // Remove qualquer padding padrão
        lineHeight: '60px', // Garante que o texto fique centralizado
        aspectRatio: '1 / 1', // Garante proporção 1:1
        minWidth: '60px',
        minHeight: '60px',
        maxWidth: '60px',
        maxHeight: '60px',
    },
};

const FloatingButton = React.memo(({ onClick }) => ( // Uso de React.memo
    <button onClick={onClick} style={styles.fab}>
        +
    </button>
));

export default FloatingButton;