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

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  icon?: string;
  isPinned: boolean;
  isCompleted: boolean;
  createdAt: number;
  order?: number;
  reminderDate?: string | null;
  reminderTime?: string | null;
  reminderRepeat?: 'none' | 'daily' | 'weekly';
  reminderDays?: number[];
  tags?: string[];
  files?: { name: string; url: string; type: string }[];
  checklist?: ChecklistItem[];
}

export interface UserProfile {
  avatar?: string;
  fullName?: string;
  nickname?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  school?: string;
  className?: string; // class is a reserved keyword
  homeroomTeacher?: string;
  schoolYear?: string;
  favoriteSubjects?: string[];
  interests?: string[];
  parentName?: string;
  parentPhone?: string;
  bio?: string;
}

export interface UserStats {
  stars: number;
  daysOnTime: number;
  homeworkCompleted: number;
  totalStarsEarned: number;
  weeklyStars?: number;
  badges: string[];
  unlockedItems: string[];
  stickers?: string[];
  activeWallpaper: string;
  activeCharacter: string;
  lastDailyRewardDate?: string;
  lastResetWeek?: string;
  highScores?: Record<string, number>;
  profile?: UserProfile;
}
