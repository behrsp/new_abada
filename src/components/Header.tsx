import React from 'react';
import { User } from '../types';
import { getCordaStyle } from '../data/graduations';
import { AbadaLogo } from './AbadaLogo';
import { LogIn, LogOut, User as UserIcon, Bell, Shield, Award } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  pendingRequestsCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  pendingRequestsCount,
  setActiveTab,
}) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';
  const cordaStyle = currentUser ? getCordaStyle(currentUser.corda) : null;

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-amber-900/40 text-amber-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Branding */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab('musicas')}
        >
          <AbadaLogo size="md" className="group-hover:scale-105 transition-transform" />
          <div className="hidden sm:block">
            <h1 className="text-base font-black tracking-wider text-amber-400 font-serif uppercase leading-tight">
              ABADÁ-CAPOEIRA
            </h1>
            <p className="text-[10px] text-amber-200/70 tracking-wide uppercase">
              Músicas • Toques • Graduações
            </p>
          </div>
        </div>

        {/* User Status / Actions */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              {/* Notification Badge for Admin/Prof */}
              {isAdminOrProf && (
                <button
                  onClick={() => setActiveTab('solicitacoes')}
                  className="relative p-2 rounded-lg bg-stone-800 text-amber-300 hover:bg-stone-700 transition"
                  title="Solicitações de alunos"
                >
                  <Bell className="w-5 h-5" />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Info Card */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="flex items-center space-x-1">
                  {isAdminOrProf && <Shield className="w-3.5 h-3.5 text-amber-400 inline" />}
                  <span className="text-sm font-semibold text-amber-100">
                    {currentUser.nickname || currentUser.name}
                  </span>
                </div>
                {cordaStyle && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border mt-0.5 inline-block"
                    style={{
                      backgroundColor: cordaStyle.bg,
                      color: cordaStyle.text,
                      borderColor: cordaStyle.border,
                    }}
                  >
                    {currentUser.corda}
                  </span>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-200 text-xs font-medium flex items-center space-x-1 transition"
                title="Sair do aplicativo"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center space-x-2 shadow-md transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
