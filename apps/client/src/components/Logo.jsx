import React from 'react';

const Logo = ({ size = 32, className = '', variant = 'dark' }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Left Segment */}
            <path d="M15 20 L40 20 L50 80 L25 80 Z" fill="url(#veloraTealLeft)" />
            {/* Center Shadow Facet */}
            <path d="M40 20 L50 80 L60 48 Z" fill="url(#veloraTealCenter)" />
            {/* Right Segment */}
            <path d="M60 48 L50 80 L85 20 L75 15 Z" fill="url(#veloraTealRight)" />

            {/* Wireframe overlay lines for the geometric high-tech look */}
            <path d="M15 20 L40 20 L50 80 L25 80 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
            <path d="M40 20 L50 80 L60 48 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
            <path d="M60 48 L50 80 L85 20 L75 15 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
            <path d="M25 80 L50 80 M40 20 L60 48 L75 15" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />

            <defs>
                <linearGradient id="veloraTealLeft" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="50%" stopColor="#0B409C" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="veloraTealCenter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="veloraTealRight" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default Logo;
