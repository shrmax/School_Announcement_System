import { apiClient } from '../client.js';

export interface ScheduleTarget {
  type: 'classroom' | 'floor' | 'building' | 'school';
  id?: number | null;
}

export interface Schedule {
  id: number;
  name: string;
  audioFileId: number;
  daysOfWeek: string;
  startTime: string;
  endTime?: string | null;
  intervalMinutes?: number | null;
  enabled: boolean;
  createdAt: string;
}

export interface CreateScheduleData {
  name: string;
  audioFileId: number;
  daysOfWeek: string;
  startTime: string;
  endTime?: string | null;
  intervalMinutes?: number | null;
  enabled?: boolean;
  targets: ScheduleTarget[];
}

export const scheduleService = {
  getSchedules: () => apiClient.get<Schedule[]>('/schedules'),
  createSchedule: (data: CreateScheduleData) => apiClient.post<Schedule>('/schedules', data),
  deleteSchedule: (id: number) => apiClient.delete(`/schedules/${id}`),
  toggleSchedule: (id: number, enabled: boolean) => apiClient.patch(`/schedules/${id}/toggle`, { enabled }),
};
