/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  BookText, 
  Clock, 
  Trophy, 
  Gamepad2, 
  Star, 
  Plus, 
  CheckCircle2, 
  Circle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Bell,
  Award,
  ShoppingBag,
  Paintbrush,
  User,
  Sun,
  CloudSun,
  Edit2,
  Camera,
  ImageIcon,
  Filter,
  Timer,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Coffee,
  Play,
  Check,
  TrendingUp,
  Map as MapIcon,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem, Homework, StudySession, UserStats, Subject, BackpackItem, HomeworkStatus, StudyMode } from './types';
import { SUBJECT_CONFIG, DAYS, BADGES, SHOP_ITEMS, STUDY_JOURNEY } from './constants';

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string; key?: string | number }) => (
  <div className={`bg-white rounded-3xl shadow-xl p-6 border-4 border-white ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  className?: string;
  disabled?: boolean;
  key?: string | number;
}) => {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1',
    secondary: 'bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1',
    accent: 'bg-yellow-400 hover:bg-yellow-500 text-blue-900 shadow-[0_4px_0_rgb(202,138,4)] active:shadow-none active:translate-y-1',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

// --- Main App ---

const FocusModeOverlay = ({ 
  focusTime, 
  timerTotalTime, 
  timerMode, 
  isTimerActive, 
  setIsTimerActive, 
  setIsFocusMode 
}: { 
  focusTime: number; 
  timerTotalTime: number; 
  timerMode: StudyMode; 
  isTimerActive: boolean; 
  setIsTimerActive: (val: boolean) => void; 
  setIsFocusMode: (val: boolean) => void; 
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const progressCircleRadius = 120;
  const progressCircleCircumference = 2 * Math.PI * progressCircleRadius;
  const progressOffset = progressCircleCircumference - (focusTime / timerTotalTime) * progressCircleCircumference;

  const breakSuggestions = [
    "Uống một ngụm nước mát nhé! 💧",
    "Vươn vai và hít thở thật sâu nào! 🧘",
    "Nhìn ra xa cửa sổ cho mắt nghỉ ngơi nhé! 🌳",
    "Xoay cổ nhẹ nhàng một chút nào! 🔄",
    "Ăn một chút trái cây cho thêm năng lượng! 🍎"
  ];

  const currentSuggestion = useMemo(() => {
    return breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
  }, [timerMode]);

  // Memoize particles to prevent stuttering on every timer tick
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5
    }));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-indigo-900/95 backdrop-blur-md flex items-center justify-center p-4 z-[100] text-white overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              left: `${p.x}%`, 
              top: `${p.y}%`,
              opacity: 0.1
            }}
            animate={{ 
              y: [0, -100],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity,
              ease: "linear",
              delay: p.delay
            }}
            className="absolute w-2 h-2 bg-white rounded-full"
          />
        ))}
      </div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="144"
              cy="144"
              r={progressCircleRadius}
              fill="transparent"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            <motion.circle
              cx="144"
              cy="144"
              r={progressCircleRadius}
              fill="transparent"
              stroke={timerMode === 'break' ? '#10B981' : '#6366F1'}
              strokeWidth="12"
              strokeDasharray={progressCircleCircumference}
              animate={{ strokeDashoffset: isNaN(progressOffset) ? 0 : progressOffset }}
              strokeLinecap="round"
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>
          
          <div className="text-center">
            <div className="text-7xl font-black font-mono tracking-tighter mb-2">
              {Math.floor(focusTime / 60)}:{(focusTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-black text-indigo-200 uppercase tracking-widest">
              {timerMode === 'break' ? '🌿 Đang nghỉ ngơi' : '📚 Đang tập trung'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black">
            {timerMode === 'break' ? 'Nghỉ ngơi một chút!' : 'Học tập thật giỏi!'}
          </h2>
          <p className="text-indigo-200 font-bold text-lg">
            {timerMode === 'break' ? currentSuggestion : 'Đang trong giờ học, không làm phiền nhé! 💪'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 bg-white/10 p-4 rounded-3xl border border-white/20">
          <Music size={20} className="text-indigo-300" />
          <span className="text-sm font-bold">Đang phát: Nhạc sóng não tập trung 🎵</span>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={() => setIsTimerActive(!isTimerActive)} 
            variant="secondary" 
            className="flex-1 bg-white/20 border-2 border-white/30 hover:bg-white/30"
          >
            {isTimerActive ? 'Tạm dừng' : 'Tiếp tục'}
          </Button>
          <Button 
            onClick={() => setShowExitConfirm(true)} 
            variant="danger" 
            className="flex-1"
          >
            Thoát
          </Button>
        </div>

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-indigo-950/90 backdrop-blur-lg flex items-center justify-center p-6 z-50"
            >
              <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-indigo-200">
                <div className="text-5xl mb-4">🛑</div>
                <h3 className="text-2xl font-black text-indigo-900 mb-2">Dừng học sao?</h3>
                <p className="text-gray-500 font-bold mb-8">Bạn có chắc muốn dừng phiên học này không?</p>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => setShowExitConfirm(false)} 
                    variant="secondary" 
                    className="flex-1 bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]"
                  >
                    Học tiếp
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsFocusMode(false);
                      setIsTimerActive(false);
                    }} 
                    variant="danger" 
                    className="flex-1"
                  >
                    Dừng luôn
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [stars, setStars] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [backpackItems, setBackpackItems] = useState<BackpackItem[]>([]);
  const [isGeneratingBackpack, setIsGeneratingBackpack] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(20 * 60); // 20 minutes
  const [timerTotalTime, setTimerTotalTime] = useState(20 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<StudyMode>('focus');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [studyJourneyProgress, setStudyJourneyProgress] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showHomeworkPopup, setShowHomeworkPopup] = useState<{ show: boolean, subject?: Subject } | null>(null);
  const [stats, setStats] = useState<UserStats>({
    stars: 0,
    daysOnTime: 0,
    homeworkCompleted: 0,
    badges: ['newbie'],
    unlockedItems: ['default_bg', 'bird'],
    stickers: [],
    activeWallpaper: 'default_bg',
    activeCharacter: 'bird'
  });
  const [showAssistantMsg, setShowAssistantMsg] = useState(true);
  const [assistantMsg, setAssistantMsg] = useState("Chào bạn! Hôm nay chúng mình cùng học thật vui nhé!");

  // Load data
  useEffect(() => {
    const savedStars = localStorage.getItem('stars');
    const savedSchedule = localStorage.getItem('schedule');
    const savedHomework = localStorage.getItem('homework');
    const savedSessions = localStorage.getItem('studySessions');
    const savedBackpack = localStorage.getItem('backpackItems');
    const savedStats = localStorage.getItem('userStats');
    const savedJourney = localStorage.getItem('studyJourneyProgress');

    if (savedStars) setStars(parseInt(savedStars));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedHomework) setHomework(JSON.parse(savedHomework));
    if (savedSessions) setStudySessions(JSON.parse(savedSessions));
    if (savedBackpack) setBackpackItems(JSON.parse(savedBackpack));
    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedJourney) setStudyJourneyProgress(parseInt(savedJourney));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('stars', stars.toString());
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('homework', JSON.stringify(homework));
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
    localStorage.setItem('backpackItems', JSON.stringify(backpackItems));
    localStorage.setItem('userStats', JSON.stringify({ ...stats, stars }));
    localStorage.setItem('studyJourneyProgress', studyJourneyProgress.toString());
  }, [stars, schedule, homework, studySessions, backpackItems, stats, studyJourneyProgress]);

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    if (isTimerActive) {
      if (focusTime === 120) {
        setAssistantMsg("Còn 2 phút nữa thôi! Cố gắng lên nào! 💪");
      }
      if (focusTime === 0) {
        setIsTimerActive(false);
        handleSessionComplete();
      }
    }
  }, [focusTime, isTimerActive]);

  const handleSessionComplete = () => {
    if (timerMode === 'break') {
      setAssistantMsg("Hết giờ nghỉ rồi! Sẵn sàng học tiếp chưa? 📚");
      return;
    }

    addStars(10, 'hoàn thành phiên học');
    setStudyJourneyProgress(prev => (prev + 1) % (STUDY_JOURNEY.length * 10));
    setShowCompletionPopup(true);
    
    if (currentSessionId) {
      setStudySessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s
      ));
    }
  };

  const startTimer = (mode: StudyMode, minutes: number, sessionId?: string) => {
    setTimerMode(mode);
    setFocusTime(minutes * 60);
    setTimerTotalTime(minutes * 60);
    setIsTimerActive(true);
    setCurrentSessionId(sessionId || null);
    setAssistantMsg("Bắt đầu học thôi! Mình sẽ đếm giờ giúp bạn! ⏱️");
    
    if (sessionId) {
      setStudySessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'studying' } : s
      ));
    }
  };

  const startBreak = () => {
    setTimerMode('break');
    setFocusTime(5 * 60);
    setTimerTotalTime(5 * 60);
    setIsTimerActive(true);
    setShowCompletionPopup(false);
    setAssistantMsg("Nghỉ giải lao 5 phút nhé! Hãy uống nước và vươn vai nào! 🌿");
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = homework.filter(h => h.createdAt?.startsWith(today));
    if (todayItems.length > 0 && todayItems.every(h => h.status === 'completed')) {
      const lastRewardDate = localStorage.getItem('lastDailyRewardDate');
      if (lastRewardDate !== today) {
        addStars(50, 'hoàn thành tất cả bài tập trong ngày');
        const newSticker = ['🚀', '🌈', '🦄', '🦖', '🍕', '🍦', '🎨', '🎸'][Math.floor(Math.random() * 8)];
        setStats(prev => ({
          ...prev,
          stickers: [...(prev.stickers || []), newSticker]
        }));
        localStorage.setItem('lastDailyRewardDate', today);
        setAssistantMsg(`Chúc mừng! Bạn đã hoàn thành hết bài tập và nhận được 50 sao cùng 1 sticker ${newSticker} mới! 🎊`);
      }
    }
  }, [homework]);

  const addStars = (amount: number, reason: string) => {
    setStars(prev => prev + amount);
    setStats(prev => ({ ...prev, stars: prev.stars + amount }));
    setAssistantMsg(`Giỏi quá! +${amount} sao vì ${reason}!`);
    setShowAssistantMsg(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500']
    });
  };

  const handleUnlock = (itemId: string, price: number, type: 'wallpaper' | 'character') => {
    if (stars < price) {
      setAssistantMsg("Bạn chưa đủ sao rồi, cố gắng học thêm nhé!");
      return;
    }

    setStars(prev => prev - price);
    setStats(prev => ({
      ...prev,
      stars: prev.stars - price,
      unlockedItems: [...prev.unlockedItems, itemId],
      activeWallpaper: type === 'wallpaper' ? itemId : prev.activeWallpaper,
      activeCharacter: type === 'character' ? itemId : prev.activeCharacter,
    }));

    setAssistantMsg(`Chúc mừng! Bạn đã mở khóa ${type === 'wallpaper' ? 'hình nền' : 'nhân vật'} mới!`);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 }
    });
  };

  const handleSelect = (itemId: string, type: 'wallpaper' | 'character') => {
    setStats(prev => ({
      ...prev,
      activeWallpaper: type === 'wallpaper' ? itemId : prev.activeWallpaper,
      activeCharacter: type === 'character' ? itemId : prev.activeCharacter,
    }));
  };

  const activeBgColor = useMemo(() => {
    return SHOP_ITEMS.wallpapers.find(w => w.id === stats.activeWallpaper)?.color || '#F0F9FF';
  }, [stats.activeWallpaper]);

  const activeCharIcon = useMemo(() => {
    return SHOP_ITEMS.characters.find(c => c.id === stats.activeCharacter)?.icon || '🐦';
  }, [stats.activeCharacter]);

  const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todayIndex = today === 0 ? 6 : today - 1; // Adjust to 0-6 (Mon-Sun)

  const tomorrow = (today + 1) % 7;
  const tomorrowIndex = tomorrow === 0 ? 6 : tomorrow - 1;
  const tomorrowSchedule = useMemo(() => {
    return schedule.filter(item => item.day === tomorrowIndex).sort((a, b) => {
      const sA = a.session || 'morning';
      const sB = b.session || 'morning';
      if (sA !== sB) return sA === 'morning' ? -1 : 1;
      return a.period - b.period;
    });
  }, [schedule, tomorrowIndex]);

  useEffect(() => {
    if (tomorrowSchedule.length > 0 && activeTab === 'home') {
      const subjects = Array.from(new Set(tomorrowSchedule.map(s => s.subject))).join(' và ');
      setTimeout(() => {
        setAssistantMsg(`Ngày mai có môn ${subjects}, nhớ chuẩn bị sách nhé! 📚`);
      }, 2000);
    }
  }, [tomorrowSchedule, activeTab]);

  const todaySchedule = useMemo(() => {
    return schedule.filter(item => item.day === todayIndex).sort((a, b) => {
      const sA = a.session || 'morning';
      const sB = b.session || 'morning';
      if (sA !== sB) return sA === 'morning' ? -1 : 1;
      return a.period - b.period;
    });
  }, [schedule, todayIndex]);

  const pendingHomework = useMemo(() => {
    return homework.filter(h => h.status !== 'completed');
  }, [homework]);

  const todayHomeworkProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = homework.filter(h => h.createdAt.startsWith(today));
    if (todayItems.length === 0) return 0;
    const completed = todayItems.filter(h => h.status === 'completed').length;
    return Math.round((completed / todayItems.length) * 100);
  }, [homework]);

  // Assistant logic based on homework
  useEffect(() => {
    if (pendingHomework.length > 0) {
      setAssistantMsg(`Bạn còn ${pendingHomework.length} bài tập chưa hoàn thành đó! Cố lên nào!`);
    } else if (homework.length > 0) {
      setAssistantMsg("Tuyệt vời! Hôm nay bạn đã làm xong hết bài tập rồi!");
    }
  }, [pendingHomework.length, homework.length]);

  const generateBackpackList = async () => {
    if (tomorrowSchedule.length === 0) {
      setAssistantMsg("Ngày mai không có tiết học nào, bạn không cần chuẩn bị cặp đâu!");
      return;
    }

    setIsGeneratingBackpack(true);
    setAssistantMsg("Đang nhờ AI xem ngày mai cần mang gì nhé...");

    try {
      const subjects = Array.from(new Set(tomorrowSchedule.map(s => s.subject)));
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Dựa trên danh sách các môn học sau: ${subjects.join(', ')}, hãy liệt kê các đồ dùng học tập cần thiết (sách, vở, dụng cụ đặc thù) cho một học sinh tiểu học. 
        Trả về kết quả dưới dạng mảng JSON các đối tượng có cấu trúc: { "name": string, "subject": string }. 
        Ví dụ: { "name": "Sách Toán", "subject": "Toán" }.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                subject: { type: Type.STRING }
              },
              required: ["name", "subject"]
            }
          }
        }
      });

      const items = JSON.parse(response.text || "[]");
      const newBackpackItems: BackpackItem[] = items.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: item.name,
        subject: item.subject,
        prepared: false
      }));

      setBackpackItems(newBackpackItems);
      setAssistantMsg("Xong rồi! Bạn hãy kiểm tra danh sách chuẩn bị cặp sách nhé!");
    } catch (error) {
      console.error("Error generating backpack list:", error);
      setAssistantMsg("Có lỗi khi nhờ AI rồi, bạn tự chuẩn bị theo thời khóa biểu nhé!");
    } finally {
      setIsGeneratingBackpack(false);
    }
  };

  const toggleBackpackItem = (id: string) => {
    setBackpackItems(prev => {
      const newItems = prev.map(item => 
        item.id === id ? { ...item, prepared: !item.prepared } : item
      );
      
      // If all items just became prepared, give a small reward
      const allPrepared = newItems.every(i => i.prepared);
      const previouslyAllPrepared = prev.every(i => i.prepared);
      if (allPrepared && !previouslyAllPrepared && newItems.length > 0) {
        addStars(5, 'chuẩn bị cặp sách đầy đủ');
      }
      
      return newItems;
    });
  };

  // --- Views ---

  const HomeView = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-blue-900"
          >
            Chào bạn nhỏ! 👋 <br/>
            <span className="text-blue-500">Hôm nay bạn học gì?</span>
          </motion.h1>

          <Card className="bg-white border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-blue-900 flex items-center gap-2">
                📊 Tiến độ học tập hôm nay
              </h2>
              <span className="text-sm font-bold text-blue-600">{todayHomeworkProgress}%</span>
            </div>
            <div className="w-full h-4 bg-blue-50 rounded-full overflow-hidden border-2 border-blue-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${todayHomeworkProgress}%` }}
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs font-bold text-gray-400">
                {homework.filter(h => h.createdAt?.startsWith(new Date().toISOString().split('T')[0]) && h.status === 'completed').length} / {homework.filter(h => h.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length} bài tập đã xong
              </p>
              <button 
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Timer size={14} /> Bắt đầu tập trung
              </button>
            </div>
          </Card>

          <Card className="bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                <Calendar className="text-blue-500" /> Thời khóa biểu hôm nay
              </h2>
              <span className="text-sm font-medium bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
                {DAYS[todayIndex] || 'Cuối tuần'}
              </span>
            </div>
            {todaySchedule.length > 0 ? (
              <div className="space-y-6">
                {['morning', 'afternoon'].map(session => {
                  const sessionItems = todaySchedule.filter(i => (i.session || 'morning') === session);
                  if (sessionItems.length === 0) return null;
                  return (
                    <div key={session}>
                      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        {session === 'morning' ? <Sun size={12} /> : <CloudSun size={12} />}
                        {session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {sessionItems.map((item) => {
                          const config = SUBJECT_CONFIG[item.subject];
                          return (
                            <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-blue-100 flex flex-col items-center text-center">
                              <div className="p-2 rounded-xl mb-2" style={{ backgroundColor: config.bgColor }}>
                                <config.icon size={24} color={config.color} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{item.subject}</span>
                              <span className="text-[10px] text-gray-400">Tiết {item.period}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500 italic">Hôm nay không có tiết học nào. Nghỉ ngơi thôi!</p>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-green-50 border-green-100">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <BookText className="text-green-500" /> Bài tập cần làm
              </h2>
              <div className="space-y-3">
                {pendingHomework.slice(0, 3).map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium text-gray-700 flex-1 truncate">{h.content}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{h.subject}</span>
                  </div>
                ))}
                {pendingHomework.length === 0 && (
                  <p className="text-center py-2 text-gray-500 text-sm">Tuyệt vời! Bạn đã hết bài tập rồi.</p>
                )}
                {pendingHomework.length > 3 && (
                  <button onClick={() => setActiveTab('homework')} className="text-xs text-green-600 font-bold hover:underline w-full text-center">
                    Xem tất cả ({pendingHomework.length})
                  </button>
                )}
              </div>
            </Card>

            <Card className="bg-yellow-50 border-yellow-100">
              <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
                <Clock className="text-yellow-500" /> Lịch học tại nhà
              </h2>
              <div className="space-y-3">
                {studySessions.length > 0 ? (
                  studySessions.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-yellow-100">
                      <span className="text-xs font-bold text-yellow-600 w-20">{s.startTime} - {s.endTime}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{s.activity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-2 text-gray-500 text-sm">Chưa có lịch học tại nhà.</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="bg-purple-50 border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                <ShoppingBag className="text-purple-500" /> 🎒 Chuẩn bị cặp sách cho ngày mai
              </h2>
              <Button 
                onClick={generateBackpackList} 
                disabled={isGeneratingBackpack}
                variant="primary"
                className="py-1 px-3 text-xs"
              >
                {isGeneratingBackpack ? 'Đang tạo...' : 'Tự động tạo danh sách'}
              </Button>
            </div>
            
            {backpackItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backpackItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleBackpackItem(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      item.prepared 
                        ? 'bg-green-100 border-green-200 opacity-70' 
                        : 'bg-white border-purple-100 hover:border-purple-300'
                    }`}
                  >
                    {item.prepared ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <Circle className="text-purple-300" size={20} />
                    )}
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${item.prepared ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.subject}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/50 rounded-2xl border-2 border-dashed border-purple-200">
                <p className="text-gray-500 text-sm mb-2">Nhấn nút phía trên để AI giúp bạn soạn sách vở nhé!</p>
                <p className="text-[10px] text-gray-400 italic">(Dựa trên thời khóa biểu ngày mai)</p>
              </div>
            )}
          </Card>
        </div>

        <div className="w-full md:w-64 space-y-4">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 p-3 rounded-full">
                <Star size={40} className="fill-yellow-300 text-yellow-300" />
              </div>
            </div>
            <div className="text-3xl font-black">{stars}</div>
            <div className="text-sm font-bold opacity-90">Ngôi sao may mắn</div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setIsFocusMode(true)} className="flex flex-col items-center gap-2 p-4 bg-indigo-100 rounded-2xl hover:bg-indigo-200 transition-colors">
              <Timer className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-800">Tập trung</span>
            </button>
            <button onClick={() => setActiveTab('schedule')} className="flex flex-col items-center gap-2 p-4 bg-blue-100 rounded-2xl hover:bg-blue-200 transition-colors">
              <Calendar className="text-blue-600" />
              <span className="text-xs font-bold text-blue-800">Lịch học</span>
            </button>
            <button onClick={() => setActiveTab('homework')} className="flex flex-col items-center gap-2 p-4 bg-green-100 rounded-2xl hover:bg-green-200 transition-colors">
              <BookText className="text-green-600" />
              <span className="text-xs font-bold text-green-800">Bài tập</span>
            </button>
            <button onClick={() => setActiveTab('achievements')} className="flex flex-col items-center gap-2 p-4 bg-purple-100 rounded-2xl hover:bg-purple-200 transition-colors">
              <Trophy className="text-purple-600" />
              <span className="text-xs font-bold text-purple-800">Thành tích</span>
            </button>
            <button onClick={() => setActiveTab('minigame')} className="flex flex-col items-center gap-2 p-4 bg-pink-100 rounded-2xl hover:bg-pink-200 transition-colors">
              <Gamepad2 className="text-pink-600" />
              <span className="text-xs font-bold text-pink-800">Trò chơi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ScheduleView = () => {
    const [selectedDay, setSelectedDay] = useState(todayIndex);
    const [isAdding, setIsAdding] = useState(false);
    const [newSubject, setNewSubject] = useState<Subject>('Toán');
    const [newPeriod, setNewPeriod] = useState(1);
    const [newDay, setNewDay] = useState(0);
    const [newSession, setNewSession] = useState<'morning' | 'afternoon'>('morning');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = () => {
      if (editingId) {
        setSchedule(prev => prev.map(item => 
          item.id === editingId 
          ? { ...item, subject: newSubject, period: newPeriod, session: newSession, day: newDay }
          : item
        ));
        setEditingId(null);
      } else {
        const newItem: ScheduleItem = {
          id: Math.random().toString(36).substr(2, 9),
          day: newDay,
          period: newPeriod,
          session: newSession,
          subject: newSubject
        };
        setSchedule(prev => [...prev, newItem]);
        addStars(2, 'thêm tiết học mới');
      }
      setIsAdding(false);
    };

    const handleEdit = (item: ScheduleItem) => {
      setNewSubject(item.subject);
      setNewPeriod(item.period);
      setNewDay(item.day);
      setNewSession(item.session || 'morning');
      setEditingId(item.id);
      setIsAdding(true);
    };

    const openAddForSlot = (period: number, session: 'morning' | 'afternoon') => {
      setNewPeriod(period);
      setNewSession(session);
      setNewDay(selectedDay);
      setNewSubject('Toán');
      setEditingId(null);
      setIsAdding(true);
    };

    const handleDelete = (id: string) => {
      setSchedule(prev => prev.filter(item => item.id !== id));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-blue-900">Thời khóa biểu</h2>
          <Button onClick={() => openAddForSlot(1, 'morning')} variant="primary">
            <Plus size={20} /> Thêm tiết học
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day, idx) => {
            const isWeekend = idx >= 5;
            const isActive = selectedDay === idx;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap border-2 ${
                  isActive 
                    ? isWeekend ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-blue-500 text-white border-blue-500 shadow-lg'
                    : isWeekend ? 'bg-orange-50 text-orange-500 border-orange-100 hover:bg-orange-100' : 'bg-white text-blue-500 border-blue-100 hover:bg-blue-50'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['morning', 'afternoon'].map(session => {
            const isWeekend = selectedDay >= 5;
            const sessionColorClass = isWeekend ? 'text-orange-600' : 'text-blue-800';
            const iconColorClass = session === 'morning' ? 'text-yellow-500' : (isWeekend ? 'text-orange-400' : 'text-blue-400');
            
            return (
              <div key={session} className="space-y-4">
                <h3 className={`text-xl font-bold ${sessionColorClass} flex items-center gap-2`}>
                  {session === 'morning' ? <Sun className={iconColorClass} /> : <CloudSun className={iconColorClass} />}
                  {session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(p => {
                    const item = schedule.find(i => i.day === selectedDay && i.period === p && (i.session || 'morning') === session);
                    return (
                      <div 
                        key={p} 
                        onClick={() => item ? handleEdit(item) : openAddForSlot(p, session as 'morning' | 'afternoon')}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group shadow-sm ${
                          item 
                            ? isWeekend ? 'bg-orange-50 border-orange-200 hover:shadow-md' : 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-md'
                            : 'border-dashed border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                          item 
                            ? isWeekend ? 'bg-orange-200 text-orange-700' : 'bg-blue-100 text-blue-600'
                            : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                        }`}>
                          {p}
                        </div>
                        {item ? (
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl shadow-sm" style={{ backgroundColor: SUBJECT_CONFIG[item.subject].bgColor }}>
                                {React.createElement(SUBJECT_CONFIG[item.subject].icon, { size: 20, color: SUBJECT_CONFIG[item.subject].color })}
                              </div>
                              <span className="text-base font-bold text-gray-700">{item.subject}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className={`${isWeekend ? 'text-orange-400 hover:text-orange-600' : 'text-blue-400 hover:text-blue-600'} p-2`}>
                                <Edit2 size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-400 hover:text-red-600 p-2">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-gray-300 italic text-sm">Trống</span>
                            <Plus size={16} className="text-gray-300 group-hover:text-blue-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {isAdding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-blue-900 mb-6">{editingId ? 'Sửa tiết học' : 'Thêm tiết học'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setNewSession('morning')}
                    className={`p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${newSession === 'morning' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-100 text-gray-400'}`}
                  >
                    <Sun size={18} /> Sáng
                  </button>
                  <button 
                    onClick={() => setNewSession('afternoon')}
                    className={`p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${newSession === 'afternoon' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}
                  >
                    <CloudSun size={18} /> Chiều
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Thứ mấy</label>
                  <select 
                    value={newDay} 
                    onChange={(e) => setNewDay(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold"
                  >
                    {DAYS.map((day, idx) => <option key={day} value={idx}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Môn học</label>
                  <select 
                    value={newSubject} 
                    onChange={(e) => setNewSubject(e.target.value as Subject)}
                    className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold"
                  >
                    {Object.keys(SUBJECT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Tiết học</label>
                  <select 
                    value={newPeriod} 
                    onChange={(e) => setNewPeriod(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold"
                  >
                    {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Tiết {p}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsAdding(false)} variant="secondary" className="flex-1 bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]">Hủy</Button>
                  <Button onClick={handleAdd} className="flex-1">Lưu lại</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isFocusMode && (
          <div className="fixed inset-0 bg-indigo-900/95 flex items-center justify-center p-4 z-[100] text-white">
            <div className="max-w-md w-full text-center space-y-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex justify-center"
              >
                <div className="w-48 h-48 rounded-full border-8 border-indigo-400/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-8 border-indigo-400 rounded-full border-t-transparent" style={{ transform: `rotate(${(focusTime / (20 * 60)) * 360}deg)` }} />
                  <Timer size={64} className="text-indigo-200" />
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-4xl font-black">Chế độ tập trung</h2>
                <p className="text-indigo-200 font-bold">Đang học bài, không làm phiền nhé!</p>
              </div>

              <div className="text-7xl font-mono font-black tracking-tighter">
                {Math.floor(focusTime / 60)}:{(focusTime % 60).toString().padStart(2, '0')}
              </div>

              <div className="flex items-center justify-center gap-4 bg-indigo-800/50 p-4 rounded-2xl border border-indigo-700">
                <Music size={20} className="text-indigo-300" />
                <span className="text-sm font-bold">Đang phát: Nhạc nhẹ tập trung</span>
              </div>

              <Button 
                onClick={() => {
                  if (confirm("Bạn có chắc muốn dừng tập trung không? Bạn sẽ không nhận được sao thưởng đâu!")) {
                    setIsFocusMode(false);
                    setFocusTime(20 * 60);
                  }
                }} 
                variant="danger" 
                className="w-full"
              >
                Dừng lại
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const HomeworkView = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newSubject, setNewSubject] = useState<Subject>('Toán');
    const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    const handleAdd = () => {
      if (!newContent) return;
      const newItem: Homework = {
        id: Math.random().toString(36).substr(2, 9),
        subject: newSubject,
        content: newContent,
        dueDate: newDueDate,
        status: 'pending',
        photo: photo || undefined,
        createdAt: new Date().toISOString()
      };
      setHomework(prev => [newItem, ...prev]);
      setNewContent('');
      setPhoto(null);
      setSuggestion(null);
      setIsAdding(false);
      addStars(5, 'thêm bài tập mới');
    };

    const updateStatus = (id: string, status: HomeworkStatus) => {
      setHomework(prev => prev.map(h => {
        if (h.id === id) {
          if (status === 'completed' && h.status !== 'completed') {
            addStars(10, `hoàn thành bài tập ${h.subject}`);
            setShowHomeworkPopup({ show: true, subject: h.subject });
          }
          return { ...h, status };
        }
        return h;
      }));
    };

    const handleDelete = (id: string) => {
      setHomework(prev => prev.filter(h => h.id !== id));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const getAISuggestion = async (subject: Subject) => {
      setIsGeneratingSuggestion(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Gợi ý một bài tập ngắn, thú vị cho môn ${subject} cấp tiểu học. Chỉ trả về 1 câu ngắn gọn.`,
        });
        setSuggestion(response.text || null);
      } catch (error) {
        console.error("Error getting suggestion:", error);
      } finally {
        setIsGeneratingSuggestion(false);
      }
    };

    const filteredHomework = homework.filter(h => {
      if (filter === 'pending') return h.status !== 'completed';
      if (filter === 'completed') return h.status === 'completed';
      return true;
    });

    const getDueDateStatus = (dateStr: string) => {
      const today = new Date().toISOString().split('T')[0];
      if (dateStr < today) return { label: 'Quá hạn', color: 'text-red-500', bg: 'bg-red-50' };
      if (dateStr === today) return { label: 'Hôm nay', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      return { label: 'Còn thời gian', color: 'text-green-600', bg: 'bg-green-50' };
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-black text-green-900">Bài tập về nhà</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsFocusMode(true)} variant="accent" className="bg-indigo-500 text-white shadow-[0_4px_0_rgb(67,56,202)]">
              <Timer size={20} /> Chế độ tập trung
            </Button>
            <Button onClick={() => setIsAdding(true)} variant="secondary">
              <Plus size={20} /> Thêm bài tập
            </Button>
          </div>
        </div>

        <div className="flex gap-2 bg-white p-1 rounded-2xl border-2 border-green-100 w-fit">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-green-500 text-white shadow-md' : 'text-green-600 hover:bg-green-50'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chưa làm' : 'Hoàn thành'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomework.map(h => {
            const config = SUBJECT_CONFIG[h.subject];
            const dueStatus = getDueDateStatus(h.dueDate);
            return (
              <motion.div 
                layout
                key={h.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative flex flex-col p-6 rounded-3xl border-4 transition-all ${h.status === 'completed' ? 'bg-gray-50 border-gray-200 opacity-75' : 'shadow-xl hover:shadow-2xl'}`}
                style={{ 
                  borderColor: h.status === 'completed' ? '#E5E7EB' : config.color,
                  backgroundColor: h.status === 'completed' ? '#F9FAFB' : config.bgColor 
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: config.bgColor }}>
                      <config.icon size={20} color={config.color} />
                    </div>
                    <span className="text-sm font-black" style={{ color: config.color }}>{h.subject}</span>
                  </div>
                  <button onClick={() => handleDelete(h.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <p className={`text-lg font-bold leading-tight ${h.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {h.content}
                  </p>

                  {h.photo && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100 aspect-video">
                      <img src={h.photo} alt="Bài tập" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${dueStatus.bg}`}>
                    <Clock size={14} className={dueStatus.color} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${dueStatus.color}`}>
                      {dueStatus.label}: {new Date(h.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t-2 border-gray-50 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {(['pending', 'in-progress', 'completed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(h.id, s)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                          h.status === s 
                            ? s === 'completed' ? 'bg-green-500 border-green-500 text-white' : s === 'in-progress' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-500 border-gray-500 text-white'
                            : 'border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {s === 'pending' ? '⏳ Chờ' : s === 'in-progress' ? '📝 Làm' : '✅ Xong'}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredHomework.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-4 border-dashed border-green-100">
            <div className="flex justify-center mb-4">
              <BookText size={64} className="text-green-100" />
            </div>
            <p className="text-xl font-bold text-gray-400">Không có bài tập nào ở đây!</p>
          </div>
        )}

        {isAdding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-green-900">Thêm bài tập mới</h3>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Môn học</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.keys(SUBJECT_CONFIG).map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          setNewSubject(s as Subject);
                          getAISuggestion(s as Subject);
                        }}
                        className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${newSubject === s ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}
                      >
                        {React.createElement(SUBJECT_CONFIG[s as Subject].icon, { size: 16, color: SUBJECT_CONFIG[s as Subject].color })}
                        <span className="text-[10px] font-bold truncate w-full text-center">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Nội dung bài tập</label>
                  <textarea 
                    value={newContent} 
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Ví dụ: Làm bài 1-5 trang 25 sách giáo khoa..."
                    className="w-full p-4 rounded-2xl border-2 border-green-100 focus:border-green-500 outline-none font-bold min-h-[100px]"
                  />
                  
                  <AnimatePresence>
                    {suggestion && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-sparkles-50 rounded-xl border border-yellow-200 flex items-start gap-2 cursor-pointer hover:bg-yellow-50 transition-colors"
                        onClick={() => setNewContent(suggestion)}
                      >
                        <Sparkles size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-medium text-yellow-700 italic">Gợi ý: "{suggestion}"</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Hạn nộp bài</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="date" 
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-green-100 focus:border-green-500 outline-none font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Hình ảnh (nếu có)</label>
                    <label className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 cursor-pointer transition-all">
                      <Camera size={18} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">Chụp ảnh / Tải lên</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {photo && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-green-100 aspect-video">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                      <Plus size={16} className="rotate-45" />
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsAdding(false)} variant="secondary" className="flex-1 bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]">Hủy</Button>
                  <Button onClick={handleAdd} className="flex-1" variant="secondary">Lưu lại</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const TimeTableView = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newActivity, setNewActivity] = useState('');
    const [newSubject, setNewSubject] = useState<Subject>('Toán');
    const [newStart, setNewStart] = useState('19:00');
    const [newEnd, setNewEnd] = useState('19:30');
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

    const studyModes: { mode: StudyMode; label: string; icon: any; time: number; color: string }[] = [
      { mode: 'focus', label: 'Học tập trung', icon: BookText, time: 25, color: 'blue' },
      { mode: 'homework', label: 'Làm bài tập', icon: Edit2, time: 30, color: 'indigo' },
      { mode: 'reading', label: 'Đọc sách', icon: BookOpen, time: 15, color: 'emerald' },
      { mode: 'review', label: 'Ôn bài nhanh', icon: Sparkles, time: 10, color: 'amber' },
    ];

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAdd = () => {
      if (!newActivity) return;
      const newItem: StudySession = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: newStart,
        endTime: newEnd,
        activity: newActivity,
        subject: newSubject,
        status: 'upcoming'
      };
      setStudySessions(prev => [...prev, newItem].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setNewActivity('');
      setIsAdding(false);
      addStars(5, 'thêm lịch học mới');
    };

    const getAISuggestion = async () => {
      setIsGeneratingSuggestion(true);
      try {
        const pending = homework.filter(h => h.status !== 'completed');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        let prompt = "Gợi ý một hoạt động học tập ngắn (30 phút) cho học sinh tiểu học.";
        if (pending.length > 0) {
          prompt = `Học sinh có bài tập: ${pending[0].content} môn ${pending[0].subject}. Hãy gợi ý một phiên học 30 phút để hoàn thành nó. Trả về 1 câu ngắn gọn.`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        
        const suggestion = response.text || "";
        setNewActivity(suggestion);
        if (pending.length > 0) setNewSubject(pending[0].subject);
      } catch (error) {
        console.error("Error getting AI suggestion:", error);
      } finally {
        setIsGeneratingSuggestion(false);
      }
    };

    const todaySessions = studySessions.filter(s => true);
    const completedSessionsCount = todaySessions.filter(s => s.status === 'completed').length;
    const progressPercent = todaySessions.length > 0 ? (completedSessionsCount / todaySessions.length) * 100 : 0;

    const getTimerColor = () => {
      if (!isTimerActive && focusTime === 0) return 'text-yellow-500';
      if (timerMode === 'break') return 'text-emerald-500';
      if (focusTime < 60) return 'text-orange-500';
      return 'text-blue-500';
    };

    const progressCircleRadius = 120;
    const progressCircleCircumference = 2 * Math.PI * progressCircleRadius;
    const progressOffset = progressCircleCircumference - (focusTime / timerTotalTime) * progressCircleCircumference;

    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-yellow-900">Giờ học thông minh</h2>
            <p className="text-gray-500 font-bold">Tập trung cao độ, gặt hái thành công!</p>
          </div>
          <Button onClick={() => setIsAdding(true)} variant="accent">
            <Plus size={20} /> Thêm lịch học
          </Button>
        </div>

        {/* Daily Progress */}
        <Card className="bg-white border-yellow-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-yellow-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-yellow-500" /> Hôm nay bạn đã học
            </h3>
            <span className="text-sm font-black text-yellow-600">{completedSessionsCount} / {todaySessions.length} phiên học</span>
          </div>
          <div className="w-full h-4 bg-yellow-50 rounded-full overflow-hidden border-2 border-yellow-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white border-blue-100 flex flex-col items-center py-12 relative overflow-hidden">
              {/* Background Illustration */}
              <div className="absolute top-4 right-4 opacity-20">
                {isTimerActive ? (
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <div className="text-6xl">🌳</div>
                  </motion.div>
                ) : (
                  <div className="text-6xl">🌱</div>
                )}
              </div>

              <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r={progressCircleRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-100"
                  />
                  <motion.circle
                    cx="144"
                    cy="144"
                    r={progressCircleRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={progressCircleCircumference}
                    animate={{ strokeDashoffset: isNaN(progressOffset) ? 0 : progressOffset }}
                    className={getTimerColor()}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <div className={`text-6xl font-black font-mono mb-2 ${getTimerColor()}`}>
                    {formatTime(focusTime)}
                  </div>
                  <div className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    {timerMode === 'break' ? '🌿 Giải lao' : '📚 Đang học'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl px-4">
                {studyModes.map(m => (
                  <button
                    key={m.mode}
                    onClick={() => startTimer(m.mode, m.time)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      timerMode === m.mode && isTimerActive ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <m.icon size={24} className={timerMode === m.mode && isTimerActive ? 'text-white' : `text-${m.color}-500`} />
                    <span className="text-[10px] font-black mt-2 text-center leading-tight">{m.label}</span>
                    <span className="text-[10px] opacity-60">{m.time} phút</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => {
                    setIsTimerActive(!isTimerActive);
                    if (!isTimerActive) setIsFocusMode(true);
                  }} 
                  variant="secondary" 
                  className={`w-40 ${isTimerActive ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)]' : ''}`}
                >
                  {isTimerActive ? 'Tạm dừng' : 'Bắt đầu ngay'}
                </Button>
                <Button 
                  onClick={() => setIsFocusMode(true)} 
                  variant="secondary" 
                  className="bg-indigo-500 text-white shadow-[0_4px_0_rgb(67,56,202)]"
                >
                  Toàn màn hình
                </Button>
                <Button 
                  onClick={() => { setFocusTime(0); setIsTimerActive(false); }} 
                  variant="secondary" 
                  className="bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]"
                >
                  Đặt lại
                </Button>
              </div>
            </Card>

            {/* Journey Map */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-100">
              <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
                <MapIcon className="text-green-500" /> Bản đồ hành trình học tập
              </h3>
              <div className="relative flex items-center justify-between px-4">
                <div className="absolute left-0 right-0 h-2 bg-green-200 top-1/2 -translate-y-1/2 -z-10 rounded-full" />
                {STUDY_JOURNEY.map((step, index) => {
                  const isUnlocked = studyJourneyProgress >= index;
                  const isCurrent = studyJourneyProgress === index;
                  return (
                    <div key={step.id} className="relative flex flex-col items-center">
                      <motion.div 
                        animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 ${
                          isUnlocked ? 'bg-white border-green-400' : 'bg-gray-200 border-gray-300 grayscale'
                        }`}
                      >
                        {step.icon}
                      </motion.div>
                      <span className={`text-[10px] font-black mt-2 ${isUnlocked ? 'text-green-700' : 'text-gray-400'}`}>
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Schedule Section */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-100">
              <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center justify-between">
                Lịch học tại nhà
                <button onClick={getAISuggestion} className="p-2 bg-sparkles-50 text-yellow-600 rounded-xl hover:bg-yellow-50 transition-colors">
                  <Sparkles size={18} />
                </button>
              </h3>
              <div className="space-y-4">
                {todaySessions.map(s => {
                  const config = s.subject ? SUBJECT_CONFIG[s.subject] : null;
                  return (
                    <motion.div 
                      layout
                      key={s.id} 
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        s.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-60' : 
                        s.status === 'studying' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-400 ring-offset-2' : 'bg-white border-gray-50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {config && (
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: config.bgColor }}>
                              <config.icon size={14} color={config.color} />
                            </div>
                          )}
                          <span className="text-xs font-black text-gray-400">{s.startTime} - {s.endTime}</span>
                        </div>
                        {s.status === 'completed' ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <button onClick={() => setStudySessions(prev => prev.filter(item => item.id !== s.id))} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-700 mb-4">{s.activity}</h4>
                      {s.status === 'upcoming' && (
                        <Button 
                          onClick={() => {
                            startTimer('focus', 30, s.id);
                            setIsFocusMode(true);
                          }} 
                          variant="secondary" 
                          className="w-full py-2 text-xs bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)]"
                        >
                          <Play size={14} /> Bắt đầu học ngay
                        </Button>
                      )}
                      {s.status === 'studying' && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-black text-xs animate-pulse">
                          <Loader2 size={14} className="animate-spin" /> Đang học...
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {todaySessions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">Chưa có lịch học nào.</p>
                    <button onClick={getAISuggestion} className="mt-2 text-xs text-blue-500 font-black hover:underline">Nhờ AI gợi ý nhé? ✨</button>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="bg-indigo-50 border-indigo-100">
              <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2">
                📈 Thống kê tuần
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="text-2xl font-black text-indigo-600">6h</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Tổng giờ học</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="text-2xl font-black text-indigo-600">12</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Phiên học</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add Session Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-yellow-900">Thêm lịch học</h3>
                <button onClick={getAISuggestion} className="flex items-center gap-1 text-xs font-black text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-xl hover:bg-yellow-100 transition-all">
                  {isGeneratingSuggestion ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Gợi ý AI
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Môn học</label>
                  <select 
                    value={newSubject} 
                    onChange={(e) => setNewSubject(e.target.value as Subject)}
                    className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                  >
                    {Object.keys(SUBJECT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Hoạt động</label>
                  <input 
                    type="text"
                    value={newActivity} 
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Ví dụ: Ôn bài Toán, Đọc sách..."
                    className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Bắt đầu</label>
                    <input 
                      type="time"
                      value={newStart} 
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Kết thúc</label>
                    <input 
                      type="time"
                      value={newEnd} 
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsAdding(false)} variant="accent" className="flex-1 bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]">Hủy</Button>
                  <Button onClick={handleAdd} variant="accent" className="flex-1">Lưu lại</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const AchievementsView = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-purple-900">Thành tích của bạn</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-blue-50 text-center">
          <div className="text-4xl font-black text-blue-600 mb-1">{stats.daysOnTime}</div>
          <div className="text-sm font-bold text-blue-800">Ngày học đúng giờ</div>
        </Card>
        <Card className="bg-green-50 text-center">
          <div className="text-4xl font-black text-green-600 mb-1">{homework.filter(h => h.completed).length}</div>
          <div className="text-sm font-bold text-green-800">Bài tập hoàn thành</div>
        </Card>
        <Card className="bg-yellow-50 text-center">
          <div className="text-4xl font-black text-yellow-600 mb-1">{stars}</div>
          <div className="text-sm font-bold text-yellow-800">Tổng số sao</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
          <Award className="text-purple-500" /> Huy hiệu đã đạt được
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {BADGES.map(badge => {
            const isEarned = stats.badges.includes(badge.id);
            return (
              <div key={badge.id} className={`flex flex-col items-center text-center p-4 rounded-3xl transition-all ${isEarned ? 'bg-purple-50 border-2 border-purple-100' : 'opacity-30 grayscale'}`}>
                <div className="text-5xl mb-3">{badge.icon}</div>
                <div className="font-black text-purple-900 text-sm mb-1">{badge.name}</div>
                <div className="text-[10px] text-purple-600 leading-tight">{badge.description}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {stats.stickers && stats.stickers.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <Sparkles className="text-indigo-500" /> Bộ sưu tập Sticker của bạn
          </h3>
          <div className="flex flex-wrap gap-4">
            {stats.stickers.map((sticker, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl border-2 border-indigo-100"
              >
                {sticker}
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const MiniGameView = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
    const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', ans: 0 });
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);

    const generateQuestion = () => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const op = Math.random() > 0.5 ? '+' : '-';
      const ans = op === '+' ? a + b : a - b;
      setQuestion({ a, b, op, ans });
    };

    const startGame = () => {
      setScore(0);
      setTimeLeft(30);
      setGameState('playing');
      generateQuestion();
    };

    useEffect(() => {
      let timer: any = null;
      if (gameState === 'playing' && timeLeft > 0) {
        timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else if (timeLeft === 0 && gameState === 'playing') {
        setGameState('end');
        if (score > 0) addStars(Math.floor(score / 2), 'chơi game học tập');
      }
      return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const handleAnswer = (userAns: number) => {
      if (userAns === question.ans) {
        setScore(prev => prev + 10);
        generateQuestion();
      } else {
        setScore(prev => Math.max(0, prev - 5));
        generateQuestion();
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-pink-50 border-pink-200 min-h-[400px] flex flex-col items-center justify-center text-center">
          {gameState === 'start' && (
            <div className="space-y-6">
              <div className="text-6xl mb-4">🧮</div>
              <h2 className="text-3xl font-black text-pink-900">Thử thách Toán học</h2>
              <p className="text-pink-700 font-bold">Trả lời đúng càng nhiều câu hỏi càng tốt trong 30 giây!</p>
              <Button onClick={startGame} variant="accent" className="bg-pink-500 text-white shadow-[0_4px_0_rgb(190,24,93)] hover:bg-pink-600">Bắt đầu chơi</Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8 w-full">
              <div className="flex justify-between items-center w-full px-4">
                <div className="bg-white px-4 py-2 rounded-full font-black text-pink-600 shadow-sm border-2 border-pink-100">Điểm: {score}</div>
                <div className="bg-white px-4 py-2 rounded-full font-black text-pink-600 shadow-sm border-2 border-pink-100">Thời gian: {timeLeft}s</div>
              </div>
              <div className="text-6xl font-black text-gray-800 py-12">
                {question.a} {question.op} {question.b} = ?
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[question.ans, question.ans + 2, question.ans - 1, question.ans + 5].sort(() => Math.random() - 0.5).map((opt, i) => (
                  <Button key={i} onClick={() => handleAnswer(opt)} variant="accent" className="text-2xl py-6">{opt}</Button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'end' && (
            <div className="space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-black text-pink-900">Kết thúc!</h2>
              <p className="text-xl font-bold text-pink-700">Bạn đạt được {score} điểm!</p>
              <p className="text-sm text-pink-500 font-bold">Bạn nhận được {Math.floor(score / 2)} sao thưởng!</p>
              <Button onClick={startGame} variant="accent" className="bg-pink-500 text-white shadow-[0_4px_0_rgb(190,24,93)] hover:bg-pink-600">Chơi lại</Button>
              <button onClick={() => setGameState('start')} className="text-pink-600 font-bold hover:underline">Về màn hình chính</button>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const ShopView = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-orange-900">Cửa hàng quà tặng</h2>
        <div className="bg-orange-100 px-6 py-2 rounded-full flex items-center gap-2 border-2 border-orange-200">
          <Star className="text-orange-500 fill-orange-500" size={20} />
          <span className="text-xl font-black text-orange-700">{stars}</span>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <Paintbrush className="text-blue-500" /> Hình nền rực rỡ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SHOP_ITEMS.wallpapers.map(item => {
              const isUnlocked = stats.unlockedItems.includes(item.id);
              const isActive = stats.activeWallpaper === item.id;
              return (
                <Card key={item.id} className={`p-4 flex flex-col items-center gap-3 transition-all ${isActive ? 'ring-4 ring-blue-400' : ''}`}>
                  <div className="w-full h-20 rounded-xl shadow-inner border-2 border-gray-100" style={{ backgroundColor: item.color }} />
                  <div className="text-sm font-bold text-gray-700">{item.name}</div>
                  {isUnlocked ? (
                    <Button 
                      onClick={() => handleSelect(item.id, 'wallpaper')} 
                      variant={isActive ? 'secondary' : 'primary'}
                      className="w-full py-1 text-xs"
                    >
                      {isActive ? 'Đang dùng' : 'Sử dụng'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUnlock(item.id, item.price, 'wallpaper')} 
                      variant="accent"
                      className="w-full py-1 text-xs"
                      disabled={stars < item.price}
                    >
                      {item.price} ⭐
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <User className="text-pink-500" /> Bạn đồng hành mới
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SHOP_ITEMS.characters.map(item => {
              const isUnlocked = stats.unlockedItems.includes(item.id);
              const isActive = stats.activeCharacter === item.id;
              return (
                <Card key={item.id} className={`p-4 flex flex-col items-center gap-3 transition-all ${isActive ? 'ring-4 ring-pink-400' : ''}`}>
                  <div className="text-5xl py-4">{item.icon}</div>
                  <div className="text-sm font-bold text-gray-700">{item.name}</div>
                  {isUnlocked ? (
                    <Button 
                      onClick={() => handleSelect(item.id, 'character')} 
                      variant={isActive ? 'secondary' : 'primary'}
                      className="w-full py-1 text-xs"
                    >
                      {isActive ? 'Đang dùng' : 'Sử dụng'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUnlock(item.id, item.price, 'character')} 
                      variant="accent"
                      className="w-full py-1 text-xs"
                      disabled={stars < item.price}
                    >
                      {item.price} ⭐
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800 pb-20 md:pb-0 md:pl-24 transition-colors duration-500" style={{ backgroundColor: activeBgColor }}>
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-24 bg-white shadow-2xl z-40 flex md:flex-col items-center justify-around md:justify-center gap-2 p-2 md:p-4 border-t-4 md:border-t-0 md:border-r-4 border-blue-100">
        {[
          { id: 'home', icon: Home, label: 'Trang chủ', color: 'text-blue-500' },
          { id: 'schedule', icon: Calendar, label: 'Lịch học', color: 'text-blue-500' },
          { id: 'homework', icon: BookText, label: 'Bài tập', color: 'text-green-500' },
          { id: 'timetable', icon: Clock, label: 'Giờ học', color: 'text-yellow-500' },
          { id: 'achievements', icon: Trophy, label: 'Thành tích', color: 'text-purple-500' },
          { id: 'shop', icon: ShoppingBag, label: 'Cửa hàng', color: 'text-orange-500' },
          { id: 'minigame', icon: Gamepad2, label: 'Trò chơi', color: 'text-pink-500' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-50 scale-110' : 'hover:bg-gray-50'}`}
          >
            <item.icon className={activeTab === item.id ? item.color : 'text-gray-400'} size={24} />
            <span className={`text-[10px] font-black mt-1 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'schedule' && <ScheduleView />}
            {activeTab === 'homework' && <HomeworkView />}
            {activeTab === 'timetable' && <TimeTableView />}
            {activeTab === 'achievements' && <AchievementsView />}
            {activeTab === 'shop' && <ShopView />}
            {activeTab === 'minigame' && <MiniGameView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Assistant Character */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 pointer-events-none">
        <div className="relative flex flex-col items-end">
          <AnimatePresence>
            {showAssistantMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-blue-200 mb-4 max-w-[200px] pointer-events-auto cursor-pointer"
                onClick={() => setShowAssistantMsg(false)}
              >
                <p className="text-sm font-bold text-blue-800 leading-tight">{assistantMsg}</p>
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-4 border-b-4 border-blue-200 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-20 h-20 bg-blue-400 rounded-full shadow-xl border-4 border-white flex items-center justify-center text-4xl pointer-events-auto cursor-pointer"
            onClick={() => setShowAssistantMsg(!showAssistantMsg)}
          >
            {activeCharIcon}
          </motion.div>
        </div>
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <FocusModeOverlay 
            focusTime={focusTime}
            timerTotalTime={timerTotalTime}
            timerMode={timerMode}
            isTimerActive={isTimerActive}
            setIsTimerActive={setIsTimerActive}
            setIsFocusMode={setIsFocusMode}
          />
        )}
      </AnimatePresence>

      {/* Completion Popup */}
      <AnimatePresence>
        {showCompletionPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl border-8 border-green-100"
            >
              <div className="text-7xl mb-6">🎉</div>
              <h3 className="text-3xl font-black text-green-900 mb-2">Giỏi quá!</h3>
              <p className="text-gray-500 font-bold mb-8">Bạn đã hoàn thành phiên học một cách xuất sắc!</p>
              
              <div className="bg-yellow-50 p-4 rounded-3xl mb-8 flex items-center justify-center gap-3 border-2 border-yellow-100">
                <Star size={32} className="text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-black text-yellow-700">+10 sao</span>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={startBreak} variant="secondary" className="bg-emerald-500 text-white shadow-[0_6px_0_rgb(5,150,105)] py-4 text-xl">
                  🌿 Nghỉ 5 phút
                </Button>
                <Button onClick={() => setShowCompletionPopup(false)} variant="secondary" className="bg-gray-200 text-gray-600 shadow-[0_6px_0_rgb(156,163,175)] py-4 text-xl">
                  Học tiếp
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Homework Completion Popup */}
      <AnimatePresence>
        {showHomeworkPopup?.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl border-8 border-blue-100"
            >
              <div className="text-7xl mb-6">🌟</div>
              <h3 className="text-3xl font-black text-blue-900 mb-2">Tuyệt vời!</h3>
              <p className="text-gray-500 font-bold mb-8">Bạn đã hoàn thành bài tập môn {showHomeworkPopup.subject}!</p>
              
              <div className="bg-yellow-50 p-4 rounded-3xl mb-8 flex items-center justify-center gap-3 border-2 border-yellow-100">
                <Star size={32} className="text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-black text-yellow-700">+10 sao</span>
              </div>

              <Button onClick={() => setShowHomeworkPopup(null)} variant="primary" className="w-full py-4 text-xl">
                Tiếp tục thôi!
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-pink-200 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
