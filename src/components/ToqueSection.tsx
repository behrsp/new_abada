import React, { useState, useRef } from 'react';
import { InstrumentType, Toque, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Radio,
  Plus,
  Edit3,
  Trash2,
  Download,
  Play,
  Video,
  X,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

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

function getEmbedYoutube(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}

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
  
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');
  const [selectedFileName, setSelectedFileName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadMode(toque.video_url && toque.video_url.startsWith('data:') ? 'device' : 'device');
      setSelectedFileName('');
    } else {
      setEditingToque(null);
      setInstrument(activeInstrument);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setAudioUrl('');
      setUploadMode('device');
      setSelectedFileName('');
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      setError('Por favor, selecione um arquivo de vídeo ou áudio válido (MP4, WEBM, MOV, MP3...).');
      return;
    }

    // Read file as Data URL
    setError('');
    setSelectedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoUrl(event.target?.result as string);
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    };
    reader.onerror = () => {
      setError('Erro ao carregar o arquivo do dispositivo.');
    };
    reader.readAsDataURL(file);
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

  const handleConfirmDeleteToque = async () => {
    if (!deletingToque) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/toques/${deletingToque.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir toque.');

      setDeletingToque(null);
      if (activeVideoToque?.id === deletingToque.id) {
        setActiveVideoToque(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeTabInfo = INSTRUMENT_TABS.find((t) => t.id === activeInstrument)!;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1816] border border-stone-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2 text-[#D4AF37]">
            <Radio className="w-6 h-6 animate-pulse" />
            <h2 className="text-xl font-bold font-serif italic text-white tracking-wide">
              Toques de Instrumentos
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            Vídeos curtos e áudios instrutivos para praticar e baixar no seu dispositivo.
          </p>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="z-10 px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg transition transform hover:scale-[1.02] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Postar Novo Toque</span>
          </button>
        )}
      </div>

      {/* Instrument Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {INSTRUMENT_TABS.map((tab) => {
          const count = toques.filter((t) => t.instrument === tab.id).length;
          const isActive = activeInstrument === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveInstrument(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shrink-0 ${
                isActive
                  ? 'bg-[#D4AF37] text-stone-950 shadow-lg scale-105'
                  : 'bg-[#1A1816] border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-stone-950 text-[#D4AF37]' : 'bg-stone-800 text-stone-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toques Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredToques.map((toque) => (
          <div
            key={toque.id}
            className="bg-[#1A1816] border border-stone-800 hover:border-[#D4AF37]/50 rounded-xl p-4 transition shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50">
                    {activeTabInfo.label}
                  </span>
                  <h3 className="text-base font-bold text-white font-serif italic mt-1">
                    {toque.title}
                  </h3>
                </div>

                {isAdminOrProf && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenForm(toque)}
                      className="p-1 text-stone-400 hover:text-amber-400 transition"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingToque(toque)}
                      className="p-1 text-stone-400 hover:text-red-400 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {toque.description && (
                <p className="text-xs text-stone-400 line-clamp-3 bg-[#0F0E0D] p-2.5 rounded-lg border border-stone-800/60">
                  {toque.description}
                </p>
              )}
            </div>

            {/* Actions: Watch / Listen */}
            <div className="pt-2 flex items-center space-x-2">
              {toque.video_url ? (
                <button
                  onClick={() => setActiveVideoToque(toque)}
                  className="flex-1 py-2 bg-[#D4AF37] hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow transition"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>Assistir Vídeo / Toque</span>
                </button>
              ) : (
                <div className="flex-1 text-center py-2 text-xs text-stone-500 italic bg-[#0F0E0D] rounded-lg border border-stone-800">
                  Sem vídeo cadastrado
                </div>
              )}

              {toque.video_url && (
                <a
                  href={toque.video_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs border border-stone-700 transition"
                  title="Baixar mídia"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredToques.length === 0 && (
        <div className="bg-[#1A1816] border border-stone-800 rounded-2xl p-12 text-center space-y-3">
          <Radio className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-300 font-serif">
            Nenhum toque cadastrado para {activeTabInfo.label}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Ainda não foram postados vídeos ou áudios para este instrumento.
          </p>
          {isAdminOrProf && (
            <button
              onClick={() => handleOpenForm()}
              className="mt-2 px-4 py-2 bg-[#D4AF37] text-stone-950 font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Postar Primeiro Toque</span>
            </button>
          )}
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {activeVideoToque && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveVideoToque(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#1A1816] border border-stone-800 rounded-2xl p-5 shadow-2xl text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoToque(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-serif text-[#D4AF37] italic mb-2">
              {activeVideoToque.title}
            </h3>
            {activeVideoToque.description && (
              <p className="text-xs text-stone-300 mb-4">{activeVideoToque.description}</p>
            )}

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-stone-800 shadow-inner flex items-center justify-center">
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
                className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#1A1816] border border-[#D4AF37]/40 rounded-2xl p-6 text-stone-200 space-y-5 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 rounded-full hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-stone-800 pb-3">
              <Radio className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-serif text-white italic">
                {editingToque ? `Editar Toque — ${activeTabInfo.label}` : `Novo Toque — ${activeTabInfo.label}`}
              </h3>
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSaveToque} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  NOME DO TOQUE *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: São Bento Grande"
                  className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  HISTÓRICO / ORIENTAÇÕES (OPCIONAL)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contexto histórico ou descrição..."
                  className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                ></textarea>
              </div>

              {/* Upload mode selector tabs */}
              <div className="flex bg-[#0F0E0D] p-1 border border-stone-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUploadMode('device')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    uploadMode === 'device'
                      ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700 shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Vídeo do Dispositivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    uploadMode === 'url'
                      ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700 shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Link de Vídeo (URL)</span>
                </button>
              </div>

              {/* DEVICE FILE DROPZONE */}
              {uploadMode === 'device' && (
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    VÍDEO OU ÁUDIO DO DISPOSITIVO (MP4, WEBM, MOV...)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {videoUrl && videoUrl.startsWith('data:') ? (
                    <div className="relative rounded-xl border border-[#D4AF37]/50 overflow-hidden bg-black/80 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{selectedFileName || 'Arquivo selecionado'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoUrl('');
                            setSelectedFileName('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>

                      {/* Live preview */}
                      <video src={videoUrl} controls className="w-full max-h-[160px] rounded-lg bg-black" />
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#D4AF37]/80 hover:border-[#D4AF37] bg-[#0F0E0D] hover:bg-[#2D2A26]/40 p-6 rounded-xl text-center cursor-pointer transition space-y-2 group"
                    >
                      <Upload className="w-8 h-8 text-[#D4AF37] mx-auto group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-[#D4AF37]">
                        Arraste ou clique para selecionar
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Selecione um vídeo da sua galeria no celular ou arquivo no computador
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* URL LINK INPUT */}
              {uploadMode === 'url' && (
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Link do Vídeo (YouTube ou URL Direta .mp4)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
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
