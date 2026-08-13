import { CordaOption } from '../types';

export const CORDA_OPTIONS: CordaOption[] = [
  { name: 'Crua', color: '#e2e8f0', border: '#cbd5e1', textColor: '#334155', category: 'Iniciante', element: 'Transformação' },
  { name: 'Crua e Amarela', color: '#fef08a', border: '#eab308', textColor: '#854d0e', category: 'Aluno', element: 'Início da Jornada' },
  { name: 'Amarela', color: '#facc15', border: '#ca8a04', textColor: '#713f12', category: 'Aluno', element: 'Ouro (Valorização do Aprendizado)' },
  { name: 'Amarela e Laranja', color: '#fb923c', border: '#ea580c', textColor: '#7c2d12', category: 'Aluno', element: 'Transição' },
  { name: 'Laranja', color: '#f97316', border: '#c2410c', textColor: '#ffffff', category: 'Aluno', element: 'Sol (Despertar da Consciência)' },
  { name: 'Laranja e Azul', color: '#38bdf8', border: '#0284c7', textColor: '#0c4a6e', category: 'Aluno', element: 'Transição' },
  { name: 'Azul', color: '#2563eb', border: '#1d4ed8', textColor: '#ffffff', category: 'Graduado', element: 'Mar (Consciência da Imensidão)' },
  { name: 'Azul e Verde', color: '#10b981', border: '#047857', textColor: '#ffffff', category: 'Graduado', element: 'Transição' },
  { name: 'Verde', color: '#16a34a', border: '#15803d', textColor: '#ffffff', category: 'Graduado', element: 'Floresta (Solidificação do Aprendizado)' },
  { name: 'Verde e Roxa', color: '#a855f7', border: '#7e22ce', textColor: '#ffffff', category: 'Graduado', element: 'Transição' },
  { name: 'Roxa', color: '#9333ea', border: '#7e22ce', textColor: '#ffffff', category: 'Instrutor', element: 'Ametista (Continuidade e Reflexão)' },
  { name: 'Roxa e Marrom', color: '#7c2d12', border: '#451a03', textColor: '#ffffff', category: 'Instrutor', element: 'Transição' },
  { name: 'Marrom', color: '#78350f', border: '#451a03', textColor: '#ffffff', category: 'Professor', element: 'O Camaleão (Estilo & Liderança)' },
  { name: 'Marrom e Vermelha', color: '#991b1b', border: '#7f1d1d', textColor: '#ffffff', category: 'Professor', element: 'Transição' },
  { name: 'Vermelha', color: '#dc2626', border: '#b91c1c', textColor: '#ffffff', category: 'Mestrando', element: 'Rubi (A Justiça)' },
  { name: 'Vermelha e Branca', color: '#ef4444', border: '#cbd5e1', textColor: '#ffffff', category: 'Mestre', element: 'Transformação (Congregação dos Ideais)' },
  { name: 'Branca', color: '#ffffff', border: '#D4AF37', textColor: '#000000', category: 'Grão-Mestre', element: 'Diamante (O Alicerce da ABADÁ)' },
];

export function getCordaIndex(cordaName?: string): number {
  if (!cordaName) return 0;
  const index = CORDA_OPTIONS.findIndex(c => c.name.toLowerCase() === cordaName.toLowerCase() || cordaName.toLowerCase().includes(c.name.toLowerCase()));
  return index >= 0 ? index : 0;
}

export function getCordaProgressPercent(cordaName?: string): number {
  const index = getCordaIndex(cordaName);
  const total = CORDA_OPTIONS.length - 1;
  if (total <= 0) return 0;
  return Math.round((index / total) * 100);
}

export function getNextCorda(cordaName?: string): CordaOption | null {
  const currentIndex = getCordaIndex(cordaName);
  if (currentIndex < CORDA_OPTIONS.length - 1) {
    return CORDA_OPTIONS[currentIndex + 1];
  }
  return null; // Already at top (Grão-Mestre)
}

export function getCordaStyle(cordaName: string): { bg: string; text: string; border: string; gradient?: string } {
  if (!cordaName) return { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' };

  const matched = CORDA_OPTIONS.find(c => c.name.toLowerCase() === cordaName.toLowerCase() || cordaName.toLowerCase().includes(c.name.toLowerCase()));
  if (matched) {
    let gradient = undefined;
    const nameLower = matched.name.toLowerCase();

    // Dual color gradient patterns for ABADÁ cordas
    if (nameLower.includes('crua e amarela')) {
      gradient = 'linear-gradient(135deg, #e2e8f0 50%, #facc15 50%)';
    } else if (nameLower.includes('amarela e laranja')) {
      gradient = 'linear-gradient(135deg, #facc15 50%, #f97316 50%)';
    } else if (nameLower.includes('laranja e azul')) {
      gradient = 'linear-gradient(135deg, #f97316 50%, #2563eb 50%)';
    } else if (nameLower.includes('azul e verde')) {
      gradient = 'linear-gradient(135deg, #2563eb 50%, #16a34a 50%)';
    } else if (nameLower.includes('verde e roxa')) {
      gradient = 'linear-gradient(135deg, #16a34a 50%, #9333ea 50%)';
    } else if (nameLower.includes('roxa e marrom')) {
      gradient = 'linear-gradient(135deg, #9333ea 50%, #78350f 50%)';
    } else if (nameLower.includes('marrom e vermelha')) {
      gradient = 'linear-gradient(135deg, #78350f 50%, #dc2626 50%)';
    } else if (nameLower.includes('vermelha e branca')) {
      gradient = 'linear-gradient(135deg, #dc2626 50%, #ffffff 50%)';
    } else if (nameLower === 'branca') {
      gradient = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
    }

    return {
      bg: matched.color,
      text: matched.textColor,
      border: matched.border,
      gradient
    };
  }
  return { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' };
}
