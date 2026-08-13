import React, { useState } from 'react';
import { User } from '../types';
import { cleanPhone, formatPhoneDisplay } from '../utils/phone';
import { AbadaLogo } from './AbadaLogo';
import { X, Phone, Lock, User as UserIcon, Calendar, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parseJsonResponse = async (res: Response) => {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro na requisição.');
        }
        return data;
      }
      const text = await res.text();
      throw new Error(`Erro na resposta do servidor (${res.status}): ${text.substring(0, 100)}`);
    };

    const cleanedP = cleanPhone(phone);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('O nome é obrigatório.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nickname: nickname || name,
            phone: cleanedP,
            birthday,
            password,
          }),
        });

        const data = await parseJsonResponse(res);
        onLoginSuccess(data.user);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanedP,
            password,
          }),
        });

        const data = await parseJsonResponse(res);
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl shadow-2xl p-6 text-amber-50">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <AbadaLogo size="lg" className="mx-auto mb-2" />
          <h2 className="text-xl font-bold font-serif text-amber-400">
            {isRegister ? 'Cadastro de Aluno' : 'Projeto Família na Capoeira'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {isRegister
              ? 'Preencha seus dados para solicitar acesso'
              : 'Entre com seu telefone e senha cadastrada'}
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Apelido na Capoeira
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ex: Moleque, Ginga, Mestre"
                    className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Data de Aniversário
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-amber-200 mb-1">
              Número do Telefone *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Espaços e traços são removidos automaticamente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-200 mb-1">
              Senha (mínimo 6 caracteres) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 font-bold text-stone-950 text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Aguarde...</span>
            ) : isRegister ? (
              <span>Concluir Cadastro</span>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-5 text-center text-xs text-stone-400">
          {isRegister ? (
            <p>
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Faça login
              </button>
            </p>
          ) : (
            <p>
              Ainda não tem cadastro?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Cadastre-se aqui
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
