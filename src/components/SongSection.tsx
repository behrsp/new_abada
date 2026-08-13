import React, { useState } from 'react';
import { Song, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Music, Plus, Search, Edit3, Trash2, ExternalLink, Maximize2, X, Play, BookOpen, User as UserIcon } from 'lucide-react';

interface SongSectionProps {
  songs: Song[];
  currentUser: User | null;
  onRefresh: () => void;
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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    } else {
      setEditingSong(null);
      setTitle('');
      setAuthor('');
      setLyrics('');
      setVideoUrl('');
    }
    setError('');
    setIsModalOpen(true);
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
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = (song: Song) => {
    setDeletingSong(song);
  };

  const handleConfirmDeleteSong = async () => {
    if (!deletingSong) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/songs/${deletingSong.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir música.');
      if (selectedSong?.id === deletingSong.id) setSelectedSong(null);
      setDeletingSong(null);
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
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Music className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-400">
              Músicas do Grupo
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Acervo de ladainhas, corridos, quadras e chulas do grupo de capoeira.
          </p>
        </div>

        {isAdminOrProf && (
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Cadastrar Música</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por título da música, autor ou palavras da letra..."
          className="w-full pl-11 pr-4 py-3 bg-stone-900/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 shadow-inner"
        />
      </div>

      {/* Song Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="group relative bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-600/50 rounded-2xl p-5 transition shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-amber-300 font-serif line-clamp-1">
                    {song.title}
                  </h3>
                  <p className="text-xs text-amber-200/70 font-medium flex items-center space-x-1 mt-0.5">
                    <UserIcon className="w-3 h-3 text-amber-500 inline" />
                    <span>Dono/Autor: {song.author || 'Domínio Público'}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSong(song)}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-amber-500 text-stone-300 hover:text-stone-950 transition"
                  title="Expandir para leitura completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lyrics Preview */}
              <div
                onClick={() => setSelectedSong(song)}
                className="mt-3 text-xs text-stone-300/90 font-sans whitespace-pre-line line-clamp-4 bg-stone-950/50 p-3 rounded-lg border border-stone-800/80 cursor-pointer hover:border-amber-800/50 transition"
              >
                {song.lyrics}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedSong(song)}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ler letra completa</span>
              </button>

              <div className="flex items-center space-x-2">
                {song.video_url && (
                  <a
                    href={song.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-amber-950/50 hover:bg-amber-900 text-amber-300 border border-amber-800/50 transition"
                    title="Ver vídeo/origem"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </a>
                )}

                {isAdminOrProf && (
                  <>
                    <button
                      onClick={() => handleOpenForm(song)}
                      className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 transition"
                      title="Editar música"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song)}
                      className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300 transition"
                      title="Excluir música"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredSongs.length === 0 && (
          <div className="col-span-full py-12 text-center text-stone-400 bg-stone-900/40 rounded-2xl border border-stone-800">
            <Music className="w-12 h-12 text-stone-600 mx-auto mb-2" />
            <p className="font-semibold text-stone-300">Nenhuma música encontrada.</p>
            <p className="text-xs text-stone-500 mt-1">
              {searchTerm ? 'Tente buscar com outros termos.' : 'Ainda não foram cadastradas músicas.'}
            </p>
          </div>
        )}
      </div>

      {/* FULLSCREEN / EXPANDED SONG READER MODAL */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-amber-50 my-auto">
            
            {/* Header controls */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase text-amber-500 tracking-widest">
                  Letra de Capoeira
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-400 mt-0.5">
                  {selectedSong.title}
                </h2>
                <p className="text-sm text-stone-300 font-medium mt-1">
                  Dono/Autor: <span className="text-amber-200">{selectedSong.author}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Font Size controls */}
                <div className="flex items-center bg-stone-950 rounded-lg p-1 border border-stone-800 text-xs">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-1 rounded font-bold ${
                      fontSize === 'normal' ? 'bg-amber-600 text-stone-950' : 'text-stone-400'
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-1 rounded font-bold text-sm ${
                      fontSize === 'large' ? 'bg-amber-600 text-stone-950' : 'text-stone-400'
                    }`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('xlarge')}
                    className={`px-2 py-1 rounded font-bold text-base ${
                      fontSize === 'xlarge' ? 'bg-amber-600 text-stone-950' : 'text-stone-400'
                    }`}
                  >
                    A++
                  </button>
                </div>

                <button
                  onClick={() => setSelectedSong(null)}
                  className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-200 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Video Player if Youtube or Link */}
            {selectedSong.video_url && (
              <div className="mb-6">
                {getEmbedYoutube(selectedSong.video_url) ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-stone-800 bg-stone-950">
                    <iframe
                      src={getEmbedYoutube(selectedSong.video_url)!}
                      title={selectedSong.title}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-200">Link do vídeo / origem cadastrado</span>
                    <a
                      href={selectedSong.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Vídeo Externo</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Lyrics Reader Body */}
            <div className="bg-stone-950/80 rounded-2xl p-6 sm:p-8 border border-stone-800 shadow-inner">
              <pre
                className={`font-serif text-amber-100 whitespace-pre-wrap leading-relaxed tracking-wide ${
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

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSong(null)}
                className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-sm"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SONG FORM MODAL (ADMIN / PROFESSOR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-stone-900 border border-amber-900/50 rounded-2xl p-6 text-amber-50">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-amber-400 mb-4">
              {editingSong ? 'Editar Música' : 'Cadastrar Nova Música'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSong} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Paraná Ê / Apanha a Laranja no Chão Tico-Tico"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Quem é o dono / autor da música
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Mestre Bimba, Mestre Suassuna, Domínio Público..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Letra da Música (Caixa texto grande) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Cole ou digite a letra completa da música aqui..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 font-mono"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-200 mb-1">
                  Link do Vídeo ou Origem (YouTube, Vimeo, etc.)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
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
                  {loading ? 'Salvar...' : 'Salvar Música'}
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
