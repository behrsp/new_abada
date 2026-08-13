import React, { useState } from 'react';
import { Photo, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Camera,
  Plus,
  Search,
  Trash2,
  Maximize2,
  X,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

interface PhotoSectionProps {
  photos: Photo[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenLogin: () => void;
}

const PHOTO_CATEGORIES = ['Rodas', 'Batizados', 'Treinos', 'Eventos', 'Geral'];

export const PhotoSection: React.FC<PhotoSectionProps> = ({
  photos,
  currentUser,
  onRefresh,
  onOpenLogin,
}) => {
  const isAdminOrProf = currentUser?.role === 'admin' || currentUser?.role === 'professor';

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Add Photo Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Geral');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Lightbox Modal
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  // Delete Modal
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!title.trim() || !imageUrl.trim()) {
      setAddError('O título e a URL da imagem são obrigatórios.');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl.trim(),
          category,
          created_by: currentUser.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao cadastrar foto.');
      }

      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setCategory('Geral');
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || 'Erro ao salvar a foto.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPhoto) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/photos/${deletingPhoto.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao excluir foto.');

      setDeletingPhoto(null);
      if (activePhoto?.id === deletingPhoto.id) {
        setActivePhoto(null);
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
            <Camera className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif italic text-white tracking-wide">
              Galeria de Fotos do Grupo
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            Registros fotográficos das nossas rodas, trocas de corda, treinos e eventos especiais do ABADÁ-CAPOEIRA.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              onOpenLogin();
            } else {
              setIsAddModalOpen(true);
            }
          }}
          className="z-10 px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg transition transform hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Foto</span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, descrição ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1816] border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              selectedCategory === ''
                ? 'bg-[#D4AF37] text-stone-950 font-bold shadow'
                : 'bg-[#1A1816] border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Todas
          </button>
          {PHOTO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-stone-950 font-bold shadow'
                  : 'bg-[#1A1816] border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => {
          const isOwnerOrAdmin =
            isAdminOrProf || (currentUser && photo.created_by === currentUser.id);

          return (
            <div
              key={photo.id}
              className="bg-[#1A1816] border border-stone-800/80 rounded-xl overflow-hidden shadow-xl hover:border-[#D4AF37]/40 transition group flex flex-col justify-between"
            >
              {/* Photo Image Card */}
              <div
                className="relative aspect-video bg-stone-950 overflow-hidden cursor-pointer"
                onClick={() => setActivePhoto(photo)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Category Badge */}
                <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm border border-stone-700 text-[#D4AF37] text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow">
                  {photo.category || 'Geral'}
                </span>

                {/* Lightbox Trigger Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-full bg-black/70 border border-[#D4AF37] text-[#D4AF37]">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Photo Body */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-serif italic line-clamp-1">
                    {photo.title}
                  </h3>
                  {photo.description && (
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-stone-600" />
                    <span>{new Date(photo.created_at).toLocaleDateString('pt-BR')}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActivePhoto(photo)}
                      className="p-1 text-stone-400 hover:text-[#D4AF37] transition"
                      title="Ver foto em tela cheia"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => setDeletingPhoto(photo)}
                        className="p-1 text-stone-500 hover:text-red-400 transition"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="bg-[#1A1816] border border-stone-800 rounded-2xl p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-300 font-serif">
            Nenhuma foto encontrada
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm || selectedCategory
              ? 'Tente ajustar sua busca ou filtro para encontrar a imagem desejada.'
              : 'Seja o primeiro a compartilhar fotos das rodas e treinos da capoeira!'}
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={() => {
                if (!currentUser) onOpenLogin();
                else setIsAddModalOpen(true);
              }}
              className="mt-2 px-4 py-2 bg-[#D4AF37] text-stone-950 font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeira Foto</span>
            </button>
          )}
        </div>
      )}

      {/* ADD PHOTO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#1A1816] border border-[#D4AF37]/40 rounded-2xl p-6 text-stone-200 space-y-5 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 rounded-full hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 border-b border-stone-800 pb-3">
              <Camera className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-serif text-white italic">
                Cadastrar Nova Foto
              </h3>
            </div>

            {addError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs font-medium">
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Título da Foto *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Roda Aberta do Batizado 2026"
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-[#D4AF37]"
                  >
                    {PHOTO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Link da Imagem (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Descrição ou Detalhes (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte um pouco sobre o momento registrado nesta imagem..."
                  className="w-full px-3 py-2 bg-[#0F0E0D] border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {addLoading ? 'Salvando...' : 'Salvar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN MODAL */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#1A1816] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/70 border border-stone-700 text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image display */}
            <div className="bg-black flex items-center justify-center min-h-[300px] max-h-[65vh] overflow-hidden">
              <img
                src={activePhoto.image_url}
                alt={activePhoto.title}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>

            {/* Info footer */}
            <div className="p-5 bg-[#1A1816] border-t border-stone-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase text-[#D4AF37] px-2.5 py-0.5 rounded bg-black/50 border border-stone-800">
                  {activePhoto.category}
                </span>
                <span className="text-xs text-stone-400 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>{new Date(activePhoto.created_at).toLocaleDateString('pt-BR')}</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-serif italic">
                {activePhoto.title}
              </h3>

              {activePhoto.description && (
                <p className="text-xs text-stone-300 leading-relaxed bg-[#0F0E0D] p-3 rounded-xl border border-stone-800/80">
                  {activePhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deletingPhoto}
        onClose={() => setDeletingPhoto(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Foto da Galeria"
        message={`Tem certeza que deseja excluir a foto "${deletingPhoto?.title}"? Esta ação não poderá ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        loading={deleteLoading}
      />
    </div>
  );
};
