import { apiClient } from '../client.js';

export interface Building {
  id: number;
  name: string;
  createdAt: string;
}

export interface Floor {
  id: number;
  buildingId: number;
  name: string;
  multicastAddress: string;
  createdAt: string;
}

export interface Classroom {
  id: number;
  floorId: number;
  name: string;
  ipAddress?: string;
  port: number;
  enabled: boolean;
  lastSeen?: string;
  createdAt: string;
}

export const hierarchyService = {
  getBuildings: () => apiClient.get<Building[]>('/buildings'),
  
  getFloors: (buildingId: number) => 
    apiClient.get<Floor[]>(`/buildings/${buildingId}/floors`),
  
  getClassrooms: (floorId: number) => 
    apiClient.get<Classroom[]>(`/floors/${floorId}/classrooms`),
    
  createBuilding: (name: string) => 
    apiClient.post<Building>('/buildings', { name }),
  updateBuilding: (id: number, name: string) => 
    apiClient.put<Building>(`/buildings/${id}`, { name }),
  deleteBuilding: (id: number) => 
    apiClient.delete(`/buildings/${id}`),

  createFloor: (buildingId: number, name: string, multicastAddress: string) => 
    apiClient.post<Floor>('/floors', { buildingId, name, multicastAddress }),
  updateFloor: (id: number, data: Partial<Omit<Floor, 'id' | 'createdAt'>>) => 
    apiClient.put<Floor>(`/floors/${id}`, data),
  deleteFloor: (id: number) => 
    apiClient.delete(`/floors/${id}`),

  createClassroom: (floorId: number, name: string, ipAddress?: string, port?: number) => 
    apiClient.post<Classroom>('/classrooms', { floorId, name, ipAddress, port }),
  updateClassroom: (id: number, data: Partial<Omit<Classroom, 'id' | 'createdAt'>>) => 
    apiClient.put<Classroom>(`/classrooms/${id}`, data),
  deleteClassroom: (id: number) => 
    apiClient.delete(`/classrooms/${id}`),
    
  toggleEnabled: (classroomId: number) => 
    apiClient.patch<Classroom>(`/classrooms/${classroomId}/toggle`),
};
