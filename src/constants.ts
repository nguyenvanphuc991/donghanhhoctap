import { Calculator, BookOpen, Globe, Palette, Music, Dumbbell, Languages, Monitor, Heart, Star } from 'lucide-react';
import { Subject } from './types';

export const SUBJECT_CONFIG: Record<Subject, { icon: any; color: string; bgColor: string }> = {
  'Toán': { icon: Calculator, color: '#3B82F6', bgColor: '#DBEAFE' },
  'Tiếng Việt': { icon: BookOpen, color: '#F97316', bgColor: '#FFEDD5' },
  'Tự nhiên xã hội': { icon: Globe, color: '#10B981', bgColor: '#D1FAE5' },
  'Mỹ thuật': { icon: Palette, color: '#A855F7', bgColor: '#F3E8FF' },
  'Âm nhạc': { icon: Music, color: '#EC4899', bgColor: '#FCE7F3' },
  'Thể dục': { icon: Dumbbell, color: '#6366F1', bgColor: '#E0E7FF' },
  'Tiếng Anh': { icon: Languages, color: '#06B6D4', bgColor: '#CFFAFE' },
  'Tin học': { icon: Monitor, color: '#6B7280', bgColor: '#F3F4F6' },
  'Đạo đức': { icon: Heart, color: '#F43F5E', bgColor: '#FFE4E6' },
  'Khác': { icon: Star, color: '#9CA3AF', bgColor: '#F9FAFB' },
};

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const BADGES = [
  { id: 'newbie', name: 'Người mới', icon: '🌱', description: 'Bắt đầu hành trình học tập' },
  { id: 'diligent_7', name: 'Chăm chỉ 7 ngày', icon: '🔥', description: 'Học tập liên tiếp 7 ngày' },
  { id: 'homework_master', name: 'Vua bài tập', icon: '👑', description: 'Hoàn thành 50 bài tập' },
  { id: 'early_bird', name: 'Chim non', icon: '🐦', description: 'Hoàn thành nhiệm vụ trước 8h tối' },
];

export const SHOP_ITEMS = {
  wallpapers: [
    { id: 'default_bg', name: 'Mặc định', price: 0, color: '#F0F9FF' },
    { id: 'sunny_bg', name: 'Nắng vàng', price: 50, color: '#FFFBEB' },
    { id: 'forest_bg', name: 'Rừng xanh', price: 100, color: '#F0FDF4' },
    { id: 'sunset_bg', name: 'Hoàng hôn', price: 150, color: '#FFF7ED' },
    { id: 'space_bg', name: 'Vũ trụ', price: 200, color: '#F5F3FF' },
  ],
  characters: [
    { id: 'bird', name: 'Chim Xanh', price: 0, icon: '🐦' },
    { id: 'cat', name: 'Mèo Con', price: 50, icon: '🐱' },
    { id: 'panda', name: 'Gấu Trúc', price: 100, icon: '🐼' },
    { id: 'owl', name: 'Cú Thông Thái', price: 150, icon: '🦉' },
    { id: 'dragon', name: 'Rồng Nhỏ', price: 200, icon: '🐲' },
  ]
};

export const STUDY_JOURNEY = [
  { id: 'school', name: 'Trường học', icon: '🏫', description: 'Nơi bắt đầu hành trình' },
  { id: 'park', name: 'Công viên', icon: '🌳', description: 'Thư giãn một chút' },
  { id: 'library', name: 'Thư viện', icon: '🏛', description: 'Kho tàng kiến thức' },
  { id: 'museum', name: 'Bảo tàng', icon: '🖼', description: 'Khám phá lịch sử' },
  { id: 'zoo', name: 'Sở thú', icon: '🦁', description: 'Thế giới động vật' },
  { id: 'space', name: 'Trạm vũ trụ', icon: '🚀', description: 'Vươn tới các vì sao' },
];
