import { useQuery } from '@tanstack/react-query';
import { type DateRange } from '../services/dashboardService';
import api from '../services/api';

interface TimelineSession {
  sessionId: number;
  startTime: string;
  endTime: string;
  logoutReason: string;
  pauses: any[];
  totalDuration: number;
  activeDuration: number;
  idleDuration: number;
  activityPercentage: number;
}

interface TimelineResponse {
  content: TimelineSession[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}