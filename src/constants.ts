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
    { id: 'mountain_bg', name: 'Núi non', price: 350, color: '#F8FAFC' },
    { id: 'midnight_bg', name: 'Đêm khuya', price: 400, color: '#1E293B' },
    { id: 'desert_bg', name: 'Sa mạc', price: 450, color: '#FEF3C7' },
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
    { id: 'tiger', name: 'Hổ Vằn', price: 600, icon: '🐯' },
    { id: 'fox', name: 'Cáo Cáo', price: 700, icon: '🦊' },
  ],
  stickers: [
    { id: 'sticker_heart', name: 'Tim yêu', price: 20, icon: '❤️' },
    { id: 'sticker_fire', name: 'Lửa cháy', price: 20, icon: '🔥' },
    { id: 'sticker_rocket', name: 'Tên lửa', price: 30, icon: '🚀' },
    { id: 'sticker_cloud', name: 'Đám mây', price: 30, icon: '☁️' },
    { id: 'sticker_star', name: 'Ngôi sao', price: 40, icon: '⭐' },
    { id: 'sticker_moon', name: 'Mặt trăng', price: 40, icon: '🌙' },
    { id: 'sticker_sun', name: 'Mặt trời', price: 40, icon: '☀️' },
    { id: 'sticker_crown', name: 'Vương miện', price: 50, icon: '👑' },
    { id: 'sticker_rainbow', name: 'Cầu vồng', price: 80, icon: '🌈' },
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

export const WORD_RESCUE_LIST = [
  { word: 'Father', translation: 'Ba' },
  { word: 'Mother', translation: 'Mẹ' },
  { word: 'Brother', translation: 'Anh/Em trai' },
  { word: 'Sister', translation: 'Chị/Em gái' },
  { word: 'Friend', translation: 'Bạn' },
  { word: 'Teacher', translation: 'Thầy/Cô' },
  { word: 'Student', translation: 'Học sinh' },
  { word: 'Baby', translation: 'Em bé' },
  { word: 'School', translation: 'Trường' },
  { word: 'Class', translation: 'Lớp' },
  { word: 'Table', translation: 'Bàn' },
  { word: 'Chair', translation: 'Ghế' },
  { word: 'Book', translation: 'Sách' },
  { word: 'Notebook', translation: 'Vở' },
  { word: 'Pen', translation: 'Bút mực' },
  { word: 'Pencil', translation: 'Bút chì' },
  { word: 'Tree', translation: 'Cây' },
  { word: 'Flower', translation: 'Hoa' },
  { word: 'Leaf', translation: 'Lá' },
  { word: 'Grass', translation: 'Cỏ' },
  { word: 'Mountain', translation: 'Núi' },
  { word: 'River', translation: 'Sông' },
  { word: 'Sea', translation: 'Biển' },
  { word: 'Sky', translation: 'Bầu trời' },
  { word: 'Dog', translation: 'Chó' },
  { word: 'Cat', translation: 'Mèo' },
  { word: 'Chicken', translation: 'Gà' },
  { word: 'Duck', translation: 'Vịt' },
  { word: 'Fish', translation: 'Cá' },
  { word: 'Bird', translation: 'Chim' },
  { word: 'Buffalo', translation: 'Trâu' },
  { word: 'Cow', translation: 'Bò' },
  { word: 'Rice', translation: 'Cơm' },
  { word: 'Water', translation: 'Nước' },
  { word: 'Milk', translation: 'Sữa' },
  { word: 'Cake', translation: 'Bánh' },
  { word: 'Candy', translation: 'Kẹo' },
  { word: 'Fruit', translation: 'Trái cây' },
  { word: 'Apple', translation: 'Táo' },
  { word: 'Banana', translation: 'Chuối' },
  { word: 'Eat', translation: 'Ăn' },
  { word: 'Drink', translation: 'Uống' },
  { word: 'Go', translation: 'Đi' },
  { word: 'Run', translation: 'Chạy' },
  { word: 'Jump', translation: 'Nhảy' },
  { word: 'Study', translation: 'Học' },
  { word: 'Beautiful', translation: 'Đẹp' },
  { word: 'Good', translation: 'Ngoan/Tốt' },
  { word: 'Happy', translation: 'Vui' },
  { word: 'Sad', translation: 'Buồn' },
];

export const SITUATIONS = [
  {
    id: 1,
    type: 'Đoạn ngắn',
    title: 'Học đúng giờ',
    content: 'Mỗi ngày, Minh đều ngồi vào bàn học lúc 7 giờ tối. Dù hôm đó nhiều hay ít bài, Minh vẫn giữ thói quen này. Nhờ vậy, Minh không bao giờ bị quên bài và luôn làm bài đầy đủ.',
    explanation: [
      'Học đúng giờ giúp tạo thói quen',
      'Não bộ quen lịch → học hiệu quả hơn'
    ],
    question: 'Minh giỏi hơn vì điều gì?',
    options: ['Học đúng giờ', 'Minh lười biếng'],
    answer: 'Học đúng giờ'
  },
  {
    id: 2,
    type: 'Hội thoại',
    title: 'Học tập trung',
    content: 'Lan: Sao cậu học lâu vậy mà vẫn chưa xong bài?\nNam: Tớ vừa học vừa xem tivi.\nLan: Tớ tắt hết điện thoại và làm bài 30 phút là xong rồi!',
    explanation: [
      'Học tập trung giúp tiết kiệm thời gian',
      'Tránh xao nhãng (tivi, điện thoại)'
    ],
    question: 'Chọn ai học đúng:',
    options: ['Lan', 'Nam'],
    answer: 'Lan'
  },
  {
    id: 3,
    type: 'Tình huống',
    title: 'Làm bài trước khi chơi',
    content: 'Tùng đi học về, thấy bạn rủ đi đá bóng. Tùng chưa làm bài tập.',
    explanation: [
      'Ưu tiên việc quan trọng trước',
      'Học xong chơi sẽ thoải mái hơn'
    ],
    question: 'Tùng nên làm gì?',
    options: ['Đi đá bóng trước', 'Làm bài tập trước'],
    answer: 'Làm bài tập trước'
  },
  {
    id: 4,
    type: 'Tục ngữ',
    title: 'Học chăm chỉ',
    content: 'Có công mài sắt, có ngày nên kim',
    explanation: [
      'Kiên trì sẽ thành công',
      'Học mỗi ngày một ít chắc chắn tiến bộ'
    ],
    question: 'Câu tục ngữ khuyên ta điều gì?',
    options: ['Kiên trì', 'Mài cây kim'],
    answer: 'Kiên trì'
  },
  {
    id: 5,
    type: 'Đoạn ngắn',
    title: 'Học từng phần',
    content: 'Hà không học một lần tất cả bài. Hà chia nhỏ bài ra: học từng phần, mỗi phần 15 phút. Nhờ vậy, Hà nhớ bài lâu hơn.',
    explanation: [
      'Học chia nhỏ giúp dễ nhớ',
      'Tránh quá tải'
    ],
    question: 'Chọn cách học tốt:',
    options: ['Học dồn', 'Học từng phần'],
    answer: 'Học từng phần'
  },
  {
    id: 6,
    type: 'Hội thoại',
    title: 'Hỏi khi không hiểu',
    content: 'Bình: Bài này khó quá!\nAn: Cậu hỏi cô giáo chưa?\nBình: Chưa…\nAn: Nếu không hỏi, cậu sẽ không hiểu đâu!',
    explanation: [
      'Không hiểu phải hỏi',
      'Hỏi giúp học nhanh hơn'
    ],
    question: 'Khi không hiểu bài hoặc một vấn đề gì khó chúng ta cần làm gì?',
    options: ['Hỏi người lớn', 'Không cần hỏi từ từ sẽ biết'],
    answer: 'Hỏi người lớn'
  },
  {
    id: 7,
    type: 'Tình huống',
    title: 'Ôn lại bài',
    content: 'Mai học bài xong và đi ngủ ngay, không xem lại.',
    explanation: [
      'Ôn lại giúp nhớ lâu',
      'Củng cố kiến thức'
    ],
    question: 'Sau khi học bài xong, Mai nên làm gì trước khi ngủ?',
    options: ['Xem lại bài cũ', 'Đi ngủ luôn'],
    answer: 'Xem lại bài cũ'
  },
  {
    id: 8,
    type: 'Thành ngữ',
    title: 'Học đi đôi với hành',
    content: 'Học đi đôi với hành',
    explanation: [
      'Học phải thực hành',
      'Làm bài tập giúp hiểu sâu'
    ],
    question: 'Ý nghĩa của câu thành ngữ là gì?',
    options: ['Học xong còn phải làm bài', 'Học là phải có hành lá'],
    answer: 'Học xong còn phải làm bài'
  },
  {
    id: 9,
    type: 'Đoạn ngắn',
    title: 'Giữ góc học tập gọn gàng',
    content: 'Bàn học của An luôn sạch sẽ, sách vở gọn gàng. Khi học, An dễ tìm đồ và không bị mất tập trung.',
    explanation: [
      'Không gian gọn gàng → dễ tập trung',
      'Tiết kiệm thời gian'
    ],
    question: 'Cần làm gì để góc học tập gọn gàng?',
    options: ['Thường xuyên dọn dẹp sắp xếp đồ đạc', 'Bỏ đồ dùng bừa bộn'],
    answer: 'Thường xuyên dọn dẹp sắp xếp đồ đạc'
  },
  {
    id: 10,
    type: 'Tình huống',
    title: 'Nghỉ ngơi hợp lý',
    content: 'Hùng học liên tục 2 tiếng mà không nghỉ.',
    explanation: [
      'Học 25–30 phút nên nghỉ',
      'Tránh mệt mỏi'
    ],
    question: 'Chọn thời gian học đúng:',
    options: ['30 phút học + 5 phút nghỉ', 'Học 2 Tiếng rồi nghỉ'],
    answer: '30 phút học + 5 phút nghỉ'
  },
  {
    id: 11,
    type: 'Đoạn ngắn',
    title: 'Chuẩn bị bài trước khi đến lớp',
    content: 'Trước khi đến lớp, Vy luôn xem lại bài học hôm trước và đọc trước bài mới. Khi lên lớp, Vy hiểu bài nhanh hơn các bạn.',
    explanation: [
      'Chuẩn bị trước giúp tiếp thu nhanh',
      'Không bị bỡ ngỡ khi học bài mới'
    ],
    question: 'Vy học tốt vì điều gì?',
    options: ['Chuẩn bị bài thật tốt', 'Đến trường thật sớm'],
    answer: 'Chuẩn bị bài thật tốt'
  },
  {
    id: 12,
    type: 'Hội thoại',
    title: 'Không học thuộc lòng máy móc',
    content: 'Nam: Tớ học thuộc hết rồi nhưng vẫn không làm được bài.\nHà: Cậu có hiểu bài không?\nNam: Không…\nHà: Phải hiểu thì mới làm được!',
    explanation: [
      'Học phải hiểu, không chỉ thuộc',
      'Hiểu giúp áp dụng được'
    ],
    question: 'Học thuộc lòng mà vẫn chưa hiểu bài thì phải làm sao?',
    options: ['Hỏi bạn bè, thầy cô', 'Tự học tiếp'],
    answer: 'Hỏi bạn bè, thầy cô'
  },
  {
    id: 13,
    type: 'Tình huống',
    title: 'Không trì hoãn',
    content: 'Lan nghĩ: “Để mai làm bài cũng được.” Nhưng ngày mai lại có thêm nhiều bài mới.',
    explanation: [
      'Trì hoãn làm việc khiến bài dồn lại',
      'Nên làm ngay khi có thể'
    ],
    question: 'Lan nên làm gì?',
    options: ['Để ngày mai làm tiếp', 'Việc của hôm nay thì phải làm hết'],
    answer: 'Việc của hôm nay thì phải làm hết'
  },
  {
    id: 14,
    type: 'Câu nói',
    title: 'Siêng năng học tập',
    content: 'Siêng năng là chìa khóa của thành công',
    explanation: [
      'Chăm chỉ giúp tiến bộ mỗi ngày',
      'Không cần quá giỏi, chỉ cần cố gắng'
    ],
    question: 'Điền từ còn thiếu: “Siêng năng là … của thành công”',
    options: ['Bạn', 'Chìa khóa'],
    answer: 'Chìa khóa'
  },
  {
    id: 15,
    type: 'Đoạn ngắn',
    title: 'Học bằng cách ghi chép',
    content: 'Khi học, Tuấn luôn ghi lại những ý chính vào vở. Nhờ vậy, Tuấn dễ nhớ bài và ôn tập nhanh hơn.',
    explanation: [
      'Ghi chép giúp nhớ lâu',
      'Tạo tài liệu để ôn lại'
    ],
    question: 'Chọn lợi ích của ghi chép:',
    options: ['Luyện viết chữ nhanh', 'Ghi nhớ bài tốt hơn'],
    answer: 'Ghi nhớ bài tốt hơn'
  },
  {
    id: 16,
    type: 'Hội thoại',
    title: 'Học nhóm hiệu quả',
    content: 'Mai: Bài này khó quá!\nLinh: Tụi mình cùng học nhé!\nMai: Ừ, mỗi người giải một phần rồi cùng kiểm tra.',
    explanation: [
      'Học nhóm giúp hiểu nhanh hơn',
      'Có thể hỗ trợ nhau'
    ],
    question: 'Chọn lợi ích của học nhóm:',
    options: ['Có người trò chuyện vui vẻ', 'Giúp nhau cùng tiến bộ'],
    answer: 'Giúp nhau cùng tiến bộ'
  },
  {
    id: 17,
    type: 'Tình huống',
    title: 'Tự giác học tập',
    content: 'Không có ai nhắc, nhưng Hùng vẫn tự ngồi vào bàn học.',
    explanation: [
      'Tự giác là thói quen tốt',
      'Không cần nhắc vẫn học'
    ],
    question: 'Hùng là học sinh tự giác, đúng hay sai?',
    options: ['Đúng', 'Sai'],
    answer: 'Đúng'
  },
  {
    id: 18,
    type: 'Đoạn ngắn',
    title: 'Đọc sách mỗi ngày',
    content: 'Mỗi tối trước khi ngủ, An thường đọc 10 trang sách. Việc này giúp An mở rộng vốn từ và hiểu biết thêm nhiều điều thú vị.',
    explanation: [
      'Đọc sách giúp mở mang kiến thức',
      'Rèn luyện khả năng ngôn ngữ'
    ],
    question: 'Đọc sách giúp chúng ta điều gì?',
    options: ['Mở rộng vốn từ', 'Mau buồn ngủ'],
    answer: 'Mở rộng vốn từ'
  },
  {
    id: 19,
    type: 'Đoạn ngắn',
    title: 'Đặt câu hỏi khi học',
    content: 'Khi học bài, nếu có điều chưa hiểu, Hoa thường tự đặt câu hỏi và tìm câu trả lời. Nhờ vậy, Hoa hiểu bài sâu hơn.',
    explanation: [
      'Đặt câu hỏi giúp suy nghĩ',
      'Hiểu sâu kiến thức'
    ],
    question: 'Chọn cách tự học tốt hơn:',
    options: ['Tìm cách tự đặt vấn đề và trả lời', 'Cứ học thuộc lòng là được'],
    answer: 'Tìm cách tự đặt vấn đề và trả lời'
  },
  {
    id: 20,
    type: 'Tình huống',
    title: 'Giữ sức khỏe khi học',
    content: 'Nam học bài trong phòng tối và ngồi sai tư thế.',
    explanation: [
      'Cần ngồi đúng tư thế',
      'Học nơi đủ ánh sáng',
      'Bảo vệ mắt và sức khỏe'
    ],
    question: 'Chọn tư thế ngồi đúng:',
    options: ['Ngồi đúng tư thế, đủ sáng', 'Ngồi đâu cũng được'],
    answer: 'Ngồi đúng tư thế, đủ sáng'
  },
  {
    id: 21,
    type: 'Tình huống',
    title: 'Lập kế hoạch học tập',
    content: 'Nam có rất nhiều bài tập nhưng không biết làm bài nào trước, nên làm rất lâu mà chưa xong.',
    explanation: [
      'Lập kế hoạch giúp làm việc có thứ tự',
      'Tránh bị rối và tiết kiệm thời gian'
    ],
    question: 'Nam nên làm gì để học tốt hơn?',
    options: ['Làm bài ngẫu nhiên', 'Lập kế hoạch học tập'],
    answer: 'Lập kế hoạch học tập'
  },
  {
    id: 22,
    type: 'Tình huống',
    title: 'Học vào thời gian phù hợp',
    content: 'Do xem ti vi trước trong thời gian lâu, đến khi ngồi vào bàn học Lan thường học bài khi rất mệt và buồn ngủ.',
    explanation: [
      'Học khi tỉnh táo sẽ hiệu quả hơn',
      'Tránh học lúc quá mệt'
    ],
    question: 'Khi nào nên học hiệu quả nhất?',
    options: ['Khi tỉnh táo', 'Khi buồn ngủ'],
    answer: 'Khi tỉnh táo'
  },
  {
    id: 23,
    type: 'Tình huống',
    title: 'Đọc kỹ đề bài',
    content: 'Cô giáo phát đề kiểm tra ra, Bình làm sai bài toán vì đọc nhanh và hiểu sai đề.',
    explanation: [
      'Đọc kỹ giúp tránh sai sót',
      'Hiểu đúng yêu cầu bài'
    ],
    question: 'Bình nên làm gì trước khi làm bài?',
    options: ['Làm ngay', 'Đọc kỹ đề'],
    answer: 'Đọc kỹ đề'
  },
  {
    id: 24,
    type: 'Tình huống',
    title: 'Giữ bàn học gọn gàng',
    content: 'Bàn học của An rất bừa bộn, sách để chung với tập, bút viết để lộn xộn, học xong thì không dọn ngay. mỗi lần tìm dụng cụ học tập mất nhiều thời gian.',
    explanation: [
      'Gọn gàng giúp tập trung',
      'Tiết kiệm thời gian'
    ],
    question: 'Bàn học nên như thế nào?',
    options: ['Gọn gàng', 'Không cần dọn'],
    answer: 'Gọn gàng'
  },
  {
    id: 25,
    type: 'Tình huống',
    title: 'Không phụ thuộc vào người khác',
    content: 'Mỗi lần có bài tập, Minh đều chờ bạn làm rồi chép lại. Minh nghĩ rằng có nộp bài cho cô là được rồi cần gì phải làm.',
    explanation: [
      'Tự làm giúp hiểu bài',
      'Không nên phụ thuộc'
    ],
    question: 'Minh nên làm gì?',
    options: ['Chép bài', 'Tự làm bài'],
    answer: 'Tự làm bài'
  },
  {
    id: 26,
    type: 'Tình huống',
    title: 'Học từ sai lầm',
    content: 'Hoa làm sai bài nhưng không xem lại lỗi sai. Nên việc học cứ luôn bị điểm thấp.',
    explanation: [
      'Xem lại lỗi giúp tiến bộ',
      'Sai là cơ hội học'
    ],
    question: 'Khi làm sai nên làm gì?',
    options: ['Xem lại lỗi', 'Không làm nữa'],
    answer: 'Xem lại lỗi'
  },
  {
    id: 27,
    type: 'Tình huống',
    title: 'Giữ tinh thần vui vẻ khi học',
    content: 'Tuấn luôn cảm thấy chán nản khi học bài. Các bài tập thầy cô cho đều không muốn làm.',
    explanation: [
      'Tâm trạng tốt giúp học tốt hơn',
      'Có thể kết hợp học và chơi'
    ],
    question: 'Khi học nên có tâm trạng như thế nào?',
    options: ['Vui vẻ', 'Buồn chán'],
    answer: 'Vui vẻ'
  },
  {
    id: 28,
    type: 'Tình huống',
    title: 'Học đúng tư thế',
    content: 'Lan nằm trên giường để học bài. Lan nghĩ rằng như vậy thoải mái hơn. Nhưng tối đó Lan bị đau lưng.',
    explanation: [
      'Ngồi đúng giúp tập trung',
      'Bảo vệ sức khỏe'
    ],
    question: 'Tư thế học đúng là gì?',
    options: ['Nằm học', 'Ngồi thẳng'],
    answer: 'Ngồi thẳng'
  },
  {
    id: 29,
    type: 'Tình huống',
    title: 'Tự kiểm tra bài sau khi làm',
    content: 'Hùng làm xong bài nhưng không kiểm tra lại. Kết quả Hùng bị sai 2 câu do chọn đáp án bị nhầm.',
    explanation: [
      'Kiểm tra giúp phát hiện lỗi',
      'Nâng cao điểm số'
    ],
    question: 'Sau khi làm bài nên làm gì?',
    options: ['Nộp ngay', 'Kiểm tra lại'],
    answer: 'Kiểm tra lại'
  },
  {
    id: 30,
    type: 'Tình huống',
    title: 'Không học quá sức',
    content: 'Mai học liên tục nhiều giờ mà không nghỉ. Đến tối Mai khó ngủ và sáng dậy không đủ tỉnh táo để đi học.',
    explanation: [
      'Học quá lâu dễ mệt',
      'Cần nghỉ ngơi hợp lý'
    ],
    question: 'Cách học tốt là gì?',
    options: ['Học và nghỉ hợp lý', 'Không học'],
    answer: 'Học và nghỉ hợp lý'
  }
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

  const notes = [
    {
      id: 'n1',
      title: 'Đi chợ giúp mẹ',
      content: 'Mẹ dặn đi chợ giúp mẹ mua đồ',
      checklist: [
        { id: 'c1', text: 'Cá', isCompleted: false },
        { id: 'c2', text: 'Rau cải xanh', isCompleted: false },
        { id: 'c3', text: 'thịt heo', isCompleted: false },
        { id: 'c4', text: 'Nước mắm', isCompleted: false },
        { id: 'c5', text: 'Tương ớt', isCompleted: false }
      ],
      createdAt: Date.now(),
      reminderDate: getDayDate(0),
      reminderTime: '08:00',
      reminderRepeat: 'none',
      tags: ['Mua sắm'],
      color: 'bg-yellow-100',
      isPinned: false,
      isCompleted: false
    },
    {
      id: 'n2',
      title: 'Học bài',
      content: 'Cô dặn về nhà học thuộc bài',
      checklist: [
        { id: 'c6', text: 'Bảng cửu chương 6', isCompleted: false },
        { id: 'c7', text: 'Toán dạng tìm x', isCompleted: false },
        { id: 'c8', text: 'Thuộc lòng ghi nhớ Đạo đức', isCompleted: false }
      ],
      createdAt: Date.now(),
      reminderDate: getDayDate(0),
      reminderRepeat: 'none',
      tags: ['Học tập'],
      color: 'bg-blue-100',
      isPinned: false,
      isCompleted: false
    },
    {
      id: 'n3',
      title: '',
      content: 'Chiều đi chơi cầu lông với bạn Tuấn',
      createdAt: Date.now(),
      color: 'bg-white',
      isPinned: false,
      isCompleted: false
    },
    {
      id: 'n4',
      title: '',
      content: 'Mai mua 2 cuốn tập viết mới.',
      createdAt: Date.now(),
      color: 'bg-white',
      isPinned: false,
      isCompleted: false
    },
    {
      id: 'n5',
      title: 'Tập thể dục',
      content: 'Xuống sân tập thể dục với ba',
      createdAt: Date.now(),
      reminderDate: getDayDate(0),
      reminderTime: '06:00',
      reminderRepeat: 'daily',
      color: 'bg-pink-100',
      isPinned: false,
      isCompleted: false
    }
  ];

  const profile = {
    fullName: 'Nguyễn Huy Hoàng',
    nickname: 'Hoàng Kun',
    gender: 'male',
    dateOfBirth: '2019-09-18',
    school: 'Trường Tiểu học Thủ Khoa Huân',
    className: '3B',
    schoolYear: '2026-2027',
    homeroomTeacher: 'Thầy Tuấn',
    favoriteSubjects: ['Tiếng Việt', 'Đạo đức', 'Tự nhiên và Xã hội', 'Âm nhạc'],
    interests: ['Chơi Cầu lông', 'xem tivi'],
    parentName: 'Nguyên Văn A',
    parentPhone: '0989 999 888'
  };

  return { schedule, homework, studySessions, notes, profile };
};
