/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  BookOpen,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem, Homework, StudySession, UserStats, Subject, BackpackItem, HomeworkStatus, StudyMode } from './types';
import { SUBJECT_CONFIG, DAYS, BADGES, SHOP_ITEMS, STUDY_JOURNEY, WORD_LIST, STICKER_BOOK_SCENES, getSampleData } from './constants';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDocs
} from 'firebase/firestore';

// --- Helpers ---

const getSubjectConfig = (subject: string) => {
  return SUBJECT_CONFIG[subject] || SUBJECT_CONFIG['Khác'];
};

const SOUNDS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  delete: 'https://assets.mixkit.co/active_storage/sfx/256/256-preview.mp3',
  start: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',
};

const playSound = (type: keyof typeof SOUNDS) => {
  const audio = new Audio(SOUNDS[type]);
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Sound play blocked:', e));
};

// --- Components ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; key?: string | number; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl shadow-xl p-6 border-4 border-white ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
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

const HomeView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, generateGuestSampleData, clearGuestData } = actions;

  const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todayIndex = today === 0 ? 6 : today - 1; // Adjust to 0-6 (Mon-Sun)

  const todaySchedule = useMemo(() => {
    return schedule.filter((item: any) => item.day === todayIndex).sort((a: any, b: any) => {
      const sA = a.session || 'morning';
      const sB = b.session || 'morning';
      if (sA !== sB) return sA === 'morning' ? -1 : 1;
      return a.period - b.period;
    });
  }, [schedule, todayIndex]);

  const todayHomework = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return homework.filter((h: any) => h.createdAt?.startsWith(todayStr) && h.status !== 'completed');
  }, [homework]);

  const todayStudySessions = useMemo(() => {
    return studySessions.filter((s: any) => s.day === todayIndex).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  }, [studySessions, todayIndex]);

  const todayHomeworkProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayItems = homework.filter((h: any) => h.createdAt?.startsWith(todayStr));
    if (todayItems.length === 0) return 0;
    const completed = todayItems.filter((h: any) => h.status === 'completed').length;
    return Math.round((completed / todayItems.length) * 100);
  }, [homework]);

return (
  <div className="space-y-8">
    <motion.h1 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-4xl font-black text-blue-900"
    >
      Chào bạn nhỏ! 👋 <br/>
      <span className="text-blue-500">Hôm nay bạn học gì?</span>
    </motion.h1>

    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1 space-y-6">
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
                        const config = getSubjectConfig(item.subject);
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
              <BookText className="text-green-500" /> Bài tập hôm nay
            </h2>
            <div className="space-y-3">
              {todayHomework.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-green-100">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">{h.content}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{h.subject}</span>
                </div>
              ))}
              {todayHomework.length === 0 && (
                <p className="text-center py-2 text-gray-500 text-sm">Tuyệt vời! Bạn đã hết bài tập hôm nay.</p>
              )}
              {todayHomework.length > 3 && (
                <button onClick={() => setActiveTab('homework')} className="text-xs text-green-600 font-bold hover:underline w-full text-center">
                  Xem tất cả ({todayHomework.length})
                </button>
              )}
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-100">
            <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <Clock className="text-yellow-500" /> Lịch học tại nhà hôm nay
            </h2>
            <div className="space-y-3">
              {todayStudySessions.length > 0 ? (
                todayStudySessions.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-yellow-100">
                    <span className="text-xs font-bold text-yellow-600 w-20">{s.startTime} - {s.endTime}</span>
                    <span className="text-sm font-medium text-gray-700 flex-1">{s.activity}</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-2 text-gray-500 text-sm">Hôm nay không có lịch học tại nhà.</p>
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
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('shop')}>
          <div className="flex justify-center mb-2">
            <div className="bg-white/20 p-3 rounded-full">
              <Star size={40} className="fill-yellow-300 text-yellow-300" />
            </div>
          </div>
          <div className="text-3xl font-black">{stars}</div>
          <div className="text-sm font-bold opacity-90">Ngôi sao may mắn</div>
          <div className="mt-4 bg-white/20 rounded-full py-2 px-4 text-xs font-bold flex items-center justify-center gap-2">
            <ShoppingBag size={14} /> Vào cửa hàng
          </div>
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
          <button onClick={() => setActiveTab('shop')} className="flex flex-col items-center gap-2 p-4 bg-orange-100 rounded-2xl hover:bg-orange-200 transition-colors">
            <ShoppingBag className="text-orange-600" />
            <span className="text-xs font-bold text-orange-800">Cửa hàng</span>
          </button>
        </div>

        {!user && (
          <div className="pt-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Chế độ khách</p>
            <button 
              onClick={generateGuestSampleData}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              ✨ Tạo dữ liệu mẫu
            </button>
            <button 
              onClick={clearGuestData}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white text-red-500 border-2 border-red-100 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all"
            >
              🗑️ Xóa hết dữ liệu
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};


const ScheduleView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, addScheduleItem, updateScheduleItem, deleteScheduleItem } = actions;

  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>('Toán');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [newPeriod, setNewPeriod] = useState(1);
  const [newDay, setNewDay] = useState(0);
  const [newSession, setNewSession] = useState<'morning' | 'afternoon'>('morning');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const subjectToSave = isCustomSubject ? customSubject : newSubject;
    if (!subjectToSave) return;

    if (editingId) {
      await updateScheduleItem(editingId, {
        subject: subjectToSave,
        period: newPeriod,
        session: newSession,
        day: newDay
      });
      setEditingId(null);
    } else {
      await addScheduleItem({
        day: newDay,
        period: newPeriod,
        session: newSession,
        subject: subjectToSave
      });
    }
    setSelectedDay(newDay);
    setIsAdding(false);
    setIsCustomSubject(false);
    setCustomSubject('');
  };

  const handleEdit = (item: ScheduleItem) => {
    const isPredefined = Object.keys(SUBJECT_CONFIG).includes(item.subject);
    if (isPredefined) {
      setNewSubject(item.subject);
      setIsCustomSubject(false);
    } else {
      setNewSubject('Khác');
      setIsCustomSubject(true);
      setCustomSubject(item.subject);
    }
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
    setIsCustomSubject(false);
    setCustomSubject('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    await deleteScheduleItem(id);
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
                  : isWeekend ? 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100' : 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50'
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
                            <div className="p-2 rounded-xl shadow-sm" style={{ backgroundColor: getSubjectConfig(item.subject).bgColor }}>
                              {React.createElement(getSubjectConfig(item.subject).icon, { size: 20, color: getSubjectConfig(item.subject).color })}
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
                  value={isCustomSubject ? 'Khác' : newSubject} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Khác') {
                      setIsCustomSubject(true);
                    } else {
                      setIsCustomSubject(false);
                      setNewSubject(val);
                    }
                  }}
                  className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold"
                >
                  {Object.keys(SUBJECT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {isCustomSubject && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    placeholder="Nhập tên môn học..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full mt-2 p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold"
                  />
                )}
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
              onClick={async () => {
                if (confirm("Bạn có chắc muốn dừng tập trung không? Bạn sẽ không nhận được sao thưởng đâu!")) {
                  setIsFocusMode(false);
                  setIsTimerActive(false);
                  setFocusTime(20 * 60);
                  if (currentSessionId && user) {
                    try {
                      await updateDoc(doc(db, 'users', user.uid, 'studySessions', currentSessionId), {
                        status: 'upcoming'
                      });
                      setCurrentSessionId(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/studySessions/${currentSessionId}`);
                    }
                  }
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

const HomeworkView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, setTimerMode, addHomework, updateHomeworkStatus, deleteHomework } = actions;

  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState<Subject>('Toán');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newContent) return;
    const subjectToSave = isCustomSubject ? customSubject : newSubject;
    if (!subjectToSave) return;

    await addHomework({
      subject: subjectToSave,
      content: newContent,
      dueDate: newDueDate,
      status: 'pending',
      photo: photo || null,
      createdAt: new Date().toISOString()
    });
    setNewContent('');
    setPhoto(null);
    setSuggestion(null);
    setIsAdding(false);
    setIsCustomSubject(false);
    setCustomSubject('');
  };

  const updateStatus = async (id: string, status: HomeworkStatus) => {
    await updateHomeworkStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    await deleteHomework(id);
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

  const filteredHomework = homework.filter((h: any) => {
    const statusMatch = filter === 'all' ? true : filter === 'pending' ? h.status !== 'completed' : h.status === 'completed';
    const subjectMatch = subjectFilter === 'all' ? true : h.subject === subjectFilter;
    return statusMatch && subjectMatch;
  }).sort((a: any, b: any) => {
    const today = new Date().toISOString().split('T')[0];
    const getPriority = (dateStr: string, status: string) => {
      if (status === 'completed') return 3; // Hoàn thành thì ưu tiên thấp nhất
      if (dateStr < today) return 0; // Quá hạn
      if (dateStr === today) return 1; // Hôm nay
      return 2; // Tương lai
    };
    const pA = getPriority(a.dueDate, a.status);
    const pB = getPriority(b.dueDate, b.status);
    if (pA !== pB) return pA - pB;
    // Nếu cùng mức độ ưu tiên, sắp xếp mới nhất lên trước (theo ngày tạo)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getDueDateStatus = (dateStr: string, status: string) => {
    if (status === 'completed') return { label: 'Đã xong', color: 'text-green-600', bg: 'bg-green-50' };
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return { label: 'Quá hạn', color: 'text-red-500', bg: 'bg-red-50' };
    if (dateStr === today) return { label: 'Hôm nay', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Còn thời gian', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const groupedHomework = filteredHomework.reduce((acc: any, h: any) => {
    const date = h.dueDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(h);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDates = Object.keys(groupedHomework).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const todayStr = new Date().toISOString().split('T')[0];
  const todayHomework = homework.filter((h: any) => h.dueDate === todayStr);
  const todayCompleted = todayHomework.filter((h: any) => h.status === 'completed').length;
  const todayTotal = todayHomework.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const availableSubjects = Array.from(new Set(homework.map((h: any) => h.subject)));

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

      {/* Daily Progress Bar */}
      {todayTotal > 0 && (
        <Card className="bg-white border-4 border-green-100 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Trophy size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-green-900">Tiến độ hôm nay</h3>
                <p className="text-sm font-bold text-gray-500">Bạn đã hoàn thành {todayCompleted}/{todayTotal} bài tập!</p>
              </div>
            </div>
            <span className="text-2xl font-black text-green-600">{todayProgress}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-4 items-center">
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

        <div className="flex gap-2 items-center overflow-x-auto pb-2 no-scrollbar max-w-full">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${subjectFilter === 'all' ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'}`}
          >
            Tất cả môn
          </button>
          {availableSubjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSubjectFilter(subject)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${subjectFilter === subject ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'}`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date} className="space-y-4">
            <h4 className="text-lg font-black text-green-800 uppercase tracking-widest border-b-2 border-green-100 pb-2">
              {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedHomework[date].map(h => {
                const config = getSubjectConfig(h.subject);
                const dueStatus = getDueDateStatus(h.dueDate, h.status);
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
                      <p className={`text-2xl font-bold leading-tight ${h.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {h.content}
                      </p>

                      {h.photo && (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100 aspect-video">
                          <img src={h.photo} alt="Bài tập" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${dueStatus.bg}`}>
                        <Clock size={16} className={dueStatus.color} />
                        <span className={`text-sm font-black uppercase tracking-wider ${dueStatus.color}`}>
                          {dueStatus.label}: {new Date(h.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t-2 border-gray-50 flex flex-col gap-3">
                      {h.status !== 'completed' && (
                        <button 
                          onClick={() => {
                            playSound('start');
                            setTimerMode('homework');
                            setFocusTime(30 * 60);
                            setIsFocusMode(true);
                            setAssistantMsg(`Bắt đầu làm bài ${h.subject} thôi nào!`);
                          }}
                          className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black shadow-[0_4px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={18} fill="currentColor" /> Bắt đầu làm ngay
                        </button>
                      )}
                      <div className="flex gap-2">
                        {(['pending', 'in-progress', 'completed'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(h.id, s)}
                            className={`flex-1 py-2 rounded-xl text-sm font-black transition-all border-2 ${
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
          </div>
        ))}
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
                        if (s === 'Khác') {
                          setIsCustomSubject(true);
                        } else {
                          setIsCustomSubject(false);
                          setNewSubject(s as Subject);
                          getAISuggestion(s as Subject);
                        }
                      }}
                      className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${(!isCustomSubject && newSubject === s) || (isCustomSubject && s === 'Khác') ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}
                    >
                      {React.createElement(getSubjectConfig(s).icon, { size: 16, color: getSubjectConfig(s).color })}
                      <span className="text-[10px] font-bold truncate w-full text-center">{s}</span>
                    </button>
                  ))}
                </div>
                {isCustomSubject && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    placeholder="Nhập tên môn học..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full mt-2 p-3 rounded-xl border-2 border-green-100 focus:border-green-500 outline-none font-bold"
                  />
                )}
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

const TimeTableView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, addStudySession, deleteStudySession, updateStudySessionStatus } = actions;

  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newSubject, setNewSubject] = useState<Subject>('Toán');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [newDay, setNewDay] = useState(todayIndex);
  const [newStart, setNewStart] = useState('19:00');
  const [newEnd, setNewEnd] = useState('19:30');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAdd = async () => {
    if (!newActivity) return;
    const subjectToSave = isCustomSubject ? customSubject : newSubject;
    if (!subjectToSave) return;

    // Check for time overlap
    const isOverlap = studySessions.some((session: any) => {
      if (session.day !== newDay) return false;
      // Simple string comparison works for HH:mm format
      return (newStart < session.endTime) && (newEnd > session.startTime);
    });

    if (isOverlap) {
      setError("Thời gian này đã trùng với một lịch học khác rồi!");
      return;
    }

    await addStudySession({
      day: newDay,
      startTime: newStart,
      endTime: newEnd,
      activity: newActivity,
      subject: subjectToSave,
      status: 'upcoming'
    });
    setNewActivity('');
    setIsAdding(false);
    setIsCustomSubject(false);
    setCustomSubject('');
    setError(null);
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

  const sortedSessions = [...studySessions].sort((a, b) => {
    const dayA = a.day ?? -1;
    const dayB = b.day ?? -1;
    if (dayA !== dayB) return dayA - dayB;
    return a.startTime.localeCompare(b.startTime);
  });
  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const dayLabel = session.day !== undefined ? DAYS[session.day] : (session.date || 'Chưa xác định');
    if (!acc[dayLabel]) acc[dayLabel] = [];
    acc[dayLabel].push(session);
    return acc;
  }, {} as Record<string, StudySession[]>);

  const dates = Object.keys(groupedSessions).sort((a, b) => {
    const idxA = DAYS.indexOf(a);
    const idxB = DAYS.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  const completedSessionsCount = sortedSessions.filter(s => s.status === 'completed').length;
  const progressPercent = sortedSessions.length > 0 ? (completedSessionsCount / sortedSessions.length) * 100 : 0;

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
          <span className="text-sm font-black text-yellow-600">{completedSessionsCount} / {sortedSessions.length} phiên học</span>
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
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-white border-blue-100 flex flex-col items-center py-8 relative overflow-hidden">
            {/* Background Illustration */}
            <div className="absolute top-4 right-4 opacity-20">
              {isTimerActive ? (
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <div className="text-4xl">🌳</div>
                </motion.div>
              ) : (
                <div className="text-4xl">🌱</div>
              )}
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 288 288">
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
                <div className={`text-4xl font-black font-mono mb-1 ${getTimerColor()}`}>
                  {formatTime(focusTime)}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {timerMode === 'break' ? '🌿 Giải lao' : '📚 Đang học'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full px-2">
              {studyModes.map(m => (
                <button
                  key={m.mode}
                  onClick={() => startTimer(m.mode, m.time)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    timerMode === m.mode && isTimerActive ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                  }`}
                >
                  <m.icon size={18} className={timerMode === m.mode && isTimerActive ? 'text-white' : `text-${m.color}-500`} />
                  <span className="text-[9px] font-black mt-1 text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-6 w-full px-2">
              <Button 
                onClick={() => {
                  setIsTimerActive(!isTimerActive);
                  if (!isTimerActive) setIsFocusMode(true);
                }} 
                variant="secondary" 
                className={`w-full py-2 text-sm ${isTimerActive ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)]' : ''}`}
              >
                {isTimerActive ? 'Tạm dừng' : 'Bắt đầu ngay'}
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsFocusMode(true)} 
                  variant="secondary" 
                  className="flex-1 py-2 text-xs bg-indigo-500 text-white shadow-[0_4px_0_rgb(67,56,202)]"
                >
                  Toàn màn hình
                </Button>
                <Button 
                  onClick={async () => { 
                    setFocusTime(0); 
                    setIsTimerActive(false); 
                    if (currentSessionId && user) {
                      try {
                        await updateDoc(doc(db, 'users', user.uid, 'studySessions', currentSessionId), {
                          status: 'upcoming'
                        });
                        setCurrentSessionId(null);
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/studySessions/${currentSessionId}`);
                      }
                    }
                  }} 
                  variant="secondary" 
                  className="flex-1 py-2 text-xs bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]"
                >
                  Đặt lại
                </Button>
              </div>
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

        {/* Schedule Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center justify-between">
              Lịch học tại nhà
              <button onClick={getAISuggestion} className="p-2 bg-sparkles-50 text-yellow-600 rounded-xl hover:bg-yellow-50 transition-colors">
                <Sparkles size={18} />
              </button>
            </h3>
            <div className="space-y-8">
              {dates.length > 0 ? dates.map(date => (
                <div key={date} className="space-y-4">
                  <h4 className="text-base font-black text-gray-800 uppercase tracking-widest border-l-4 border-yellow-500 pl-3 py-1 bg-yellow-50/50 rounded-r-lg">
                    {date}
                  </h4>
                  <div className="space-y-3">
                    {groupedSessions[date].map(s => {
                      const config = s.subject ? getSubjectConfig(s.subject) : null;
                      return (
                        <motion.div 
                          layout
                          key={s.id} 
                          className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                            s.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-60' : 
                            s.status === 'studying' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-400 ring-offset-2' : 'bg-white border-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {config && (
                                <div className="p-3 rounded-2xl shadow-inner" style={{ backgroundColor: config.bgColor }}>
                                  <config.icon size={24} color={config.color} />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{s.startTime} - {s.endTime}</span>
                                  {s.subject && <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.subject}</span>}
                                </div>
                                <h4 className="font-black text-gray-800 text-lg">{s.activity}</h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {s.status === 'completed' ? (
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                  <CheckCircle2 size={20} />
                                </div>
                              ) : s.status === 'studying' ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center gap-2 text-blue-600 font-black text-xs animate-pulse mr-2">
                                    <Loader2 size={14} className="animate-spin" /> Đang học
                                  </div>
                                  <Button 
                                    onClick={async () => {
                                      await updateStudySessionStatus(s.id, 'completed');
                                    }} 
                                    variant="primary"
                                    className="px-4 py-2 text-sm bg-green-500 text-white shadow-[0_4px_0_rgb(34,197,94)]"
                                  >
                                    Xong!
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={() => {
                                      startTimer('focus', 30, s.id);
                                      setIsFocusMode(true);
                                    }} 
                                    variant="secondary" 
                                    className="px-4 py-2 text-sm bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)]"
                                  >
                                    <Play size={14} /> Học ngay
                                  </Button>
                                  <button 
                                    onClick={async () => {
                                      await deleteStudySession(s.id);
                                    }} 
                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )) : (
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
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border-2 border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Môn học</label>
                <select 
                  value={isCustomSubject ? 'Khác' : newSubject} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Khác') {
                      setIsCustomSubject(true);
                    } else {
                      setIsCustomSubject(false);
                      setNewSubject(val);
                    }
                  }}
                  className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                >
                  {Object.keys(SUBJECT_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {isCustomSubject && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    placeholder="Nhập tên môn học..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full mt-2 p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                  />
                )}
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
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Thứ mấy</label>
                <select 
                  value={newDay} 
                  onChange={(e) => {
                    setNewDay(parseInt(e.target.value));
                    setError(null);
                  }}
                  className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                >
                  {DAYS.map((day, idx) => <option key={day} value={idx}>{day}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Bắt đầu</label>
                  <input 
                    type="time"
                    value={newStart} 
                    onChange={(e) => {
                      setNewStart(e.target.value);
                      setError(null);
                    }}
                    className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Kết thúc</label>
                  <input 
                    type="time"
                    value={newEnd} 
                    onChange={(e) => {
                      setNewEnd(e.target.value);
                      setError(null);
                    }}
                    className="w-full p-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 outline-none font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => {
                  setIsAdding(false);
                  setError(null);
                }} variant="accent" className="flex-1 bg-gray-200 text-gray-600 shadow-[0_4px_0_rgb(156,163,175)]">Hủy</Button>
                <Button onClick={handleAdd} variant="accent" className="flex-1">Lưu lại</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AchievementsView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup } = actions;

  const totalStars = stats.totalStarsEarned || 0;
  const currentLevel = Math.floor(totalStars / 100) + 1;
  const nextLevelStars = currentLevel * 100;
  const currentLevelProgress = totalStars % 100;
  const progressPercent = (currentLevelProgress / 100) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-purple-900">Thành tích của bạn</h2>
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-black flex items-center gap-2">
          <Award size={20} /> Cấp độ {currentLevel}
        </div>
      </div>

      {/* Level Progress */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-3xl font-black text-white mb-1">Tiến trình lên cấp {currentLevel + 1}</div>
            </div>
            <div className="text-right">
              <div className="text-purple-100 font-bold mb-1">Cần thêm</div>
              <div className="text-2xl font-black">{nextLevelStars - totalStars} sao</div>
            </div>
          </div>
          <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 text-center border-blue-100 h-full flex flex-col justify-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-500">
              <Target size={32} />
            </div>
            <div className="text-4xl font-black text-blue-600 mb-1">{stats.daysOnTime}</div>
            <div className="text-sm font-bold text-blue-800">Ngày học đúng giờ</div>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 text-center border-green-100 h-full flex flex-col justify-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4 text-green-500">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-4xl font-black text-green-600 mb-1">{homework.filter(h => h.status === 'completed').length}</div>
            <div className="text-sm font-bold text-green-800">Bài tập hoàn thành</div>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 text-center border-orange-100 h-full flex flex-col justify-center">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-orange-500">
              <Star size={32} />
            </div>
            <div className="text-4xl font-black text-orange-600 mb-1">{stars}</div>
            <div className="text-sm font-bold text-orange-800">Số sao hiện có</div>
            <div className="text-[10px] text-orange-400 font-bold mt-1">Đã kiếm: {totalStars}</div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
          <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <Target className="text-orange-500" /> Thử thách tuần này
          </h3>
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-100 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold text-orange-900">Hoàn thành 10 bài tập</span>
                  </div>
                  <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    {Math.min(homework.filter(h => h.status === 'completed').length, 10)}/10
                  </span>
                </div>
                <div className="w-full h-4 bg-orange-100 rounded-full overflow-hidden p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((homework.filter(h => h.status === 'completed').length / 10) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" 
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500">
                      <Clock size={20} />
                    </div>
                    <span className="font-bold text-blue-900">Học tập trung 120 phút</span>
                  </div>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    0/120
                  </span>
                </div>
                <div className="w-full h-4 bg-blue-100 rounded-full overflow-hidden p-1">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-0" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
          <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <Award className="text-purple-500" /> Huy hiệu của bạn
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {BADGES.map((badge, idx) => {
              const isEarned = stats.badges.includes(badge.id);
              return (
                <motion.div 
                  key={badge.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden flex flex-col items-center text-center p-5 rounded-3xl transition-all border-2 ${
                    isEarned 
                      ? 'bg-gradient-to-b from-purple-50 to-white border-purple-200 shadow-sm hover:shadow-md hover:-translate-y-1' 
                      : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                  }`}
                >
                  {isEarned && <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-200 rounded-full blur-2xl opacity-50" />}
                  <div className="text-5xl mb-3 drop-shadow-md relative z-10">{badge.icon}</div>
                  <div className="font-black text-purple-900 text-sm mb-1 relative z-10">{badge.name}</div>
                  <div className="text-[10px] text-purple-600 leading-tight relative z-10">{badge.description}</div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {stats.stickers && stats.stickers.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <Sparkles className="text-indigo-500" /> Bộ sưu tập Sticker
          </h3>
          <div className="flex flex-wrap gap-4">
            {stats.stickers.map((sticker, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl border-2 border-indigo-100 cursor-pointer"
              >
                {sticker}
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const MiniGameView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup } = actions;

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'start' | 'difficulty' | 'playing' | 'end'>('start');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Math Game State
  const [mathQuestion, setMathQuestion] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [mathOptions, setMathOptions] = useState<number[]>([]);
  
  // Emoji Match State
  const [emojiGrid, setEmojiGrid] = useState<string[]>([]);
  const [targetEmoji, setTargetEmoji] = useState('');
  
  // Word Scramble State
  const [scrambledWord, setScrambledWord] = useState({ original: '', scrambled: '', hint: '' });
  const [selectedLetters, setSelectedLetters] = useState<{char: string, index: number}[]>([]);

  // Memory Match State
  const [memoryCards, setMemoryCards] = useState<{id: number, emoji: string, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [usedWordIndices, setUsedWordIndices] = useState<number[]>([]);
  
  // Sticker Book State
  const [stickerScene, setStickerScene] = useState<any>(null);
  const [placedStickers, setPlacedStickers] = useState<string[]>([]); // IDs of slots filled
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [hasErrorInCurrentSlot, setHasErrorInCurrentSlot] = useState(false);
  
  // Dino Runner State
  const [dinoY, setDinoY] = useState(0);
  const dinoYRef = useRef(0);
  const dinoVelocityRef = useRef(0);
  const [dinoObstacles, setDinoObstacles] = useState<{id: number, x: number, type: string}[]>([]);
  const [dinoFrame, setDinoFrame] = useState(0);
  const dinoScoreRef = useRef(0);

  // Joke State
  const [currentJokes, setCurrentJokes] = useState<string[]>([]);

  const JOKES = [
    "1. Bài kiểm tra thật thà\nTrong giờ kiểm tra, cô giáo hỏi:\n– Nam, tại sao bài kiểm tra của em giống hệt bài của bạn Bình?\nNam thật thà trả lời:\n– Thưa cô, vì tụi em cùng làm chung một đề ạ!\nCô giáo nói:\n– Nhưng cả hai còn sai giống nhau nữa!\nNam gãi đầu:\n– Dạ… chắc tụi em cùng suy nghĩ giống nhau đó cô!",
    "2. Con cá biết đọc\nCô giáo hỏi cả lớp:\n– Các em cho cô biết, con cá sống ở đâu?\nTí nhanh nhảu trả lời:\n– Thưa cô, con cá sống trong… sách ạ!\nCô giáo ngạc nhiên:\n– Sao lại trong sách?\nTí nói:\n– Vì hôm qua con thấy trong sách ghi: “Cá sống dưới nước”!",
    "3. Con mèo thông minh\nCô giáo hỏi:\n– Minh, nhà em có nuôi con gì không?\nMinh trả lời:\n– Dạ có nuôi con mèo ạ.\nCô hỏi tiếp:\n– Mèo nhà em có bắt chuột không?\nMinh lắc đầu:\n– Dạ không ạ.\nCô ngạc nhiên:\n– Sao vậy?\nMinh đáp:\n– Vì mẹ em mua... chuột máy tính rồi cô!",
    "4. Học sinh rất thật thà\nCô giáo hỏi:\n– Hôm qua em làm bài tập chưa?\nTùng nói:\n– Dạ rồi ạ.\nCô hỏi:\n– Em làm lúc mấy giờ?\nTùng trả lời:\n– Dạ… làm lúc cô kiểm tra bài ạ!",
    "5. Lý do đi học trễ\nCô giáo hỏi:\n– Sao hôm nay em đi học trễ?\nBé Lan trả lời:\n– Dạ tại bảng “Đi chậm lại” trước cổng trường đó cô.\nCô hỏi:\n– Bảng đó thì sao?\nLan nói:\n– Con đọc xong nên… đi chậm lại thật!",
    "6. Học sinh cẩn thận\nCô giáo hỏi:\n– Tại sao hôm nay em mang theo ô trong khi trời nắng?\nHải trả lời:\n– Dạ để phòng khi cô hỏi bài, con còn… che mặt lại ạ!",
    "7. Con vật chăm học\nCô giáo hỏi cả lớp:\n– Theo các em, con vật nào học giỏi nhất?\nBé An nhanh nhảu:\n– Dạ con cú mèo ạ!\nCô hỏi:\n– Vì sao?\nAn trả lời:\n– Vì nó thức học suốt đêm!",
    "8. Lý do điểm thấp\nCô giáo hỏi:\n– Sao bài kiểm tra Toán của em chỉ được 2 điểm?\nBé Nam trả lời:\n– Dạ tại con làm sai hết ạ.\nCô hỏi tiếp:\n– Vậy sao vẫn được 2 điểm?\nNam nói:\n– Dạ chắc cô… thương con nên cho thêm!",
    "9. Học sinh sáng tạo\nCô giáo hỏi:\n– Em hãy đặt một câu có từ “bất ngờ”.\nBé Bình suy nghĩ một lúc rồi nói:\n– Thưa cô, hôm qua con làm bài kiểm tra… bất ngờ được 10 điểm!\nCô giáo cười:\n– Sao lại bất ngờ?\nBình trả lời:\n– Vì con tưởng mình chỉ được 2 điểm thôi ạ!",
    "10. Học sinh rất hiểu bài\nCô giáo hỏi:\n– Em hãy cho cô biết: nước sôi ở bao nhiêu độ?\nTí nhanh nhảu:\n– Dạ… ở 100 độ ạ.\nCô giáo gật đầu:\n– Rất tốt! Vậy nước đá tan ở bao nhiêu độ?\nTí suy nghĩ rồi nói:\n– Dạ… chắc khoảng 100 độ luôn, vì con thấy mẹ bỏ nước đá vào nước sôi là tan ngay!",
    "11. Câu trả lời thông minh\nCô giáo hỏi:\n– Nếu cô có 5 quả táo, cho em 2 quả, còn lại bao nhiêu?\nBé Nam trả lời:\n– Dạ… còn 5 quả ạ!\nCô ngạc nhiên:\n– Sao lại còn 5?\nNam nói:\n– Vì con đâu có nhận táo của cô đâu ạ!",
    "12. Bài văn tả bố\nCô giáo giao bài: “Hãy tả bố của em.”\nHôm sau, cô hỏi:\n– Nam, sao bài văn của em giống hệt bài của bạn Bình?\nNam trả lời:\n– Thưa cô, vì tụi em tả… cùng một người ạ.\nCô ngạc nhiên:\n– Sao lại cùng một người?\nNam nói:\n– Dạ… tại bố bạn Bình cũng là… bố của con đó cô!",
    "13. Học sinh rất tự tin\nCô giáo hỏi:\n– Nếu cô hỏi 10 câu mà em trả lời đúng 5 câu thì em được mấy điểm?\nBé Tí trả lời:\n– Dạ chắc được 5 điểm ạ.\nCô hỏi tiếp:\n– Vậy nếu em trả lời đúng hết 10 câu thì sao?\nTí cười:\n– Dạ… chắc cô sẽ nghĩ con quay cóp!",
    "14. Lý do làm bài sai\nCô giáo hỏi:\n– Sao bài Toán này em làm sai?\nBé Lan trả lời:\n– Dạ tại con làm đúng… nhưng đáp án trong sách lại sai đó cô!\nCô giáo hỏi:\n– Sao em biết sách sai?\nLan nói:\n– Vì con làm sai mà cô!",
    "15. Thầy bói xem voi\nCó mấy ông thầy bói chưa từng thấy con voi nên rủ nhau đi xem.\nÔng sờ vào chân voi nói:\n– Con voi giống cái cột nhà!\nÔng sờ vào tai voi nói:\n– Không phải! Nó giống cái quạt mo!\nÔng sờ vào đuôi voi nói:\n– Sai rồi! Nó giống cái chổi!\nThế là ai cũng cãi mình đúng.\nNgười đứng ngoài cười nói:\n– Các ông mỗi người sờ một chỗ, nên mới hiểu… mỗi kiểu!",
    "16. Trạng Quỳnh ăn trộm mèo\nMột hôm, Trạng Quỳnh bắt trộm con mèo của nhà hàng xóm để làm thịt.\nHàng xóm sang hỏi:\n– Có thấy con mèo nhà tôi đâu không?\nTrạng Quỳnh vừa ăn vừa nói:\n– Tôi đang ăn thịt thỏ đây.\nHàng xóm nghi ngờ:\n– Nhưng sao tôi thấy cái đuôi mèo kia?\nTrạng Quỳnh bình tĩnh đáp:\n– À… thỏ mặc áo mèo đó!",
    "17. Học trò lười\nThầy giáo hỏi học trò:\n– Vì sao em không làm bài tập?\nHọc trò đáp:\n– Thưa thầy, hôm qua nhà em mất điện.\nThầy hỏi tiếp:\n– Nhưng bài tập này thầy giao từ tuần trước mà?\nHọc trò nhanh trí:\n– Dạ… nhà em mất điện sớm ạ!",
    "18. Anh chàng tiết kiệm\nMột anh chàng nổi tiếng tiết kiệm.\nBạn hỏi:\n– Sao hôm nay anh đi bộ xa vậy?\nAnh trả lời:\n– Tôi tiết kiệm tiền xe.\nBạn nói:\n– Sao không chạy cho nhanh hơn?\nAnh đáp:\n– Nếu chạy thì còn tiết kiệm được tiền ăn nữa!",
    "19. Người bán cá thông minh\nMột người mua cá hỏi:\n– Cá này tươi không?\nNgười bán trả lời:\n– Tươi lắm!\nKhách hỏi tiếp:\n– Sao tôi thấy nó không nhúc nhích?\nNgười bán cười:\n– Cá tươi nên… đang ngủ đó mà!",
    "20. Trạng Quỳnh “ăn mày chữ”\nMột người khoe với Trạng Quỳnh rằng mình học rất giỏi.\nQuỳnh hỏi:\n– Anh biết chữ “nhất” không?\nNgười kia nói:\n– Biết chứ!\nQuỳnh cầm que vạch một nét xuống đất rồi nói:\n– Đây là chữ “nhất”. Tôi viết xong rồi, anh đọc đi!\nNgười kia ngớ người ra, còn Quỳnh cười:\n– Học nhiều mà không biết đọc thì cũng như không!",
    "21. Trạng Quỳnh và con chó đá\nMột lần, Trạng Quỳnh thấy trước cổng làng có con chó đá.\nÔng cúi xuống nói nhỏ:\n– Này chó, nếu mày sủa thì ta cho ăn thịt!\nNgười đi đường nghe vậy hỏi:\n– Chó đá sao sủa được?\nQuỳnh cười:\n– Đúng rồi! Vậy mà người ta vẫn tin những chuyện vô lý đó!",
    "22. Ba Giai – Tú Xuất đi chợ\nHai anh chàng Ba Giai và Tú Xuất đi chợ.\nThấy hàng bánh ngon, Ba Giai nói:\n– Anh đứng đây giữ chỗ, tôi đi thử bánh.\nMột lúc sau Tú Xuất hỏi:\n– Ngon không?\nBa Giai đáp:\n– Ngon lắm… nhưng hết rồi!",
    "23. Ba Giai bán thuốc\nBa Giai bày bán một loại thuốc “chữa bách bệnh”.\nNgười ta hỏi:\n– Thuốc này chữa được bệnh gì?\nBa Giai trả lời:\n– Ai uống xong cũng không bị bệnh… đói nữa!\nMọi người ngạc nhiên.\nBa Giai cười:\n– Vì uống xong là… hết tiền mua cơm!",
    "24. Tú Xuất mượn tiền\nMột người hỏi Tú Xuất:\n– Anh mượn tôi tiền khi nào trả?\nTú Xuất nói:\n– Khi nào tôi có tiền!\nNgười kia hỏi:\n– Nếu anh không có thì sao?\nTú Xuất cười:\n– Thì anh khỏi phải… đòi!",
    "25. Xiển Bột thông minh\nMột lần, Xiển Bột đi qua cánh đồng.\nNgười ta hỏi:\n– Anh biết ruộng này rộng bao nhiêu không?\nXiển Bột nói:\n– Tôi không biết.\nHọ cười:\n– Vậy anh biết gì?\nXiển Bột trả lời:\n– Tôi biết ruộng này không phải của tôi, thế là đủ rồi!",
    "26. Trạng Quỳnh đoán tuổi\nCó người hỏi Trạng Quỳnh:\n– Ông đoán tôi bao nhiêu tuổi?\nQuỳnh nhìn một lúc rồi nói:\n– Khoảng 40.\nNgười kia ngạc nhiên:\n– Sao ông biết đúng vậy?\nQuỳnh cười:\n– Vì tôi có người bạn ngốc bằng nửa anh, năm nay 20 tuổi!",
    "27. Ba Giai ăn vụng\nMột lần Ba Giai ăn vụng bánh.\nChủ nhà hỏi:\n– Ai ăn bánh của tôi?\nBa Giai nói:\n– Chắc chuột!\nChủ nhà hỏi:\n– Nhưng sao bánh mất hết?\nBa Giai đáp:\n– Vì chuột… rất đông!",
    "28. Tú Xuất đi học\nThầy hỏi Tú Xuất:\n– Hôm qua sao em nghỉ học?\nTú Xuất trả lời:\n– Dạ em bị bệnh.\nThầy hỏi:\n– Bệnh gì?\nTú Xuất nói:\n– Bệnh… ngủ quên ạ!",
    "29. Xiển Bột và cái bóng\nMột hôm Xiển Bột đi dưới nắng.\nThấy cái bóng đi theo, ông chạy thật nhanh.\nBạn hỏi:\n– Sao anh chạy?\nXiển Bột nói:\n– Tôi muốn xem cái bóng có theo kịp không!"
  ];

  const generateJokes = () => {
    const shuffled = [...JOKES].sort(() => 0.5 - Math.random());
    setCurrentJokes(shuffled.slice(0, 3));
    setGameState('playing');
  };

  const games = [
    { id: 'math', name: 'Toán học', icon: '🧮', color: 'bg-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50', description: 'Tính toán thật nhanh!' },
    { id: 'emoji', name: 'Nhanh mắt', icon: '🔍', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Tìm hình giống hệt!' },
    { id: 'word', name: 'Ghép chữ', icon: '🔡', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50', description: 'Sắp xếp lại từ đúng!' },
    { id: 'memory', name: 'Lật hình', icon: '🧠', color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50', description: 'Thử thách trí nhớ!' },
    { id: 'sticker', name: 'Góc sáng tạo', icon: '🎨', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50', description: 'Dán sticker vào tranh!' },
    { id: 'dino', name: 'Khủng long', icon: '🦖', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Nhảy qua vật cản!' },
    { id: 'joke', name: 'Truyện cười', icon: '😂', color: 'bg-teal-500', textColor: 'text-teal-600', bgColor: 'bg-teal-50', description: 'Cười chút cho vui!' },
  ];

  const generateMathQuestion = () => {
    const range = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 50;
    const a = Math.floor(Math.random() * range) + 1;
    const b = Math.floor(Math.random() * range) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    const ans = op === '+' ? a + b : a - b;
    setMathQuestion({ a, b, op, ans });
    
    const options = new Set([ans]);
    while (options.size < 4) {
      options.add(ans + Math.floor(Math.random() * 10) - 5);
    }
    setMathOptions(Array.from(options).sort(() => Math.random() - 0.5));
  };

  const generateEmojiGrid = () => {
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣'];
    const count = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;
    const target = emojis[Math.floor(Math.random() * emojis.length)];
    setTargetEmoji(target);
    
    const grid = [target];
    while (grid.length < count) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      if (!grid.includes(randomEmoji)) grid.push(randomEmoji);
    }
    setEmojiGrid(grid.sort(() => Math.random() - 0.5));
  };

  const generateWordScramble = (resetUsed = false) => {
    const currentUsed = resetUsed ? [] : usedWordIndices;
    
    const filteredWords = WORD_LIST.filter((w, index) => {
      if (currentUsed.includes(index)) return false;
      if (difficulty === 'easy') return w.word.length <= 5;
      if (difficulty === 'medium') return w.word.length <= 7;
      return true;
    });

    // If all words used, reset
    if (filteredWords.length === 0) {
      setUsedWordIndices([]);
      generateWordScramble(true);
      return;
    }

    const selected = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    const originalIndex = WORD_LIST.findIndex(w => w.word === selected.word);
    
    setUsedWordIndices(prev => resetUsed ? [originalIndex] : [...prev, originalIndex]);
    const scrambled = selected.word.split('').sort(() => Math.random() - 0.5).join('');
    setScrambledWord({ original: selected.word, scrambled, hint: selected.hint });
    setSelectedLetters([]);
  };

  const generateMemoryCards = () => {
    const emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉', '🥑', '🌽', '🥕', '🍔'];
    const count = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const selectedEmojis = emojis.slice(0, count);
    const pairs = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }));
    setMemoryCards(pairs);
    setFlippedIndices([]);
  };

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    setGameState('difficulty');
  };

  const startPlaying = () => {
    setScore(0);
    const time = difficulty === 'easy' ? 45 : difficulty === 'medium' ? 30 : 20;
    setTimeLeft(time);
    setGameState('playing');
    playSound('start');
    if (selectedGame === 'math') generateMathQuestion();
    if (selectedGame === 'emoji') generateEmojiGrid();
    if (selectedGame === 'word') {
      setUsedWordIndices([]);
      generateWordScramble(true);
    }
    if (selectedGame === 'memory') generateMemoryCards();
    if (selectedGame === 'sticker') {
      setStickerScene(STICKER_BOOK_SCENES[Math.floor(Math.random() * STICKER_BOOK_SCENES.length)]);
      setPlacedStickers([]);
      setActiveSlotId(null);
      setHasErrorInCurrentSlot(false);
    }
    if (selectedGame === 'joke') {
      generateJokes();
    }
    if (selectedGame === 'dino') {
      setDinoY(0);
      dinoYRef.current = 0;
      dinoVelocityRef.current = 0;
      dinoScoreRef.current = 0;
      setDinoObstacles([{ id: Date.now(), x: 100, type: '🌵' }]);
      setDinoFrame(0);
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
      if (score > 0) addStars(Math.floor((score / 5) * multiplier), `chơi game ${selectedGame} (${difficulty})`);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleMathAnswer = (userAns: number) => {
    if (feedback) return;
    if (userAns === mathQuestion.ans) {
      setScore(prev => prev + 10);
      setFeedback('correct');
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateMathQuestion();
      }, 600);
    } else {
      setScore(prev => Math.max(0, prev - 5));
      setFeedback('incorrect');
      playSound('delete');
      setTimeout(() => {
        setFeedback(null);
        generateMathQuestion();
      }, 600);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    if (feedback) return;
    if (emoji === targetEmoji) {
      setScore(prev => prev + 10);
      setFeedback('correct');
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateEmojiGrid();
      }, 600);
    } else {
      setScore(prev => Math.max(0, prev - 5));
      setFeedback('incorrect');
      playSound('delete');
      setTimeout(() => {
        setFeedback(null);
      }, 600);
    }
  };

  const handleLetterClick = (char: string, index: number) => {
    setSelectedLetters(prev => [...prev, { char, index }]);
  };

  const handleSelectedLetterClick = (indexToRemove: number) => {
    setSelectedLetters(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleWordSubmit = () => {
    if (feedback) return;
    const currentWord = selectedLetters.map(l => l.char).join('');
    if (currentWord === scrambledWord.original) {
      setScore(prev => prev + 20);
      setFeedback('correct');
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateWordScramble();
      }, 800);
    } else {
      setFeedback('incorrect');
      playSound('delete');
      setAssistantMsg("Chưa đúng rồi, thử lại nhé!");
      setTimeout(() => {
        setFeedback(null);
        setSelectedLetters([]);
      }, 800);
    }
  };

  const handleMemoryClick = (index: number) => {
    if (flippedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first].emoji === memoryCards[second].emoji) {
        playSound('pop');
        setTimeout(() => {
          const matchedCards = [...memoryCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setMemoryCards(matchedCards);
          setFlippedIndices([]);
          setScore(prev => prev + 20);
          
          if (matchedCards.every(c => c.isMatched)) {
            setTimeout(() => generateMemoryCards(), 500);
          }
        }, 500);
      } else {
        playSound('delete');
        setTimeout(() => {
          const resetCards = [...memoryCards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setMemoryCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const handleStickerPlace = (stickerIcon: string) => {
    if (feedback || !activeSlotId || placedStickers.includes(activeSlotId)) return;
    
    const currentSlot = stickerScene.slots.find((s: any) => s.id === activeSlotId);
    
    if (currentSlot.icon === stickerIcon) {
      // Correct
      setPlacedStickers(prev => [...prev, activeSlotId]);
      if (!hasErrorInCurrentSlot) {
        setScore(prev => prev + 25);
      }
      setFeedback('correct');
      playSound('pop');
      setActiveSlotId(null);
      setHasErrorInCurrentSlot(false);
      
      setTimeout(() => {
        setFeedback(null);
        if (placedStickers.length + 1 === stickerScene.slots.length) {
          setTimeout(() => {
            const nextIndex = (STICKER_BOOK_SCENES.findIndex(s => s.id === stickerScene.id) + 1) % STICKER_BOOK_SCENES.length;
            setStickerScene(STICKER_BOOK_SCENES[nextIndex]);
            setPlacedStickers([]);
            setActiveSlotId(null);
            setHasErrorInCurrentSlot(false);
          }, 1000);
        }
      }, 600);
    } else {
      // Incorrect
      setFeedback('incorrect');
      playSound('delete');
      setHasErrorInCurrentSlot(true);
      setTimeout(() => {
        setFeedback(null);
      }, 600);
    }
  };

  const handleDinoJump = () => {
    if (dinoYRef.current === 0) {
      dinoVelocityRef.current = 16;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedGame === 'dino' && gameState === 'playing') {
        e.preventDefault();
        handleDinoJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame, gameState, dinoY]);

  useEffect(() => {
    if (selectedGame !== 'dino' || gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setDinoFrame(f => f + 1);
      
      // Dino Physics
      const nextY = dinoYRef.current + dinoVelocityRef.current;
      if (nextY <= 0) {
        dinoVelocityRef.current = 0;
        dinoYRef.current = 0;
      } else {
        dinoYRef.current = nextY;
        dinoVelocityRef.current -= 1.8; // Gravity
      }
      setDinoY(dinoYRef.current);

      // Obstacles
      setDinoObstacles(obs => {
        const speed = difficulty === 'easy' ? 2.5 : difficulty === 'medium' ? 3.5 : 4.5;
        const moved = obs.map(o => ({ ...o, x: o.x - speed }));
        
        // Collision detection
        for (const o of moved) {
          if (o.x > 12 && o.x < 18 && dinoYRef.current < 20) {
             setGameState('end');
             playSound('delete');
             const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
             if (dinoScoreRef.current > 0) {
               addStars(Math.floor((dinoScoreRef.current / 5) * multiplier), `chơi game Khủng long (${difficulty})`);
             }
             return moved;
          }
        }

        const filtered = moved.filter(o => o.x > -10);
        if (filtered.length < 2 && Math.random() < 0.03 && (filtered.length === 0 || filtered[filtered.length-1].x < 60)) {
           filtered.push({ id: Date.now(), x: 100, type: ['🌵', '🌵', '🌱', '🌿'][Math.floor(Math.random() * 4)] });
           dinoScoreRef.current += 5;
           setScore(dinoScoreRef.current);
        }
        return filtered;
      });
    }, 30);

    return () => clearInterval(gameLoop);
  }, [selectedGame, gameState, difficulty]);

  const currentGame = games.find(g => g.id === selectedGame) || games[0];

  return (
    <div className="max-w-4xl mx-auto">
      {gameState === 'start' && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-black text-pink-900 mb-2">Khu vui chơi giải trí</h2>
            <p className="text-gray-500 font-bold">Vừa chơi vừa rèn luyện trí não để nhận thêm sao nhé!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map(game => (
              <Card 
                key={game.id} 
                onClick={() => startGame(game.id)}
                className={`cursor-pointer hover:scale-105 transition-all border-white hover:border-${game.id === 'math' ? 'pink' : game.id === 'emoji' ? 'blue' : 'green'}-200`}
              >
                <div className="text-6xl mb-4 text-center">{game.icon}</div>
                <h3 className={`text-xl font-black text-center mb-2 ${game.textColor}`}>{game.name}</h3>
                <p className="text-gray-500 text-sm text-center font-bold">{game.description}</p>
                <div className="mt-4 flex justify-center">
                  <div className={`px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider ${game.color}`}>Chơi ngay</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {gameState === 'difficulty' && (
        <Card className="max-w-md mx-auto p-8 text-center space-y-8">
          <div className="text-6xl">{currentGame.icon}</div>
          <div>
            <h3 className={`text-3xl font-black mb-2 ${currentGame.textColor}`}>{currentGame.name}</h3>
            <p className="text-gray-500 font-bold">Chọn mức độ thử thách cho bạn nhé!</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-4 rounded-2xl border-4 transition-all flex items-center justify-between ${difficulty === d ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${d === 'easy' ? 'bg-green-500' : d === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {d === 'easy' ? '😊' : d === 'medium' ? '🤔' : '🔥'}
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-800 uppercase tracking-wider">{d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}</div>
                    <div className="text-xs text-gray-400 font-bold">{d === 'easy' ? '45 giây - Thưởng x1' : d === 'medium' ? '30 giây - Thưởng x1.5' : '20 giây - Thưởng x2'}</div>
                  </div>
                </div>
                {difficulty === d && <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setGameState('start')} variant="secondary" className="flex-1">Quay lại</Button>
            <Button onClick={startPlaying} variant="accent" className={`flex-1 text-white shadow-lg ${currentGame.color}`}>Bắt đầu!</Button>
          </div>
        </Card>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <Card className={`${currentGame.bgColor} border-${currentGame.id === 'math' ? 'pink' : currentGame.id === 'emoji' ? 'blue' : 'green'}-200 min-h-[500px] relative overflow-hidden`}>
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-white px-4 py-2 rounded-2xl font-black text-gray-700 shadow-sm border-2 border-white flex items-center gap-2">
                  <Trophy size={18} className={currentGame.textColor} />
                  Điểm: {score}
                </div>
                <div className="bg-white/50 px-3 py-1 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Mức độ: {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}
                </div>
              </div>
              <div className={`px-6 py-2 rounded-2xl font-black text-white shadow-lg flex items-center gap-2 ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : currentGame.color}`}>
                <Timer size={18} />
                {timeLeft}s
              </div>
            </div>

            {/* Game Area */}
            <div className="flex flex-col items-center justify-center py-8 relative">
              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                  >
                    <div className={`text-9xl drop-shadow-2xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                      {feedback === 'correct' ? '✅' : '❌'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedGame === 'math' && (
                <div className="space-y-12 w-full max-w-md">
                  <div className="text-7xl font-black text-gray-800 text-center drop-shadow-sm">
                    {mathQuestion.a} {mathQuestion.op} {mathQuestion.b} = ?
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {mathOptions.map((opt, i) => (
                      <Button key={i} onClick={() => handleMathAnswer(opt)} variant="accent" className="text-3xl py-8 rounded-3xl">{opt}</Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedGame === 'emoji' && (
                <div className="space-y-8 w-full max-w-lg">
                  <div className="text-center">
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-2">Hãy tìm hình này:</p>
                    <div className="text-8xl bg-white w-32 h-32 mx-auto flex items-center justify-center rounded-[40px] shadow-xl border-4 border-blue-100 mb-8">
                      {targetEmoji}
                    </div>
                  </div>
                  <div className={`grid gap-3 ${difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4'}`}>
                    {emojiGrid.map((emoji, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-4xl bg-white aspect-square rounded-2xl shadow-md border-2 border-blue-50 flex items-center justify-center hover:bg-blue-50 transition-colors"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {selectedGame === 'word' && (
                <div className="space-y-8 w-full max-w-md text-center">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-green-100">
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-4">Gợi ý: {scrambledWord.hint}</p>
                    
                    {/* Selected Letters */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[48px]">
                      {selectedLetters.map((item, i) => (
                        <motion.button
                          key={`selected-${i}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSelectedLetterClick(i)}
                          className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center text-2xl font-black shadow-lg"
                        >
                          {item.char}
                        </motion.button>
                      ))}
                    </div>

                    {/* Scrambled Letters */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                      {scrambledWord.scrambled.split('').map((char, i) => {
                        const isSelected = selectedLetters.some(item => item.index === i);
                        return (
                          <motion.button
                            key={`scrambled-${i}`}
                            whileHover={!isSelected ? { scale: 1.1 } : {}}
                            whileTap={!isSelected ? { scale: 0.9 } : {}}
                            onClick={() => !isSelected && handleLetterClick(char, i)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg transition-all ${
                              isSelected 
                                ? 'bg-gray-100 text-gray-300 shadow-none cursor-default' 
                                : 'bg-white text-green-600 border-2 border-green-100 hover:bg-green-50 cursor-pointer'
                            }`}
                            disabled={isSelected}
                          >
                            {char}
                          </motion.button>
                        );
                      })}
                    </div>

                    <Button 
                      onClick={handleWordSubmit} 
                      variant="secondary" 
                      className="w-full py-4 text-xl"
                      disabled={selectedLetters.length !== scrambledWord.scrambled.length}
                    >
                      Kiểm tra
                    </Button>
                  </div>
                </div>
              )}

              {selectedGame === 'memory' && (
                <div className="w-full max-w-lg">
                  <div className={`grid gap-4 ${difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4'}`}>
                    {memoryCards.map((card, i) => (
                      <motion.div
                        key={card.id}
                        onClick={() => handleMemoryClick(i)}
                        className="perspective-1000 cursor-pointer aspect-square"
                        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="relative w-full h-full text-center transition-transform duration-500 transform-style-3d">
                          {/* Front */}
                          <div className={`absolute inset-0 backface-hidden flex items-center justify-center rounded-2xl border-4 border-purple-200 shadow-lg ${card.isMatched ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                            <div className="text-4xl">{card.isFlipped || card.isMatched ? card.emoji : '❓'}</div>
                          </div>
                          {/* Back */}
                          <div className="absolute inset-0 backface-hidden flex items-center justify-center rounded-2xl bg-purple-500 border-4 border-purple-600 shadow-lg rotate-y-180">
                            <div className="text-4xl text-white">?</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {selectedGame === 'sticker' && stickerScene && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-yellow-600 uppercase tracking-widest">Chủ đề: {stickerScene.name}</h3>
                    <p className="text-gray-500 font-bold">Nhấn vào ô tròn rồi chọn sticker đúng nhé!</p>
                  </div>

                  <div className={`relative w-full aspect-video rounded-[40px] shadow-2xl overflow-hidden border-8 border-white ${stickerScene.bgColor}`}>
                    {/* Scene Background Elements */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/30 blur-xl" />
                      <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                    </div>

                    {/* Slots */}
                    {stickerScene.slots.map((slot: any) => {
                      const isPlaced = placedStickers.includes(slot.id);
                      const isActive = activeSlotId === slot.id;
                      return (
                        <div 
                          key={slot.id}
                          style={{ left: slot.x, top: slot.y }}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                        >
                          {isPlaced ? (
                            <motion.div 
                              initial={{ scale: 0, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="text-7xl drop-shadow-lg"
                            >
                              {slot.icon}
                            </motion.div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              animate={isActive ? { scale: [1, 1.1, 1], borderColor: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.5)'] } : {}}
                              transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                              onClick={() => {
                                setActiveSlotId(slot.id);
                                setHasErrorInCurrentSlot(false);
                              }}
                              className={`w-20 h-20 rounded-full bg-white/30 border-4 border-dashed flex items-center justify-center text-white text-xs font-black uppercase text-center p-2 transition-all ${isActive ? 'border-white bg-white/50 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'border-white/50'}`}
                            >
                              {slot.name}
                            </motion.button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Sticker Palette */}
                  <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border-4 border-white shadow-xl">
                    <div className="flex justify-center gap-4 flex-wrap">
                      {stickerScene.slots.map((slot: any) => {
                        const isPlaced = placedStickers.includes(slot.id);
                        return (
                          <motion.button
                            key={`palette-${slot.id}`}
                            whileHover={!isPlaced ? { scale: 1.1, y: -5 } : {}}
                            whileTap={!isPlaced ? { scale: 0.9 } : {}}
                            onClick={() => handleStickerPlace(slot.icon)}
                            disabled={isPlaced || !activeSlotId}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all ${
                              isPlaced 
                                ? 'bg-gray-100 opacity-30 grayscale cursor-default' 
                                : !activeSlotId 
                                  ? 'bg-gray-50 border-2 border-gray-100 opacity-50 cursor-not-allowed'
                                  : 'bg-white border-4 border-yellow-100 hover:border-yellow-400 cursor-pointer'
                            }`}
                          >
                            {slot.icon}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {selectedGame === 'dino' && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="text-center">
                    <p className="text-gray-500 font-bold">Nhấn phím Cách (Space) hoặc chạm vào màn hình để nhảy!</p>
                  </div>
                  
                  <div 
                    onClick={handleDinoJump}
                    className="relative w-full h-64 bg-gradient-to-b from-blue-50 to-orange-50 rounded-3xl border-4 border-white shadow-xl overflow-hidden cursor-pointer"
                  >
                    {/* Ground */}
                    <div className="absolute bottom-0 w-full h-8 bg-orange-200 border-t-4 border-orange-300" />
                    
                    {/* Dino */}
                    <motion.div 
                      style={{ bottom: 32 + dinoY, left: '15%' }}
                      className="absolute text-6xl -translate-x-1/2 scale-x-[-1]"
                      animate={{ 
                        rotate: dinoY > 0 ? 0 : [0, -5, 5, 0],
                        y: dinoY > 0 ? 0 : [0, -2, 0]
                      }}
                      transition={{ 
                        duration: 0.2, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      🦖
                    </motion.div>

                    {/* Obstacles */}
                    {dinoObstacles.map(obs => (
                      <div 
                        key={obs.id}
                        style={{ left: `${obs.x}%`, bottom: 32 }}
                        className="absolute text-4xl -translate-x-1/2"
                      >
                        {obs.type}
                      </div>
                    ))}

                    {/* Background elements */}
                    <div className="absolute top-10 right-20 text-4xl opacity-20">☁️</div>
                    <div className="absolute top-20 left-40 text-3xl opacity-10">☁️</div>
                  </div>
                </div>
              )}

              {selectedGame === 'joke' && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {currentJokes.map((joke, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.2 }}
                      >
                        <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="whitespace-pre-wrap text-gray-700 font-medium leading-relaxed">
                            {joke}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={generateJokes} 
                      variant="accent" 
                      className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl shadow-lg flex items-center gap-2"
                    >
                      <Sparkles size={20} /> Đọc thêm truyện khác
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setGameState('start')}
              className="absolute bottom-6 left-6 text-gray-400 font-bold hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} /> Thoát
            </button>
          </Card>
        </div>
      )}

      {gameState === 'end' && (
        <Card className="max-w-md mx-auto p-12 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-9xl mb-4"
          >
            {score > 0 ? '🏆' : '😅'}
          </motion.div>
          <div>
            <h3 className="text-4xl font-black text-gray-800 mb-2">
              {score > 0 ? 'Tuyệt vời!' : 'Cố gắng lên!'}
            </h3>
            <p className="text-gray-500 font-bold">Bạn đã hoàn thành thử thách {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-[40px] border-4 border-gray-100">
            <div className="text-sm text-gray-400 font-black uppercase tracking-widest mb-2">Điểm số của bạn</div>
            <div className={`text-6xl font-black ${currentGame.textColor} mb-4`}>{score}</div>
            <div className="flex items-center justify-center gap-2 text-yellow-500 font-black text-2xl">
              <Star fill="currentColor" size={28} />
              + {Math.floor((score / 5) * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2))} sao
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => startGame(selectedGame!)} variant="accent" className={`w-full py-4 text-xl text-white shadow-lg ${currentGame.color}`}>Chơi lại</Button>
            <Button onClick={() => setGameState('start')} variant="secondary" className="w-full py-4 text-xl">Về menu chính</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

const ShopView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup } = actions;

  const [shopTab, setShopTab] = useState<'shop' | 'collection'>('shop');
  const [activeCategory, setActiveCategory] = useState<'wallpapers' | 'characters' | 'stickers' | 'supplies'>('wallpapers');

  const categories = [
    { id: 'wallpapers', name: 'Hình nền', icon: Paintbrush, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 'characters', name: 'Bạn đồng hành', icon: User, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { id: 'stickers', name: 'Nhãn dán', icon: Sparkles, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { id: 'supplies', name: 'Dụng cụ', icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-orange-900 leading-tight">Cửa hàng quà tặng</h2>
          <p className="text-gray-500 font-bold">Dùng sao tích lũy để đổi lấy những món quà tuyệt vời!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-3xl flex items-center gap-3 border-4 border-orange-100 shadow-xl">
          <Star className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
          <span className="text-2xl font-black text-orange-700">{stars}</span>
        </div>
      </div>

      {/* Shop/Collection Toggle */}
      <div className="flex p-1 bg-orange-100 rounded-2xl w-fit">
        <button 
          onClick={() => setShopTab('shop')}
          className={`px-6 py-2 rounded-xl font-black transition-all ${shopTab === 'shop' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-400 hover:text-orange-500'}`}
        >
          Cửa hàng
        </button>
        <button 
          onClick={() => setShopTab('collection')}
          className={`px-6 py-2 rounded-xl font-black transition-all ${shopTab === 'collection' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-400 hover:text-orange-500'}`}
        >
          Bộ sưu tập
        </button>
      </div>

      {shopTab === 'shop' ? (
        <>
          {/* Categories Tab */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? `${cat.bgColor} ${cat.color} shadow-lg scale-105` 
                    : 'bg-white text-gray-400 hover:bg-gray-50'
                }`}
              >
                <cat.icon size={20} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <AnimatePresence mode="wait">
              {SHOP_ITEMS[activeCategory].map((item: any) => {
                const isUnlocked = activeCategory === 'stickers' 
                  ? stats.stickers?.includes(item.icon)
                  : stats.unlockedItems.includes(item.id);
                
                const isActive = activeCategory === 'wallpapers' 
                  ? stats.activeWallpaper === item.id 
                  : activeCategory === 'characters' 
                    ? stats.activeCharacter === item.id 
                    : false;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    className="relative group"
                  >
                    <Card className={`h-full p-5 flex flex-col items-center gap-4 transition-all relative overflow-hidden ${
                      isActive ? 'border-orange-400 bg-orange-50/30' : 'border-white hover:border-orange-100'
                    }`}>
                      {/* Item Display */}
                      <div className="w-full aspect-square rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden bg-gray-50 group-hover:bg-white transition-colors">
                        {activeCategory === 'wallpapers' && (
                          <div className="w-full h-full" style={{ backgroundColor: item.color }} />
                        )}
                        {activeCategory === 'characters' && (
                          <div className="text-6xl drop-shadow-lg">{item.icon}</div>
                        )}
                        {activeCategory === 'stickers' && (
                          <div className="text-5xl drop-shadow-md">{item.icon}</div>
                        )}
                        {activeCategory === 'supplies' && (
                          <div className="text-6xl drop-shadow-lg">{item.icon}</div>
                        )}
                        
                        {/* Status Badge */}
                        {isUnlocked && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-black text-gray-800 mb-1">{item.name}</div>
                        {isUnlocked ? (
                          <div className="text-[10px] font-black text-green-500 uppercase tracking-wider">Đã sở hữu</div>
                        ) : (
                          <div className="text-[10px] font-black text-orange-500 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Star size={10} fill="currentColor" /> {item.price} sao
                          </div>
                        )}
                      </div>

                      {(activeCategory === 'wallpapers' || activeCategory === 'characters') && isUnlocked ? (
                        <Button 
                          onClick={() => handleSelect(item.id, activeCategory === 'wallpapers' ? 'wallpaper' : 'character')} 
                          variant={isActive ? 'secondary' : 'primary'}
                          className="w-full py-2 text-xs rounded-xl"
                        >
                          {isActive ? 'Đang dùng' : 'Sử dụng'}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleUnlock(item.id, item.price, activeCategory as any)} 
                          variant="accent"
                          className="w-full py-2 text-xs rounded-xl"
                          disabled={stars < item.price || isUnlocked}
                        >
                          {isUnlocked ? 'Đã mua' : `Mua ngay`}
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-black text-gray-700 mb-6 flex items-center gap-2">
              🎨 Hình nền & Bạn đồng hành
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {[...SHOP_ITEMS.wallpapers, ...SHOP_ITEMS.characters]
                .filter(item => stats.unlockedItems.includes(item.id))
                .map(item => {
                  const isWallpaper = 'color' in item;
                  const isActive = isWallpaper ? stats.activeWallpaper === item.id : stats.activeCharacter === item.id;
                  return (
                    <Card 
                      key={item.id} 
                      onClick={() => handleSelect(item.id, isWallpaper ? 'wallpaper' : 'character')}
                      className={`p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${isActive ? 'border-blue-400 bg-blue-50' : 'hover:border-blue-200'}`}
                    >
                      {isWallpaper ? (
                        <div className="w-full h-12 rounded-lg" style={{ backgroundColor: item.color }} />
                      ) : (
                        <div className="text-3xl">{item.icon}</div>
                      )}
                      <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{item.name}</span>
                    </Card>
                  );
                })}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black text-gray-700 mb-6 flex items-center gap-2">
              ✨ Nhãn dán của bạn ({stats.stickers?.length || 0})
            </h3>
            <div className="bg-white p-8 rounded-[40px] border-4 border-dashed border-orange-100 min-h-[200px] flex flex-wrap gap-6 justify-center items-center">
              {stats.stickers && stats.stickers.length > 0 ? (
                stats.stickers.map((icon, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    className="text-5xl cursor-default drop-shadow-md"
                  >
                    {icon}
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-300">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Bạn chưa có nhãn dán nào. Hãy chăm chỉ học tập nhé!</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black text-gray-700 mb-6 flex items-center gap-2">
              📚 Dụng cụ học tập của bạn
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {SHOP_ITEMS.supplies
                .filter(item => stats.unlockedItems.includes(item.id))
                .map(item => (
                  <Card 
                    key={item.id} 
                    className="p-4 flex flex-col items-center gap-2 border-green-100 bg-green-50/30"
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{item.name}</span>
                  </Card>
                ))}
              {SHOP_ITEMS.supplies.filter(item => stats.unlockedItems.includes(item.id)).length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 font-bold bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  Bạn chưa có dụng cụ học tập nào. Hãy ghé cửa hàng nhé!
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};


export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
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
    totalStarsEarned: 0,
    badges: ['newbie'],
    unlockedItems: ['default_bg', 'bird'],
    stickers: [],
    activeWallpaper: 'default_bg',
    activeCharacter: 'bird'
  });
  const [showAssistantMsg, setShowAssistantMsg] = useState(true);
  const [assistantMsg, setAssistantMsg] = useState("Chào bạn! Hôm nay chúng mình cùng học thật vui nhé!");

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Load data from Firestore or LocalStorage (for guests)
  useEffect(() => {
    if (!user) {
      if (isAuthReady) {
        // Load from localStorage for guests
        const gSchedule = localStorage.getItem('guest_schedule');
        const gHomework = localStorage.getItem('guest_homework');
        const gSessions = localStorage.getItem('guest_studySessions');
        const gStars = localStorage.getItem('guest_stars');
        const gStats = localStorage.getItem('guest_stats');
        
        if (gSchedule || gHomework || gSessions || gStats) {
          if (gSchedule) setSchedule(JSON.parse(gSchedule));
          if (gHomework) setHomework(JSON.parse(gHomework));
          if (gSessions) setStudySessions(JSON.parse(gSessions));
          if (gStars) setStars(parseInt(gStars));
          if (gStats) setStats(JSON.parse(gStats));
        } else {
          // No guest data found, generate sample data automatically
          generateGuestSampleData();
        }
        setUserName('Khách');
      }
      return;
    }

    const userId = user.uid;

    // User profile listener
    const unsubUser = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.userName || '');
        setStats(prev => ({ ...prev, ...data }));
        setStars(data.stars || 0);
      } else {
        setShowNameInput(true);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`));

    // Schedule listener
    const unsubSchedule = onSnapshot(collection(db, 'users', userId, 'schedule'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
      setSchedule(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/schedule`));

    // Homework listener
    const unsubHomework = onSnapshot(collection(db, 'users', userId, 'homework'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Homework));
      setHomework(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/homework`));

    // Study sessions listener
    const unsubSessions = onSnapshot(collection(db, 'users', userId, 'studySessions'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySession));
      setStudySessions(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/studySessions`));

    // Backpack items listener
    const unsubBackpack = onSnapshot(collection(db, 'users', userId, 'backpackItems'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as BackpackItem));
      setBackpackItems(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/backpackItems`));

    return () => {
      unsubUser();
      unsubSchedule();
      unsubHomework();
      unsubSessions();
      unsubBackpack();
    };
  }, [user]);

  // Sync stars to stats
  useEffect(() => {
    if (user && stats.stars !== stars) {
      updateDoc(doc(db, 'users', user.uid), { 
        stars,
        totalStarsEarned: stats.totalStarsEarned || 0
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
    }
  }, [stars, user, stats.totalStarsEarned]);

  // Save Name
  const saveUserName = async (name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        userName: name,
        stars: stars || 0,
        totalStarsEarned: stats.totalStarsEarned || 0,
        daysOnTime: stats.daysOnTime || 0,
        homeworkCompleted: stats.homeworkCompleted || 0,
        badges: stats.badges || ['newbie'],
        unlockedItems: stats.unlockedItems || ['default_bg', 'bird'],
        stickers: stats.stickers || [],
        activeWallpaper: stats.activeWallpaper || 'default_bg',
        activeCharacter: stats.activeCharacter || 'bird',
        lastDailyRewardDate: stats.lastDailyRewardDate || null
      }, { merge: true });
      setUserName(name);
      setShowNameInput(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

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

  const handleSessionComplete = async () => {
    if (timerMode === 'break') {
      setAssistantMsg("Hết giờ nghỉ rồi! Sẵn sàng học tiếp chưa? 📚");
      return;
    }

    addStars(10, 'hoàn thành phiên học');
    setStudyJourneyProgress(prev => (prev + 1) % (STUDY_JOURNEY.length * 10));
    setShowCompletionPopup(true);
    
    if (currentSessionId) {
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'studySessions', currentSessionId), {
            status: 'completed',
            completedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/studySessions/${currentSessionId}`);
        }
      } else {
        setStudySessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s));
      }
    }
  };

  // Weekly Reset Logic (Monday)
  useEffect(() => {
    const performReset = async () => {
      if (!user || studySessions.length === 0 || !stats) return;

      const now = new Date();
      // Get current week identifier (ISO Week: Year-Wxx)
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const currentWeek = `${d.getUTCFullYear()}-W${weekNo}`;

      if (stats.lastResetWeek !== currentWeek) {
        try {
          // Reset all sessions to upcoming
          const batchPromises = studySessions.map(session => {
            if (session.status !== 'upcoming') {
              return updateDoc(doc(db, 'users', user.uid, 'studySessions', session.id), {
                status: 'upcoming',
                completedAt: null
              });
            }
            return Promise.resolve();
          });

          await Promise.all(batchPromises);

          // Update lastResetWeek in user profile
          await updateDoc(doc(db, 'users', user.uid), {
            lastResetWeek: currentWeek
          });
          
          setAssistantMsg("Chào tuần mới! Lịch học của bạn đã được làm mới rồi đấy. Cố gắng lên nhé! ✨");
          setShowAssistantMsg(true);
        } catch (err) {
          console.error('Weekly reset failed:', err);
        }
      }
    };

    performReset();
  }, [user, studySessions.length, stats.lastResetWeek]);

  const startTimer = async (mode: StudyMode, minutes: number, sessionId?: string) => {
    if (currentSessionId && currentSessionId !== sessionId) {
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'studySessions', currentSessionId), {
            status: 'upcoming'
          });
        } catch (err) {
          console.error("Failed to reset previous session", err);
        }
      } else {
        setStudySessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, status: 'upcoming' } : s));
      }
    }

    setTimerMode(mode);
    playSound('start');
    setFocusTime(minutes * 60);
    setTimerTotalTime(minutes * 60);
    setIsTimerActive(true);
    setCurrentSessionId(sessionId || null);
    setAssistantMsg("Bắt đầu học thôi! Mình sẽ đếm giờ giúp bạn! ⏱️");
    
    if (sessionId) {
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'studySessions', sessionId), {
            status: 'studying'
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/studySessions/${sessionId}`);
        }
      } else {
        setStudySessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'studying' } : s));
      }
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
    const reminders = [
      "Đừng quên uống nước nhé! 💧",
      "Ngồi thẳng lưng lên nào! 🧘",
      "Mắt cách xa màn hình một chút nhé! 👀",
      "Hôm nay bạn đã làm rất tốt! 🌟",
      "Cố gắng hoàn thành bài tập sớm để được chơi game nhé! 🎮",
      "Nếu thấy khó quá, hãy nhờ ba mẹ hoặc thầy cô giúp đỡ nhé! 👨‍👩‍👧",
      "Bạn có biết: Não bộ cần nghỉ ngơi để ghi nhớ tốt hơn không? 🧠",
      "Hãy luôn giữ nụ cười trên môi nhé! 😊"
    ];
    const interval = setInterval(() => {
      if (!isTimerActive) {
        setAssistantMsg(reminders[Math.floor(Math.random() * reminders.length)]);
        setShowAssistantMsg(true);
        setTimeout(() => setShowAssistantMsg(false), 5000);
      }
    }, 60000); // Every 1 minute
    return () => clearInterval(interval);
  }, [isTimerActive]);

  // --- Guest Data Helpers ---

  const generateGuestSampleData = () => {
    const { schedule: sampleSchedule, homework: sampleHomework, studySessions: sampleSessions } = getSampleData();

    setSchedule(sampleSchedule);
    setHomework(sampleHomework);
    setStudySessions(sampleSessions);
    setStars(250);
    setStats(prev => ({ ...prev, stars: 250, totalStarsEarned: 250 }));
    
    setAssistantMsg("Đã tạo dữ liệu mẫu cho bạn rồi đó! Hãy khám phá các chức năng nhé! ✨");
    playSound('success');
  };

  const clearGuestData = () => {
    setSchedule([]);
    setHomework([]);
    setStudySessions([]);
    setStars(0);
    setStats(prev => ({
      ...prev,
      stars: 0,
      totalStarsEarned: 0,
      unlockedItems: ['default_bg', 'bird'],
      stickers: [],
      activeWallpaper: 'default_bg',
      activeCharacter: 'bird'
    }));
    
    localStorage.removeItem('guest_schedule');
    localStorage.removeItem('guest_homework');
    localStorage.removeItem('guest_studySessions');
    localStorage.removeItem('guest_stars');
    localStorage.removeItem('guest_stats');
    
    setAssistantMsg("Đã xóa hết dữ liệu khách. Bạn có thể bắt đầu lại từ đầu!");
    playSound('delete');
  };

  // Sync guest data to localStorage
  useEffect(() => {
    if (!user && isAuthReady) {
      localStorage.setItem('guest_schedule', JSON.stringify(schedule));
      localStorage.setItem('guest_homework', JSON.stringify(homework));
      localStorage.setItem('guest_studySessions', JSON.stringify(studySessions));
      localStorage.setItem('guest_stars', stars.toString());
      localStorage.setItem('guest_stats', JSON.stringify(stats));
    }
  }, [user, isAuthReady, schedule, homework, studySessions, stars, stats]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const todayItems = homework.filter(h => h.createdAt?.startsWith(today));
    if (todayItems.length > 0 && todayItems.every(h => h.status === 'completed')) {
      const lastRewardDate = stats.lastDailyRewardDate;
      if (lastRewardDate !== today) {
        addStars(50, 'hoàn thành tất cả bài tập trong ngày');
        const newSticker = ['🚀', '🌈', '🦄', '🦖', '🍕', '🍦', '🎨', '🎸'][Math.floor(Math.random() * 8)];
        
        updateDoc(doc(db, 'users', user.uid), {
          stickers: [...(stats.stickers || []), newSticker],
          lastDailyRewardDate: today
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));

        setAssistantMsg(`Chúc mừng! Bạn đã hoàn thành hết bài tập và nhận được 50 sao cùng 1 sticker ${newSticker} mới! 🎊`);
      }
    }
  }, [homework, user, stats.lastDailyRewardDate]);

  const addStars = async (amount: number, reason: string) => {
    const newStars = stars + amount;
    const newTotalStars = (stats.totalStarsEarned || 0) + amount;
    setStars(newStars);
    setStats(prev => ({ ...prev, stars: newStars, totalStarsEarned: newTotalStars }));
    setAssistantMsg(`Giỏi quá! +${amount} sao vì ${reason}!`);
    setShowAssistantMsg(true);
    playSound('success');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500']
    });

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          stars: newStars,
          totalStarsEarned: newTotalStars
        });
      } catch (err) {
        console.error("Error saving stars:", err);
      }
    }
  };

  // --- Unified Actions ---

  const addScheduleItem = async (item: Omit<ScheduleItem, 'id'>) => {
    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'schedule'), item);
        addStars(2, 'thêm tiết học mới');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/schedule`);
      }
    } else {
      const newItem = { ...item, id: Date.now().toString() };
      setSchedule(prev => [...prev, newItem]);
      addStars(2, 'thêm tiết học mới');
      playSound('success');
    }
  };

  const updateScheduleItem = async (id: string, item: Partial<ScheduleItem>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'schedule', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/schedule/${id}`);
      }
    } else {
      setSchedule(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
      playSound('success');
    }
  };

  const deleteScheduleItem = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'schedule', id));
        playSound('delete');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/schedule/${id}`);
      }
    } else {
      setSchedule(prev => prev.filter(i => i.id !== id));
      playSound('delete');
    }
  };

  const addHomework = async (item: Omit<Homework, 'id'>) => {
    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'homework'), item);
        addStars(5, 'thêm bài tập mới');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/homework`);
      }
    } else {
      const newItem = { ...item, id: Date.now().toString() };
      setHomework(prev => [...prev, newItem]);
      addStars(5, 'thêm bài tập mới');
      playSound('pop');
    }
  };

  const updateHomeworkStatus = async (id: string, status: HomeworkStatus) => {
    const h = homework.find(item => item.id === id);
    if (!h) return;

    if (status === 'completed' && h.status !== 'completed') {
      playSound('success');
      addStars(10, `hoàn thành bài tập ${h.subject}`);
      setShowHomeworkPopup({ show: true, subject: h.subject });
    } else {
      playSound('click');
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'homework', id), { status });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/homework/${id}`);
      }
    } else {
      setHomework(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const deleteHomework = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'homework', id));
        playSound('delete');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/homework/${id}`);
      }
    } else {
      setHomework(prev => prev.filter(h => h.id !== id));
      playSound('delete');
    }
  };

  const addStudySession = async (session: Omit<StudySession, 'id'>) => {
    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'studySessions'), session);
        addStars(5, 'thêm lịch học mới');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/studySessions`);
      }
    } else {
      const newSession = { ...session, id: Date.now().toString() };
      setStudySessions(prev => [...prev, newSession]);
      addStars(5, 'thêm lịch học mới');
      playSound('pop');
    }
  };

  const deleteStudySession = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'studySessions', id));
        playSound('delete');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/studySessions/${id}`);
      }
    } else {
      setStudySessions(prev => prev.filter(s => s.id !== id));
      playSound('delete');
    }
  };

  const updateStudySessionStatus = async (id: string, status: 'upcoming' | 'studying' | 'completed') => {
    const s = studySessions.find(item => item.id === id);
    if (!s) return;

    if (status === 'completed' && s.status !== 'completed') {
      playSound('success');
      addStars(5, 'hoàn thành lịch học');
      if (currentSessionId === id) {
        setIsTimerActive(false);
        setCurrentSessionId(null);
      }
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'studySessions', id), { status });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/studySessions/${id}`);
      }
    } else {
      setStudySessions(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const handleUnlock = async (itemId: string, price: number, type: 'wallpaper' | 'character' | 'sticker' | 'supplies') => {
    if (stars < price) {
      setAssistantMsg("Bạn chưa đủ sao rồi, cố gắng học thêm nhé!");
      return;
    }

    const newStars = stars - price;
    const newUnlockedItems = [...stats.unlockedItems, itemId];
    let newStickers = [...(stats.stickers || [])];
    let activeWallpaper = stats.activeWallpaper;
    let activeCharacter = stats.activeCharacter;

    if (type === 'sticker') {
      const stickerItem = SHOP_ITEMS.stickers.find(s => s.id === itemId);
      if (stickerItem) {
        newStickers = [...newStickers, stickerItem.icon];
      }
    } else {
      if (type === 'wallpaper') activeWallpaper = itemId;
      if (type === 'character') activeCharacter = itemId;
    }

    setStars(newStars);
    setStats(prev => ({
      ...prev,
      stars: newStars,
      unlockedItems: type === 'sticker' ? prev.unlockedItems : newUnlockedItems,
      stickers: newStickers,
      activeWallpaper,
      activeCharacter
    }));

    if (user) {
      try {
        const updateData: any = { 
          stars: newStars,
          unlockedItems: type === 'sticker' ? stats.unlockedItems : newUnlockedItems,
          stickers: newStickers,
          activeWallpaper,
          activeCharacter
        };
        await updateDoc(doc(db, 'users', user.uid), updateData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }

    playSound('success');
    setAssistantMsg(`Chúc mừng! Bạn đã mở khóa ${type === 'wallpaper' ? 'hình nền' : type === 'character' ? 'nhân vật' : type === 'sticker' ? 'nhãn dán' : 'dụng cụ'} mới!`);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 }
    });
  };

  const handleSelect = async (itemId: string, type: 'wallpaper' | 'character') => {
    setStats(prev => ({
      ...prev,
      [type === 'wallpaper' ? 'activeWallpaper' : 'activeCharacter']: itemId
    }));

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          [type === 'wallpaper' ? 'activeWallpaper' : 'activeCharacter']: itemId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    playSound('success');
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
    setAssistantMsg("Đang tạo danh sách chuẩn bị cặp sách...");

    try {
      const subjects = Array.from(new Set(tomorrowSchedule.map(s => s.subject)));
      
      const newBackpackItems: any[] = [];
      
      // 1. Dụng cụ dùng chung mỗi ngày đều có
      const commonItems = [
        "Bút, viết",
        "Gọt bút chì",
        "Thước kẻ, Compa",
        "Vở ghi chép",
        "Hộp bút",
        "Bình nước cá nhân",
        "Bảng con, phấn viết, lau bảng",
        "Khăn giấy"
      ];
      
      commonItems.forEach(item => {
        newBackpackItems.push({
          name: item,
          subject: "Dụng cụ chung",
          prepared: false
        });
      });

      // 2. Dụng cụ đặc thù theo từng môn học
      const subjectItemsMap: Record<string, string[]> = {
        "Tiếng Việt": ["Sách, tập Tiếng Việt"],
        "Toán": ["Sách, tập Toán", "Bộ đồ dùng học Toán"],
        "Ngoại ngữ": ["Sách, tập Tiếng Anh", "Từ điển"],
        "Tiếng Anh": ["Sách, tập Tiếng Anh", "Từ điển"], // Thêm alias cho Ngoại ngữ
        "Tự nhiên và Xã hội": ["Sách, tập Tự nhiên và xã hội"],
        "Khoa học": ["Sách tập Khoa học"],
        "Lịch sử và Địa lý": ["Sách tập LS&ĐL"],
        "Tin học": ["Sách, tập Tin học"],
        "Công nghệ": ["Sách Tập Công nghệ"],
        "Giáo dục thể chất": ["Đồng phục thể dục", "giày", "nón", "khăn lau mồ hôi"],
        "Thể dục": ["Đồng phục thể dục", "giày", "nón", "khăn lau mồ hôi"], // Thêm alias
        "Mỹ thuật": ["Sách Mỹ thuật", "Giấy vẽ", "Bút chì màu"],
        "Âm nhạc": ["Sách, tập Âm nhạc", "Phách gõ"],
        "Hoạt động trải nghiệm": ["Sổ tay ghi chép nhật ký"]
      };

      subjects.forEach(subject => {
        const items = subjectItemsMap[subject as string];
        if (items) {
          items.forEach(item => {
            newBackpackItems.push({
              name: item,
              subject: subject as string,
              prepared: false
            });
          });
        }
      });

      const itemsWithIds = newBackpackItems.map((item, idx) => ({ ...item, id: `bp-${idx}-${Date.now()}` }));
      setBackpackItems(itemsWithIds);

      if (user) {
        // Clear old items and add new ones
        const oldDocs = await getDocs(collection(db, 'users', user.uid, 'backpackItems'));
        await Promise.all(oldDocs.docs.map(d => deleteDoc(d.ref)));
        await Promise.all(newBackpackItems.map((item: any) => addDoc(collection(db, 'users', user.uid, 'backpackItems'), item)));
      }

      setAssistantMsg("Xong rồi! Bạn hãy kiểm tra danh sách chuẩn bị cặp sách nhé!");
    } catch (error) {
      console.error("Error generating backpack list:", error);
      setAssistantMsg("Có lỗi khi tạo danh sách rồi, bạn tự chuẩn bị theo thời khóa biểu nhé!");
    } finally {
      setIsGeneratingBackpack(false);
    }
  };

  const toggleBackpackItem = async (id: string) => {
    const item = backpackItems.find(i => i.id === id);
    if (!item) return;

    const newPrepared = !item.prepared;
    const updatedItems = backpackItems.map(i => i.id === id ? { ...i, prepared: newPrepared } : i);
    setBackpackItems(updatedItems);

    // Check if all items are prepared
    const allPrepared = updatedItems.every(i => i.prepared);
    const previouslyAllPrepared = backpackItems.every(i => i.prepared);
    if (allPrepared && !previouslyAllPrepared && updatedItems.length > 0) {
      addStars(5, 'chuẩn bị cặp sách đầy đủ');
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'backpackItems', id), { prepared: newPrepared });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/backpackItems/${id}`);
      }
    }
  };

  // --- Views ---


  const state = { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay };
  const actions = { 
    setAssistantMsg, 
    setShowAssistantMsg, 
    addStars, 
    setIsFocusMode, 
    setActiveTab, 
    setSelectedDay, 
    setIsTimerActive, 
    setFocusTime, 
    setCurrentSessionId, 
    startTimer, 
    generateBackpackList, 
    toggleBackpackItem, 
    handleUnlock, 
    handleSelect, 
    setShowHomeworkPopup, 
    setTimerMode, 
    generateGuestSampleData, 
    clearGuestData,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    addHomework,
    updateHomeworkStatus,
    deleteHomework,
    addStudySession,
    deleteStudySession,
    updateStudySessionStatus
  };
  return (
    <div className="min-h-screen font-sans text-gray-800 pb-20 md:pb-0 md:pl-24 pt-16 md:pt-20 transition-colors duration-500" style={{ backgroundColor: activeBgColor }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 md:left-24 h-16 md:h-20 bg-white/80 backdrop-blur-md z-30 flex items-center justify-between px-6 border-b-2 border-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg text-white">
            {activeCharIcon}
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Chào mừng bạn nhỏ</div>
            <div className="text-sm md:text-lg font-black text-blue-900 leading-none flex items-center gap-2">
              {user ? (userName || 'Bạn nhỏ') : 'Khách'}
              {user && (
                <button 
                  onClick={() => setShowNameInput(true)}
                  className="p-1 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={12} className="text-blue-400" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 px-4 py-2 rounded-2xl flex items-center gap-2 border-2 border-yellow-200 shadow-sm">
            <Star className="text-yellow-500 fill-yellow-500" size={18} />
            <span className="text-lg font-black text-yellow-700">{stars}</span>
          </div>
          {user ? (
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Đăng xuất"
            >
              <User size={20} />
            </button>
          ) : (
            <Button onClick={loginWithGoogle} variant="primary" className="py-2 px-4 text-xs">
              Đăng nhập
            </Button>
          )}
        </div>
      </header>

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
            <span className={`hidden md:block text-[10px] font-black mt-1 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}>{item.label}</span>
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
            
            {activeTab === 'home' && <HomeView state={state} actions={actions} />}
            {activeTab === 'schedule' && <ScheduleView state={state} actions={actions} />}
            {activeTab === 'homework' && <HomeworkView state={state} actions={actions} />}
            {activeTab === 'timetable' && <TimeTableView state={state} actions={actions} />}
            {activeTab === 'achievements' && <AchievementsView state={state} actions={actions} />}
            {activeTab === 'shop' && <ShopView state={state} actions={actions} />}
            {activeTab === 'minigame' && <MiniGameView state={state} actions={actions} />}
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

      {/* Name Input Modal */}
      <AnimatePresence>
        {showNameInput && (
          <div className="fixed inset-0 bg-indigo-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl border-8 border-blue-100"
            >
              <div className="text-7xl mb-6">👋</div>
              <h3 className="text-3xl font-black text-blue-900 mb-2">Chào bạn mới!</h3>
              <p className="text-gray-500 font-bold mb-8">Hãy cho mình biết tên của bạn để chúng mình làm quen nhé!</p>
              
              <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn..."
                    className="w-full px-6 py-4 rounded-2xl border-4 border-blue-50 focus:border-blue-400 outline-none text-lg font-bold text-center transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userName.trim()) {
                        setShowNameInput(false);
                      }
                    }}
                  />
                </div>
                
                <Button 
                  onClick={() => {
                    if (userName.trim()) {
                      saveUserName(userName.trim());
                    }
                  }} 
                  variant="primary" 
                  className="w-full py-4 text-xl"
                  disabled={!userName.trim()}
                >
                  Bắt đầu thôi!
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
