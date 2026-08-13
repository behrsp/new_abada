import React, { useState, useEffect, useCallback } from 'react';
import { User, Song, Toque, CapoeiraEvent, StudentRequest, ChatMessage, Photo } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SongSection } from './components/SongSection';
import { ToqueSection } from './components/ToqueSection';
import { EventSection } from './components/EventSection';
import { PhotoSection } from './components/PhotoSection';
import { DashboardSection } from './components/DashboardSection';
import { StudentSection } from './components/StudentSection';
import { LoginModal } from './components/LoginModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('capoeira_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('musicas');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('capoeira_user');
      return !saved;
    } catch {
      return true;
    }
  });

  // App Data States
  const [songs, setSongs] = useState<Song[]>([]);
  const [toques, setToques] = useState<Toque[]>([]);
  const [events, setEvents] = useState<CapoeiraEvent[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch functions
  const fetchSongs = useCallback(async () => {
    try {
      const res = await fetch('/api/songs');
      if (res.ok) setSongs(await res.json());
    } catch (e) {
      console.error('Error fetching songs', e);
    }
  }, []);

  const fetchToques = useCallback(async () => {
    try {
      const res = await fetch('/api/toques');
      if (res.ok) setToques(await res.json());
    } catch (e) {
      console.error('Error fetching toques', e);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const url = currentUser?.id ? `/api/events?user_id=${currentUser.id}` : '/api/events';
      const res = await fetch(url);
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error('Error fetching events', e);
    }
  }, [currentUser]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) setPhotos(await res.json());
    } catch (e) {
      console.error('Error fetching photos', e);
    }
  }, []);

  const fetchUsersList = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsersList(await res.json());
    } catch (e) {
      console.error('Error fetching users', e);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const url = currentUser?.role === 'admin' || currentUser?.role === 'professor'
        ? '/api/requests'
        : currentUser?.id
        ? `/api/requests?user_id=${currentUser.id}`
        : '/api/requests';

      const res = await fetch(url);
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error('Error fetching requests', e);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error('Error fetching messages', e);
    }
  }, []);

  const fetchAllData = useCallback(() => {
    fetchSongs();
    fetchToques();
    fetchEvents();
    fetchPhotos();
    fetchUsersList();
    fetchRequests();
    fetchMessages();
  }, [fetchSongs, fetchToques, fetchEvents, fetchPhotos, fetchUsersList, fetchRequests, fetchMessages]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Periodic polling for real-time feel (every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
      fetchMessages();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchRequests, fetchMessages]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('capoeira_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('capoeira_user');
    setActiveTab('musicas');
    setIsLoginModalOpen(true);
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pendente').length;

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 font-sans flex flex-col selection:bg-amber-500 selection:text-stone-950">
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        pendingRequestsCount={pendingRequestsCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Active Tab View Rendering */}
        {activeTab === 'musicas' && (
          <SongSection
            songs={songs}
            currentUser={currentUser}
            onRefresh={fetchSongs}
          />
        )}

        {activeTab === 'toques' && (
          <ToqueSection
            toques={toques}
            currentUser={currentUser}
            onRefresh={fetchToques}
          />
        )}

        {activeTab === 'eventos' && (
          <EventSection
            events={events}
            currentUser={currentUser}
            onRefresh={fetchEvents}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'fotos' && (
          <PhotoSection
            photos={photos}
            currentUser={currentUser}
            onRefresh={fetchPhotos}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardSection
            users={usersList}
            currentUser={currentUser}
            onRefresh={fetchUsersList}
            onUpdateCurrentUser={handleLoginSuccess}
          />
        )}

        {activeTab === 'solicitacoes' && (
          <StudentSection
            currentUser={currentUser}
            requests={requests}
            messages={messages}
            onRefreshRequests={fetchRequests}
            onRefreshMessages={fetchMessages}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}
      </main>

      {/* Login & Register Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
