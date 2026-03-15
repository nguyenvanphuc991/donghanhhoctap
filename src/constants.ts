import { Calculator, BookOpen, Globe, Palette, Music, Dumbbell, Languages, Monitor, Heart, Star, Compass, FlaskConical, Cpu, Wrench, Rocket } from 'lucide-react';
import { Subject } from './types';

export const SUBJECT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Tiếng Việt': { icon: BookOpen, color: '#F97316', bgColor: '#FFEDD5' },
  'Toán': { icon: Calculator, color: '#3B82F6', bgColor: '#DBEAFE' },
  'Đạo đức': { icon: Heart, color: '#F43F5E', bgColor: '#FFE4E6' },
  'Ngoại ngữ': { icon: Languages, color: '#06B6D4', bgColor: '#CFFAFE' },
  'Tự nhiên và Xã hội': { icon: Globe, color: '#10B981', bgColor: '#D1FAE5' },
  'Lịch sử & Địa lý': { icon: Compass, color: '#D97706', bgColor: '#FEF3C7' },
  'Khoa học': { icon: FlaskConical, color: '#8B5CF6', bgColor: '#EDE9FE' },
  'Tin học': { icon: Monitor, color: '#6B7280', bgColor: '#F3F4F6' },
  'Công nghệ': { icon: Cpu, color: '#0EA5E9', bgColor: '#E0F2FE' },
  'Giáo dục thể chất': { icon: Dumbbell, color: '#6366F1', bgColor: '#E0E7FF' },
  'Âm nhạc': { icon: Music, color: '#EC4899', bgColor: '#FCE7F3' },
  'Mỹ thuật': { icon: Palette, color: '#A855F7', bgColor: '#F3E8FF' },
  'Hoạt động trải nghiệm': { icon: Rocket, color: '#14B8A6', bgColor: '#CCFBF1' },
  'STEM': { icon: Wrench, color: '#F59E0B', bgColor: '#FEF3C7' },
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
    { id: 'ocean_bg', name: 'Đại dương', price: 250, color: '#E0F2FE' },
    { id: 'candy_bg', name: 'Kẹo ngọt', price: 300, color: '#FDF2F8' },
    { id: 'midnight_bg', name: 'Đêm khuya', price: 400, color: '#1E293B' },
  ],
  characters: [
    { id: 'bird', name: 'Chim Xanh', price: 0, icon: '🐦' },
    { id: 'cat', name: 'Mèo Con', price: 50, icon: '🐱' },
    { id: 'panda', name: 'Gấu Trúc', price: 100, icon: '🐼' },
    { id: 'owl', name: 'Cú Thông Thái', price: 150, icon: '🦉' },
    { id: 'dragon', name: 'Rồng Nhỏ', price: 200, icon: '🐲' },
    { id: 'unicorn', name: 'Kỳ lân', price: 300, icon: '🦄' },
    { id: 'robot', name: 'Người máy', price: 400, icon: '🤖' },
    { id: 'alien', name: 'Người ngoài hành tinh', price: 500, icon: '👽' },
  ],
  stickers: [
    { id: 'sticker_heart', name: 'Tim yêu', price: 20, icon: '❤️' },
    { id: 'sticker_fire', name: 'Lửa cháy', price: 20, icon: '🔥' },
    { id: 'sticker_rocket', name: 'Tên lửa', price: 30, icon: '🚀' },
    { id: 'sticker_crown', name: 'Vương miện', price: 50, icon: '👑' },
    { id: 'sticker_diamond', name: 'Kim cương', price: 100, icon: '💎' },
  ],
  supplies: [
    { id: 'supply_pencil', name: 'Viết chì', price: 10, icon: '✏️' },
    { id: 'supply_eraser', name: 'Gôm', price: 10, icon: '🧼' },
    { id: 'supply_ruler', name: 'Thước', price: 15, icon: '📏' },
    { id: 'supply_pen', name: 'Viết mực', price: 20, icon: '🖋️' },
    { id: 'supply_notebook', name: 'Tập', price: 30, icon: '📓' },
    { id: 'supply_book', name: 'Sách', price: 50, icon: '📚' },
    { id: 'supply_scissors', name: 'Kéo', price: 60, icon: '✂️' },
    { id: 'supply_pencil_case', name: 'Hộp viết', price: 80, icon: '👝' },
    { id: 'supply_water_bottle', name: 'Bình nước', price: 100, icon: '🥤' },
    { id: 'supply_backpack', name: 'Cái cặp', price: 200, icon: '🎒' },
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

export const STICKER_BOOK_SCENES = [
  {
    id: 'ocean',
    name: 'Đại dương xanh',
    icon: '🌊',
    bgColor: 'bg-blue-400',
    slots: [
      { id: 's1', icon: '🐠', x: '20%', y: '30%', name: 'Cá nhỏ' },
      { id: 's2', icon: '🐙', x: '70%', y: '60%', name: 'Bạch tuộc' },
      { id: 's3', icon: '🦀', x: '40%', y: '80%', name: 'Cua đỏ' },
      { id: 's4', icon: '🐳', x: '15%', y: '60%', name: 'Cá voi' },
    ]
  },
  {
    id: 'space',
    name: 'Vũ trụ bao la',
    icon: '🚀',
    bgColor: 'bg-indigo-900',
    slots: [
      { id: 's1', icon: '🚀', x: '50%', y: '20%', name: 'Tên lửa' },
      { id: 's2', icon: '👨‍🚀', x: '20%', y: '50%', name: 'Phi hành gia' },
      { id: 's3', icon: '🪐', x: '80%', y: '30%', name: 'Hành tinh' },
      { id: 's4', icon: '🛸', x: '70%', y: '70%', name: 'Đĩa bay' },
    ]
  },
  {
    id: 'garden',
    name: 'Khu vườn nhỏ',
    icon: '🏡',
    bgColor: 'bg-green-400',
    slots: [
      { id: 's1', icon: '🦋', x: '30%', y: '20%', name: 'Bướm xinh' },
      { id: 's2', icon: '🐝', x: '60%', y: '40%', name: 'Ong chăm chỉ' },
      { id: 's3', icon: '🌻', x: '15%', y: '70%', name: 'Hoa hướng dương' },
      { id: 's4', icon: '🐞', x: '80%', y: '80%', name: 'Bọ cánh cam' },
    ]
  },
  {
    id: 'jungle',
    name: 'Rừng xanh vẫy gọi',
    icon: '🌳',
    bgColor: 'bg-emerald-600',
    slots: [
      { id: 's1', icon: '🦁', x: '20%', y: '70%', name: 'Sư tử' },
      { id: 's2', icon: '🐒', x: '50%', y: '30%', name: 'Khỉ con' },
      { id: 's3', icon: '🐘', x: '80%', y: '65%', name: 'Voi to' },
      { id: 's4', icon: '🦜', x: '30%', y: '20%', name: 'Vẹt hồng' },
    ]
  },
  {
    id: 'countryside',
    name: 'Đồng quê yên bình',
    icon: '🌾',
    bgColor: 'bg-orange-300',
    slots: [
      { id: 's1', icon: '🐄', x: '25%', y: '65%', name: 'Bò sữa' },
      { id: 's2', icon: '🐓', x: '60%', y: '75%', name: 'Gà trống' },
      { id: 's3', icon: '🚜', x: '80%', y: '60%', name: 'Máy cày' },
      { id: 's4', icon: '🏠', x: '50%', y: '40%', name: 'Nhà ngói' },
    ]
  },
  {
    id: 'animals',
    name: 'Thế giới động vật',
    icon: '🐼',
    bgColor: 'bg-yellow-200',
    slots: [
      { id: 's1', icon: '🐼', x: '20%', y: '40%', name: 'Gấu trúc' },
      { id: 's2', icon: '🦒', x: '50%', y: '50%', name: 'Hươu cao cổ' },
      { id: 's3', icon: '🦓', x: '80%', y: '45%', name: 'Ngựa vằn' },
      { id: 's4', icon: '🦘', x: '40%', y: '75%', name: 'Kangaroo' },
    ]
  }
];

export const WORD_LIST = [
  { word: 'TRUONG', hint: 'Nơi chúng mình đến học mỗi ngày' },
  { word: 'GIAOVIEN', hint: 'Người dạy dỗ chúng mình' },
  { word: 'SACHVO', hint: 'Đồ dùng để viết và đọc' },
  { word: 'BANBE', hint: 'Những người cùng chơi với mình' },
  { word: 'HOCTAP', hint: 'Việc chính của học sinh' },
  { word: 'BUTCHI', hint: 'Dùng để vẽ hoặc viết' },
  { word: 'THUOCKE', hint: 'Dùng để kẻ đường thẳng' },
  { word: 'CAPSACH', hint: 'Dùng để đựng đồ dùng học tập' },
  { word: 'GIADINH', hint: 'Những người thân yêu nhất' },
  { word: 'MUAHE', hint: 'Kỳ nghỉ dài nhất trong năm' },
  { word: 'MATTROI', hint: 'Ông mặt trời tỏa sáng ban ngày' },
  { word: 'TRANGSAO', hint: 'Chiếu sáng bầu trời ban đêm' },
  { word: 'CONMEO', hint: 'Con vật thích bắt chuột' },
  { word: 'CONCHO', hint: 'Con vật trung thành giữ nhà' },
  { word: 'TRAICAY', hint: 'Thức ăn bổ dưỡng từ cây' },
  { word: 'RAUXANH', hint: 'Thực phẩm giúp bé khỏe mạnh' },
  { word: 'DAPXE', hint: 'Một hoạt động thể thao vui vẻ' },
  { word: 'BOILOI', hint: 'Hoạt động dưới nước' },
  { word: 'CAMTRAI', hint: 'Ngủ trong lều ngoài trời' },
  { word: 'MAYBAY', hint: 'Phương tiện bay trên trời' },
  { word: 'TAUHOA', hint: 'Phương tiện chạy trên đường ray' },
  { word: 'XEBUS', hint: 'Xe chở nhiều người cùng lúc' },
  { word: 'BANHMI', hint: 'Món ăn sáng quen thuộc' },
  { word: 'SUATUOI', hint: 'Đồ uống giúp bé cao lớn' },
  { word: 'CONVOI', hint: 'Con vật to có cái vòi dài' },
  { word: 'CONHUOU', hint: 'Con vật có cái cổ rất cao' },
  { word: 'CONHO', hint: 'Chúa tể rừng xanh' },
  { word: 'CONKHI', hint: 'Con vật thích leo trèo' },
  { word: 'HOAHONG', hint: 'Loài hoa có gai và rất thơm' },
  { word: 'HOASEN', hint: 'Loài hoa mọc dưới bùn' },
  { word: 'BUTMUC', hint: 'Dùng để viết mực tím' },
  { word: 'CUCGOM', hint: 'Dùng để tẩy vết bút chì' },
  { word: 'BANGDEN', hint: 'Nơi cô giáo viết bài' },
  { word: 'PHANTRANG', hint: 'Dùng để viết lên bảng' },
  { word: 'GHEGO', hint: 'Đồ dùng để chúng mình ngồi' },
  { word: 'BANHOC', hint: 'Nơi chúng mình để sách vở' },
  { word: 'DONGHO', hint: 'Dùng để xem giờ' },
  { word: 'QUYENVO', hint: 'Nơi chúng mình viết bài' },
  { word: 'TIENGANH', hint: 'Một môn ngoại ngữ' },
  { word: 'AMNHAC', hint: 'Môn học về các bài hát' },
  { word: 'MYTHUAT', hint: 'Môn học về vẽ tranh' },
  { word: 'THECHUC', hint: 'Môn học giúp cơ thể khỏe mạnh' },
  { word: 'KHOAHOC', hint: 'Khám phá thế giới xung quanh' },
  { word: 'LICHSU', hint: 'Học về những chuyện ngày xưa' },
  { word: 'DIALY', hint: 'Học về các vùng đất' },
  { word: 'TINHOC', hint: 'Học cách dùng máy tính' },
];

export const getSampleData = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  
  const getDayDate = (dayOffset: number) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
  };

  const schedule = [
    // Thứ 2
    { id: 's1', day: 0, period: 1, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's2', day: 0, period: 2, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's3', day: 0, period: 3, session: 'morning', subject: 'Toán' },
    { id: 's4', day: 0, period: 4, session: 'morning', subject: 'Đạo đức' },
    { id: 's5', day: 0, period: 2, session: 'afternoon', subject: 'Ngoại ngữ' },
    { id: 's6', day: 0, period: 3, session: 'afternoon', subject: 'Tin học' },
    { id: 's7', day: 0, period: 4, session: 'afternoon', subject: 'Hoạt động trải nghiệm' },
    { id: 's8', day: 0, period: 5, session: 'afternoon', subject: 'Hoạt động trải nghiệm' },
    // Thứ 3
    { id: 's9', day: 1, period: 1, session: 'morning', subject: 'Toán' },
    { id: 's10', day: 1, period: 2, session: 'morning', subject: 'Toán' },
    { id: 's11', day: 1, period: 3, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's12', day: 1, period: 4, session: 'morning', subject: 'Tự nhiên và Xã hội' },
    { id: 's13', day: 1, period: 2, session: 'afternoon', subject: 'Công nghệ' },
    { id: 's14', day: 1, period: 3, session: 'afternoon', subject: 'Mỹ thuật' },
    { id: 's15', day: 1, period: 4, session: 'afternoon', subject: 'Âm nhạc' },
    { id: 's16', day: 1, period: 5, session: 'afternoon', subject: 'Giáo dục thể chất' },
    // Thứ 4
    { id: 's17', day: 2, period: 1, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's18', day: 2, period: 2, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's19', day: 2, period: 3, session: 'morning', subject: 'Toán' },
    { id: 's20', day: 2, period: 4, session: 'morning', subject: 'Lịch sử và Địa lý' },
    { id: 's21', day: 2, period: 2, session: 'afternoon', subject: 'STEM' },
    { id: 's22', day: 2, period: 3, session: 'afternoon', subject: 'Ngoại ngữ' },
    { id: 's23', day: 2, period: 4, session: 'afternoon', subject: 'Khoa học' },
    { id: 's24', day: 2, period: 5, session: 'afternoon', subject: 'Khoa học' },
    // Thứ 5
    { id: 's25', day: 3, period: 1, session: 'morning', subject: 'Toán' },
    { id: 's26', day: 3, period: 2, session: 'morning', subject: 'Toán' },
    { id: 's27', day: 3, period: 3, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's28', day: 3, period: 4, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's29', day: 3, period: 2, session: 'afternoon', subject: 'Tự nhiên và Xã hội' },
    { id: 's30', day: 3, period: 3, session: 'afternoon', subject: 'Giáo dục thể chất' },
    { id: 's31', day: 3, period: 4, session: 'afternoon', subject: 'Tin học' },
    { id: 's32', day: 3, period: 5, session: 'afternoon', subject: 'Công nghệ' },
    // Thứ 6
    { id: 's33', day: 4, period: 1, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's34', day: 4, period: 2, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's35', day: 4, period: 3, session: 'morning', subject: 'Toán' },
    { id: 's36', day: 4, period: 4, session: 'morning', subject: 'Đạo đức' },
    { id: 's37', day: 4, period: 2, session: 'afternoon', subject: 'Lịch sử và Địa lý' },
    { id: 's38', day: 4, period: 3, session: 'afternoon', subject: 'Khoa học' },
    { id: 's39', day: 4, period: 4, session: 'afternoon', subject: 'Ngoại ngữ' },
    { id: 's40', day: 4, period: 5, session: 'afternoon', subject: 'Hoạt động trải nghiệm' },
    // Thứ 7
    { id: 's41', day: 5, period: 1, session: 'morning', subject: 'Toán' },
    { id: 's42', day: 5, period: 2, session: 'morning', subject: 'STEM' },
    { id: 's43', day: 5, period: 3, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's44', day: 5, period: 4, session: 'morning', subject: 'Tiếng Việt' },
    { id: 's45', day: 5, period: 2, session: 'afternoon', subject: 'Âm nhạc' },
    { id: 's46', day: 5, period: 3, session: 'afternoon', subject: 'Mỹ thuật' },
    { id: 's47', day: 5, period: 4, session: 'afternoon', subject: 'Giáo dục thể chất' },
    { id: 's48', day: 5, period: 5, session: 'afternoon', subject: 'Hoạt động trải nghiệm' },
  ];

  const homework = [
    { id: 'h1', subject: 'Toán', content: 'Làm bài tập trang 6', status: 'pending', createdAt: getDayDate(0), dueDate: getDayDate(0) },
    { id: 'h2', subject: 'Tiếng Việt', content: 'Làm tập làm văn về nhà mêu tả cơn mưa', status: 'pending', createdAt: getDayDate(0), dueDate: getDayDate(0) },
    { id: 'h3', subject: 'Lịch sử và Địa lý', content: 'Học thuộc lòng bài trang 10', status: 'pending', createdAt: getDayDate(1), dueDate: getDayDate(1) },
    { id: 'h4', subject: 'Ngoại ngữ', content: 'học từ vựng', status: 'pending', createdAt: getDayDate(1), dueDate: getDayDate(1) },
    { id: 'h5', subject: 'Toán', content: 'Học bảng cửu chương', status: 'pending', createdAt: getDayDate(2), dueDate: getDayDate(2) },
    { id: 'h6', subject: 'Tự nhiên và Xã hội', content: 'học thuộc lòng kết luận trang 15', status: 'pending', createdAt: getDayDate(2), dueDate: getDayDate(2) },
    { id: 'h7', subject: 'Tiếng Việt', content: 'học cách phân loại câu', status: 'pending', createdAt: getDayDate(3), dueDate: getDayDate(3) },
    { id: 'h8', subject: 'Đạo đức', content: 'học thuộc tổng kết bài học', status: 'pending', createdAt: getDayDate(3), dueDate: getDayDate(3) },
    { id: 'h9', subject: 'Âm nhạc', content: 'học bài hát Đêm trung thu', status: 'pending', createdAt: getDayDate(4), dueDate: getDayDate(4) },
    { id: 'h10', subject: 'Mỹ thuật', content: 'Vẽ tự do nộp bài cho thầy', status: 'pending', createdAt: getDayDate(4), dueDate: getDayDate(4) },
    { id: 'h11', subject: 'Ngoại ngữ', content: 'học thì hiện tại đơn', status: 'pending', createdAt: getDayDate(5), dueDate: getDayDate(5) },
    { id: 'h12', subject: 'Tin học', content: 'học gõ văn bản', status: 'pending', createdAt: getDayDate(5), dueDate: getDayDate(5) },
  ];

  const studySessions = [
    { id: 'ss1', day: 0, startTime: '06:00', endTime: '06:30', activity: 'Học Toán', subject: 'Toán', status: 'upcoming' },
    { id: 'ss2', day: 0, startTime: '06:30', endTime: '07:30', activity: 'Học Tiếng việt', subject: 'Tiếng Việt', status: 'upcoming' },
    { id: 'ss3', day: 0, startTime: '07:30', endTime: '08:30', activity: 'Giải trí', subject: 'Khác', status: 'upcoming' },
    { id: 'ss4', day: 1, startTime: '06:00', endTime: '06:30', activity: 'Học Đạo đức', subject: 'Đạo đức', status: 'upcoming' },
    { id: 'ss5', day: 1, startTime: '06:30', endTime: '07:30', activity: 'Học Tin học', subject: 'Tin học', status: 'upcoming' },
    { id: 'ss6', day: 1, startTime: '07:30', endTime: '08:30', activity: 'Xem ti vi', subject: 'Khác', status: 'upcoming' },
    { id: 'ss7', day: 2, startTime: '06:00', endTime: '07:30', activity: 'Học thêm môn Toán thầy Phước', subject: 'Toán', status: 'upcoming' },
    { id: 'ss8', day: 2, startTime: '08:30', endTime: '09:00', activity: 'Tự học, chuẩn bị bài tập', subject: 'Khác', status: 'upcoming' },
    { id: 'ss9', day: 3, startTime: '06:00', endTime: '06:30', activity: 'Học Tin học', subject: 'Tin học', status: 'upcoming' },
    { id: 'ss10', day: 3, startTime: '06:30', endTime: '07:30', activity: 'Học Đạo đức', subject: 'Đạo đức', status: 'upcoming' },
    { id: 'ss11', day: 3, startTime: '07:30', endTime: '08:30', activity: 'Đọc sách', subject: 'Khác', status: 'upcoming' },
    { id: 'ss12', day: 5, startTime: '07:00', endTime: '08:30', activity: 'Học thêm tiếng anh Trung tâm', subject: 'Ngoại ngữ', status: 'upcoming' },
    { id: 'ss13', day: 5, startTime: '08:40', endTime: '09:00', activity: 'Học bài, chuẩn bị bài hôm sau', subject: 'Khác', status: 'upcoming' },
    { id: 'ss14', day: 5, startTime: '06:00', endTime: '06:30', activity: 'Học Toán', subject: 'Toán', status: 'upcoming' },
    { id: 'ss15', day: 5, startTime: '06:30', endTime: '07:30', activity: 'Học Tiếng việt', subject: 'Tiếng Việt', status: 'upcoming' },
    { id: 'ss16', day: 5, startTime: '07:30', endTime: '08:30', activity: 'Giải trí', subject: 'Khác', status: 'upcoming' },
  ];

  return { schedule, homework, studySessions };
};
