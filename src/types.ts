export type Subject = string;

export interface ScheduleItem {
  id: string;
  day: number; // 0 (Mon) to 6 (Sun)
  period: number; // 1 to 5
  session: 'morning' | 'afternoon';
  subject: Subject;
}

export type HomeworkStatus = 'pending' | 'in-progress' | 'completed';

export interface Homework {
  id: string;
  subject: Subject;
  content: string;
  dueDate: string;
  status: HomeworkStatus;
  photo?: string;
  createdAt: string;
}

export type StudySessionStatus = 'upcoming' | 'studying' | 'completed';
export type StudyMode = 'focus' | 'homework' | 'reading' | 'review' | 'break';

export interface StudySession {
  id: string;
  day?: number; // 0 (Mon) to 6 (Sun)
  date?: string; // Legacy support
  startTime: string;
  endTime: string;
  activity: string;
  subject?: Subject;
  status: StudySessionStatus;
  completedAt?: string;
}

export interface BackpackItem {
  id: string;
  name: string;
  subject: Subject;
  prepared: boolean;
}

export interface UserStats {
  stars: number;
  daysOnTime: number;
  homeworkCompleted: number;
  totalStarsEarned: number;
  badges: string[];
  unlockedItems: string[];
  stickers?: string[];
  activeWallpaper: string;
  activeCharacter: string;
  lastDailyRewardDate?: string;
  lastResetWeek?: string;
}
