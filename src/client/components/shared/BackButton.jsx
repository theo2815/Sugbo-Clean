import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COLORS } from '../../../utils/constants';

export default function BackButton({ to = '/resident', label = 'Back' }) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(to)}
            aria-label={label}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: COLORS.secondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 2px',
                marginBottom: 12,
            }}
        >
            <ArrowLeft size={16} />
            {label}
        </button>
    );
}
