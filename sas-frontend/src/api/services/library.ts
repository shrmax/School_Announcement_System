import { apiClient } from '../client.js';

export interface AudioFile {
  id: number;
  name: string;
  description: string | null;
  filename: string;
  durationSec: number | null;
  sizeBytes: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  createdAt: string;
}

export const libraryService = {
  getFiles: () => apiClient.get<AudioFile[]>('/library'),
  
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<AudioFile>('/library/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteFile: (id: number) => apiClient.delete(`/library/${id}`),
};
