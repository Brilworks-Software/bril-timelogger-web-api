export interface ReportFilters {
  fromDate: string;
  toDate: string;
  format: string;
  projectId?: string;
  taskId?: string;
}

export interface ReportProps {
  filters: Partial<ReportFilters>;
  loading: boolean;
}

export interface InactivityLogEntry {
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  reason: string;
}

export interface UserActivityEntry {
  userName: string;
  date: string;
  activeTime: string;
  idleTime: string;
  totalTime: string;
  activityPercentage: number;
}

export interface ProductivityEntry {
  userName: string;
  score: number;
  activeHours: number;
  efficiency: number;
} 