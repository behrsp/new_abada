import React, { useState } from 'react';
import { InstrumentType, Toque, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Radio, Plus, Edit3, Trash2, Download, Play, Video, ExternalLink, X, Film } from 'lucide-react';

interface ToqueSectionProps {
  toques: Toque[];
  currentUser: User | null;
  onRefresh: () => void;
}

const INSTRUMENT_TABS: { id: InstrumentType; label: string; icon: string }[] = [
  { id: 'berimbau', label: 'Berimbau', icon: '🪕' },
  { id: 'pandeiro', label: 'Pandeiro', icon: '🪘' },
  { id: 'atabaque', label: 'Atabaque', icon: '🥁' },
  { id: 'agogo', label: 'Agogô', icon: '🔔' },
  { id: 'cuia', label: 'Cuia', icon: '🥣' },
];

export const ToqueSection: React.FC<ToqueSectionProps> = ({ toques, currentUser, onRefresh }) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  const [activeInstrument, setActiveInstrument] = useState<InstrumentType>('berimbau');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToque, setEditingToque] = useState<Toque | null>(null);

  const [instrument, setInstrument] = useState<InstrumentType>('berimbau');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Modal State
  const [deletingToque, setDeletingToque] = useState<Toque | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Active Video Modal
  const [activeVideoToque, setActiveVideoToque] = useState<Toque | null>(null);

  const filteredToques = toques.filter((t) => t.instrument === activeInstrument);

  const handleOpenForm = (toque?: Toque) => {
    if (toque) {
      setEditingToque(toque);
      setInstrument(toque.instrument);
      setTitle(toque.title);
      setDescription(toque.description || '');
      setVideoUrl(toque.video_url || '');
      setAudioUrl(toque.audio_url || '');
    } else {
      setEditingToque(null);
      setInstrument(activeInstrument);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setAudioUrl('');
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveToque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título do toque é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      if (editingToque) {
        const res = await fetch(`/api/toques/${editingToque.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instrument,
            title,
            description,
            video_url: videoUrl,
            audio_url: audioUrl,
          }),
        });

        if (!res.ok) throw new Error('Erro ao atualizar toque.');
      } else {
        const res = await fetch('/api/toques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instrument,
            title,
            description,
            video_url: videoUrl,
            audio_url: audioUrl,
            created_by: currentUser?.id,
          }),
        });

        if (!res.ok) throw new Error('Erro ao cadastrar toque.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar toque.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToque = (toque: Toque) => {
    setDeletingToque(toque);
  };

  const handleConfirmDeleteToque = async () => {
    if (!deletingToque) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/toques/${deletingToque.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir toque.');
      setDeletingToque(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getEmbedYoutube = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-400">
              Toques de Instrumentos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Vídeos curtos e áudios instrutivos para praticar e baixar no seu dispositivo.
          </p>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Postar Novo Toque</span>
          </button>
        )}
      </div>

      {/* Instrument Category Selector Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
        {INSTRUMENT_TABS.map((tab) => {
          const isActive = activeInstrument === tab.id;
          const count = toques.filter((t) => t.instrument === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveInstrument(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition shadow-md ${
                isActive
                  ? 'bg-amber-500 text-stone-950 scale-105'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-stone-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toques Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredToques.map((toque) => (
          <div
            key={toque.id}
            className="bg-stone-900 border border-stone-800 hover:border-amber-600/40 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-950 border border-amber-800/60 text-amber-300 rounded">
                    {toque.instrument}
                  </span>
                  <h3 className="text-lg font-bold text-amber-200 font-serif mt-1">
                    {toque.title}
                  </h3>
                </div>

                {isAdminOrProf && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenForm(toque)}
                      className="p-1.5 rounded bg-stone-800 text-amber-300 hover:bg-stone-700 transition"
                      title="Editar toque"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteToque(toque)}
                      className="p-1.5 rounded bg-red-950/60 text-red-300 hover:bg-red-900 transition"
                      title="Excluir toque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {toque.description && (
                <p className="text-xs text-stone-300 mt-2 bg-stone-950/40 p-3 rounded-lg border border-stone-800/50">
                  {toque.description}
                </p>
              )}
            </div>

            {/* Media Player / Action Buttons */}
            <div className="mt-4 pt-3 border-t border-stone-800 space-y-2">
              {toque.video_url ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveVideoToque(toque)}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Assistir Vídeo Curto</span>
                  </button>

                  <a
                    href={toque.video_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl transition"
                    title="Baixar ou abrir mídia no seu dispositivo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic text-center py-2">
                  Nenhum vídeo ou áudio anexado.
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredToques.length === 0 && (
          <div className="col-span-full py-12 text-center text-stone-400 bg-stone-900/40 rounded-2xl border border-stone-800">
            <Radio className="w-12 h-12 text-stone-600 mx-auto mb-2" />
            <p className="font-semibold text-stone-300">
              Nenhum toque cadastrado para {activeInstrument.toUpperCase()}.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {isAdminOrProf
                ? 'Clique no botão acima para postar o primeiro vídeo de instrução!'
                : 'Aguarde o professor/administrador publicar este conteúdo.'}
            </p>
          </div>
        )}
      </div>

      {/* WATCH VIDEO MODAL */}
      {activeVideoToque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl p-6 text-amber-50">
            <button
              onClick={() => setActiveVideoToque(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 bg-stone-800 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-2 pr-8">
              {activeVideoToque.title} ({activeVideoToque.instrument})
            </h3>
            {activeVideoToque.description && (
              <p className="text-xs text-stone-300 mb-4">{activeVideoToque.description}</p>
            )}

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-stone-800 shadow-inner">
              {getEmbedYoutube(activeVideoToque.video_url) ? (
                <iframe
                  src={getEmbedYoutube(activeVideoToque.video_url)!}
                  title={activeVideoToque.title}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  src={activeVideoToque.video_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Seu navegador não suporta a exibição de vídeos.
                </video>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-stone-400">Assista ou baixe para treinar offline</span>
              <a
                href={activeVideoToque.video_url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Baixar no Dispositivo</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TOQUE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-4">
              {editingToque ? 'Editar Toque de Instrumento' : 'Postar Novo Toque'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveToque} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Instrumento *
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                >
                  <option value="berimbau">🪕 Berimbau</option>
                  <option value="pandeiro">🪘 Pandeiro</option>
                  <option value="atabaque">🥁 Atabaque</option>
                  <option value="agogo">🔔 Agogô</option>
                  <option value="cuia">🥣 Cuia / Cabaça</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Título do Toque / Aula *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Toque de Angola com Variações"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Descrição e Orientações para o Aluno
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique os detalhes do toque, afinação ou cadência do ritmo..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Link do Vídeo Curto (YouTube, MP4 URL, Google Drive, etc.)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou link direto .mp4"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
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
                  {loading ? 'Postando...' : 'Postar Toque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingToque}
        title="Excluir Toque"
        message={`Tem certeza que deseja excluir o toque "${deletingToque?.title}"?`}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteToque}
        onClose={() => setDeletingToque(null)}
      />
    </div>
  );
};
