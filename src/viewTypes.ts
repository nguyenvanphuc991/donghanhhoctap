import { User as FirebaseUser } from 'firebase/auth';
import { ScheduleItem, Homework, StudySession, UserStats, BackpackItem, StudyMode, Subject } from './types';

export interface AppState {
  user: FirebaseUser | null;
  stars: number;
  schedule: ScheduleItem[];
  homework: Homework[];
  studySessions: StudySession[];
  backpackItems: BackpackItem[];
  isGeneratingBackpack: boolean;
  isFocusMode: boolean;
  focusTime: number;
  timerTotalTime: number;
  isTimerActive: boolean;
  timerMode: StudyMode;
  currentSessionId: string | null;
  studyJourneyProgress: number;
  stats: UserStats;
  activeTab: string;
  selectedDay: number;
}

export interface AppActions {
  setAssistantMsg: (msg: string) => void;
  setShowAssistantMsg: (show: boolean) => void;
  addStars: (amount: number, reason: string) => void;
  setIsFocusMode: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSelectedDay: (day: number) => void;
  setIsTimerActive: (val: boolean) => void;
  setFocusTime: (val: number) => void;
  setCurrentSessionId: (id: string | null) => void;
  startTimer: (mode: StudyMode, minutes: number, sessionId?: string) => void;
  generateBackpackList: () => void;
  toggleBackpackItem: (id: string) => void;
  handleUnlock: (id: string, price: number, type: 'wallpaper' | 'character' | 'sticker') => void;
  handleSelect: (id: string, type: 'wallpaper' | 'character') => void;
  setShowHomeworkPopup: (val: { show: boolean, subject?: Subject } | null) => void;
}
