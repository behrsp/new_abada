import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { AbadaLogo } from './AbadaLogo';
import { ConfirmModal } from './ConfirmModal';
import {
  CORDA_OPTIONS,
  getCordaStyle,
  getCordaIndex,
  getCordaProgressPercent,
  getNextCorda,
} from '../data/graduations';
import { formatPhoneDisplay } from '../utils/phone';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Award,
  Phone,
  Calendar,
  Shield,
  X,
  Filter,
  TrendingUp,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
} from 'lucide-react';

interface DashboardSectionProps {
  users: User[];
  currentUser: User | null;
  onRefresh: () => void;
  onUpdateCurrentUser?: (user: User) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  users,
  currentUser,
  onRefresh,
  onUpdateCurrentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCordaFilter, setSelectedCordaFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  // Modal form states (Create / Edit User)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [corda, setCorda] = useState(CORDA_OPTIONS[0].name);

  // Quick Promote Modal State
  const [promoteUserTarget, setPromoteUserTarget] = useState<User | null>(null);
  const [targetCorda, setTargetCorda] = useState<string>('');

  // Student Trail Modal State
  const [inspectUserTarget, setInspectUserTarget] = useState<User | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdminOrProf =
    currentUser?.role === 'admin' || currentUser?.role === 'professor';

  // Compute breakdown by Corda
  const cordaBreakdown = CORDA_OPTIONS.map((cOption) => {
    const count = users.filter(
      (u) => u.corda?.toLowerCase() === cOption.name.toLowerCase()
    ).length;
    const percentage =
      users.length > 0 ? Math.round((count / users.length) * 100) : 0;
    return {
      ...cOption,
      count,
      percentage,
    };
  });

  // Compute breakdown by Category
  const CATEGORIES = ['Iniciante', 'Aluno', 'Graduado', 'Instrutor', 'Professor', 'Mestrando', 'Mestre', 'Grão-Mestre'];
  const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Iniciante: { bg: '#e2e8f0', text: '#0F0E0D', border: '#cbd5e1' },
    Aluno: { bg: '#facc15', text: '#0F0E0D', border: '#ca8a04' },
    Graduado: { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8' },
    Instrutor: { bg: '#9333ea', text: '#ffffff', border: '#7e22ce' },
    Professor: { bg: '#78350f', text: '#ffffff', border: '#451a03' },
    Mestrando: { bg: '#dc2626', text: '#ffffff', border: '#b91c1c' },
    Mestre: { bg: '#ef4444', text: '#ffffff', border: '#b91c1c' },
    'Grão-Mestre': { bg: '#ffffff', text: '#000000', border: '#D4AF37' },
  };

  const categoryBreakdown = CATEGORIES.map((cat) => {
    const cordasInCat = CORDA_OPTIONS.filter((c) => c.category === cat).map((c) =>
      c.name.toLowerCase()
    );
    const count = users.filter(
      (u) => u.corda && cordasInCat.includes(u.corda.toLowerCase())
    ).length;
    const percentage =
      users.length > 0 ? Math.round((count / users.length) * 100) : 0;
    return {
      category: cat,
      count,
      percentage,
      ...CATEGORY_COLORS[cat],
    };
  });

  // Filter users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.phone.includes(searchTerm);

    const matchesCorda = selectedCordaFilter
      ? u.corda?.toLowerCase() === selectedCordaFilter.toLowerCase()
      : true;

    const matchedCordaOption = CORDA_OPTIONS.find(
      (c) => c.name.toLowerCase() === u.corda?.toLowerCase()
    );

    const matchesCategory = selectedCategoryFilter
      ? matchedCordaOption?.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
      : true;

    return matchesSearch && matchesCorda && matchesCategory;
  });

  const handleOpenForm = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setNickname(u.nickname || u.name);
      setPhone(u.phone);
      setBirthday(u.birthday || '');
      setPassword(''); // keep blank unless changing
      setRole(u.role);
      setCorda(u.corda || CORDA_OPTIONS[0].name);
    } else {
      setEditingUser(null);
      setName('');
      setNickname('');
      setPhone('');
      setBirthday('');
      setPassword('');
      setRole('aluno');
      setCorda(CORDA_OPTIONS[0].name);
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setError('A senha inicial do aluno deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nickname: nickname || name,
            phone,
            birthday,
            role,
            corda,
            password: password || undefined,
          }),
        });

        if (!res.ok) throw new Error('Erro ao atualizar dados do aluno.');
        const updatedUser = await res.json();
        if (editingUser.id === currentUser?.id && onUpdateCurrentUser) {
          onUpdateCurrentUser(updatedUser);
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nickname: nickname || name,
            phone,
            birthday,
            password,
            role,
            corda,
          }),
        });

        if (!res.ok) throw new Error('Erro ao cadastrar novo aluno.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar aluno.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPromoteOpen = (u: User) => {
    const next = getNextCorda(u.corda);
    setPromoteUserTarget(u);
    setTargetCorda(next ? next.name : u.corda || CORDA_OPTIONS[0].name);
  };

  const handleExecutePromotion = async () => {
    if (!promoteUserTarget) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${promoteUserTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promoteUserTarget.name,
          nickname: promoteUserTarget.nickname || promoteUserTarget.name,
          phone: promoteUserTarget.phone,
          birthday: promoteUserTarget.birthday || '',
          role: promoteUserTarget.role,
          corda: targetCorda,
        }),
      });

      if (!res.ok) throw new Error('Erro ao promover graduação do aluno.');
      const updatedUser = await res.json();
      if (promoteUserTarget.id === currentUser?.id && onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }

      setPromoteUserTarget(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar troca de corda.');
    } finally {
      setLoading(false);
    }
  };

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteUser = (u: User) => {
    setDeletingUser(u);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir aluno.');
      setDeletingUser(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1816] border-l-2 border-[#D4AF37] border-y border-r border-stone-800 p-4 sm:p-6 rounded-xl shadow-xl">
        <div className="flex items-center space-x-4">
          <AbadaLogo size="lg" className="hidden sm:block" />
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-white">
                Gestão de Graduações & Alunos ABADÁ
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 font-sans">
              Acompanhe a distribuição por cordas, o progresso da jornada e realize a troca de graduações do grupo.
            </p>
          </div>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="px-5 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-amber-400 text-[#0F0E0D] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Aluno</span>
          </button>
        )}
      </div>

      {/* DASHBOARD SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#1A1816] p-4 border-l-2 border-[#D4AF37] border-y border-r border-stone-800 rounded-lg">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
            Total do Grupo
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <p className="text-2xl font-serif font-bold text-white">
              {users.length}
            </p>
            <span className="text-[10px] text-stone-400">alunos</span>
          </div>
        </div>

        {categoryBreakdown.slice(0, 4).map((cat) => (
          <div
            key={cat.category}
            onClick={() => {
              setSelectedCategoryFilter(
                selectedCategoryFilter === cat.category ? '' : cat.category
              );
              setSelectedCordaFilter('');
            }}
            className={`bg-[#1A1816] p-4 border rounded-lg cursor-pointer transition ${
              selectedCategoryFilter === cat.category
                ? 'border-[#D4AF37] bg-[#2D2A26]'
                : 'border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                {cat.category}s
              </p>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.bg }}
              />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-serif font-bold text-white">
                {cat.count}
              </p>
              <span className="text-[10px] text-[#D4AF37] font-mono">
                {cat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MACRO DISTRIBUTION PROGRESS BAR */}
      <div className="bg-[#1A1816] border border-stone-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#D4AF37] font-serif italic flex items-center space-x-2 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              <span>Distribuição do Grupo por Nível de Graduação</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Visualização percentual do grupo distribuído por categorias
            </p>
          </div>

          {(selectedCategoryFilter || selectedCordaFilter) && (
            <button
              onClick={() => {
                setSelectedCategoryFilter('');
                setSelectedCordaFilter('');
              }}
              className="text-xs text-[#D4AF37] hover:underline font-medium self-start sm:self-auto"
            >
              Limpar Filtro Visual ({selectedCategoryFilter || selectedCordaFilter})
            </button>
          )}
        </div>

        {/* Multi-segmented distribution bar */}
        <div className="h-4 w-full bg-[#0F0E0D] rounded-full overflow-hidden flex border border-stone-800 p-0.5 space-x-0.5">
          {categoryBreakdown.map((cat) =>
            cat.count > 0 ? (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.bg,
                }}
                className="h-full rounded-sm transition-all duration-500 relative group cursor-pointer"
                onClick={() => setSelectedCategoryFilter(cat.category)}
                title={`${cat.category}: ${cat.count} alunos (${cat.percentage}%)`}
              />
            ) : null
          )}
        </div>

        {/* Category Legend Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categoryBreakdown.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => {
                  setSelectedCategoryFilter(isSelected ? '' : cat.category);
                  setSelectedCordaFilter('');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition border ${
                  isSelected
                    ? 'bg-[#2D2A26] border-[#D4AF37] text-[#D4AF37] font-bold'
                    : 'bg-[#0F0E0D] border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: cat.bg }}
                />
                <span>{cat.category}</span>
                <span className="text-[10px] text-stone-400 ml-1">
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAPA SPECTRUM DAS 13 CORDAS (INTERACTIVE CORDA PATHWAY) */}
      <div className="bg-[#1A1816] border border-stone-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-serif italic flex items-center space-x-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>Sistema de Graduações ABADÁ-CAPOEIRA (Trilha das 17 Cordas)</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Clique em qualquer corda para filtrar os alunos e visualizar seu elemento e significado
            </p>
          </div>
        </div>

        {/* Corda Spectrum Horizontal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-17 gap-2 overflow-x-auto pb-1">
          {cordaBreakdown.map((item, index) => {
            const isSelected =
              selectedCordaFilter.toLowerCase() === item.name.toLowerCase();
            const cordaStyle = getCordaStyle(item.name);

            return (
              <button
                key={item.name}
                onClick={() => {
                  setSelectedCordaFilter(isSelected ? '' : item.name);
                  setSelectedCategoryFilter('');
                }}
                className={`p-2 rounded-lg border text-center transition flex flex-col justify-between items-center shadow-md relative group min-w-[75px] ${
                  isSelected
                    ? 'ring-2 ring-[#D4AF37] scale-105 bg-[#2D2A26]'
                    : 'hover:border-stone-600 bg-[#0F0E0D]'
                }`}
                style={{
                  borderColor: isSelected ? '#D4AF37' : item.border,
                }}
                title={`${item.name} - ${item.category} (${item.element || ''})`}
              >
                {/* Level indicator pill */}
                <span className="text-[9px] font-mono text-stone-400">
                  #{index + 1}
                </span>

                {/* Swatch Cord Visual */}
                <div
                  className="w-full h-3.5 my-1.5 rounded border border-black/30 shadow-inner"
                  style={{
                    background: cordaStyle.gradient || item.color,
                  }}
                />

                <span className="text-[10px] font-bold text-stone-200 line-clamp-1 leading-tight">
                  {item.name}
                </span>

                {item.element && (
                  <span className="text-[8px] text-[#D4AF37] italic truncate w-full mt-0.5">
                    {item.element}
                  </span>
                )}

                <div className="mt-1 flex items-baseline space-x-0.5">
                  <span className="text-sm font-serif font-bold text-white">
                    {item.count}
                  </span>
                  <span className="text-[8px] text-stone-400">
                    {item.count === 1 ? 'aluno' : 'alunos'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH, FILTERS & VIEW MODE CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, apelido ou telefone..."
            className="w-full pl-11 pr-4 py-3 bg-[#1A1816] border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={selectedCordaFilter}
            onChange={(e) => {
              setSelectedCordaFilter(e.target.value);
              setSelectedCategoryFilter('');
            }}
            className="px-4 py-3 bg-[#1A1816] border border-stone-800 rounded-lg text-stone-200 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="">Todas as Cordas/Graduações</option>
            {CORDA_OPTIONS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-[#1A1816] p-1 border border-stone-800 rounded-lg text-xs font-bold">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded transition ${
                viewMode === 'grid'
                  ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Visão em Lista Detalhada com Progresso"
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded transition ${
                viewMode === 'kanban'
                  ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Visão por Colunas de Categoria"
            >
              Categorias
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID LIST WITH INDIVIDUAL PROGRESS BARS */}
      {viewMode === 'grid' && (
        <div className="bg-[#1A1816] border border-stone-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0F0E0D] border-b border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#D4AF37] tracking-wider">
              Alunos e Indicadores de Progresso ({filteredUsers.length})
            </span>
          </div>

          <div className="divide-y divide-stone-800/60">
            {filteredUsers.map((u) => {
              const cordaStyle = getCordaStyle(u.corda || '');
              const cordaIndex = getCordaIndex(u.corda);
              const progressPercent = getCordaProgressPercent(u.corda);
              const nextCordaOption = getNextCorda(u.corda);
              const isSelf = u.id === currentUser?.id;

              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#2D2A26]/40 transition"
                >
                  {/* Left: User Avatar & Info */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-[280px]">
                    <div
                      className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow"
                      style={{
                        backgroundColor: '#2D2A26',
                        borderColor: cordaStyle.border,
                      }}
                    >
                      {u.nickname ? u.nickname[0].toUpperCase() : u.name[0].toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-base font-serif italic font-bold text-white">
                          {u.nickname || u.name}
                        </h4>
                        {u.nickname && u.nickname !== u.name && (
                          <span className="text-xs text-stone-400">({u.name})</span>
                        )}

                        {u.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-[#2D2A26] text-[#D4AF37] border border-stone-700 rounded text-[10px] font-bold uppercase flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        )}
                        {u.role === 'professor' && (
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[10px] font-bold uppercase">
                            Professor
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-stone-400 flex-wrap gap-y-1 font-sans">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-stone-500" />
                          <span>{formatPhoneDisplay(u.phone)}</span>
                        </span>

                        {u.birthday && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-stone-500" />
                            <span>Aniversário: {u.birthday}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Visual Progress Meter */}
                  <div className="flex-1 max-w-md w-full bg-[#0F0E0D] p-3 rounded-lg border border-stone-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/30"
                          style={{
                            background: cordaStyle.gradient || cordaStyle.bg,
                          }}
                        />
                        <span className="font-bold text-white">
                          {u.corda || 'Crua (Iniciante)'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#D4AF37] font-bold">
                        Nível {cordaIndex + 1}/13 ({progressPercent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(progressPercent, 7)}%`,
                          background: cordaStyle.gradient || cordaStyle.bg,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-stone-400 pt-0.5">
                      <span>Jornada Capoeira</span>
                      {nextCordaOption ? (
                        <span className="text-[#D4AF37] font-medium flex items-center space-x-1">
                          <span>Próxima: {nextCordaOption.name}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Mestre Alcançado!</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setInspectUserTarget(u)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2D2A26] hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center space-x-1 transition border border-stone-700"
                      title="Ver trilha de graduação completa do aluno"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Trilha</span>
                    </button>

                    {isAdminOrProf && nextCordaOption && (
                      <button
                        onClick={() => handleQuickPromoteOpen(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-amber-400 text-[#0F0E0D] font-bold text-xs flex items-center space-x-1 transition shadow"
                        title="Promover corda do aluno"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Promover</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenForm(u)}
                      className="p-1.5 rounded-lg bg-[#2D2A26] hover:bg-stone-700 text-stone-300 transition"
                      title="Editar aluno"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 transition"
                        title="Excluir aluno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-stone-400 italic text-sm">
                Nenhum aluno encontrado para os critérios de busca.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN COLUMNS BY CATEGORY */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const cordasInCat = CORDA_OPTIONS.filter((c) => c.category === cat).map((c) =>
              c.name.toLowerCase()
            );
            const studentsInCat = filteredUsers.filter(
              (u) => u.corda && cordasInCat.includes(u.corda.toLowerCase())
            );
            const catInfo = CATEGORY_COLORS[cat];

            return (
              <div
                key={cat}
                className="bg-[#1A1816] border border-stone-800 rounded-xl overflow-hidden flex flex-col"
              >
                <div
                  className="p-3 border-b flex items-center justify-between"
                  style={{
                    backgroundColor: '#2D2A26',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: catInfo.bg }}
                    />
                    <h4 className="font-serif italic font-bold text-white text-sm">
                      {cat}s
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#0F0E0D] px-2 py-0.5 rounded text-[#D4AF37]">
                    {studentsInCat.length}
                  </span>
                </div>

                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                  {studentsInCat.map((u) => {
                    const cordaStyle = getCordaStyle(u.corda || '');
                    return (
                      <div
                        key={u.id}
                        className="bg-[#0F0E0D] border border-stone-800 hover:border-[#D4AF37]/50 rounded-lg p-3 transition space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white font-serif italic">
                              {u.nickname || u.name}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {formatPhoneDisplay(u.phone)}
                            </p>
                          </div>
                          <span
                            className="text-[9px] px-2 py-0.5 rounded font-bold uppercase border"
                            style={{
                              backgroundColor: cordaStyle.bg,
                              color: cordaStyle.text,
                              borderColor: cordaStyle.border,
                            }}
                          >
                            {u.corda}
                          </span>
                        </div>

                        <div className="flex justify-end space-x-1 pt-1 border-t border-stone-800/60">
                          <button
                            onClick={() => setInspectUserTarget(u)}
                            className="p-1 rounded bg-[#2D2A26] text-[#D4AF37] hover:bg-stone-700 text-xs"
                            title="Ver trilha"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdminOrProf && (
                            <button
                              onClick={() => handleQuickPromoteOpen(u)}
                              className="p-1 rounded bg-[#D4AF37] text-black hover:bg-amber-400 text-xs"
                              title="Promover corda"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {studentsInCat.length === 0 && (
                    <div className="p-6 text-center text-xs text-stone-500 italic">
                      Nenhum aluno nesta categoria.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PROMOTION MODAL */}
      {promoteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#1A1816] border border-[#D4AF37]/40 rounded-xl p-6 text-stone-200 space-y-5 shadow-2xl">
            <button
              onClick={() => setPromoteUserTarget(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#2D2A26] border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif italic font-bold text-[#D4AF37]">
                Troca de Corda / Promoção
              </h3>
              <p className="text-xs text-stone-400">
                Avanço na graduação de Capoeira do aluno
              </p>
            </div>

            <div className="bg-[#0F0E0D] p-4 rounded-lg border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Aluno:</span>
                <span className="text-sm font-bold text-white">
                  {promoteUserTarget.nickname || promoteUserTarget.name}
                </span>
              </div>

              {/* Corda Transition Preview */}
              <div className="flex items-center justify-around py-3 bg-[#1A1816] rounded-lg border border-stone-800">
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase text-stone-400 font-bold block">
                    Atual
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded font-bold uppercase border inline-block"
                    style={getCordaStyle(promoteUserTarget.corda || '')}
                  >
                    {promoteUserTarget.corda || 'Crua'}
                  </span>
                </div>

                <ChevronRight className="w-6 h-6 text-[#D4AF37] animate-pulse" />

                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">
                    Nova Corda
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded font-bold uppercase border inline-block"
                    style={getCordaStyle(targetCorda)}
                  >
                    {targetCorda}
                  </span>
                </div>
              </div>

              {/* Select custom target corda if desired */}
              <div>
                <label className="block text-xs text-stone-400 mb-1">
                  Ou selecione outra graduação:
                </label>
                <select
                  value={targetCorda}
                  onChange={(e) => setTargetCorda(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded text-xs text-stone-200 font-bold"
                >
                  {CORDA_OPTIONS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPromoteUserTarget(null)}
                className="px-4 py-2 bg-[#2D2A26] text-stone-300 font-bold rounded text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={loading}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-[#0F0E0D] font-bold rounded text-xs uppercase tracking-wider shadow-md"
              >
                {loading ? 'Confirmando...' : 'Confirmar Nova Corda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT TRAIL INSPECTION MODAL */}
      {inspectUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#1A1816] border border-[#D4AF37]/40 rounded-xl p-6 text-stone-200 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectUserTarget(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 border-b border-stone-800 pb-4">
              <div
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-white text-xl shrink-0"
                style={{
                  backgroundColor: '#2D2A26',
                  borderColor: getCordaStyle(inspectUserTarget.corda || '').border,
                }}
              >
                {inspectUserTarget.nickname
                  ? inspectUserTarget.nickname[0].toUpperCase()
                  : inspectUserTarget.name[0].toUpperCase()}
              </div>

              <div>
                <h3 className="text-xl font-serif italic font-bold text-white">
                  {inspectUserTarget.nickname || inspectUserTarget.name}
                </h3>
                <p className="text-xs text-stone-400">
                  Nome real: {inspectUserTarget.name} • {formatPhoneDisplay(inspectUserTarget.phone)}
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border"
                    style={getCordaStyle(inspectUserTarget.corda || '')}
                  >
                    {inspectUserTarget.corda || 'Crua'}
                  </span>
                  <span className="text-[11px] text-[#D4AF37] font-mono">
                    {getCordaProgressPercent(inspectUserTarget.corda)}% da Trilha Completa
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Corda Progression Timeline */}
            <div>
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-3">
                Trilha de Graduações (Progresso do Aluno)
              </h4>

              <div className="space-y-2">
                {CORDA_OPTIONS.map((cOption, index) => {
                  const studentIndex = getCordaIndex(inspectUserTarget.corda);
                  const isCurrent = studentIndex === index;
                  const isPassed = studentIndex > index;
                  const cordaStyle = getCordaStyle(cOption.name);

                  return (
                    <div
                      key={cOption.name}
                      className={`p-3 rounded-lg border flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-[#2D2A26] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                          : isPassed
                          ? 'bg-[#0F0E0D] border-stone-800 opacity-90'
                          : 'bg-[#0F0E0D]/40 border-stone-800/50 opacity-40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-xs font-mono font-bold text-stone-400 border border-stone-800">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div
                          className="w-8 h-3 rounded border border-black/30"
                          style={{
                            background: cordaStyle.gradient || cOption.color,
                          }}
                        />

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-[#D4AF37]' : 'text-stone-200'
                            }`}
                          >
                            {cOption.name}
                          </p>
                          <p className="text-[9px] text-stone-500 uppercase">
                            Categoria: {cOption.category}
                          </p>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase bg-[#D4AF37] text-black px-2 py-0.5 rounded shadow">
                          Graduação Atual
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT STUDENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#1A1816] border border-[#D4AF37]/30 rounded-xl p-6 text-stone-200 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif italic font-bold text-[#D4AF37] mb-4">
              {editingUser ? 'Editar Dados do Aluno' : 'Cadastrar Novo Aluno'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Apelido
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Apelido no grupo"
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Telefone (login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="41984842941"
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Data de Aniversário
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Corda Selection */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Corda / Graduação *
                </label>
                <select
                  value={corda}
                  onChange={(e) => setCorda(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  {CORDA_OPTIONS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Nível de Acesso (Função)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="aluno">Aluno (Visualização e área do aluno)</option>
                  <option value="professor">Professor (Administração de conteúdos e alunos)</option>
                  <option value="admin">Administrador (Acesso Total)</option>
                </select>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Senha {editingUser ? '(Deixe em branco para manter atual)' : '*'}
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#2D2A26] text-stone-300 font-bold rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-amber-400 text-[#0F0E0D] font-bold rounded-lg text-xs uppercase tracking-wider shadow-md"
                >
                  {loading ? 'Salvar...' : 'Salvar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingUser}
        title="Excluir Aluno"
        message={`Tem certeza que deseja excluir o aluno "${deletingUser?.name}" (${deletingUser?.nickname || ''})? esta ação removerá a conta do sistema.`}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
};
