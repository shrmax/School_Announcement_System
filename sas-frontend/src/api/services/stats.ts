import { apiClient } from '../client.js';

export interface SystemStats {
  buildings: number;
  floors: number;
  classrooms: {
    total: number;
    online: number;
    enabled: number;
  };
  audioFiles: number;
  recentAnnouncements: {
    id: number;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }[];
}

export const statsService = {
  getSystemStats: () => apiClient.get<SystemStats>('/stats'),
};
