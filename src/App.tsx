/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

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
  Palette,
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
  Target,
  Calculator,
  X,
  XCircle,
  Send,
  MessageSquare,
  Tag,
  Paperclip,
  CalendarDays,
  BookMarked,
  Printer,
  LayoutGrid,
  List,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem, Homework, StudySession, UserStats, Subject, BackpackItem, HomeworkStatus, StudyMode, Note, ChecklistItem } from './types';
import { SUBJECT_CONFIG, DAYS, BADGES, SHOP_ITEMS, STUDY_JOURNEY, WORD_LIST, WORD_RESCUE_LIST, SITUATIONS, STICKER_BOOK_SCENES, getSampleData } from './constants';
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
  getDocs,
  limit,
  getCountFromServer
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
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  className?: string;
  disabled?: boolean;
  key?: string | number;
}) => {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1',
    secondary: 'bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1',
    accent: 'bg-yellow-400 hover:bg-yellow-500 text-blue-900 shadow-[0_4px_0_rgb(202,138,4)] active:shadow-none active:translate-y-1',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1',
    outline: 'bg-transparent border-2 border-gray-200 text-gray-700 hover:bg-gray-50 active:translate-y-1'
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

const SortableNote = ({ note, colorConfig, updateNote, handleEdit, deleteNote }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`break-inside-avoid p-5 rounded-2xl border-2 shadow-sm relative group transition-all ${colorConfig.class} ${note.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-3 left-3 cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-black/5 text-black/30 hover:text-black/50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <LayoutGrid size={16} />
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
          className={`p-1.5 rounded-lg transition-colors ${note.isPinned ? 'bg-black/10 text-black' : 'hover:bg-black/5 text-black/50 hover:text-black'}`}
        >
          <Star size={16} className={note.isPinned ? 'fill-current' : ''} />
        </button>
        <button 
          onClick={() => handleEdit(note)}
          className="p-1.5 rounded-lg hover:bg-black/5 text-black/50 hover:text-black transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => deleteNote(note.id)}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {note.isPinned && (
        <div className="absolute -top-3 -left-3 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-md border-2 border-white">
          <Star size={14} className="fill-current" />
        </div>
      )}

      <div 
        className="cursor-pointer mt-4"
        onClick={() => updateNote(note.id, { isCompleted: !note.isCompleted })}
      >
        {note.title && (
          <h3 className={`font-bold text-lg mb-2 pr-20 flex items-center gap-2 ${note.isCompleted ? 'line-through' : ''}`}>
            {note.icon && <span>{note.icon}</span>}
            {note.title}
          </h3>
        )}
        {note.content && (
          <p className={`whitespace-pre-wrap text-sm leading-relaxed ${note.isCompleted ? 'line-through' : ''} ${!note.title ? 'pr-20' : ''}`}>
            {!note.title && note.icon && <span className="mr-2">{note.icon}</span>}
            {note.content}
          </p>
        )}
      </div>

      {note.checklist && note.checklist.length > 0 && (
        <div className="mt-3 space-y-2">
          {note.checklist.map((item: any) => (
            <div 
              key={item.id} 
              className="flex items-start gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const newChecklist = note.checklist!.map((c: any) => c.id === item.id ? { ...c, isCompleted: !c.isCompleted } : c);
                updateNote(note.id, { checklist: newChecklist });
              }}
            >
              <div className={`mt-0.5 min-w-[16px] h-4 rounded border flex items-center justify-center ${item.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400'}`}>
                {item.isCompleted && <Check size={12} />}
              </div>
              <span className={`text-sm ${item.isCompleted ? 'line-through opacity-60' : ''}`}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {note.files && note.files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.files.map((file: any, idx: number) => (
            <div key={idx} className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg text-xs font-medium">
              {file.type.startsWith('image/') ? <ImageIcon size={12} /> : <Paperclip size={12} />}
              <span className="truncate max-w-[100px]">{file.name}</span>
            </div>
          ))}
        </div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {note.tags.map((tag: any, idx: number) => (
            <span key={idx} className="bg-black/10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="mt-4 flex flex-col gap-2 text-xs font-medium opacity-60">
        <div className="flex items-center justify-between">
          <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
          {note.isCompleted && <span className="flex items-center gap-1"><Check size={14} /> Đã xong</span>}
        </div>
        {note.reminderDate && (
          <div className="flex items-center gap-1 text-red-600 bg-red-100/50 w-fit px-2 py-1 rounded-md">
            <Bell size={12} /> Nhắc nhở: {new Date(note.reminderDate).toLocaleString('vi-VN')}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const NotesView = ({ state, actions }: { state: any, actions: any }) => {
  const { notes } = state;
  const { addNote, updateNote, deleteNote } = actions;

  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-yellow-100');
  const [isPinned, setIsPinned] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'tomorrow' | 'reminder' | 'pinned' | 'completed'>('all');
  const [quickNoteText, setQuickNoteText] = useState('');
  
  const [icon, setIcon] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderRepeat, setReminderRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [reminderDays, setReminderDays] = useState<number[]>([]);

  const NOTE_ICONS = [
    { icon: '📚', label: 'Học tập' },
    { icon: '🎯', label: 'Mục tiêu' },
    { icon: '🎮', label: 'Sở thích' },
    { icon: '🛒', label: 'Mua sắm' },
    { icon: '💡', label: 'Ý tưởng' },
    { icon: '😊', label: 'Cảm xúc' },
  ];

  const colors = [
    { id: 'bg-yellow-100', class: 'bg-yellow-100 border-yellow-200 text-yellow-900' },
    { id: 'bg-blue-100', class: 'bg-blue-100 border-blue-200 text-blue-900' },
    { id: 'bg-green-100', class: 'bg-green-100 border-green-200 text-green-900' },
    { id: 'bg-pink-100', class: 'bg-pink-100 border-pink-200 text-pink-900' },
    { id: 'bg-purple-100', class: 'bg-purple-100 border-purple-200 text-purple-900' },
  ];

  const PREDEFINED_TAGS = [
    'Học tập', 'Việc cần làm', 'Nhắc nhở', 'Ghi nhớ', 'Lưu ý', 
    'Mục tiêu', 'Kế hoạch', 'Ý tưởng', 'Sở thích', 'Mua sắm', 
    'Cảm xúc', 'Thành tích'
  ];

  const totalNotes = notes.length;
  const completedNotes = notes.filter((n: Note) => n.isCompleted).length;
  const pinnedNotes = notes.filter((n: Note) => n.isPinned).length;
  const reminderNotes = notes.filter((n: Note) => n.reminderDate).length;
  
  const tagCounts = notes.reduce((acc: any, note: Note) => {
    if (note.tags) {
      note.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const handleSave = () => {
    if (!title.trim() && !content.trim() && checklist.length === 0) return;

    const noteData = {
      title,
      content,
      color,
      icon,
      isPinned,
      reminderDate: reminderDate || null,
      reminderTime: reminderTime || null,
      reminderRepeat,
      reminderDays,
      tags,
      files,
      checklist
    };

    if (editingNote) {
      updateNote(editingNote.id, noteData);
    } else {
      addNote({
        ...noteData,
        isCompleted: false,
        createdAt: Date.now()
      });
    }

    resetForm();
  };

  const handleQuickNote = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickNoteText.trim()) {
      e.preventDefault();
      addNote({
        title: '',
        content: quickNoteText.trim(),
        color: 'bg-yellow-100',
        isPinned: false,
        isCompleted: false,
        createdAt: Date.now()
      });
      setQuickNoteText('');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('bg-yellow-100');
    setIcon('');
    setIsPinned(false);
    setReminderDate('');
    setReminderTime('');
    setReminderRepeat('none');
    setReminderDays([]);
    setTags([]);
    setTagInput('');
    setFiles([]);
    setChecklist([]);
    setNewChecklistItem('');
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setColor(note.color || 'bg-yellow-100');
    setIcon(note.icon || '');
    setIsPinned(note.isPinned || false);
    setReminderDate(note.reminderDate || '');
    setReminderTime(note.reminderTime || '');
    setReminderRepeat(note.reminderRepeat || 'none');
    setReminderDays(note.reminderDays || []);
    setTags(note.tags || []);
    setFiles(note.files || []);
    setChecklist(note.checklist || []);
    setIsAdding(true);
  };

  const handleAddChecklist = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newChecklistItem.trim()) {
      e.preventDefault();
      setChecklist([...checklist, { id: Date.now().toString(), text: newChecklistItem.trim(), isCompleted: false }]);
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach((file: File) => {
      if (file.size > 500000) { // Limit to 500KB to avoid Firestore 1MB limit easily
        alert(`File ${file.name} quá lớn. Vui lòng chọn file dưới 500KB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFiles(prev => [...prev, {
            name: file.name,
            url: event.target!.result as string,
            type: file.type
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const sortedNotes = [...notes]
    .filter((note: Note) => {
      if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = note.title?.toLowerCase().includes(query);
        const matchContent = note.content?.toLowerCase().includes(query);
        const matchChecklist = note.checklist?.some(item => item.text.toLowerCase().includes(query));
        if (!matchTitle && !matchContent && !matchChecklist) return false;
      }

      if (filterType === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return note.reminderDate === todayStr;
      }
      if (filterType === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        return note.reminderDate === tomorrowStr;
      }
      if (filterType === 'reminder') return !!note.reminderDate || !!note.reminderTime;
      if (filterType === 'pinned') return note.isPinned;
      if (filterType === 'completed') return note.isCompleted;

      return true;
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Sort by order if available, otherwise fallback to createdAt
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return b.createdAt - a.createdAt;
    });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sortedNotes.findIndex((note: Note) => note.id === active.id);
      const newIndex = sortedNotes.findIndex((note: Note) => note.id === over.id);

      const newSortedNotes = arrayMove(sortedNotes, oldIndex, newIndex);
      
      // Update order in backend
      newSortedNotes.forEach((note: Note, index: number) => {
        updateNote(note.id, { order: index });
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <Edit2 className="text-blue-500" size={32} />
          Ghi chú cá nhân
        </h2>
        <Button onClick={() => setIsAdding(true)} className="bg-blue-500 hover:bg-blue-600">
          <Plus size={20} /> Thêm ghi chú
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
          <Edit2 size={20} />
        </div>
        <input
          type="text"
          placeholder="Ghi chú nhanh (Ví dụ: mua bút mới) - Nhấn Enter để lưu"
          value={quickNoteText}
          onChange={(e) => setQuickNoteText(e.target.value)}
          onKeyDown={handleQuickNote}
          className="flex-1 bg-transparent border-none outline-none font-medium text-gray-700 placeholder-gray-400"
        />
        {quickNoteText && (
          <button onClick={() => handleQuickNote({ key: 'Enter', preventDefault: () => {} } as any)} className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors">
            <Send size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center gap-2">
          <div className="pl-3 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú, checklist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-medium text-gray-700 placeholder-gray-400 py-2"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="pr-3 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-gray-100 p-1 rounded-xl whitespace-nowrap">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'today', label: 'Hôm nay' },
              { id: 'tomorrow', label: 'Ngày mai' },
              { id: 'reminder', label: 'Có nhắc nhở' },
              { id: 'pinned', label: 'Đã ghim' },
              { id: 'completed', label: 'Đã xong' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id as any)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${filterType === filter.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <BookMarked size={20} />
          </div>
          <h4 className="font-bold text-blue-900 text-lg">Tổng hợp ghi chú</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">Tổng số</div>
            <div className="text-2xl font-black text-gray-800">{totalNotes}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">Đã hoàn thành</div>
            <div className="text-2xl font-black text-green-600">{completedNotes}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">Đã ghim</div>
            <div className="text-2xl font-black text-yellow-600">{pinnedNotes}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">Có nhắc nhở</div>
            <div className="text-2xl font-black text-red-500">{reminderNotes}</div>
          </div>
        </div>

        {Object.keys(tagCounts).length > 0 && (
          <div>
            <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center justify-between">
              <span>Phân loại theo thẻ:</span>
              {selectedTag && (
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Bỏ lọc
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-all ${
                  selectedTag === null 
                    ? 'bg-blue-600 text-white border border-blue-600' 
                    : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                <span>Tất cả</span>
                <span className={`${selectedTag === null ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'} px-1.5 py-0.5 rounded-md text-[10px]`}>
                  {totalNotes}
                </span>
              </button>
              {Object.entries(tagCounts).sort((a: any, b: any) => b[1] - a[1]).map(([tag, count]) => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-all ${
                    selectedTag === tag 
                      ? 'bg-blue-600 text-white border border-blue-600' 
                      : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span>{tag}</span>
                  <span className={`${selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'} px-1.5 py-0.5 rounded-md text-[10px]`}>
                    {count as number}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Edit2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-bold text-gray-400">Chưa có ghi chú nào!</p>
          <p className="text-gray-500 mt-2">Hãy tạo ghi chú đầu tiên của bạn nhé.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-500 font-medium italic flex items-center gap-2 px-2">
            <AlertCircle size={16} className="text-blue-500" />
            Nhấn vào từng ghi chú để kết thúc. Kéo thả để sắp xếp lại vị trí.
          </p>
          <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={sortedNotes.map((n: Note) => n.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                <AnimatePresence>
            {sortedNotes.map((note: Note) => {
              const colorConfig = colors.find(c => c.id === note.color) || colors[0];
                    return (
                      <SortableNote 
                        key={note.id} 
                        note={note} 
                        colorConfig={colorConfig} 
                        updateNote={updateNote} 
                        handleEdit={handleEdit} 
                        deleteNote={deleteNote} 
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
    )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingNote ? 'Sửa ghi chú' : 'Thêm ghi chú mới'}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingNote(null);
                  setTitle('');
                  setContent('');
                  setColor('bg-yellow-100');
                  setIsPinned(false);
                }} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="appearance-none w-12 h-[50px] text-center rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-xl bg-white cursor-pointer"
                  >
                    <option value="">📝</option>
                    {NOTE_ICONS.map(i => (
                      <option key={i.label} value={i.icon}>{i.icon}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Tiêu đề (không bắt buộc)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-bold text-lg transition-all"
                />
              </div>
              
              <textarea
                placeholder="Nội dung ghi chú..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none min-h-[100px] resize-y transition-all"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Checklist</label>
                <div className="space-y-2 mb-2">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center ${item.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}
                      >
                        {item.isCompleted && <Check size={14} />}
                      </button>
                      <input 
                        type="text" 
                        value={item.text}
                        onChange={(e) => setChecklist(checklist.map(c => c.id === item.id ? { ...c, text: e.target.value } : c))}
                        className={`flex-1 p-1.5 text-sm border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none ${item.isCompleted ? 'line-through text-gray-400' : ''}`}
                      />
                      <button onClick={() => removeChecklistItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Thêm mục checklist (nhấn Enter)..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={handleAddChecklist}
                    className="flex-1 p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Màu sắc</label>
                <div className="flex gap-3">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${c.class} ${color === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'border-transparent hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-gray-400" />
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="flex-1 p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    />
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-32 p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <select
                      value={reminderRepeat}
                      onChange={(e) => setReminderRepeat(e.target.value as any)}
                      className="p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    >
                      <option value="none">Không lặp lại</option>
                      <option value="daily">Mỗi ngày</option>
                      <option value="weekly">Hàng tuần</option>
                    </select>
                    {reminderRepeat === 'weekly' && (
                      <div className="flex gap-1">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (reminderDays.includes(i)) {
                                setReminderDays(reminderDays.filter(day => day !== i));
                              } else {
                                setReminderDays([...reminderDays, i]);
                              }
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-bold ${reminderDays.includes(i) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Tag size={18} className="text-gray-400 mt-2" />
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            if (tags.includes(tag)) {
                              removeTag(tag);
                            } else {
                              setTags([...tags, tag]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tags.includes(tag) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Thêm thẻ khác (nhấn Enter)..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="flex-1 p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                      />
                    </div>
                    
                    {tags.filter(t => !PREDEFINED_TAGS.includes(t)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.filter(t => !PREDEFINED_TAGS.includes(t)).map((tag, idx) => (
                          <span key={idx} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-blue-900"><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Paperclip size={18} className="text-gray-400 mt-2" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {files.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-sm border border-gray-100">
                            <div className="flex items-center gap-2 truncate">
                              {file.type.startsWith('image/') ? <ImageIcon size={14} className="text-gray-400" /> : <Paperclip size={14} className="text-gray-400" />}
                              <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${isPinned ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Star size={16} className={isPinned ? 'fill-current' : ''} />
                  {isPinned ? 'Đã ghim lên đầu' : 'Ghim lên đầu'}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingNote(null);
                    setTitle('');
                    setContent('');
                    setColor('bg-yellow-100');
                    setIsPinned(false);
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Lưu ghi chú
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const HomeView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, generateGuestSampleData, clearGuestData, setShowCalculator } = actions;

  const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todayIndex = today === 0 ? 6 : today - 1; // Adjust to 0-6 (Mon-Sun)
  const tomorrowIndex = (todayIndex + 1) % 7;

  const todaySchedule = useMemo(() => {
    return schedule.filter((item: any) => item.day === todayIndex).sort((a: any, b: any) => {
      const sA = a.session || 'morning';
      const sB = b.session || 'morning';
      if (sA !== sB) return sA === 'morning' ? -1 : 1;
      return a.period - b.period;
    });
  }, [schedule, todayIndex]);

  const tomorrowSchedule = useMemo(() => {
    return schedule.filter((item: any) => item.day === tomorrowIndex).sort((a: any, b: any) => {
      const sA = a.session || 'morning';
      const sB = b.session || 'morning';
      if (sA !== sB) return sA === 'morning' ? -1 : 1;
      return a.period - b.period;
    });
  }, [schedule, tomorrowIndex]);

  const todayHomework = useMemo(() => {
    return homework.filter((h: any) => h.status !== 'completed');
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

  const sortedBackpackItems = useMemo(() => {
    return [...backpackItems].sort((a: any, b: any) => {
      if (a.subject === "Dụng cụ chung" && b.subject !== "Dụng cụ chung") return -1;
      if (a.subject !== "Dụng cụ chung" && b.subject === "Dụng cụ chung") return 1;
      return 0;
    });
  }, [backpackItems]);

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

        <Card className="bg-indigo-50 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
              <Calendar className="text-indigo-500" /> Thời khóa biểu ngày mai
            </h2>
            <span className="text-sm font-medium bg-indigo-200 text-indigo-800 px-3 py-1 rounded-full">
              {DAYS[tomorrowIndex]}
            </span>
          </div>
          {tomorrowSchedule.length > 0 ? (
            <div className="space-y-6">
              {['morning', 'afternoon'].map(session => {
                const sessionItems = tomorrowSchedule.filter(i => (i.session || 'morning') === session);
                if (sessionItems.length === 0) return null;
                return (
                  <div key={session}>
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      {session === 'morning' ? <Sun size={12} /> : <CloudSun size={12} />}
                      {session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {sessionItems.map((item: any) => (
                        <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-indigo-100 flex flex-col items-center text-center">
                          <span className="text-xs font-bold text-gray-700">{item.subject}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Tiết {item.period}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500 italic">Ngày mai không có tiết học nào.</p>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-green-50 border-green-100">
            <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <BookText className="text-green-500" /> Danh sách bài tập chưa làm
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {todayHomework.map(h => (
                <div key={h.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-green-100">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-medium text-gray-700 flex-1">{h.content}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{h.subject}</span>
                </div>
              ))}
              {todayHomework.length === 0 && (
                <p className="text-center py-2 text-gray-500 text-sm">Tuyệt vời! Bạn đã hết bài tập rồi.</p>
              )}
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-100">
            <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
              <Clock className="text-yellow-500" /> Thời gian biểu hôm nay
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
          
          {sortedBackpackItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedBackpackItems.map(item => (
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
            <span className="text-xs font-bold text-blue-800">Thời khóa biểu</span>
          </button>
          <button onClick={() => setActiveTab('homework')} className="flex flex-col items-center gap-2 p-4 bg-green-100 rounded-2xl hover:bg-green-200 transition-colors">
            <BookText className="text-green-600" />
            <span className="text-xs font-bold text-green-800">Bài tập</span>
          </button>
          <button onClick={() => setActiveTab('notes')} className="flex flex-col items-center gap-2 p-4 bg-yellow-100 rounded-2xl hover:bg-yellow-200 transition-colors">
            <Edit2 className="text-yellow-600" />
            <span className="text-xs font-bold text-yellow-800">Ghi chú</span>
          </button>
          <button onClick={() => setActiveTab('achievements')} className="flex flex-col items-center gap-2 p-4 bg-purple-100 rounded-2xl hover:bg-purple-200 transition-colors">
            <Trophy className="text-purple-600" />
            <span className="text-xs font-bold text-purple-800">Thành tích</span>
          </button>
          <button onClick={() => setActiveTab('minigame')} className="flex flex-col items-center gap-2 p-4 bg-pink-100 rounded-2xl hover:bg-pink-200 transition-colors">
            <Gamepad2 className="text-pink-600" />
            <span className="text-xs font-bold text-pink-800">Trò chơi</span>
          </button>
          <button onClick={() => setActiveTab('shop')} className="flex flex-col items-center gap-2 p-4 bg-orange-100 rounded-2xl hover:bg-orange-200 transition-colors col-span-2">
            <ShoppingBag className="text-orange-600" />
            <span className="text-xs font-bold text-orange-800">Cửa hàng</span>
          </button>
        </div>

        <Card className="bg-yellow-50 border-yellow-100 p-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('shop')}>
          <h3 className="text-xs font-black text-yellow-800 uppercase mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-500" /> Nhãn dán của em
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.stickers && stats.stickers.length > 0 ? (
              stats.stickers.slice(0, 6).map((s: string, i: number) => (
                <span key={i} className="text-xl">{s}</span>
              ))
            ) : (
              <span className="text-[10px] text-gray-400 italic">Chưa có nhãn dán nào</span>
            )}
          </div>
        </Card>

        <Card className="bg-green-50 border-green-100 p-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('shop')}>
          <h3 className="text-xs font-black text-green-800 uppercase mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-green-500" /> Dụng cụ học tập
          </h3>
          <div className="flex flex-wrap gap-2">
            {SHOP_ITEMS.supplies.filter((item: any) => stats.unlockedItems.includes(item.id)).length > 0 ? (
              SHOP_ITEMS.supplies
                .filter((item: any) => stats.unlockedItems.includes(item.id))
                .slice(0, 6)
                .map((item: any) => (
                  <span key={item.id} className="text-xl" title={item.name}>{item.icon}</span>
                ))
            ) : (
              <span className="text-[10px] text-gray-400 italic">Chưa có dụng cụ nào</span>
            )}
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-100 p-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowCalculator(true)}>
          <h3 className="text-xs font-black text-blue-800 uppercase mb-3 flex items-center gap-2">
            <Calculator size={14} className="text-blue-500" /> Máy tính bỏ túi
          </h3>
          <div className="flex items-center justify-center py-2">
            <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-blue-100">
              <Calculator size={32} className="text-blue-600" />
            </div>
          </div>
          <p className="text-[10px] text-center text-blue-400 font-bold mt-2 uppercase tracking-tighter">Nhấn để sử dụng</p>
        </Card>

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

const DraggableSubject: React.FC<{ subject: string, config: any }> = ({ subject, config }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `subject-${subject}`,
    data: { subject }
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-transform bg-white border border-gray-100 shadow-sm ${isDragging ? 'opacity-50' : 'hover:scale-105'}`}
    >
      <div className="p-2 rounded-xl" style={{ backgroundColor: config.bgColor }}>
        {React.createElement(config.icon, { size: 20, color: config.color })}
      </div>
      <span className="text-[10px] font-bold text-center max-w-[60px] truncate">{subject}</span>
    </div>
  );
};

const DroppableSlot: React.FC<{ id: string, children: React.ReactNode, isWeekend: boolean, className?: string }> = ({ id, children, isWeekend, className }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={`${className || ''} ${isOver ? 'ring-2 ring-blue-500 bg-blue-50/50 scale-[1.02] transition-transform' : ''}`}
    >
      {children}
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
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

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

  const handlePrint = () => {
    window.print();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const subject = active.data.current?.subject;
    if (!subject) return;

    const [_, dayStr, session, periodStr] = (over.id as string).split('-');
    const day = parseInt(dayStr);
    const period = parseInt(periodStr);

    const existingItem = schedule.find((i: ScheduleItem) => i.day === day && i.period === period && (i.session || 'morning') === session);

    if (existingItem) {
      await updateScheduleItem(existingItem.id, { subject });
    } else {
      await addScheduleItem({
        day,
        period,
        session: session as 'morning' | 'afternoon',
        subject
      });
    }
  };

  const subjectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    schedule.forEach((item: ScheduleItem) => {
      stats[item.subject] = (stats[item.subject] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [schedule]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <h2 className="text-3xl font-black text-blue-900">Thời khóa biểu</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('day')}
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={18} />
                <span className="hidden sm:inline">Theo ngày</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid size={18} />
                <span className="hidden sm:inline">Theo tuần</span>
              </button>
            </div>
            {viewMode === 'week' && (
              <Button onClick={handlePrint} variant="secondary" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200">
                <Printer size={20} />
              </Button>
            )}
            <Button onClick={() => openAddForSlot(1, 'morning')} variant="primary">
              <Plus size={20} /> Thêm tiết học
            </Button>
          </div>
        </div>

        <div className="print:hidden bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
          <p className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} /> Kéo thả môn học vào thời khóa biểu
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SUBJECT_CONFIG).filter(([key]) => key !== 'Khác').map(([subject, config]) => (
              <DraggableSubject key={subject} subject={subject} config={config} />
            ))}
          </div>
        </div>

        <div className="hidden print:block mb-6">
          <h1 className="text-3xl font-black text-center mb-2">THỜI KHÓA BIỂU</h1>
          <p className="text-center text-gray-500">Năm học 2025 - 2026</p>
        </div>

      {viewMode === 'day' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
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
                      const item = schedule.find((i: ScheduleItem) => i.day === selectedDay && i.period === p && (i.session || 'morning') === session);
                      return (
                        <DroppableSlot key={p} id={`slot-${selectedDay}-${session}-${p}`} isWeekend={isWeekend}>
                          <div 
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
                                <div className="flex items-center gap-1 print:hidden">
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
                                <Plus size={16} className="text-gray-300 group-hover:text-blue-400 print:hidden" />
                              </div>
                            )}
                          </div>
                        </DroppableSlot>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-blue-100 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-blue-900 uppercase bg-blue-50">
                <tr>
                  <th className="px-4 py-3 border-b border-blue-100 text-center w-20">Buổi</th>
                  <th className="px-4 py-3 border-b border-blue-100 text-center w-16">Tiết</th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-3 border-b border-blue-100 text-center min-w-[120px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['morning', 'afternoon'].map((session, sIdx) => (
                  <React.Fragment key={session}>
                    {[1, 2, 3, 4, 5].map((period, pIdx) => (
                      <tr key={`${session}-${period}`} className="bg-white border-b border-gray-50 hover:bg-gray-50">
                        {pIdx === 0 && (
                          <td rowSpan={5} className="px-4 py-3 font-bold text-center border-r border-gray-100 bg-gray-50/50">
                            {session === 'morning' ? <span className="text-yellow-600 flex flex-col items-center gap-1"><Sun size={16}/> Sáng</span> : <span className="text-orange-600 flex flex-col items-center gap-1"><CloudSun size={16}/> Chiều</span>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center font-bold text-gray-500 border-r border-gray-100">{period}</td>
                        {DAYS.map((_, dayIdx) => {
                          const item = schedule.find((i: ScheduleItem) => i.day === dayIdx && i.period === period && (i.session || 'morning') === session);
                          return (
                            <td 
                              key={dayIdx} 
                              className="border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-blue-50/50 transition-colors p-0"
                              onClick={() => item ? handleEdit(item) : openAddForSlot(period, session as 'morning' | 'afternoon')}
                            >
                              <DroppableSlot id={`slot-${dayIdx}-${session}-${period}`} isWeekend={dayIdx >= 5} className="w-full h-full min-h-[48px] p-2 flex items-center justify-center">
                                {item ? (
                                  <div className="flex flex-col items-center justify-center p-2 rounded-xl w-full" style={{ backgroundColor: getSubjectConfig(item.subject).bgColor }}>
                                    <span className="font-bold text-center text-xs" style={{ color: getSubjectConfig(item.subject).color }}>{item.subject}</span>
                                  </div>
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-200">
                                    -
                                  </div>
                                )}
                              </DroppableSlot>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {sIdx === 0 && (
                      <tr className="bg-blue-50/30 h-4">
                        <td colSpan={9}></td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="bg-blue-50 border-blue-100 print:break-inside-avoid">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-500" /> Thống kê môn học trong tuần
            </h3>
            <div className="flex flex-wrap gap-3">
              {subjectStats.map(([subject, count]) => (
                <div key={subject} className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: getSubjectConfig(subject).bgColor }}>
                    {React.createElement(getSubjectConfig(subject).icon, { size: 16, color: getSubjectConfig(subject).color })}
                  </div>
                  <span className="font-bold text-gray-700">{subject}:</span>
                  <span className="font-black text-blue-600">{count} tiết</span>
                </div>
              ))}
              {subjectStats.length === 0 && (
                <div className="text-gray-500 italic">Chưa có dữ liệu thời khóa biểu</div>
              )}
            </div>
          </Card>
        </div>
      )}

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
    </DndContext>
  );
};

const AITutorChat = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey && process.env.NODE_ENV === 'production');
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Use the selected key (API_KEY) if available, otherwise fallback to environment key (GEMINI_API_KEY)
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      const modelName = "gemini-3-flash-preview";

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const session = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: "Bạn là một Trợ lý Học tập Thông minh dành cho học sinh tiểu học. Hãy giải thích các kiến thức một cách đơn giản, dễ hiểu, vui vẻ và khích lệ. Sử dụng ngôn ngữ phù hợp với trẻ em. Nếu học sinh nhờ kiểm tra lỗi chính tả, hãy chỉ ra lỗi và giải thích tại sao. Luôn giữ thái độ tích cực và thân thiện.",
        },
        history: history
      });

      const response = await session.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Xin lỗi, tớ gặp chút trục trặc.' }]);
      playSound('success');
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      
      const errorMsg = error?.message || '';
      
      if (errorMsg.includes('API key') || errorMsg.includes('403') || errorMsg.includes('not found') || errorMsg.includes('Requested entity was not found')) {
        setMessages(prev => [...prev, { role: 'model', text: 'Tớ cần bạn giúp kích hoạt bằng cách chọn một "chìa khóa" (API Key) hợp lệ. Bạn nhấn nút bên dưới nhé!' }]);
        setNeedsKey(true);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Tớ đang bận một chút, bạn hỏi lại sau nhé!' }]);
      }
      playSound('pop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setNeedsKey(false);
        setMessages(prev => [...prev, { role: 'model', text: 'Đang khởi động lại... Bạn hãy thử gửi lại tin nhắn nhé!' }]);
      } catch (err) {
        console.error("Failed to open key selector:", err);
      }
    } else {
      setMessages(prev => [...prev, { role: 'model', text: 'Tớ không tìm thấy bảng chọn mã khóa. Bạn hãy thử mở ứng dụng trong AI Studio hoặc kiểm tra cài đặt trình duyệt nhé!' }]);
    }
  };

  return (
    <Card className="bg-white border-4 border-indigo-100 p-6 shadow-lg flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-4 border-b-2 border-indigo-50 pb-4">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <MessageSquare size={24} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-black text-indigo-900">Góc Trợ lý Thông minh 🤖</h3>
          <p className="text-sm font-bold text-gray-500">Hỏi tớ về bài tập hoặc kiến thức nhé!</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
              <Sparkles size={40} className="text-indigo-400" />
            </div>
            <div className="max-w-[200px]">
              <p className="text-sm font-bold text-indigo-900">"Chào bạn! Tớ có thể giải thích bài tập, kiểm tra chính tả hoặc kể chuyện khoa học cho bạn đó!"</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                : 'bg-indigo-50 text-indigo-900 rounded-tl-none border border-indigo-100 shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-50 p-3 rounded-2xl rounded-tl-none border border-indigo-100">
              <div className="flex gap-1">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              </div>
            </div>
          </div>
        )}
        {needsKey && (
          <div className="flex justify-center py-2">
            <button 
              onClick={handleOpenKey}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-xs hover:bg-amber-200 transition-colors border-2 border-amber-200"
            >
              <Sparkles size={14} /> Kích hoạt Trợ lý (Chọn API Key)
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Bạn muốn hỏi gì tớ nào?..."
          className="flex-1 bg-gray-50 border-2 border-indigo-50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-300 transition-all shadow-inner"
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()} 
          className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
        >
          <Send size={20} />
        </button>
      </div>
    </Card>
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
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
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
        <h2 className="text-2xl font-bold text-gray-800">Bài tập về nhà</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsFocusMode(true)} variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Timer size={18} className="mr-2" /> Tập trung
          </Button>
          <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus size={18} className="mr-2" /> Thêm bài tập
          </Button>
        </div>
      </div>

      {/* Daily Progress Bar */}
      {todayTotal > 0 && (
        <Card className="bg-white border border-gray-200 p-5 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Trophy size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Tiến độ hôm nay</h3>
                <p className="text-sm text-gray-500">Hoàn thành {todayCompleted}/{todayTotal} bài tập</p>
              </div>
            </div>
            <span className="text-xl font-bold text-green-600">{todayProgress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress}%` }}
              className="h-full bg-green-500"
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              {(['all', 'pending', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chưa làm' : 'Hoàn thành'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center overflow-x-auto pb-2 no-scrollbar max-w-full">
              <button
                onClick={() => setSubjectFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${subjectFilter === 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Tất cả môn
              </button>
              {availableSubjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${subjectFilter === subject ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="space-y-3">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                  {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h4>
                <div className="flex flex-col gap-3">
                  {groupedHomework[date].map(h => {
                    const config = getSubjectConfig(h.subject);
                    const dueStatus = getDueDateStatus(h.dueDate, h.status);
                    return (
                      <motion.div 
                        layout
                        key={h.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border transition-all ${h.status === 'completed' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 sm:w-24 shrink-0">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: config.bgColor, color: config.color }}>
                            <config.icon size={24} />
                          </div>
                          <span className="text-xs font-bold text-center" style={{ color: config.color }}>{h.subject}</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <p className={`text-lg font-semibold ${h.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {h.content}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${dueStatus.bg} ${dueStatus.color}`}>
                              <Clock size={14} />
                              <span>{dueStatus.label}: {new Date(h.dueDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            
                            <div className="flex gap-1">
                              {(['pending', 'in-progress', 'completed'] as const).map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(h.id, s)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                    h.status === s 
                                      ? s === 'completed' ? 'bg-green-100 border-green-200 text-green-700' : s === 'in-progress' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-700'
                                      : 'border-transparent text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {s === 'pending' ? 'Chờ' : s === 'in-progress' ? 'Đang làm' : 'Xong'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 shrink-0 sm:w-32 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
                          {h.photo && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                              <img src={h.photo} alt="Bài tập" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 w-full justify-end sm:justify-center">
                            {h.status !== 'completed' && (
                              <button 
                                onClick={() => {
                                  playSound('start');
                                  setTimerMode('homework');
                                  setFocusTime(30 * 60);
                                  setIsFocusMode(true);
                                  setAssistantMsg(`Bắt đầu làm bài ${h.subject} thôi nào!`);
                                }}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Bắt đầu làm ngay"
                              >
                                <Play size={18} fill="currentColor" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(h.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
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
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="flex justify-center mb-3">
                <BookText size={48} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">Không có bài tập nào ở đây!</p>
            </div>
          )}
        </div>

    <div className="lg:col-span-1 space-y-6">
      <Card className="bg-white border border-gray-200 p-6 shadow-sm rounded-2xl sticky top-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          Bảng Thành Tích
        </h3>
        
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
              <BookText size={24} className="text-blue-500 mb-2" />
              <span className="text-2xl font-black text-blue-700">{homework.length}</span>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-1">Tổng bài tập</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={24} className="text-green-500 mb-2" />
              <span className="text-2xl font-black text-green-700">{homework.filter((h: any) => h.status === 'completed').length}</span>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-1">Đã hoàn thành</span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-gray-600">Tỷ lệ hoàn thành</span>
              <span className="text-lg font-black text-green-600">
                {homework.length > 0 ? Math.round((homework.filter((h: any) => h.status === 'completed').length / homework.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${homework.length > 0 ? Math.round((homework.filter((h: any) => h.status === 'completed').length / homework.length) * 100) : 0}%` }}
                className="h-full bg-green-500"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Other Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star size={18} className="text-yellow-600" />
                </div>
                <span className="font-semibold text-yellow-800">Sao tích lũy</span>
              </div>
              <span className="text-xl font-black text-yellow-600">{stars}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Timer size={18} className="text-indigo-600" />
                </div>
                <span className="font-semibold text-indigo-800">Thời gian tập trung</span>
              </div>
              <span className="text-xl font-black text-indigo-600">
                {Math.round(studySessions.reduce((acc: number, s: any) => acc + s.duration, 0) / 60)}p
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp size={18} className="text-orange-600" />
                </div>
                <span className="font-semibold text-orange-800">Chuỗi ngày học</span>
              </div>
              <span className="text-xl font-black text-orange-600">{stats.daysOnTime || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>

  {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Thêm bài tập mới</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
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
                      className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${(!isCustomSubject && newSubject === s) || (isCustomSubject && s === 'Khác') ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      {React.createElement(getSubjectConfig(s).icon, { size: 18, color: getSubjectConfig(s).color })}
                      <span className="text-[11px] font-medium truncate w-full text-center text-gray-600">{s}</span>
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
                    className="w-full mt-3 p-2.5 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung bài tập</label>
                <textarea 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Ví dụ: Làm bài 1-5 trang 25 sách giáo khoa..."
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm min-h-[100px] resize-y"
                />
                
                <AnimatePresence>
                  {suggestion && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200 flex items-start gap-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                      onClick={() => setNewContent(suggestion)}
                    >
                      <Sparkles size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-800">Gợi ý: "{suggestion}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hạn nộp bài</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="date" 
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh đính kèm</label>
                  <label className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                    <Camera size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Tải ảnh lên</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {photo && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">Hủy</Button>
                <Button onClick={handleAdd} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Lưu lại</Button>
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
          <h2 className="text-3xl font-black text-yellow-900">Thời gian biểu thông minh</h2>
          <p className="text-gray-500 font-bold">Tập trung cao độ, gặt hái thành công!</p>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="accent">
          <Plus size={20} /> Thêm thời gian biểu
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
              Thời gian biểu
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

const Leaderboard = ({ user, stats }: { user: any, stats: any }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('weeklyStars', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const fetchedLeaders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeaders(fetchedLeaders);

        const currentUserInTop10 = fetchedLeaders.findIndex(l => l.id === user?.uid);
        if (currentUserInTop10 !== -1) {
          setCurrentUserRank(currentUserInTop10 + 1);
        } else if (user && stats) {
          // Fetch exact rank if not in top 10
          const countQ = query(
            collection(db, 'users'), 
            where('weeklyStars', '>', stats.weeklyStars || 0)
          );
          const countSnapshot = await getCountFromServer(countQ);
          setCurrentUserRank(countSnapshot.data().count + 1);
        } else {
          setCurrentUserRank(null);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  return (
    <Card className="border-yellow-100 bg-gradient-to-br from-white to-yellow-50/30">
      <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Bảng xếp hạng tuần
      </h3>
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const isCurrentUser = leader.id === user?.uid;
            return (
              <div key={leader.id} className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${isCurrentUser ? 'bg-yellow-50 border-yellow-300 shadow-sm' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-md' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white shadow-sm' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="font-bold text-gray-800">
                    {leader.userName || 'Học sinh ẩn danh'} 
                    {isCurrentUser && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full ml-2 uppercase font-black">Bạn</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-black text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                  {leader.weeklyStars || 0} <Star size={16} className="fill-current" />
                </div>
              </div>
            );
          })}
          
          {currentUserRank !== null && currentUserRank > 10 && user && (
            <>
              <div className="flex justify-center py-2 gap-2">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl border-2 bg-yellow-50 border-yellow-300 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-gray-100 text-gray-500">
                    {currentUserRank}
                  </div>
                  <div className="font-bold text-gray-800">
                    {stats.userName || 'Học sinh ẩn danh'} 
                    <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full ml-2 uppercase font-black">Bạn</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-black text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-xl border border-yellow-200">
                  {stats.weeklyStars || 0} <Star size={16} className="fill-current" />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Leaderboard user={user} stats={stats} />
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

      {SHOP_ITEMS.supplies && SHOP_ITEMS.supplies.some(item => stats.unlockedItems?.includes(item.id)) && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <h3 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
            <BookOpen className="text-emerald-500" /> Bộ sưu tập Dụng cụ học tập
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SHOP_ITEMS.supplies.filter(item => stats.unlockedItems?.includes(item.id)).map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center border-2 border-emerald-100 cursor-pointer"
              >
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className="font-bold text-emerald-900 text-sm">{item.name}</div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const ProfileView = ({ state, actions }: { state: any, actions: any }) => {
  const { user, stats } = state;
  const { setAssistantMsg, updateProfile } = actions;
  const profile = stats.profile || {};

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    avatar: profile.avatar || '',
    fullName: profile.fullName || '',
    nickname: profile.nickname || '',
    dateOfBirth: profile.dateOfBirth || '',
    gender: profile.gender || '',
    school: profile.school || '',
    className: profile.className || '',
    homeroomTeacher: profile.homeroomTeacher || '',
    schoolYear: profile.schoolYear || '',
    favoriteSubjects: profile.favoriteSubjects || [],
    interests: profile.interests || [],
    parentName: profile.parentName || '',
    parentPhone: profile.parentPhone || '',
    bio: profile.bio || ''
  });

  const [interestInput, setInterestInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const current = prev.favoriteSubjects;
      if (current.includes(subject)) {
        return { ...prev, favoriteSubjects: current.filter((s: string) => s !== subject) };
      } else {
        return { ...prev, favoriteSubjects: [...current, subject] };
      }
    });
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      if (!formData.interests.includes(interestInput.trim())) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, interestInput.trim()] }));
      }
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({ ...prev, interests: prev.interests.filter((i: string) => i !== interest) }));
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    setAssistantMsg("Hồ sơ của bạn đã được cập nhật thành công! 🎉");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);

  // Calculate profile completion
  const profileFields = ['avatar', 'fullName', 'nickname', 'dateOfBirth', 'gender', 'school', 'className', 'homeroomTeacher', 'schoolYear', 'parentName', 'parentPhone', 'bio'];
  const filledFields = profileFields.filter(field => formData[field as keyof typeof formData]).length + (formData.favoriteSubjects.length > 0 ? 1 : 0) + (formData.interests.length > 0 ? 1 : 0);
  const totalFields = profileFields.length + 2;
  const completionRate = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <User className="text-blue-500" size={32} />
          Hồ sơ cá nhân
        </h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-600 shadow-md">
            <Edit2 size={20} /> Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" className="bg-white">
              Hủy
            </Button>
            <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 shadow-md">
              <Check size={20} /> Lưu
            </Button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border-4 border-white relative">
        <div className="h-40 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -100, 0],
              y: [0, 50, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-3xl"
          />
        </div>
        
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full p-2 shadow-xl">
                <div className="w-full h-full bg-blue-50 rounded-full overflow-hidden flex items-center justify-center text-6xl">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>👦</span>
                  )}
                </div>
              </div>
              {isEditing && (
                <label className="absolute bottom-2 right-2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 cursor-pointer transition-transform hover:scale-110">
                  <Camera size={20} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-1">
                {formData.fullName || stats.userName || 'Chưa cập nhật tên'}
              </h1>
              <p className="text-lg text-gray-500 font-bold mb-4">
                {formData.nickname ? `"${formData.nickname}"` : 'Thêm biệt danh cho vui nhé!'}
              </p>
              
              {/* Profile Completion Bar */}
              <div className="max-w-md bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-600">Mức độ hoàn thiện hồ sơ</span>
                  <span className="text-blue-600">{completionRate}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            <div className="text-center p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
              <Star className="mx-auto text-yellow-500 fill-yellow-500 mb-2" size={28} />
              <div className="text-2xl font-black text-yellow-700">{stats.stars || 0}</div>
              <div className="text-xs font-bold text-yellow-600 uppercase mt-1">Sao hiện có</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-green-50 border border-green-100">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
              <div className="text-2xl font-black text-green-700">{stats.homeworkCompleted || 0}</div>
              <div className="text-xs font-bold text-green-600 uppercase mt-1">Bài đã làm</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <Calendar className="mx-auto text-blue-500 mb-2" size={28} />
              <div className="text-2xl font-black text-blue-700">{stats.daysOnTime || 0}</div>
              <div className="text-xs font-bold text-blue-600 uppercase mt-1">Ngày đúng giờ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin học sinh */}
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <User size={24} />
            </div>
            <h3 className="text-xl font-bold text-blue-900">Thông tin cơ bản</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Họ và tên</label>
              {isEditing ? (
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors font-medium" placeholder="Nguyễn Văn A" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">{formData.fullName || 'Chưa cập nhật'}</div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Biệt danh</label>
                {isEditing ? (
                  <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors font-medium" placeholder="Tí, Tèo..." />
                ) : (
                  <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">{formData.nickname || 'Chưa cập nhật'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Giới tính</label>
                {isEditing ? (
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none bg-white transition-colors font-medium">
                    <option value="">Chọn...</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                ) : (
                  <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">
                    {formData.gender === 'male' ? 'Nam' : formData.gender === 'female' ? 'Nữ' : formData.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Ngày sinh</label>
              {isEditing ? (
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors font-medium" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Giới thiệu bản thân</label>
              {isEditing ? (
                <textarea name="bio" value={formData.bio} onChange={handleChange as any} rows={3} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors font-medium resize-none" placeholder="Hãy viết vài dòng về bản thân bạn nhé..." />
              ) : (
                <div className="font-medium text-gray-700 text-base bg-gray-50 p-4 rounded-xl border border-transparent italic">
                  {formData.bio ? `"${formData.bio}"` : 'Chưa có lời giới thiệu nào.'}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Thông tin trường học */}
        <Card className="border-green-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-2xl text-green-600">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-green-900">Trường lớp</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Trường học</label>
              {isEditing ? (
                <input type="text" name="school" value={formData.school} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-green-400 outline-none transition-colors font-medium" placeholder="Trường Tiểu học ABC" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent flex items-center gap-2">
                  <span className="text-xl">🏫</span> {formData.school || 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Lớp</label>
                {isEditing ? (
                  <input type="text" name="className" value={formData.className} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-green-400 outline-none transition-colors font-medium" placeholder="5A" />
                ) : (
                  <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent flex items-center gap-2">
                    <span className="text-xl">📚</span> {formData.className || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Năm học</label>
                {isEditing ? (
                  <input type="text" name="schoolYear" value={formData.schoolYear} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-green-400 outline-none transition-colors font-medium" placeholder="2025 - 2026" />
                ) : (
                  <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent flex items-center gap-2">
                    <span className="text-xl">📅</span> {formData.schoolYear || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Giáo viên chủ nhiệm</label>
              {isEditing ? (
                <input type="text" name="homeroomTeacher" value={formData.homeroomTeacher} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-green-400 outline-none transition-colors font-medium" placeholder="Cô Lan" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent flex items-center gap-2">
                  <span className="text-xl">👩‍🏫</span> {formData.homeroomTeacher || 'Chưa cập nhật'}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Sở thích & Môn học */}
        <Card className="border-purple-100 md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
              <Star size={24} />
            </div>
            <h3 className="text-xl font-bold text-purple-900">Sở thích & Môn học</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-3">Môn học yêu thích</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {ALL_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${formData.favoriteSubjects.includes(subject) ? 'bg-purple-500 text-white border-purple-500 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-purple-200 hover:bg-purple-50'}`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-2xl min-h-[100px]">
                  {formData.favoriteSubjects.length > 0 ? (
                    formData.favoriteSubjects.map((subject: string) => (
                      <span key={subject} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-xl text-sm font-black shadow-sm">
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic flex items-center justify-center w-full">Chưa chọn môn học nào</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-3">Sở thích cá nhân</label>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Thêm sở thích (nhấn Enter)..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={handleAddInterest}
                      className="flex-1 p-3 text-sm rounded-xl border-2 border-gray-100 focus:border-purple-400 outline-none transition-colors font-medium"
                    />
                    <Button onClick={() => handleAddInterest({ key: 'Enter', preventDefault: () => {} } as any)} className="bg-purple-500 hover:bg-purple-600 rounded-xl">
                      Thêm
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest: string, idx: number) => (
                      <span key={idx} className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-pink-200">
                        {interest}
                        <button onClick={() => handleRemoveInterest(interest)} className="hover:text-pink-900 bg-pink-100 p-1 rounded-full"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-2xl min-h-[100px]">
                  {formData.interests.length > 0 ? (
                    formData.interests.map((interest: string, idx: number) => (
                      <span key={idx} className="bg-pink-100 text-pink-800 px-4 py-2 rounded-xl text-sm font-black shadow-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic flex items-center justify-center w-full">Chưa thêm sở thích nào</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Huy hiệu & Thành tích */}
        <Card className="border-yellow-100 md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold text-yellow-900">Huy hiệu & Thành tích</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${stats.homeworkCompleted >= 5 ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                📚
              </div>
              <div className="font-black text-sm text-gray-800">Chăm chỉ</div>
              <div className="text-xs font-bold text-gray-500 mt-1">Làm 5 bài tập</div>
            </div>

            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${stats.stars >= 50 ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                ⭐
              </div>
              <div className="font-black text-sm text-gray-800">Ngôi sao</div>
              <div className="text-xs font-bold text-gray-500 mt-1">Đạt 50 sao</div>
            </div>

            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${stats.daysOnTime >= 3 ? 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                ⏰
              </div>
              <div className="font-black text-sm text-gray-800">Đúng giờ</div>
              <div className="text-xs font-bold text-gray-500 mt-1">3 ngày đúng giờ</div>
            </div>

            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${completionRate === 100 ? 'bg-gradient-to-br from-purple-50 to-fuchsia-100 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                🏆
              </div>
              <div className="font-black text-sm text-gray-800">Hoàn hảo</div>
              <div className="text-xs font-bold text-gray-500 mt-1">Hồ sơ 100%</div>
            </div>
          </div>
        </Card>

        {/* Kỷ lục trò chơi */}
        <Card className="border-pink-100 md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 p-3 rounded-2xl text-pink-600">
              <Gamepad2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-pink-900">Kỷ lục trò chơi</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { id: 'math', name: 'Toán học', icon: '🧮', color: 'bg-pink-50 text-pink-700 border-pink-200' },
              { id: 'emoji', name: 'Nhanh mắt', icon: '🔍', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { id: 'word', name: 'Ghép chữ', icon: '🔡', color: 'bg-green-50 text-green-700 border-green-200' },
              { id: 'memory', name: 'Lật hình', icon: '🧠', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { id: 'dino', name: 'Khủng long', icon: '🦖', color: 'bg-orange-50 text-orange-700 border-orange-200' }
            ].map(game => (
              <div key={game.id} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${game.color}`}>
                <div className="text-3xl mb-2">{game.icon}</div>
                <div className="font-bold text-sm mb-1">{game.name}</div>
                <div className="text-xl font-black">{stats.highScores?.[game.id] || 0}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Thông tin liên hệ */}
        <Card className="border-orange-100 md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold text-orange-900">Thông tin liên hệ (Tùy chọn)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Tên phụ huynh</label>
              {isEditing ? (
                <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-colors font-medium" placeholder="Nguyễn Văn B" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">{formData.parentName || 'Chưa cập nhật'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Số điện thoại phụ huynh</label>
              {isEditing ? (
                <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 outline-none transition-colors font-medium" placeholder="090xxxxxxx" />
              ) : (
                <div className="font-bold text-gray-800 text-lg bg-gray-50 p-3 rounded-xl border border-transparent">{formData.parentPhone || 'Chưa cập nhật'}</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MiniGameView = ({ state, actions }: { state: any, actions: any }) => {

const { user, stars, schedule, homework, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay } = state;
const { setAssistantMsg, setShowAssistantMsg, addStars, setIsFocusMode, setActiveTab, setSelectedDay, setIsTimerActive, setFocusTime, setCurrentSessionId, startTimer, generateBackpackList, toggleBackpackItem, handleUnlock, handleSelect, setShowHomeworkPopup, updateHighScore } = actions;

  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'start' | 'difficulty' | 'playing' | 'end'>('start');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<{id: number, x: number, y: number, value: string}[]>([]);
  
  // Confetti effect for new high score
  useEffect(() => {
    if (isNewHighScore && gameState === 'end') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isNewHighScore, gameState]);

  const addFloatingPoint = (x: number, y: number, value: string) => {
    const id = Date.now();
    setFloatingPoints(prev => [...prev, { id, x, y, value }]);
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };
  
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
  const dinoObstaclesRef = useRef<{id: number, x: number, type: string}[]>([]);
  const [dinoFrame, setDinoFrame] = useState(0);
  const dinoScoreRef = useRef(0);

  // Word Rescue State
  const [wordRescueTarget, setWordRescueTarget] = useState({ word: '', translation: '' });
  const [wordRescueMissingIndex, setWordRescueMissingIndex] = useState(0);
  const [wordRescueIsComplete, setWordRescueIsComplete] = useState(false);
  const [wordRescueLetters, setWordRescueLetters] = useState<{id: number, char: string, x: number, y: number, speed: number}[]>([]);
  const [wordRescueBirdY, setWordRescueBirdY] = useState(50);
  const wordRescueBirdYRef = useRef(50);
  const [wordRescueLevel, setWordRescueLevel] = useState(1);

  // Situation Game State
  const [currentSituation, setCurrentSituation] = useState<any>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [situationStep, setSituationStep] = useState<'content' | 'explanation' | 'question'>('content');
  const [situationFeedback, setSituationFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [usedSituationIndices, setUsedSituationIndices] = useState<number[]>([]);

  const generateSituation = (resetUsed = false) => {
    const currentUsed = resetUsed ? [] : usedSituationIndices;
    const available = SITUATIONS.filter((_, i) => !currentUsed.includes(i));

    if (available.length === 0) {
      setUsedSituationIndices([]);
      generateSituation(true);
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];
    const originalIndex = SITUATIONS.indexOf(selected);

    // Shuffle options
    const options = [...selected.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setShuffledOptions(options);

    setUsedSituationIndices(prev => [...prev, originalIndex]);
    setCurrentSituation(selected);
    setSituationStep('content');
    setSituationFeedback(null);
  };

  const handleSituationAnswer = (option: string) => {
    if (situationFeedback) return;
    if (option === currentSituation.answer) {
      setSituationFeedback('correct');
      setScore(prev => prev + 20);
      playSound('success');
      addFloatingPoint(50, 40, "+20");
      setAssistantMsg("Tuyệt vời! Bạn đã chọn đúng rồi đấy! ✨");
      
      // Removed automatic transition to allow manual "Next" button
    } else {
      setSituationFeedback('incorrect');
      playSound('delete');
      setAssistantMsg("Hic, chưa đúng rồi. Hãy đọc kỹ lại nhé! 🧐");
      setTimeout(() => setSituationFeedback(null), 1500);
    }
  };

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
    setCurrentJokes(shuffled.slice(0, 1));
    setGameState('playing');
  };

  const games = [
    { id: 'math', name: 'Toán học', icon: '🧮', color: 'bg-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50', description: 'Tính toán thật nhanh!' },
    { id: 'emoji', name: 'Nhanh mắt', icon: '🔍', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Tìm hình giống hệt!' },
    { id: 'word', name: 'Ghép chữ', icon: '🔡', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50', description: 'Sắp xếp lại từ đúng!' },
    { id: 'memory', name: 'Lật hình', icon: '🧠', color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50', description: 'Thử thách trí nhớ!' },
    { id: 'sticker', name: 'Góc sáng tạo', icon: '🎨', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50', description: 'Dán sticker vào tranh!' },
    { id: 'dino', name: 'Khủng long', icon: '🦖', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Nhảy qua vật cản!' },
    { id: 'wordRescue', name: 'Giải cứu từ', icon: '🦜', color: 'bg-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', description: 'Giúp chim bay cao!' },
    { id: 'situation', name: 'Tình huống', icon: '🎭', color: 'bg-cyan-500', textColor: 'text-cyan-600', bgColor: 'bg-cyan-50', description: 'Học cách ứng xử hay!' },
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

    const selected = filteredWords[Math.floor(Math.random() * filteredWords.length)] || filteredWords[0] || WORD_LIST[0];
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

  const generateWordRescue = () => {
    const selected = WORD_RESCUE_LIST[Math.floor(Math.random() * WORD_RESCUE_LIST.length)];
    const missingIndex = Math.floor(Math.random() * selected.word.length);
    
    setWordRescueTarget({ word: selected.word, translation: selected.translation });
    setWordRescueMissingIndex(missingIndex);
    setWordRescueIsComplete(false);
    setWordRescueLetters([]);
    setWordRescueBirdY(50);
    wordRescueBirdYRef.current = 50;
  };

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    if (gameId === 'joke' || gameId === 'situation') {
      setScore(0);
      setTimeLeft(0); // No timer for jokes or situations
      setGameState('playing');
      if (gameId === 'joke') generateJokes();
      if (gameId === 'situation') generateSituation(true);
    } else {
      setGameState('difficulty');
    }
  };

  const startPlaying = () => {
    setScore(0);
    setCombo(0);
    setIsNewHighScore(false);
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
      const initialObstacles = [{ id: Date.now(), x: 100, type: '🌵' }];
      setDinoObstacles(initialObstacles);
      dinoObstaclesRef.current = initialObstacles;
      setDinoFrame(0);
    }
    if (selectedGame === 'wordRescue') {
      generateWordRescue();
      setWordRescueLevel(1);
    }
    if (selectedGame === 'situation') {
      generateSituation(true);
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing' && selectedGame !== 'joke' && selectedGame !== 'situation') {
      const finalizeGame = async () => {
        setGameState('end');
        const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
        const totalStars = Math.floor((score / 5) * multiplier);
        if (score > 0) {
          addStars(totalStars, `chơi game ${selectedGame} (${difficulty})`);
          const isNew = await updateHighScore(selectedGame!, score);
          setIsNewHighScore(isNew);
        }
      };
      finalizeGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, selectedGame]);

  const handleMathAnswer = (userAns: number) => {
    if (feedback) return;
    if (userAns === mathQuestion.ans) {
      const bonus = Math.floor(combo / 3) * 5;
      const points = 10 + bonus;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setFeedback('correct');
      addFloatingPoint(50, 40, `+${points}`);
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateMathQuestion();
      }, 600);
    } else {
      setScore(prev => Math.max(0, prev - 5));
      setCombo(0);
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
      const bonus = Math.floor(combo / 3) * 5;
      const points = 10 + bonus;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setFeedback('correct');
      addFloatingPoint(50, 40, `+${points}`);
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateEmojiGrid();
      }, 600);
    } else {
      setScore(prev => Math.max(0, prev - 5));
      setCombo(0);
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
      const bonus = Math.floor(combo / 2) * 10;
      const points = 20 + bonus;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setFeedback('correct');
      addFloatingPoint(50, 40, `+${points}`);
      playSound('pop');
      setTimeout(() => {
        setFeedback(null);
        generateWordScramble();
      }, 800);
    } else {
      setCombo(0);
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
        const bonus = Math.floor(combo / 2) * 10;
        const points = 20 + bonus;
        setCombo(prev => prev + 1);
        addFloatingPoint(50, 40, `+${points}`);
        setTimeout(() => {
          const matchedCards = [...memoryCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setMemoryCards(matchedCards);
          setFlippedIndices([]);
          setScore(prev => prev + points);
          
          if (matchedCards.every(c => c.isMatched)) {
            setTimeout(() => generateMemoryCards(), 500);
          }
        }, 500);
      } else {
        setCombo(0);
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
        addFloatingPoint(50, 40, "+25");
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

      // Obstacles and Collision
      const speed = difficulty === 'easy' ? 2.5 : difficulty === 'medium' ? 3.5 : 4.5;
      const moved = dinoObstaclesRef.current.map(o => ({ ...o, x: o.x - speed }));
      
      // Collision detection (Dino is at left: 15%)
      // Dino hitbox: x from 12 to 18, y up to 35
      const collision = moved.find(o => o.x > 8 && o.x < 22 && dinoYRef.current < 35);
      
      if (collision) {
        setGameState('end');
        playSound('delete');
        const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
        if (dinoScoreRef.current > 0) {
          addStars(Math.floor((dinoScoreRef.current / 5) * multiplier), `chơi game Khủng long (${difficulty})`);
        }
        clearInterval(gameLoop);
        return;
      }

      // Filter off-screen and add new obstacles
      let scoreIncrement = 0;
      let filtered = moved.filter(o => o.x > -10);
      if (filtered.length < 2 && Math.random() < 0.03 && (filtered.length === 0 || filtered[filtered.length-1].x < 60)) {
         filtered.push({ id: Date.now(), x: 100, type: ['🌵', '🌵', '🌱', '🌿'][Math.floor(Math.random() * 4)] });
         scoreIncrement = 5;
      }

      dinoObstaclesRef.current = filtered;
      setDinoObstacles(filtered);

      if (scoreIncrement > 0) {
        dinoScoreRef.current += scoreIncrement;
        setScore(dinoScoreRef.current);
      }
    }, 30);

    return () => clearInterval(gameLoop);
  }, [selectedGame, gameState, difficulty]);

  useEffect(() => {
    if (selectedGame !== 'wordRescue' || gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      if (wordRescueIsComplete || !wordRescueTarget.word) return;

      // Move letters down
      setWordRescueLetters(prev => {
        const speed = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 1.2 : 1.6;
        const moved = prev.map(l => ({ ...l, y: l.y + speed }));
        
        // Add new letters
        if (Math.random() < 0.05 && moved.length < 10) {
          // 30% chance of being the correct missing letter, 70% random
          const correctChar = wordRescueTarget.word[wordRescueMissingIndex]?.toUpperCase();
          if (!correctChar) return moved;

          const isCorrect = Math.random() < 0.3;
          const char = isCorrect ? correctChar : String.fromCharCode(65 + Math.floor(Math.random() * 26));
          
          if (char) {
            moved.push({
              id: Date.now() + Math.random(),
              char,
              x: 10 + Math.random() * 80,
              y: -10,
              speed: speed * (0.8 + Math.random() * 0.4)
            });
          }
        }
        
        return moved.filter(l => l.y < 110);
      });

      // Bird physics (slowly falls if not rescued)
      wordRescueBirdYRef.current = Math.max(0, wordRescueBirdYRef.current - 0.1);
      setWordRescueBirdY(wordRescueBirdYRef.current);

      if (wordRescueBirdYRef.current <= 0) {
        setGameState('end');
        playSound('delete');
        const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
        if (score > 0) {
          addStars(Math.floor((score / 5) * multiplier), `chơi game Giải cứu từ (${difficulty})`);
        }
      }
    }, 50);

    return () => clearInterval(gameLoop);
  }, [selectedGame, gameState, difficulty, wordRescueTarget, wordRescueMissingIndex, wordRescueIsComplete, score]);

  const handleWordRescueLetterClick = (letter: {id: number, char: string}) => {
    if (wordRescueIsComplete || !wordRescueTarget.word) return;

    const correctChar = wordRescueTarget.word[wordRescueMissingIndex]?.toUpperCase();
    if (!correctChar) return;

    if (letter.char.toUpperCase() === correctChar) {
      // Correct
      setWordRescueIsComplete(true);
      setWordRescueLetters([]);
      
      // Bird flies up
      wordRescueBirdYRef.current = Math.min(90, wordRescueBirdYRef.current + 20);
      setWordRescueBirdY(wordRescueBirdYRef.current);
      
      setScore(prev => prev + 20);
      playSound('pop');
      addFloatingPoint(50, 40, "+20");
      setAssistantMsg(`Chính xác! ${wordRescueTarget.word} nghĩa là ${wordRescueTarget.translation}`);

      setTimeout(() => {
        generateWordRescue();
        setWordRescueLevel(prev => prev + 1);
      }, 2500);
    } else {
      // Incorrect
      wordRescueBirdYRef.current = Math.max(0, wordRescueBirdYRef.current - 10);
      setWordRescueBirdY(wordRescueBirdYRef.current);
      setWordRescueLetters(prev => prev.filter(l => l.id !== letter.id));
      playSound('delete');
      setAssistantMsg("Ôi không! Nhầm chữ rồi, thử lại nhé!");
    }
  };

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
            {games.map(game => {
              const highScore = stats.highScores?.[game.id] || 0;
              return (
                <Card 
                  key={game.id} 
                  onClick={() => startGame(game.id)}
                  className={`cursor-pointer hover:scale-105 transition-all border-white hover:border-${game.id === 'math' ? 'pink' : game.id === 'emoji' ? 'blue' : 'green'}-200 group relative overflow-hidden`}
                >
                  {highScore > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10">
                      <Trophy size={10} /> {highScore}
                    </div>
                  )}
                  <div className="text-6xl mb-4 text-center group-hover:rotate-12 transition-transform">{game.icon}</div>
                  <h3 className={`text-xl font-black text-center mb-2 ${game.textColor}`}>{game.name}</h3>
                  <p className="text-gray-500 text-sm text-center font-bold">{game.description}</p>
                  <div className="mt-4 flex justify-center">
                    <div className={`px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider ${game.color}`}>Chơi ngay</div>
                  </div>
                </Card>
              );
            })}
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
            {selectedGame !== 'joke' && selectedGame !== 'situation' && (
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-4 py-2 rounded-2xl font-black text-gray-700 shadow-sm border-2 border-white flex items-center gap-2">
                    <Trophy size={18} className={currentGame.textColor} />
                    Điểm: {score}
                  </div>
                  {combo > 1 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-orange-500 text-white px-3 py-1 rounded-xl text-xs font-black shadow-lg"
                    >
                      Combo x{combo} 🔥
                    </motion.div>
                  )}
                  <div className="bg-white/50 px-3 py-1 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Mức độ: {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}
                  </div>
                </div>
                <div className={`px-6 py-2 rounded-2xl font-black text-white shadow-lg flex items-center gap-2 ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : currentGame.color}`}>
                  <Timer size={18} />
                  {timeLeft}s
                </div>
              </div>
            )}

            {/* Game Area */}
            <div className="flex flex-col items-center justify-center py-8 relative">
              {/* Floating Points */}
              <AnimatePresence>
                {floatingPoints.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -100, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute z-50 pointer-events-none font-black text-3xl text-yellow-500 drop-shadow-md"
                  >
                    {p.value}
                  </motion.div>
                ))}
              </AnimatePresence>

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
                <div className="w-full max-w-4xl space-y-8">
                  <div className="text-center space-y-2">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-block px-6 py-2 bg-yellow-100 rounded-full border-2 border-yellow-200"
                    >
                      <h3 className="text-xl font-black text-yellow-700 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Palette className="w-6 h-6" />
                        Chủ đề: {stickerScene.name}
                      </h3>
                    </motion.div>
                    <p className="text-gray-500 font-medium text-lg">Chọn sticker bên dưới và dán vào đúng vị trí nhé! ✨</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Scene Canvas */}
                    <div className="lg:col-span-3">
                      <div className={`relative w-full aspect-video rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border-[12px] border-white ring-4 ring-yellow-100/50 ${stickerScene.bgColor} transition-colors duration-700`}>
                        {/* Dynamic Background Decorations */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.2, 1],
                              rotate: [0, 90, 0],
                              opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 20, repeat: Infinity }}
                            className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white blur-[100px]" 
                          />
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.3, 1],
                              x: [0, 50, 0],
                              opacity: [0.1, 0.15, 0.1]
                            }}
                            transition={{ duration: 15, repeat: Infinity }}
                            className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-yellow-200 blur-[120px]" 
                          />
                          
                          {/* Grid Overlay for texture */}
                          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                        </div>

                        {/* Slots */}
                        {stickerScene.slots.map((slot: any) => {
                          const isPlaced = placedStickers.includes(slot.id);
                          const isActive = activeSlotId === slot.id;
                          const isError = hasErrorInCurrentSlot && isActive;

                          return (
                            <div 
                              key={slot.id}
                              style={{ left: slot.x, top: slot.y }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                            >
                              {isPlaced ? (
                                <motion.div 
                                  initial={{ scale: 0, rotate: -45, y: -20 }}
                                  animate={{ scale: 1, rotate: [0, -5, 5, 0], y: 0 }}
                                  className="relative group"
                                >
                                  <div className="text-8xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] filter saturate-[1.2] hover:scale-110 transition-transform cursor-pointer">
                                    {slot.icon}
                                  </div>
                                  {/* Success Sparkle Effect */}
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute -inset-4 pointer-events-none"
                                  >
                                    <Sparkles className="w-full h-full text-yellow-300" />
                                  </motion.div>
                                </motion.div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  animate={
                                    isError 
                                      ? { x: [-5, 5, -5, 5, 0], backgroundColor: ['rgba(255,255,255,0.3)', 'rgba(239,68,68,0.4)', 'rgba(255,255,255,0.3)'] }
                                      : isActive 
                                        ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0)'] } 
                                        : {}
                                  }
                                  transition={isActive ? { repeat: Infinity, duration: 2 } : { duration: 0.4 }}
                                  onClick={() => {
                                    setActiveSlotId(slot.id);
                                    setHasErrorInCurrentSlot(false);
                                    playSound('click');
                                  }}
                                  className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isActive 
                                      ? 'bg-white/60 border-4 border-white shadow-[0_0_40px_rgba(255,255,255,0.6)]' 
                                      : 'bg-white/20 border-4 border-white/40 border-dashed hover:bg-white/40 hover:border-white'
                                  }`}
                                >
                                  <div className={`text-center p-2 ${isActive ? 'text-yellow-700' : 'text-white/80'}`}>
                                    <Plus className={`w-6 h-6 mx-auto mb-1 transition-transform group-hover:rotate-90 ${isActive ? 'scale-125' : ''}`} />
                                    <span className="text-[10px] font-black uppercase leading-tight block">{slot.name}</span>
                                  </div>
                                  
                                  {/* Pulsing Ring for Active Slot */}
                                  {isActive && (
                                    <div className="absolute -inset-2 border-2 border-white rounded-full animate-ping opacity-20" />
                                  )}
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sticker Palette */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[32px] border-4 border-white shadow-2xl h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-4 px-2">
                          <div className="w-2 h-8 bg-yellow-400 rounded-full" />
                          <h4 className="font-black text-gray-700 uppercase text-sm tracking-wider">Túi nhãn dán</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {stickerScene.slots.map((slot: any) => {
                            const isPlaced = placedStickers.includes(slot.id);
                            
                            return (
                              <motion.button
                                key={`palette-${slot.id}`}
                                whileHover={!isPlaced ? { scale: 1.05, y: -4 } : {}}
                                whileTap={!isPlaced ? { scale: 0.95 } : {}}
                                onClick={() => handleStickerPlace(slot.icon)}
                                disabled={isPlaced || !activeSlotId}
                                className={`relative aspect-square rounded-2xl flex items-center justify-center text-4xl shadow-sm transition-all duration-300 ${
                                  isPlaced 
                                    ? 'bg-gray-100 opacity-20 grayscale cursor-default' 
                                    : !activeSlotId 
                                      ? 'bg-gray-50 border-2 border-gray-100 opacity-40 cursor-not-allowed'
                                      : 'bg-white border-4 border-yellow-50 hover:border-yellow-300 hover:shadow-lg cursor-pointer'
                                }`}
                              >
                                {slot.icon}
                                {!isPlaced && activeSlotId && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        <div className="mt-auto pt-6 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-2xl border border-yellow-100">
                            <span className="text-xs font-bold text-yellow-700">
                              Đã dán: {placedStickers.length}/{stickerScene.slots.length}
                            </span>
                          </div>
                        </div>
                      </div>
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

              {selectedGame === 'situation' && currentSituation && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-block px-4 py-1 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold uppercase tracking-wider">
                      {currentSituation.type}
                    </div>
                    <h3 className="text-2xl font-black text-cyan-600">{currentSituation.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1: Content */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-[32px] border-4 transition-all duration-500 ${
                        situationStep === 'content' ? 'bg-white border-cyan-500 shadow-xl scale-105 z-10' : 'bg-gray-50 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">1</div>
                        <span className="font-bold text-cyan-600 uppercase text-xs tracking-widest">Nội dung</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {currentSituation.content}
                      </p>
                      {situationStep === 'content' && (
                        <button 
                          onClick={() => { setSituationStep('explanation'); playSound('click'); }}
                          className="mt-6 w-full py-3 bg-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-600 transition-colors"
                        >
                          Tiếp theo
                        </button>
                      )}
                    </motion.div>

                    {/* Step 2: Explanation */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`p-6 rounded-[32px] border-4 transition-all duration-500 ${
                        situationStep === 'explanation' ? 'bg-white border-cyan-500 shadow-xl scale-105 z-10' : 'bg-gray-50 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">2</div>
                        <span className="font-bold text-cyan-600 uppercase text-xs tracking-widest">Giải thích</span>
                      </div>
                      <ul className="space-y-3">
                        {currentSituation.explanation.map((item: string, i: number) => (
                          <li key={i} className="flex gap-2 text-gray-700">
                            <span className="text-cyan-500">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {situationStep === 'explanation' && (
                        <button 
                          onClick={() => { setSituationStep('question'); playSound('click'); }}
                          className="mt-6 w-full py-3 bg-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-600 transition-colors"
                        >
                          Đã hiểu!
                        </button>
                      )}
                    </motion.div>

                    {/* Step 3: Question & Answer */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`p-6 rounded-[32px] border-4 transition-all duration-500 ${
                        situationStep === 'question' ? 'bg-white border-cyan-500 shadow-xl scale-105 z-10' : 'bg-gray-50 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">3</div>
                          <span className="font-bold text-cyan-600 uppercase text-xs tracking-widest">Câu hỏi</span>
                        </div>
                        <span className="text-xs font-bold text-cyan-400">
                          {usedSituationIndices.length} / {SITUATIONS.length}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 mb-6">{currentSituation.question}</p>
                      
                      <div className="space-y-3">
                        {shuffledOptions.map((option: string, i: number) => (
                          <button
                            key={i}
                            disabled={situationStep !== 'question' || !!situationFeedback}
                            onClick={() => handleSituationAnswer(option)}
                            className={`w-full p-4 rounded-2xl border-2 font-bold transition-all text-left flex items-center justify-between ${
                              situationFeedback === 'correct' && option === currentSituation.answer
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : situationFeedback === 'incorrect' && option !== currentSituation.answer
                                ? 'bg-rose-50 border-rose-200 text-rose-400'
                                : 'bg-white border-gray-100 text-gray-700 hover:border-cyan-200 hover:bg-cyan-50'
                            }`}
                          >
                            <span>{option}</span>
                            {situationFeedback === 'correct' && option === currentSituation.answer && <CheckCircle2 className="w-5 h-5" />}
                            {situationFeedback === 'incorrect' && option !== currentSituation.answer && <XCircle className="w-5 h-5" />}
                          </button>
                        ))}
                      </div>

                      {situationFeedback === 'correct' && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => {
                            if (usedSituationIndices.length === SITUATIONS.length) {
                              setGameState('end');
                            } else {
                              generateSituation();
                            }
                          }}
                          className="mt-6 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          Câu tiếp theo
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {selectedGame === 'joke' && (
                <div className="w-full max-w-2xl space-y-8">
                  <AnimatePresence mode="wait">
                    {currentJokes.map((joke, idx) => {
                      const lines = joke.split('\n');
                      const rawTitle = lines[0];
                      // Remove leading number like "1. " or "10. "
                      const title = rawTitle.replace(/^\d+\.\s*/, '');
                      const content = lines.slice(1).join('\n');
                      
                      return (
                        <motion.div
                          key={joke.substring(0, 20)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          <Card className="p-8 md:p-12 bg-white border-4 border-teal-200 shadow-2xl rounded-[48px] relative overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-tr-full -ml-12 -mb-12 opacity-50" />
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200 shrink-0">
                                  <BookOpen size={28} />
                                </div>
                                <div>
                                  <h3 className="text-2xl md:text-3xl font-black text-teal-600 leading-tight">{title}</h3>
                                  <div className="h-1.5 w-20 bg-teal-200 rounded-full mt-2" />
                                </div>
                              </div>

                              <div className="whitespace-pre-wrap text-gray-700 text-lg md:text-xl font-medium leading-relaxed text-left pl-6 border-l-4 border-teal-100">
                                {content}
                              </div>

                              <div className="mt-8 flex justify-end">
                                <span className="text-4xl opacity-20 select-none">✨</span>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={generateJokes} 
                      variant="accent" 
                      className="bg-teal-500 hover:bg-teal-600 text-white px-12 py-6 rounded-3xl shadow-xl shadow-teal-100 flex items-center gap-4 text-xl font-black transform hover:scale-105 active:scale-95 transition-all group"
                    >
                      <Sparkles size={28} className="group-hover:rotate-12 transition-transform" /> 
                      Đọc truyện khác
                    </Button>
                  </div>
                </div>
              )}

              {selectedGame === 'wordRescue' && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-indigo-600 uppercase tracking-widest">Cấp độ {wordRescueLevel}</h3>
                    {wordRescueIsComplete && (
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-indigo-500 font-bold text-xl mt-2"
                      >
                        {wordRescueTarget.translation}
                      </motion.p>
                    )}
                  </div>

                  <div className="relative w-full h-[400px] bg-gradient-to-b from-indigo-50 to-blue-100 rounded-[40px] border-4 border-white shadow-xl overflow-hidden">
                    {/* Clouds */}
                    <div className="absolute top-10 right-20 text-4xl opacity-20">☁️</div>
                    <div className="absolute top-40 left-10 text-3xl opacity-10">☁️</div>
                    <div className="absolute top-20 left-1/2 text-5xl opacity-15">☁️</div>

                    {/* Bird */}
                    <motion.div
                      style={{ bottom: `${wordRescueBirdY}%`, left: '20%' }}
                      className="absolute text-7xl -translate-x-1/2 z-20"
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🦜
                    </motion.div>

                    {/* Falling Letters */}
                    {!wordRescueIsComplete && wordRescueLetters.map(letter => (
                      <motion.button
                        key={letter.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ left: `${letter.x}%`, top: `${letter.y}%` }}
                        onClick={() => handleWordRescueLetterClick(letter)}
                        className="absolute w-12 h-12 bg-white rounded-2xl shadow-lg border-2 border-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600 hover:bg-indigo-50 transition-colors z-30"
                      >
                        {letter.char}
                      </motion.button>
                    ))}

                    {/* Target Word Display */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border-2 border-white">
                      {wordRescueTarget.word.split('').map((char, i) => (
                        <div 
                          key={i}
                          className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                            i === wordRescueMissingIndex && !wordRescueIsComplete
                              ? 'bg-white border-dashed border-indigo-300 text-transparent'
                              : 'bg-indigo-500 border-indigo-600 text-white shadow-lg'
                          }`}
                        >
                          {i === wordRescueMissingIndex && !wordRescueIsComplete ? '?' : char}
                        </div>
                      ))}
                    </div>
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
        <Card className="max-w-md mx-auto p-12 text-center space-y-8 relative overflow-hidden">
          {isNewHighScore && (
            <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="absolute top-0 left-0 w-full bg-yellow-400 text-yellow-900 py-2 font-black text-sm uppercase tracking-widest shadow-md z-10"
            >
              Kỷ lục mới! 🌟
            </motion.div>
          )}
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-9xl mb-4"
          >
            {isNewHighScore ? '👑' : score > 0 ? '🏆' : '😅'}
          </motion.div>
          
          <div>
            <h3 className="text-4xl font-black text-gray-800 mb-2">
              {isNewHighScore ? 'Kỷ lục mới!' : score > 0 ? 'Tuyệt vời!' : 'Cố gắng lên!'}
            </h3>
            <p className="text-gray-500 font-bold">Bạn đã hoàn thành thử thách {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-[40px] border-4 border-gray-100 relative">
            <div className="text-sm text-gray-400 font-black uppercase tracking-widest mb-2">Điểm số của bạn</div>
            <div className={`text-6xl font-black ${currentGame.textColor} mb-4`}>{score}</div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-yellow-500 font-black text-2xl">
                <Star fill="currentColor" size={28} />
                + {Math.floor((score / 5) * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2))} sao
              </div>
            </div>

            {stats.highScores?.[selectedGame!] && !isNewHighScore && (
              <div className="mt-4 text-xs text-gray-400 font-bold">
                Kỷ lục của bạn: {stats.highScores[selectedGame!]}
              </div>
            )}
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


const CalculatorPopup = ({ onClose }: { onClose: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
    playSound('pop');
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
    playSound('pop');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor as a safer alternative to eval for simple math
      // In a real app, use a proper math parser
      const result = new Function(`return ${fullEquation.replace('x', '*').replace('÷', '/')}`)();
      setDisplay(Number.isInteger(result) ? result.toString() : result.toFixed(2).toString());
      setEquation('');
      setShouldReset(true);
      playSound('success');
    } catch (e) {
      setDisplay('Lỗi');
      setEquation('');
      setShouldReset(true);
      playSound('pop');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setShouldReset(false);
    playSound('delete');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] p-6 w-full max-w-xs shadow-2xl border-4 border-blue-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-blue-900 flex items-center gap-2">
            <Calculator className="text-blue-500" /> Máy tính
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="bg-gray-900 rounded-3xl p-6 mb-6 text-right shadow-inner">
          <div className="text-blue-400 text-xs font-bold h-4 mb-1 overflow-hidden whitespace-nowrap">
            {equation}
          </div>
          <div className="text-white text-4xl font-black font-mono overflow-hidden whitespace-nowrap">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button onClick={clear} className="col-span-2 p-4 bg-red-100 text-red-600 rounded-2xl font-black hover:bg-red-200 transition-colors">AC</button>
          <button onClick={() => handleOperator('/')} className="p-4 bg-orange-100 text-orange-600 rounded-2xl font-black hover:bg-orange-200 transition-colors">÷</button>
          <button onClick={() => handleOperator('*')} className="p-4 bg-orange-100 text-orange-600 rounded-2xl font-black hover:bg-orange-200 transition-colors">×</button>

          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-blue-50 text-blue-900 rounded-2xl font-black hover:bg-blue-100 transition-colors">{n}</button>
          ))}
          <button onClick={() => handleOperator('-')} className="p-4 bg-orange-100 text-orange-600 rounded-2xl font-black hover:bg-orange-200 transition-colors">-</button>

          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-blue-50 text-blue-900 rounded-2xl font-black hover:bg-blue-100 transition-colors">{n}</button>
          ))}
          <button onClick={() => handleOperator('+')} className="p-4 bg-orange-100 text-orange-600 rounded-2xl font-black hover:bg-orange-200 transition-colors">+</button>

          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-blue-50 text-blue-900 rounded-2xl font-black hover:bg-blue-100 transition-colors">{n}</button>
          ))}
          <button onClick={calculate} className="row-span-2 p-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">=</button>

          <button onClick={() => handleNumber('0')} className="col-span-2 p-4 bg-blue-50 text-blue-900 rounded-2xl font-black hover:bg-blue-100 transition-colors">0</button>
          <button onClick={() => handleNumber('.')} className="p-4 bg-blue-50 text-blue-900 rounded-2xl font-black hover:bg-blue-100 transition-colors">.</button>
        </div>
      </motion.div>
    </motion.div>
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
  const [notes, setNotes] = useState<Note[]>([]);
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
  const [showCalculator, setShowCalculator] = useState(false);
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
        const gNotes = localStorage.getItem('guest_notes');
        const gSessions = localStorage.getItem('guest_studySessions');
        const gStars = localStorage.getItem('guest_stars');
        const gStats = localStorage.getItem('guest_stats');
        
        if (gSchedule || gHomework || gSessions || gStats || gNotes) {
          if (gSchedule) setSchedule(JSON.parse(gSchedule));
          if (gHomework) setHomework(JSON.parse(gHomework));
          if (gNotes) setNotes(JSON.parse(gNotes));
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
        setUserName(data.profile?.nickname || data.profile?.fullName || data.userName || '');
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

    // Notes listener
    const unsubNotes = onSnapshot(collection(db, 'users', userId, 'notes'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Note));
      setNotes(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/notes`));

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
      unsubNotes();
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
        profile: {
          ...stats.profile,
          fullName: name
        },
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

          // Update lastResetWeek and reset weeklyStars in user profile
          await updateDoc(doc(db, 'users', user.uid), {
            lastResetWeek: currentWeek,
            weeklyStars: 0
          });
          
          setAssistantMsg("Chào tuần mới! Thời khóa biểu của bạn đã được làm mới rồi đấy. Cố gắng lên nhé! ✨");
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
    const { schedule: sampleSchedule, homework: sampleHomework, studySessions: sampleSessions, notes: sampleNotes, profile: sampleProfile } = getSampleData();

    setSchedule(sampleSchedule);
    setHomework(sampleHomework);
    setStudySessions(sampleSessions);
    setNotes(sampleNotes);
    setStars(250);
    setStats(prev => ({ 
      ...prev, 
      stars: 250, 
      totalStarsEarned: 250,
      profile: { ...prev.profile, ...sampleProfile }
    }));
    
    setAssistantMsg("Đã tạo dữ liệu mẫu cho bạn rồi đó! Hãy khám phá các chức năng nhé! ✨");
    playSound('success');
  };

  const clearGuestData = () => {
    setSchedule([]);
    setHomework([]);
    setNotes([]);
    setStudySessions([]);
    setStars(0);
    setStats(prev => ({
      ...prev,
      stars: 0,
      totalStarsEarned: 0,
      unlockedItems: ['default_bg', 'bird'],
      stickers: [],
      activeWallpaper: 'default_bg',
      activeCharacter: 'bird',
      profile: {}
    }));
    
    localStorage.removeItem('guest_schedule');
    localStorage.removeItem('guest_homework');
    localStorage.removeItem('guest_notes');
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
      localStorage.setItem('guest_notes', JSON.stringify(notes));
      localStorage.setItem('guest_studySessions', JSON.stringify(studySessions));
      localStorage.setItem('guest_stars', stars.toString());
      localStorage.setItem('guest_stats', JSON.stringify(stats));
    }
  }, [user, isAuthReady, schedule, homework, notes, studySessions, stars, stats]);

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
    const newWeeklyStars = (stats.weeklyStars || 0) + amount;
    setStars(newStars);
    setStats(prev => ({ ...prev, stars: newStars, totalStarsEarned: newTotalStars, weeklyStars: newWeeklyStars }));
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
          totalStarsEarned: newTotalStars,
          weeklyStars: newWeeklyStars
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

  const addNote = async (item: Omit<Note, 'id'>) => {
    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'notes'), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/notes`);
      }
    } else {
      const newItem = { ...item, id: Date.now().toString() };
      setNotes(prev => [...prev, newItem]);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'notes', id), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/notes/${id}`);
      }
    } else {
      setNotes(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  };

  const deleteNote = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
        playSound('delete');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/notes/${id}`);
      }
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
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

  // Assistant logic based on notes
  useEffect(() => {
    if (activeTab === 'notes') {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const todayNotes = notes.filter((n: Note) => n.reminderDate === todayStr && !n.isCompleted);
      const tomorrowNotes = notes.filter((n: Note) => n.reminderDate === tomorrowStr && !n.isCompleted);

      if (todayNotes.length > 0) {
        setTimeout(() => {
          setAssistantMsg(`Bạn có ${todayNotes.length} ghi chú cần làm hôm nay đó!`);
        }, 1000);
      } else if (tomorrowNotes.length > 0) {
        setTimeout(() => {
          setAssistantMsg(`Ngày mai bạn có ${tomorrowNotes.length} ghi chú cần nhớ nhé!`);
        }, 1000);
      }
    }
  }, [notes, activeTab]);

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

  const updateHighScore = async (gameId: string, newScore: number) => {
    const currentHighScores = stats.highScores || {};
    const currentBest = currentHighScores[gameId] || 0;
    
    if (newScore > currentBest) {
      const updatedHighScores = { ...currentHighScores, [gameId]: newScore };
      setStats(prev => ({ ...prev, highScores: updatedHighScores }));
      
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            highScores: updatedHighScores
          });
        } catch (err) {
          console.error("Error saving high score:", err);
        }
      }
      return true; // New high score
    }
    return false;
  };

  // --- Views ---


  const updateProfile = async (profileData: any) => {
    setStats(prev => ({ ...prev, profile: profileData }));
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          profile: profileData
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const state = { user, stars, schedule, homework, notes, studySessions, backpackItems, isGeneratingBackpack, isFocusMode, focusTime, timerTotalTime, isTimerActive, timerMode, currentSessionId, studyJourneyProgress, stats, activeTab, selectedDay };
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
    addNote,
    updateNote,
    deleteNote,
    addStudySession,
    deleteStudySession,
    updateStudySessionStatus,
    updateHighScore,
    setShowCalculator,
    updateProfile
  };
  return (
    <div className="min-h-screen font-sans text-gray-800 pb-20 md:pb-0 md:pl-24 pt-16 md:pt-20 transition-colors duration-500" style={{ backgroundColor: activeBgColor }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 md:left-24 h-16 md:h-20 bg-white/80 backdrop-blur-md z-30 flex items-center justify-between px-6 border-b-2 border-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg text-white overflow-hidden">
            {stats.profile?.avatar ? (
              <img src={stats.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              activeCharIcon
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Chào mừng bạn nhỏ</div>
            <div className="text-sm md:text-lg font-black text-blue-900 leading-none flex items-center gap-2">
              {user ? (stats.profile?.nickname || stats.profile?.fullName || userName || 'Bạn nhỏ') : 'Khách'}
              {user && (
                <button 
                  onClick={() => setActiveTab('profile')}
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
          { id: 'schedule', icon: Calendar, label: 'Thời khóa biểu', color: 'text-blue-500' },
          { id: 'homework', icon: BookText, label: 'Bài tập', color: 'text-green-500' },
          { id: 'timetable', icon: Clock, label: 'Thời gian biểu', color: 'text-yellow-500' },
          { id: 'notes', icon: Edit2, label: 'Ghi chú', color: 'text-indigo-500' },
          { id: 'achievements', icon: Trophy, label: 'Thành tích', color: 'text-purple-500' },
          { id: 'shop', icon: ShoppingBag, label: 'Cửa hàng', color: 'text-orange-500' },
          { id: 'minigame', icon: Gamepad2, label: 'Trò chơi', color: 'text-pink-500' },
          { id: 'profile', icon: User, label: 'Cá nhân', color: 'text-teal-500' },
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
            {activeTab === 'notes' && <NotesView state={state} actions={actions} />}
            {activeTab === 'achievements' && <AchievementsView state={state} actions={actions} />}
            {activeTab === 'shop' && <ShopView state={state} actions={actions} />}
            {activeTab === 'minigame' && <MiniGameView state={state} actions={actions} />}
            {activeTab === 'profile' && <ProfileView state={state} actions={actions} />}
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
        {showCalculator && <CalculatorPopup onClose={() => setShowCalculator(false)} />}
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
                        saveUserName(userName.trim());
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
