import React from 'react';

const LoadingSpinner = ({ message = '', fullScreen = false }) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center gap-5 select-none antialiased ${
        fullScreen 
          ? 'fixed inset-0 z-[9999] min-h-screen w-screen bg-white' 
          : 'w-full min-h-[350px] h-[calc(100vh-140px)] bg-transparent'
      }`}
    >
      {/* 1. Company Logo */}
      <img 
        src="/logo.png" 
        alt="Velora" 
        className="h-10 sm:h-14 w-auto object-contain"
      />

      {/* 2. Clock Needle Spinner Animation directly below Logo */}
      <div className="relative w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center shadow-2xs">
        {/* Center Pivot */}
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 z-10"></div>
        
        {/* Clock Needle Hand (0.7s spin) */}
        <div 
          className="absolute top-1.5 w-0.5 h-2.5 bg-slate-900 rounded-full animate-clock-needle"
          style={{ transformOrigin: 'bottom center' }}
        />
      </div>

      {/* 3. Optional Simple Message */}
      {message && (
        <p className="text-xs font-semibold text-slate-500 tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
