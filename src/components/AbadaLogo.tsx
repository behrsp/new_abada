import React from 'react';

interface AbadaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AbadaLogo: React.FC<AbadaLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 sm:h-10',
    md: 'h-10 sm:h-12',
    lg: 'h-16 sm:h-20',
    xl: 'h-24 sm:h-32',
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        src="/logonew.png"
        alt="ABADÁ-CAPOEIRA Logo"
        className="h-full w-auto object-contain drop-shadow-md"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
