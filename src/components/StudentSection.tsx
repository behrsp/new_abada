import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RequestType, StudentRequest, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { MessageSquarePlus, Send, MessageCircle, AlertCircle, CheckCircle, Clock, Trash2, Shield, User as UserIcon, Plus, X, CornerDownRight } from 'lucide-react';

interface StudentSectionProps {
  currentUser: User | null;
  requests: StudentRequest[];
  messages: ChatMessage[];
  onRefreshRequests: () => void;
  onRefreshMessages: () => void;
  onOpenLogin: () => void;
}

export const StudentSection: React.FC<StudentSectionProps> = ({
  currentUser,
  requests,
  messages,
  onRefreshRequests,
  onRefreshMessages,
  onOpenLogin,
}) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  // Sub-tabs: 'solicitacoes' or 'chat'
  const [activeSubTab, setActiveSubTab] = useState<'solicitacoes' | 'chat'>('solicitacoes');

  // Request Form modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('toque');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [reqError, setReqError] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  // Admin response modal
  const [selectedReqForAdmin, setSelectedReqForAdmin] = useState<StudentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Chat message input
  const [chatText, setChatText] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSubTab]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!requestTitle.trim()) {
      setReqError('O título do pedido é obrigatório.');
      return;
    }

    setReqLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_nickname: currentUser.nickname,
          type: requestType,
          title: requestTitle,
          description: requestDesc,
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar solicitação.');

      setIsRequestModalOpen(false);
      setRequestTitle('');
      setRequestDesc('');
      onRefreshRequests();
    } catch (err: any) {
      setReqError(err.message || 'Erro ao enviar pedido.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleUpdateReqStatus = async (status: 'atendido' | 'recusado') => {
    if (!selectedReqForAdmin) return;

    try {
      const res = await fetch(`/api/requests/${selectedReqForAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar solicitação.');
      setSelectedReqForAdmin(null);
      setAdminNotes('');
      onRefreshRequests();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar.');
    }
  };

  // Delete request modal state
  const [deletingRequest, setDeletingRequest] = useState<StudentRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteRequest = (req: StudentRequest) => {
    setDeletingRequest(req);
  };

  const handleConfirmDeleteRequest = async () => {
    if (!deletingRequest) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/requests/${deletingRequest.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir solicitação.');
      setDeletingRequest(null);
      onRefreshRequests();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!chatText.trim()) return;

    setChatSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_nickname: currentUser.nickname || currentUser.name,
          sender_role: currentUser.role,
          text: chatText,
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem.');
      setChatText('');
      onRefreshMessages();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setChatSending(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pendente').length;

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquarePlus className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-400">
              Área do Aluno & Comunicação
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Faça pedidos de novos toques, músicas ou aulas e converse no chat interno.
          </p>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex bg-stone-950 p-1.5 rounded-xl border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('solicitacoes')}
            className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeSubTab === 'solicitacoes'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Solicitações</span>
            {pendingCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeSubTab === 'chat'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Interno</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SOLICITAÇÕES */}
      {activeSubTab === 'solicitacoes' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-stone-900 p-4 rounded-xl border border-stone-800">
            <div>
              <h3 className="text-base font-bold text-amber-300">
                {isAdminOrProf
                  ? 'Painel de Solicitações dos Alunos'
                  : 'Suas Solicitações e Pedidos'}
              </h3>
              <p className="text-xs text-stone-400">
                {isAdminOrProf
                  ? 'Atenda ou responda aos pedidos de toques, músicas ou aulas.'
                  : 'Peça um toque de berimbau, uma aula específica ou uma nova música.'}
              </p>
            </div>

            {!isAdminOrProf && (
              <button
                onClick={() => {
                  if (!currentUser) onOpenLogin();
                  else setIsRequestModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Solicitação</span>
              </button>
            )}
          </div>

          {/* Pending Alert banner for Admin */}
          {isAdminOrProf && pendingCount > 0 && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs font-semibold flex items-center justify-between animate-pulse">
              <span>⚠️ Você possui {pendingCount} nova(s) solicitação(ões) pendente(s) para atender!</span>
            </div>
          )}

          {/* Requests list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-stone-950 border border-stone-800 text-amber-400 rounded">
                        Pedido: {req.type.toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-amber-200 font-serif mt-1">
                        {req.title}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Por: <span className="text-stone-200 font-medium">{req.user_nickname || req.user_name}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {req.status === 'pendente' && (
                        <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendente</span>
                        </span>
                      )}
                      {req.status === 'atendido' && (
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Atendido</span>
                        </span>
                      )}
                      {req.status === 'recusado' && (
                        <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Recusado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {req.description && (
                    <p className="text-xs text-stone-300 mt-3 bg-stone-950/60 p-3 rounded-lg border border-stone-800/60">
                      "{req.description}"
                    </p>
                  )}

                  {req.admin_notes && (
                    <div className="mt-3 p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-200">
                      <span className="font-bold text-amber-400 block mb-0.5">
                        Resposta da Administração / Professor:
                      </span>
                      {req.admin_notes}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-stone-500">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  <div className="flex items-center space-x-2">
                    {isAdminOrProf && (
                      <button
                        onClick={() => {
                          setSelectedReqForAdmin(req);
                          setAdminNotes(req.admin_notes || '');
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg"
                      >
                        Atender / Responder
                      </button>
                    )}

                    {(isAdminOrProf || req.user_id === currentUser?.id) && (
                      <button
                        onClick={() => handleDeleteRequest(req)}
                        className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="col-span-full py-12 text-center text-stone-400 bg-stone-900/40 rounded-2xl border border-stone-800">
                <AlertCircle className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                <p className="font-semibold text-stone-300">Nenhuma solicitação encontrada.</p>
                <p className="text-xs text-stone-500 mt-1">
                  Os alunos podem enviar pedidos de toques de berimbau, aulas ou músicas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CHAT INTERNO */}
      {activeSubTab === 'chat' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-[600px]">
          <div className="pb-3 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-serif text-amber-300 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-amber-500" />
                <span>Chat Interno do Portal</span>
              </h3>
              <p className="text-xs text-stone-400">
                Comunicação em tempo real entre alunos, professores e mestres do grupo.
              </p>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUser?.id;
              const isAdminSender = msg.sender_role === 'admin' || msg.sender_role === 'professor';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md text-xs sm:text-sm ${
                      isMine
                        ? 'bg-amber-600 text-stone-950 font-medium rounded-br-none'
                        : isAdminSender
                        ? 'bg-stone-800 text-amber-100 border border-amber-600/40 rounded-bl-none'
                        : 'bg-stone-950 text-stone-200 border border-stone-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 font-bold text-[11px] opacity-90">
                      {isAdminSender && <Shield className="w-3 h-3 text-amber-400 inline" />}
                      <span>{msg.sender_nickname || msg.sender_name}</span>
                      <span className="text-[9px] opacity-75 font-normal ml-auto">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Send Message Input */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-stone-800 flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={
                currentUser
                  ? 'Digite sua mensagem para o mestre ou colegas...'
                  : 'Faça login para conversar no chat'
              }
              disabled={!currentUser}
              className="flex-1 px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />

            <button
              type="submit"
              disabled={!currentUser || chatSending || !chatText.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* NEW REQUEST FORM MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-4">
              Nova Solicitação ao Professor/Mestre
            </h3>

            {reqError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                {reqError}
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  O que você gostaria de solicitar? *
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 font-bold"
                >
                  <option value="toque">🪕 Toque de Instrumento (Berimbau/Pandeiro/etc)</option>
                  <option value="aula">🥋 Aula Específica / Técnica de Capoeira</option>
                  <option value="musica">🎵 Nova Música para a sessão de Músicas</option>
                  <option value="outro">💬 Outra Solicitação</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Título do Pedido *
                </label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="Ex: Tutorial do toque de Iúna ou Música X"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Detalhes da Solicitação
                </label>
                <textarea
                  rows={4}
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  placeholder="Explique melhor o que precisa para ajudarmos você..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 font-bold rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reqLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-sm shadow-md"
                >
                  {reqLoading ? 'Enviando...' : 'Enviar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ANSWER REQUEST MODAL */}
      {selectedReqForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50">
            <button
              onClick={() => setSelectedReqForAdmin(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-2">
              Atender Solicitação de Aluno
            </h3>
            <p className="text-xs text-stone-300 mb-4">
              Solicitante: <span className="font-bold text-amber-200">{selectedReqForAdmin.user_name}</span> ({selectedReqForAdmin.title})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Observações / Resposta ao Aluno
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Escreva uma resposta explicativa para o aluno..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateReqStatus('recusado')}
                  className="px-4 py-2 bg-red-950 text-red-200 border border-red-800 font-bold rounded-lg text-xs"
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReqStatus('atendido')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-lg text-xs shadow-md"
                >
                  Marcar como Atendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingRequest}
        title="Excluir Solicitação"
        message={`Tem certeza que deseja excluir a solicitação "${deletingRequest?.title}"?`}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteRequest}
        onClose={() => setDeletingRequest(null)}
      />
    </div>
  );
};
