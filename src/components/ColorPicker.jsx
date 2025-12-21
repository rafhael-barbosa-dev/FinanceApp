// src/components/ColorPicker.jsx - Componente de Seletor de Cor

import React, { useState } from 'react';

const ColorPicker = ({ value, onChange }) => {
    const [showPicker, setShowPicker] = useState(false);
    
    // Cores predefinidas comuns
    const predefinedColors = [
        '#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0',
        '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf', '#4bc0c0',
        '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
        '#ff9f40', '#ff6384', '#c9cbcf', '#4bc0c0', '#ff6384'
    ];

    const colorButtonStyle = (color) => ({
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: value === color ? '3px solid #333' : '2px solid #ddd',
        backgroundColor: color,
        cursor: 'pointer',
        margin: '5px',
        boxShadow: value === color ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none',
    });

    return (
        <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Cor da Tag:
            </label>
            
            {/* Mostra a cor atual */}
            <div 
                style={{
                    width: '100%',
                    height: '50px',
                    backgroundColor: value || '#4bc0c0',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}
                onClick={() => setShowPicker(!showPicker)}
            >
                {value || '#4bc0c0'}
            </div>

            {/* Input de cor HTML5 */}
            <input
                type="color"
                value={value || '#4bc0c0'}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    height: '50px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                }}
            />

            {/* Cores predefinidas */}
            {showPicker && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px'
                }}>
                    {predefinedColors.map((color, index) => (
                        <div
                            key={index}
                            style={colorButtonStyle(color)}
                            onClick={() => {
                                onChange(color);
                                setShowPicker(false);
                            }}
                            title={color}
                        />
                    ))}
                </div>
            )}

            {/* Input de texto para código hexadecimal */}
            <input
                type="text"
                value={value || '#4bc0c0'}
                onChange={(e) => {
                    const newColor = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                        onChange(newColor);
                    }
                }}
                placeholder="#4bc0c0"
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    marginTop: '10px'
                }}
            />
        </div>
    );
};

export default ColorPicker;

