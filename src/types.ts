export type UserRole = 'admin' | 'professor' | 'aluno';

export interface User {
  id: number;
  name: string;
  nickname: string;
  phone: string;
  birthday: string;
  role: UserRole;
  corda: string;
  created_at?: string;
}

export interface Song {
  id: number;
  title: string;
  author: string;
  lyrics: string;
  video_url: string;
  created_at: string;
  created_by?: number;
}

export type InstrumentType = 'berimbau' | 'pandeiro' | 'atabaque' | 'agogo' | 'cuia';

export interface Toque {
  id: number;
  instrument: InstrumentType;
  title: string;
  description: string;
  video_url: string;
  audio_url?: string;
  created_at: string;
  created_by?: number;
}

export type RSVPStatus = 'vou' | 'nao_sei' | 'nao_vou';

export interface EventRSVP {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  user_nickname?: string;
  user_corda?: string;
  response: RSVPStatus;
  updated_at: string;
}

export interface CapoeiraEvent {
  id: number;
  title: string;
  event_date: string;
  location: string;
  description: string;
  created_at: string;
  created_by?: number;
  rsvps?: EventRSVP[];
  counts?: {
    vou: number;
    nao_sei: number;
    nao_vou: number;
  };
  user_rsvp?: RSVPStatus;
}

export type RequestType = 'toque' | 'aula' | 'musica' | 'outro';
export type RequestStatus = 'pendente' | 'atendido' | 'recusado';

export interface StudentRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_nickname?: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  admin_notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_nickname?: string;
  sender_role: UserRole;
  receiver_id?: number | null;
  text: string;
  created_at: string;
}

export interface CordaOption {
  name: string;
  color: string;
  border: string;
  textColor: string;
  category: 'Iniciante' | 'Aluno' | 'Graduado' | 'Instrutor' | 'Professor' | 'Mestrando' | 'Mestre' | 'Grão-Mestre';
  element?: string;
}
