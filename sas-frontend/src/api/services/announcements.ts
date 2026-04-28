import { apiClient } from '../client.js';

export type TargetType = 'classroom' | 'floor' | 'building' | 'school';
export type AnnouncementType = 'live' | 'prerecorded' | 'emergency' | 'bell';

export interface AnnouncementTarget {
  type: TargetType;
  id?: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  type: AnnouncementType;
  priority: number;
  audioFileId: number;
  targets: AnnouncementTarget[];
  scheduledAt?: string;
}

export interface Announcement {
  id: number;
  title: string;
  type: AnnouncementType;
  status: string;
  priority: number;
  createdAt: string;
}

export const announcementService = {
  create: (data: CreateAnnouncementRequest) => 
    apiClient.post<Announcement>('/announcements', data),
    
  getStatus: (id: number) => 
    apiClient.get<Announcement>(`/announcements/${id}`),
};
