import React from 'react';

export default function Footer() {
    return (
        <footer style={{ 
            marginTop: 'auto', 
            padding: '20px 5%', 
            background: '#f8f9fa', 
            borderTop: '1px solid #ddd',
            textAlign: 'center'
        }}>
            <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>
                "Keeping Sugbo clean, one pickup at a time."
            </p>
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
                <p>📍 LGU Cebu City Sanitation Office | 📞 Support: (032) 123-4567</p>
                <p>© 2026 SugboClean Project - CIT-U Capstone</p>
            </div>
        </footer>
    );
}