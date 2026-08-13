import React from 'react';
import { Music, Radio, Calendar, Users, MessageSquarePlus } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  pendingRequestsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingRequestsCount,
}) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  const navItems = [
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'toques', label: 'Toques', icon: Radio },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    ...(isAdminOrProf
      ? [{ id: 'dashboard', label: 'Gestão de Alunos', icon: Users }]
      : []),
    { id: 'solicitacoes', label: 'Área do Aluno', icon: MessageSquarePlus, badge: pendingRequestsCount },
  ];

  return (
    <>
      {/* Desktop Navigation Header Bar */}
      <div className="hidden md:block bg-stone-950 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition relative ${
                    isActive
                      ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                      : 'text-amber-200/80 hover:bg-stone-800 hover:text-amber-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur border-t border-stone-800 px-2 py-1">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition relative ${
                  isActive ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-amber-500/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-0 right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
