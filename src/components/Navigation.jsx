// src/components/Navigation.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-around',
        position: 'fixed', // Fica fixo no rodapé
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        boxShadow: '0 -2px 5px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '10px 0',
    },
    link: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        color: '#555',
        fontSize: '10px', // Pequeno e otimizado para mobile
    },
    activeLink: {
        color: '#007bff', // Cor de destaque
    }
};

const Navigation = ({ active }) => (
    <nav style={styles.nav}>
        <Link to="/" style={{...styles.link, ...(active === 'Home' ? styles.activeLink : {})}}>
            {/* Você pode substituir '🏠' por ícones */}
            <span>🏠</span>
            <span>Home</span>
        </Link>
        <Link to="/registros" style={{...styles.link, ...(active === 'Registros' ? styles.activeLink : {})}}>
            <span>📝</span>
            <span>Registros</span>
        </Link>
        <Link to="/metas" style={{...styles.link, ...(active === 'Metas' ? styles.activeLink : {})}}>
            <span>🎯</span>
            <span>Metas</span>
        </Link>
        {/* Adicionar as demais páginas aqui... */}
    </nav>
);

export default Navigation;