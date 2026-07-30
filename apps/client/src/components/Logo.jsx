import React from 'react';

const Logo = ({ size = 36, className = '', variant = 'dark' }) => {
    const isLight = variant === 'light';

    return (
        <div className={`inline-flex items-center select-none ${isLight ? 'bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/50' : ''} ${className}`}>
            <img 
                src="/logo.png" 
                alt="Velora" 
                style={{ 
                    height: typeof size === 'number' ? `${size}px` : size,
                    width: 'auto',
                    objectFit: 'contain'
                }}
                className="transition-all duration-200"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
};

export default Logo;

