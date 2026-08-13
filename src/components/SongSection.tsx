import React, { useState, useRef } from 'react';
import { Song, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Music,
  Plus,
  Search,
  Edit3,
  Trash2,
  Maximize2,
  X,
  Play,
  BookOpen,
  User as UserIcon,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

interface SongSectionProps {
  songs: Song[];
  currentUser: User | null;
  onRefresh: () => void;
}

function getEmbedYoutube(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}

export const SongSection: React.FC<SongSectionProps> = ({ songs, currentUser, onRefresh }) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');
  const [selectedFileName, setSelectedFileName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reader Mode settings
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (song?: Song) => {
    if (song) {
      setEditingSong(song);
      setTitle(song.title);
      setAuthor(song.author);
      setLyrics(song.lyrics);
      setVideoUrl(song.video_url || '');
      setUploadMode(song.video_url && song.video_url.startsWith('data:') ? 'device' : 'device');
      setSelectedFileName('');
    } else {
      setEditingSong(null);
      setTitle('');
      setAuthor('');
      setLyrics('');
      setVideoUrl('');
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

    setError('');
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoUrl(event.target?.result as string);
    };
    reader.onerror = () => {
      setError('Erro ao carregar o arquivo do dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lyrics.trim()) {
      setError('Nome da música e letra são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (editingSong) {
        const res = await fetch(`/api/songs/${editingSong.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            author: author || 'Desconhecido',
            lyrics,
            video_url: videoUrl,
          }),
        });

        if (!res.ok) throw new Error('Erro ao atualizar música.');
      } else {
        const res = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            author: author || 'Desconhecido',
            lyrics,
            video_url: videoUrl,
            created_by: currentUser?.id,
          }),
        });

        if (!res.ok) throw new Error('Erro ao cadastrar música.');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar música.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteSong = async () => {
    if (!deletingSong) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/songs/${deletingSong.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir música.');

      setDeletingSong(null);
      if (selectedSong?.id === deletingSong.id) {
        setSelectedSong(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1816] border border-stone-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2 text-[#D4AF37]">
            <Music className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif italic text-white tracking-wide">
              Músicas do Grupo
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            Acervo de ladainhas, corridos, quadras e chulas do grupo de capoeira.
          </p>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="z-10 px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg transition transform hover:scale-[1.02] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Música</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por título da música, autor ou palavras da letra..."
          className="w-full pl-11 pr-4 py-3 bg-[#1A1816] border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-[#D4AF37]"
        />
      </div>

      {/* Songs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="bg-[#1A1816] border border-stone-800 hover:border-[#D4AF37]/50 rounded-xl p-4 transition shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-serif italic line-clamp-1">
                    {song.title}
                  </h3>
                  <p className="text-xs text-stone-400 flex items-center space-x-1 mt-0.5">
                    <UserIcon className="w-3 h-3 text-[#D4AF37]" />
                    <span>Dono/Autor: {song.author}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedSong(song)}
                    className="p-1.5 text-stone-400 hover:text-[#D4AF37] transition rounded-lg hover:bg-stone-800"
                    title="Ver letra em modo de leitura"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {isAdminOrProf && (
                    <>
                      <button
                        onClick={() => handleOpenForm(song)}
                        className="p-1.5 text-stone-400 hover:text-amber-400 transition rounded-lg hover:bg-stone-800"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingSong(song)}
                        className="p-1.5 text-stone-400 hover:text-red-400 transition rounded-lg hover:bg-stone-800"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Lyrics Snippet */}
              <div className="bg-[#0F0E0D] p-3 rounded-lg border border-stone-800/60 font-serif text-xs text-stone-300 whitespace-pre-line line-clamp-4 leading-relaxed">
                {song.lyrics}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedSong(song)}
                className="text-[#D4AF37] font-bold hover:underline flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ler letra completa</span>
              </button>

              {song.video_url && (
                <button
                  onClick={() => setSelectedSong(song)}
                  className="p-1.5 rounded-lg bg-amber-500/10 text-[#D4AF37] border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center space-x-1 text-[11px] font-bold"
                >
                  <Play className="w-3 h-3 fill-[#D4AF37]" />
                  <span>Mídia</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSongs.length === 0 && (
        <div className="bg-[#1A1816] border border-stone-800 rounded-2xl p-12 text-center space-y-3">
          <Music className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-300 font-serif">
            Nenhuma música encontrada
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente pesquisar por outros termos ou nomes de autores.'
              : 'Nenhuma música foi cadastrada ainda.'}
          </p>
          {isAdminOrProf && !searchTerm && (
            <button
              onClick={() => handleOpenForm()}
              className="mt-2 px-4 py-2 bg-[#D4AF37] text-stone-950 font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeira Música</span>
            </button>
          )}
        </div>
      )}

      {/* FULLSCREEN LYRICS READER & PLAYER MODAL */}
      {selectedSong && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedSong(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#1A1816] border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-stone-200 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSong(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-900 text-stone-400 hover:text-stone-100 border border-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1 pr-8">
              <h2 className="text-2xl font-bold font-serif text-[#D4AF37] italic">
                {selectedSong.title}
              </h2>
              <p className="text-xs text-stone-400 flex items-center space-x-1">
                <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>Autor/Dono: {selectedSong.author}</span>
              </p>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center justify-between border-y border-stone-800 py-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Tamanho do Texto:
              </span>
              <div className="flex bg-[#0F0E0D] p-1 border border-stone-800 rounded-lg text-xs font-bold space-x-1">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-3 py-1 rounded transition ${
                    fontSize === 'normal'
                      ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-1 rounded transition ${
                    fontSize === 'large'
                      ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Grande
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-3 py-1 rounded transition ${
                    fontSize === 'xlarge'
                      ? 'bg-[#2D2A26] text-[#D4AF37] border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Extra
                </button>
              </div>
            </div>

            {/* Video / Media section if present */}
            {selectedSong.video_url && (
              <div className="space-y-2">
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-stone-800 shadow-inner flex items-center justify-center">
                  {getEmbedYoutube(selectedSong.video_url) ? (
                    <iframe
                      src={getEmbedYoutube(selectedSong.video_url)!}
                      title={selectedSong.title}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={selectedSong.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Lyrics Body */}
            <div className="bg-[#0F0E0D] rounded-2xl p-6 sm:p-8 border border-stone-800 shadow-inner">
              <pre
                className={`font-serif text-stone-100 whitespace-pre-wrap leading-relaxed tracking-wide ${
                  fontSize === 'normal'
                    ? 'text-base'
                    : fontSize === 'large'
                    ? 'text-lg sm:text-xl'
                    : 'text-xl sm:text-2xl font-semibold'
                }`}
              >
                {selectedSong.lyrics}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SONG FORM MODAL */}
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
              <Music className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-serif text-white italic">
                {editingSong ? 'Editar Música' : 'Cadastrar Nova Música'}
              </h3>
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSaveSong} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Paraná Ê / Apanha a Laranja no Chão Tico-Tico"
                  className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Quem é o dono / autor da música
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Mestre Bimba, Mestre Suassuna, Domínio Público..."
                  className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Letra da Música *
                </label>
                <textarea
                  required
                  rows={6}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Cole ou digite a letra completa da música aqui..."
                  className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] font-serif"
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
                  <span>Vídeo/Áudio do Dispositivo</span>
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
                        Vídeo ou áudio da música direto do celular ou computador (Opcional)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* URL LINK INPUT */}
              {uploadMode === 'url' && (
                <div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 bg-[#0F0E0D] border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
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
                  {loading ? 'Salvando...' : 'Salvar Música'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingSong}
        title="Excluir Música"
        message={`Tem certeza que deseja excluir a música "${deletingSong?.title}"?`}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteSong}
        onClose={() => setDeletingSong(null)}
      />
    </div>
  );
};
