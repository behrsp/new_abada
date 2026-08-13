import React, { useState } from 'react';
import { CapoeiraEvent, RSVPStatus, User } from '../types';
import { getCordaStyle } from '../data/graduations';
import { ConfirmModal } from './ConfirmModal';
import { Calendar, Plus, MapPin, CheckCircle2, HelpCircle, XCircle, Users, Edit3, Trash2, X, Clock } from 'lucide-react';

interface EventSectionProps {
  events: CapoeiraEvent[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenLogin: () => void;
}

export const EventSection: React.FC<EventSectionProps> = ({
  events,
  currentUser,
  onRefresh,
  onOpenLogin,
}) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  // Modal view for listing RSVP attendees
  const [selectedEventForRsvps, setSelectedEventForRsvps] = useState<CapoeiraEvent | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CapoeiraEvent | null>(null);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Modal State
  const [deletingEvent, setDeletingEvent] = useState<CapoeiraEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenForm = (ev?: CapoeiraEvent) => {
    if (ev) {
      setEditingEvent(ev);
      setTitle(ev.title);
      setEventDate(ev.event_date || '');
      setLocation(ev.location || '');
      setDescription(ev.description || '');
    } else {
      setEditingEvent(null);
      setTitle('');
      setEventDate('');
      setLocation('');
      setDescription('');
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      setError('Título e data do evento são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (editingEvent) {
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            event_date: eventDate,
            location,
            description,
          }),
        });
        if (!res.ok) throw new Error('Erro ao atualizar evento.');
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            event_date: eventDate,
            location,
            description,
            created_by: currentUser?.id,
          }),
        });
        if (!res.ok) throw new Error('Erro ao criar evento.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = (ev: CapoeiraEvent) => {
    setDeletingEvent(ev);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deletingEvent) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/events/${deletingEvent.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir evento.');
      setDeletingEvent(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRsvp = async (eventId: number, response: RSVPStatus) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          response,
        }),
      });

      if (!res.ok) throw new Error('Erro ao registrar presença.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar confirmação.');
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-400">
              Eventos do Grupo
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Rodas, batizados, oficinas e encontros. Confirme sua presença!
          </p>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Evento</span>
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-5">
        {events.map((ev) => {
          const myRsvp = ev.user_rsvp;
          const counts = ev.counts || { vou: 0, nao_sei: 0, nao_vou: 0 };

          return (
            <div
              key={ev.id}
              className="bg-stone-900 border border-stone-800 hover:border-amber-600/40 rounded-2xl p-5 sm:p-6 shadow-xl transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Event Main Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateDisplay(ev.event_date)}</span>
                    </span>

                    {ev.location && (
                      <span className="px-2.5 py-1 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{ev.location}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-amber-200 font-serif">
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p className="text-xs sm:text-sm text-stone-300/90 whitespace-pre-line bg-stone-950/50 p-3 rounded-xl border border-stone-800">
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Admin options */}
                {isAdminOrProf && (
                  <div className="flex items-center space-x-2 self-start">
                    <button
                      onClick={() => handleOpenForm(ev)}
                      className="p-2 rounded-lg bg-stone-800 text-amber-300 hover:bg-stone-700 transition"
                      title="Editar evento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev)}
                      className="p-2 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 transition"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* RSVP Action Buttons & Quantitativo Counters */}
              <div className="mt-5 pt-4 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Options: Vou, Não Sei, Não Vou */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-stone-400 font-bold hidden sm:inline mr-1">
                    Sua resposta:
                  </span>

                  <button
                    onClick={() => handleRsvp(ev.id, 'vou')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                      myRsvp === 'vou'
                        ? 'bg-emerald-600 text-stone-950 border-emerald-400 shadow'
                        : 'bg-stone-950 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vou</span>
                  </button>

                  <button
                    onClick={() => handleRsvp(ev.id, 'nao_sei')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                      myRsvp === 'nao_sei'
                        ? 'bg-amber-500 text-stone-950 border-amber-300 shadow'
                        : 'bg-stone-950 text-amber-400 border-amber-900/50 hover:bg-amber-950'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Não Sei</span>
                  </button>

                  <button
                    onClick={() => handleRsvp(ev.id, 'nao_vou')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                      myRsvp === 'nao_vou'
                        ? 'bg-red-600 text-white border-red-400 shadow'
                        : 'bg-stone-950 text-red-400 border-red-900/50 hover:bg-red-950'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Não Vou</span>
                  </button>
                </div>

                {/* Quantitativos Summary & View Attendees list */}
                <div className="flex items-center space-x-3 bg-stone-950 px-3 py-2 rounded-xl border border-stone-800 text-xs">
                  <div className="flex items-center space-x-2 text-stone-300">
                    <span className="text-emerald-400 font-bold">🟢 {counts.vou} confirmados</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">🟡 {counts.nao_sei} dúvidas</span>
                    <span>•</span>
                    <span className="text-red-400 font-bold">🔴 {counts.nao_vou} ausentes</span>
                  </div>

                  <button
                    onClick={() => setSelectedEventForRsvps(ev)}
                    className="ml-2 p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 transition flex items-center space-x-1"
                    title="Ver lista de alunos que responderam"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold hidden sm:inline">Ver Lista</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="py-12 text-center text-stone-400 bg-stone-900/40 rounded-2xl border border-stone-800">
            <Calendar className="w-12 h-12 text-stone-600 mx-auto mb-2" />
            <p className="font-semibold text-stone-300">Nenhum evento agendado no momento.</p>
            <p className="text-xs text-stone-500 mt-1">
              {isAdminOrProf
                ? 'Clique no botão acima para agendar uma nova roda ou encontro.'
                : 'Acompanhe em breve os novos eventos do grupo!'}
            </p>
          </div>
        )}
      </div>

      {/* ATTENDEES LIST MODAL */}
      {selectedEventForRsvps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedEventForRsvps(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-1 pr-6">
              Respostas do Evento
            </h3>
            <p className="text-xs text-stone-400 mb-4">{selectedEventForRsvps.title}</p>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {selectedEventForRsvps.rsvps && selectedEventForRsvps.rsvps.length > 0 ? (
                selectedEventForRsvps.rsvps.map((rsvp) => {
                  const cordaStyle = rsvp.user_corda ? getCordaStyle(rsvp.user_corda) : null;
                  return (
                    <div
                      key={rsvp.id}
                      className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-stone-100">
                          {rsvp.user_nickname || rsvp.user_name}
                        </div>
                        <div className="text-xs text-stone-400">{rsvp.user_name}</div>
                        {cordaStyle && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border mt-1 inline-block"
                            style={{
                              backgroundColor: cordaStyle.bg,
                              color: cordaStyle.text,
                              borderColor: cordaStyle.border,
                            }}
                          >
                            {rsvp.user_corda}
                          </span>
                        )}
                      </div>

                      <div>
                        {rsvp.response === 'vou' && (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Vou</span>
                          </span>
                        )}
                        {rsvp.response === 'nao_sei' && (
                          <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Não Sei</span>
                          </span>
                        )}
                        {rsvp.response === 'nao_vou' && (
                          <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded-lg text-xs font-bold flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Não Vou</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-stone-500 italic py-6 text-center">
                  Nenhum aluno respondeu a este evento ainda.
                </p>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-stone-800 text-right">
              <button
                onClick={() => setSelectedEventForRsvps(null)}
                className="px-4 py-2 bg-stone-800 text-stone-200 font-bold rounded-lg text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-4">
              {editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Roda de Capoeira do Mestre"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Data e Horário *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Local do Evento
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Academia Central / Praça Principal"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Descrição e Orientações aos Alunos
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informe vestimenta necessária, convidados ou instruções do evento..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 font-bold rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-sm shadow-md"
                >
                  {loading ? 'Salvar...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEvent}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${deletingEvent?.title}"?`}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
};
