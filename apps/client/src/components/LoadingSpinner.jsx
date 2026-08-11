import React from 'react';

const LoadingSpinner = ({ message = '', fullScreen = true }) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center bg-white select-none antialiased ${
        fullScreen ? 'fixed inset-0 z-[9999] min-h-screen w-screen' : 'min-h-[340px] w-full p-8'
      }`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        
        {/* Official Velora Brand Logo (V-mark + VELORA) - Prominently Large in Center */}
        <div className="flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Velora" 
            className="h-14 sm:h-20 w-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* Small Clock Rotating Needle Spinner (0.7s timing) */}
        <div className="relative w-7 h-7 rounded-full border-2 border-slate-300 flex items-center justify-center shadow-2xs">
          {/* Center Pin / Pivot */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 z-10"></div>
          
          {/* Rotating Clock Needle (0.7s loop) */}
          <div 
            className="absolute top-1.5 w-0.5 h-2 bg-slate-900 rounded-full animate-clock-needle"
            style={{
              transformOrigin: 'bottom center'
            }}
          />
        </div>

        {message && (
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-0.5 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
