import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Star,
  UserPlus,
  UserCheck,
  Plus,
  Send,
  Utensils,
  Image as ImageIcon,
  Camera,
  Grid,
  List,
  Trash2,
  Sparkles,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { CommunityPost, DishTaste, DishDifficulty } from '../types';
import { DISH_IMAGES } from '../data/initialData';
import { formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';
import { CurrencyInput } from './CurrencyInput';
import { AuthAccount } from './AuthModal';

export interface UserProfileInfo {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  followersCount: number;
}

interface CommunityViewProps {
  posts: CommunityPost[];
  followedAuthors: string[];
  userProfile: UserProfileInfo;
  onUpdateUserProfile: (next: UserProfileInfo) => void;
  authAccount?: AuthAccount | null;
  onOpenAuthModal?: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onRatePost: (postId: string, rating: number) => void;
  onAddPostComment: (postId: string, text: string, customAuthor?: string) => void;
  onDeletePost?: (postId: string) => void;
  onSimulateIncomingEngagement?: (postId: string) => void;
  onToggleFollow: (authorId: string) => void;
  onCreatePost: (newPost: {
    dishName: string;
    image: string;
    costPerServing: number;
    cookTimeMinutes: number;
    taste: DishTaste;
    difficulty: DishDifficulty;
    caption: string;
    smartTip: string;
    ingredientsSummary: string[];
    stepsSummary: string[];
  }) => void;
  totalSavedOverall: number;
}

/**
 * Ultra-resilient mobile photo compressor:
 * 1. Handles modern mobile phone cameras (HEIC, JPEG, PNG, WebP)
 * 2. Uses createImageBitmap where available for native orientation handling & background decoding
 * 3. Uses URL.createObjectURL + Canvas for low memory footprint on iPhones and Androids
 * 4. Resizes to max 960x960 and 0.82 JPEG quality (~120KB-200KB), avoiding localStorage QuotaExceeded errors
 */
async function readAndCompressImageFile(
  file: File,
  maxWidth = 960,
  maxHeight = 960
): Promise<string> {
  // 1. Try modern createImageBitmap (fastest, memory safe on iOS 15+ and Android)
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          return dataUrl;
        }
      }
    } catch {
      // fallback to Image
    }
  }

  // 2. Try URL.createObjectURL with Image (avoids huge base64 strings in memory during decode)
  return new Promise((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      objectUrl = '';
    }

    if (objectUrl) {
      const img = new Image();
      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      img.onerror = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        fallbackWithFileReader(file, maxWidth).then(resolve).catch(reject);
      };

      img.src = objectUrl;
    } else {
      fallbackWithFileReader(file, maxWidth).then(resolve).catch(reject);
    }
  });
}

function fallbackWithFileReader(file: File, maxWidth = 960): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (!data) {
        reject(new Error('Không đọc được dữ liệu ảnh'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(data);
        }
      };
      img.onerror = () => resolve(data);
      img.src = data;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh từ thiết bị'));
    reader.readAsDataURL(file);
  });
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  followedAuthors,
  userProfile,
  onUpdateUserProfile,
  authAccount,
  onOpenAuthModal,
  onToggleLike,
  onToggleSave,
  onRatePost,
  onAddPostComment,
  onDeletePost,
  onSimulateIncomingEngagement,
  onToggleFollow,
  onCreatePost,
  totalSavedOverall,
}) => {
  const [subView, setSubView] = useState<'feed' | 'profile'>('profile');
  const [profileTab, setProfileTab] = useState<'posted' | 'saved'>('posted');
  const [profileLayout, setProfileLayout] = useState<'timeline' | 'grid'>('timeline');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [tempName, setTempName] = useState(userProfile.displayName);
  const [tempBio, setTempBio] = useState(userProfile.bio);

  // Comment inputs & commenter persona
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommenterName, setActiveCommenterName] = useState<string>(
    `${userProfile.displayName} (${userProfile.handle})`
  );
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [selectedGridPost, setSelectedGridPost] = useState<CommunityPost | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  // Dedicated refs for Phone Camera & Phone Album
  const postAlbumInputRef = useRef<HTMLInputElement | null>(null);
  const postCameraInputRef = useRef<HTMLInputElement | null>(null);
  const avatarAlbumInputRef = useRef<HTMLInputElement | null>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement | null>(null);
  const coverAlbumInputRef = useRef<HTMLInputElement | null>(null);

  // New Post Form State
  const [dishName, setDishName] = useState('');
  const [selectedImg, setSelectedImg] = useState<string>(DISH_IMAGES.thitKho);
  const [isCustomAlbumPhoto, setIsCustomAlbumPhoto] = useState<boolean>(false);
  const [costPerServing, setCostPerServing] = useState<number>(22000);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(20);
  const [taste, setTaste] = useState<DishTaste>('Đậm đà');
  const [difficulty, setDifficulty] = useState<DishDifficulty>('Dễ nấu');
  const [caption, setCaption] = useState('');
  const [smartTip, setSmartTip] = useState('');
  const [ingredientsText, setIngredientsText] = useState('2 quả trứng gà, 2 quả cà chua, Hành lá');
  const [stepsText, setStepsText] = useState(
    'Phi thơm hành với cà chua\nĐổ trứng đánh tan vào đảo đều\nRắc tiêu và hành lá'
  );

  // Handle picking dish photo from Camera or Album
  const handlePickDishPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    source: 'camera' | 'album'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadNotice(null);

    try {
      const compressed = await readAndCompressImageFile(file, 960, 960);
      setSelectedImg(compressed);
      setIsCustomAlbumPhoto(true);
      setShowCreateForm(true);
      setUploadNotice(
        source === 'camera'
          ? '✓ Đã chụp ảnh món ăn từ Camera điện thoại thành công!'
          : '✓ Đã tải ảnh món ăn từ Album điện thoại thành công!'
      );
      setTimeout(() => setUploadNotice(null), 4000);
    } catch {
      setUploadNotice('⚠ Không thể đọc ảnh. Vui lòng chọn ảnh định dạng JPG, PNG hoặc HEIC từ điện thoại.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  // Handle picking Avatar photo from Camera or Album
  const handlePickAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>,
    source: 'camera' | 'album' = 'album'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadNotice(null);

    try {
      const compressed = await readAndCompressImageFile(file, 400, 400);
      onUpdateUserProfile({
        ...userProfile,
        avatarUrl: compressed,
      });
      setUploadNotice(
        source === 'camera'
          ? '✓ Đã chụp và cập nhật ảnh đại diện mới!'
          : '✓ Đã cập nhật ảnh đại diện từ Album điện thoại!'
      );
      setTimeout(() => setUploadNotice(null), 4000);
    } catch {
      setUploadNotice('⚠ Không thể đổi ảnh đại diện. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  // Handle picking Cover photo from Album
  const handlePickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadNotice(null);

    try {
      const compressed = await readAndCompressImageFile(file, 1200, 600);
      onUpdateUserProfile({
        ...userProfile,
        coverUrl: compressed,
      });
      setUploadNotice('✓ Đã cập nhật ảnh bìa từ Album điện thoại!');
      setTimeout(() => setUploadNotice(null), 4000);
    } catch {
      setUploadNotice('⚠ Không thể đổi ảnh bìa. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !caption.trim()) return;

    onCreatePost({
      dishName: dishName.trim(),
      image: selectedImg,
      costPerServing,
      cookTimeMinutes,
      taste,
      difficulty,
      caption: caption.trim(),
      smartTip: smartTip.trim() || 'Tận dụng nguyên liệu sẵn có trong tủ lạnh để tiết kiệm tối đa.',
      ingredientsSummary: ingredientsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      stepsSummary: stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });

    setDishName('');
    setCaption('');
    setSmartTip('');
    setIsCustomAlbumPhoto(false);
    setShowCreateForm(false);
    // Automatically switch to Trang cá nhân của tôi -> Các món tôi đã đăng so the user sees their post right away!
    setSubView('profile');
    setProfileTab('posted');
    setUploadNotice('Đã đăng món ăn lên Trang cá nhân của tôi và Bảng tin Cộng đồng!');
    setTimeout(() => setUploadNotice(null), 4000);
  };

  const handleSharePost = (post: CommunityPost) => {
    const shareText = `${post.dishName} (${formatVND(post.costPerServing)}/phần - ${
      post.cookTimeMinutes
    } phút): ${post.caption}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  const myPosted = posts.filter((p) => p.authorId === 'user-me');
  const mySaved = posts.filter((p) => p.isSaved);
  const totalMyLikes = myPosted.reduce((sum, p) => sum + p.likes, 0);
  const displayedPosts =
    subView === 'feed' ? posts : profileTab === 'posted' ? myPosted : mySaved;

  // Keep selectedGridPost in sync with latest likes/comments in posts
  const activeModalPost = selectedGridPost
    ? posts.find((p) => p.id === selectedGridPost.id) || null
    : null;

  // Reliable mobile input styling (avoid display: none blocking on WebKit / Android)
  const hiddenInputStyle: React.CSSProperties = {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    opacity: 0,
    width: '1px',
    height: '1px',
    pointerEvents: 'none',
  };

  return (
    <div className="space-y-8">
      {/* Mobile-Safe File Inputs (Synchronous trigger, Camera & Album separated) */}
      <input
        ref={postCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePickDishPhoto(e, 'camera')}
        style={hiddenInputStyle}
        title="Chụp ảnh món ăn từ Camera điện thoại"
      />
      <input
        ref={postAlbumInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,image/jpeg,image/png,image/webp"
        onChange={(e) => handlePickDishPhoto(e, 'album')}
        style={hiddenInputStyle}
        title="Chọn ảnh món ăn từ Thư viện Album điện thoại"
      />
      <input
        ref={avatarCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => handlePickAvatar(e, 'camera')}
        style={hiddenInputStyle}
        title="Chụp ảnh đại diện từ Camera trước"
      />
      <input
        ref={avatarAlbumInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,image/jpeg,image/png,image/webp"
        onChange={(e) => handlePickAvatar(e, 'album')}
        style={hiddenInputStyle}
        title="Chọn ảnh đại diện từ Album điện thoại"
      />
      <input
        ref={coverAlbumInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,image/jpeg,image/png,image/webp"
        onChange={handlePickCover}
        style={hiddenInputStyle}
        title="Chọn ảnh bìa từ Album điện thoại"
      />

      {/* Processing Photo Mobile Overlay Spinner */}
      {isProcessingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE5D8] flex items-center gap-4 max-w-sm w-full">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF5EE] flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-[#2D6A4F] animate-spin" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1B2A22]">
                Đang xử lý ảnh từ điện thoại...
              </div>
              <div className="text-xs text-[#5C7467] mt-0.5">
                Tự động tối ưu dung lượng và điều chỉnh góc xoay chuẩn.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Switcher: Bảng tin Cộng đồng vs Trang cá nhân của tôi */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
            Cộng đồng Món Khôn & Trang cá nhân
          </h1>
          <p className="text-sm text-[#4A6355] mt-1">
            Đăng ảnh món ăn từ Album máy lên Trang cá nhân, thả tim, bình luận và lưu công thức như Instagram & Facebook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-[#EEF5EE] border border-[#DCE5D8] rounded-xl">
            <button
              type="button"
              onClick={() => setSubView('feed')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                subView === 'feed'
                  ? 'bg-white text-[#1B4332] shadow-2xs'
                  : 'text-[#4A6355] hover:text-[#1B2A22]'
              }`}
            >
              Bảng tin Cộng đồng ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('profile')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                subView === 'profile'
                  ? 'bg-white text-[#1B4332] shadow-2xs'
                  : 'text-[#4A6355] hover:text-[#1B2A22]'
              }`}
            >
              Trang cá nhân của tôi ({myPosted.length} bài)
            </button>
          </div>

          {/* Mobile Camera Direct Button (Synchronous trigger) */}
          <button
            type="button"
            onClick={() => postCameraInputRef.current?.click()}
            className="px-3.5 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] border border-[#CFE0D2] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 transition-all"
            title="Mở Camera chụp ảnh mâm cơm trực tiếp bằng điện thoại"
          >
            <Camera className="w-4 h-4 text-[#2D6A4F]" />
            <span className="hidden sm:inline">Chụp ảnh Camera</span>
            <span className="sm:hidden">Chụp ảnh</span>
          </button>

          {/* Mobile Album Direct Button (Synchronous trigger) */}
          <button
            type="button"
            onClick={() => postAlbumInputRef.current?.click()}
            className="px-3.5 py-2.5 text-xs font-semibold text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 transition-all"
            title="Chọn ảnh món ăn từ thư viện Album ảnh điện thoại"
          >
            <ImageIcon className="w-4 h-4 text-[#166534]" />
            <span className="hidden sm:inline">Tải ảnh từ Album</span>
            <span className="sm:hidden">Album máy</span>
          </button>

          {/* Write Recipe Button */}
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Đăng món mới
          </button>
        </div>
      </section>

      {uploadNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all ${
            uploadNotice.startsWith('⚠')
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              : 'bg-[#EEF5EE] border-[#95D5B2] text-[#1B4332]'
          }`}
        >
          <span className="flex items-center gap-2">
            {uploadNotice.startsWith('⚠') ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D6A4F]" />
            )}
            {uploadNotice}
          </span>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="text-xs underline ml-3 shrink-0 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Personal Profile Header (Instagram / Facebook Style) when in 'profile' view */}
      {subView === 'profile' && (
        <section className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
          {/* Cover Photo Banner */}
          <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-[#FCEEF3] via-[#EEF5EE] to-[#FDF6F0] overflow-hidden">
            {userProfile.coverUrl && (
              <img
                src={userProfile.coverUrl}
                alt="Ảnh bìa cá nhân"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => coverAlbumInputRef.current?.click()}
              className="absolute bottom-3 right-4 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#1B2A22] border border-[#DCE5D8] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Đổi ảnh bìa từ Album
            </button>
          </div>

          {/* Avatar + Profile Details */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar with Album Upload button */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#2D6A4F] border-4 border-white shadow-md overflow-hidden flex items-center justify-center group">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-3xl font-bold text-white">MK</span>
                  )}
                  {/* Desktop Hover Overlay */}
                  <button
                    type="button"
                    onClick={() => avatarAlbumInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
                    title="Đổi ảnh đại diện từ Album"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    Đổi ảnh
                  </button>
                  {/* Always-visible Mobile Camera Badge for Touchscreens */}
                  <button
                    type="button"
                    onClick={() => avatarAlbumInputRef.current?.click()}
                    className="sm:hidden absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#1B2A22]/90 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-90 transition-transform"
                    title="Chạm để đổi ảnh đại diện"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 sm:pt-0">
                  {editingBio ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="px-3 py-1 text-sm font-semibold bg-[#F6F9F5] border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                        placeholder="Tên hiển thị"
                      />
                      <input
                        type="text"
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        className="w-full sm:w-80 px-3 py-1 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-lg text-[#1B2A22] block"
                        placeholder="Tiểu sử cá nhân"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateUserProfile({
                              ...userProfile,
                              displayName: tempName.trim() || userProfile.displayName,
                              bio: tempBio.trim() || userProfile.bio,
                            });
                            setEditingBio(false);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#2D6A4F] rounded-lg cursor-pointer"
                        >
                          Lưu hồ sơ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBio(false)}
                          className="px-3 py-1 text-xs text-[#4A6355] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-display font-bold text-[#1B2A22]">
                          {userProfile.displayName}
                        </h2>
                        <span className="text-xs text-[#5C7467]">{userProfile.handle}</span>

                        {authAccount ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF5EE] text-[#2D6A4F] border border-[#CFE0D2]">
                            {authAccount.provider === 'google' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                            )}
                            <span>Đã kết nối {authAccount.provider === 'google' ? 'Google' : 'Email'}</span>
                          </span>
                        ) : onOpenAuthModal ? (
                          <button
                            type="button"
                            onClick={onOpenAuthModal}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1B2A22] text-white hover:bg-black transition-colors cursor-pointer"
                          >
                            <span>Đăng nhập Google</span>
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#4A6355] mt-1 max-w-xl">{userProfile.bio}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => avatarCameraInputRef.current?.click()}
                          className="text-xs font-semibold text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Chụp ảnh đại diện
                        </button>
                        <span className="text-xs text-[#DCE5D8]">·</span>
                        <button
                          type="button"
                          onClick={() => avatarAlbumInputRef.current?.click()}
                          className="text-xs font-medium text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Chọn từ Album
                        </button>
                        <span className="text-xs text-[#DCE5D8]">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempName(userProfile.displayName);
                            setTempBio(userProfile.bio);
                            setEditingBio(true);
                          }}
                          className="text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] cursor-pointer"
                        >
                          Chỉnh sửa tiểu sử
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* IG/FB Stats Bar */}
              <div className="grid grid-cols-4 gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E6EFE2] text-center">
                <div>
                  <div className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
                    {myPosted.length}
                  </div>
                  <div className="text-xs text-[#5C7467]">Bài đăng</div>
                </div>
                <div>
                  <div className="font-mono tabular-nums text-lg font-semibold text-[#E11D48]">
                    {totalMyLikes}
                  </div>
                  <div className="text-xs text-[#5C7467]">Lượt tim</div>
                </div>
                <div>
                  <div className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
                    {userProfile.followersCount}
                  </div>
                  <div className="text-xs text-[#5C7467]">Người theo dõi</div>
                </div>
                <div>
                  <div className="font-mono tabular-nums text-lg font-semibold text-[#2D6A4F]">
                    {formatVND(totalSavedOverall)}
                  </div>
                  <div className="text-xs text-[#5C7467]">Đã tiết kiệm</div>
                </div>
              </div>
            </div>

            {/* Quick Status / Photo Upload Box inside Personal Profile (Facebook / IG style) */}
            <div className="mt-6 p-4 rounded-2xl bg-[#F8FBF7] border border-[#DCE5D8] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'MK'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white border border-[#DCE5D8] text-xs sm:text-sm text-[#5C7467] hover:border-[#2D6A4F] transition-colors cursor-pointer truncate"
                >
                  Hôm nay bạn nấu món gì? Đăng ảnh món ăn lên Trang cá nhân của bạn...
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => postCameraInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-[#EEF5EE] hover:bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                  title="Chụp ảnh món ăn bằng Camera điện thoại"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Chụp Camera</span>
                  <span className="sm:hidden">Chụp ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => postAlbumInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                  title="Chọn ảnh món ăn từ Thư viện Album điện thoại"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Album ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Viết bài
                </button>
              </div>
            </div>

            {/* Profile Tabs & Layout Switcher (Timeline vs IG Grid) */}
            <div className="mt-5 pt-4 border-t border-[#E6EFE2] flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfileTab('posted')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                    profileTab === 'posted'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[#F8FBF7] text-[#4A6355] border border-[#DCE5D8]'
                  }`}
                >
                  Tường cá nhân · Món tôi đã đăng ({myPosted.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('saved')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                    profileTab === 'saved'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[#F8FBF7] text-[#4A6355] border border-[#DCE5D8]'
                  }`}
                >
                  Bộ sưu tập đã lưu ({mySaved.length})
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F8FBF7] border border-[#DCE5D8] rounded-xl">
                <button
                  type="button"
                  onClick={() => setProfileLayout('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    profileLayout === 'timeline'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'text-[#4A6355]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Dòng thời gian (FB)
                </button>
                <button
                  type="button"
                  onClick={() => setProfileLayout('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    profileLayout === 'grid'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'text-[#4A6355]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  Lưới Album (IG)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Create Post Form (Supports Picking Image from Device Album + Sample Presets) */}
      {showCreateForm && (
        <section className="bg-white border-2 border-[#2D6A4F] rounded-2xl p-6 space-y-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#1B2A22]">
                Đăng chia sẻ món ăn lên Trang cá nhân & Cộng đồng
              </h2>
              <p className="text-xs text-[#4A6355]">
                Bài đăng sẽ hiển thị trong mục <strong>Trang cá nhân của tôi</strong> và cho phép mọi người thả tim, bình luận.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1.5 rounded-lg text-[#4A6355] hover:bg-[#EEF5EE] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            {/* Step 1: Pick Photo from Camera, Album or Sample */}
            <div className="p-4 rounded-2xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A22]">
                    1. Hình ảnh món ăn của bạn
                  </label>
                  <span className="text-xs text-[#4A6355]">
                    Chụp trực tiếp bằng Camera điện thoại, lấy ảnh từ Album máy hoặc chọn ảnh mẫu bên dưới
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => postCameraInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                    title="Mở Camera điện thoại chụp ảnh mâm cơm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Chụp từ Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => postAlbumInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F6F9F5] border border-[#DCE5D8] text-[#1B2A22] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                    title="Chọn ảnh từ Album điện thoại"
                  >
                    <ImageIcon className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Album điện thoại</span>
                  </button>
                </div>
              </div>

              {/* Current Photo Preview + Sample Thumbnails */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                  <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-[#DCE5D8] bg-white">
                    <DishImage src={selectedImg} alt="Ảnh món ăn chuẩn bị đăng" className="w-full h-full" />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[11px] font-medium flex items-center gap-1">
                      {isCustomAlbumPhoto ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ảnh chụp từ điện thoại của bạn</span>
                        </>
                      ) : (
                        <span>Ảnh mẫu minh họa</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-2">
                  <span className="text-xs font-medium text-[#4A6355] block">
                    Hoặc chọn nhanh ảnh món mẫu:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label: 'Thịt kho trứng', img: DISH_IMAGES.thitKho },
                      { label: 'Canh cà chua', img: DISH_IMAGES.canhCaChua },
                      { label: 'Ức gà áp chảo', img: DISH_IMAGES.ucGa },
                      { label: 'Đậu hũ nhồi thịt', img: DISH_IMAGES.dauHu },
                      { label: 'Cơm chiên trứng', img: DISH_IMAGES.comChien },
                      { label: 'Bún bò xào', img: DISH_IMAGES.bunBo },
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedImg(opt.img);
                          setIsCustomAlbumPhoto(false);
                        }}
                        className={`p-1 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedImg === opt.img && !isCustomAlbumPhoto
                            ? 'border-[#2D6A4F] bg-[#EAF4EC]'
                            : 'border-[#DCE5D8] bg-white'
                        }`}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-1">
                          <DishImage src={opt.img} alt={opt.label} className="w-full h-full" />
                        </div>
                        <div className="text-[10px] font-medium text-[#1B2A22] truncate">
                          {opt.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Dish Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Tên món ăn *
                </label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="VD: Cơm cuộn trứng xúc xích 15k..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Chi phí / khẩu phần (VNĐ)
                </label>
                <CurrencyInput
                  value={costPerServing}
                  onChange={(val) => setCostPerServing(val)}
                  quickDeltas={[5000, 10000, 20000]}
                  placeholder="VD: 25.000..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Thời gian nấu (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  value={cookTimeMinutes}
                  onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Dòng trạng thái / Chia sẻ cảm nhận (Caption) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Chia sẻ câu chuyện nấu món này hoặc cách bạn vét tủ lạnh..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Mẹo nấu ngon & tiết kiệm riêng của bạn
                </label>
                <textarea
                  rows={2}
                  value={smartTip}
                  onChange={(e) => setSmartTip(e.target.value)}
                  placeholder="Mẹo giúp món ngon hơn hoặc rẻ hơn..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Nguyên liệu (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Khẩu vị & Độ khó
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={taste}
                    onChange={(e) => setTaste(e.target.value as DishTaste)}
                    className="px-3 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                  >
                    <option value="Đậm đà">Đậm đà</option>
                    <option value="Thanh đạm">Thanh đạm</option>
                    <option value="Chua ngọt">Chua ngọt</option>
                    <option value="Cay nhẹ">Cay nhẹ</option>
                  </select>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DishDifficulty)}
                    className="px-3 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                  >
                    <option value="Dễ nấu">Dễ nấu</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Cầu kỳ">Cầu kỳ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EFE2]">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl cursor-pointer"
              >
                Đăng lên Trang cá nhân của tôi
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Commenter Identity Bar (Allows testing comments from other people like IG/FB) */}
      <div className="bg-white border border-[#DCE5D8] rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#4A6355]">
          <span>Đang tương tác (Thả tim & Bình luận) dưới tên:</span>
          <strong className="text-[#1B2A22]">{activeCommenterName}</strong>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#5C7467]">Đổi nhanh người bình luận:</span>
          {[
            `${userProfile.displayName} (Chủ trang)`,
            'Lan Chi · Bếp Sinh Viên',
            'Đức Minh · Meal Prep',
            'Thanh Huyền · Sống Một Mình',
            'Hoàng Nam · Bách Khoa',
          ].map((persona) => (
            <button
              key={persona}
              type="button"
              onClick={() => setActiveCommenterName(persona)}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                activeCommenterName === persona
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8]'
              }`}
            >
              {persona.split(' · ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Empty State vs Instagram Grid vs Facebook Timeline */}
      {displayedPosts.length === 0 ? (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-12 text-center space-y-4">
          <Utensils className="w-8 h-8 text-[#2D6A4F] mx-auto opacity-75" />
          <div className="text-base font-semibold text-[#1B2A22]">
            Chưa có bài đăng nào trong mục này
          </div>
          <p className="text-xs text-[#5C7467] max-w-md mx-auto">
            Chụp ảnh mâm cơm gia đình bằng <strong>Camera điện thoại</strong> hoặc tải ảnh từ <strong>Album máy</strong> để lưu giữ và chia sẻ cùng cộng đồng!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => postCameraInputRef.current?.click()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              Chụp ảnh Camera ngay
            </button>
            <button
              type="button"
              onClick={() => postAlbumInputRef.current?.click()}
              className="px-4 py-2.5 text-xs font-semibold text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              Chọn ảnh từ Album máy
            </button>
          </div>
        </div>
      ) : subView === 'profile' && profileLayout === 'grid' ? (
        /* Instagram 3-Column Photo Album Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayedPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedGridPost(post)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#EEF4ED] border border-[#DCE5D8] cursor-pointer"
            >
              <DishImage
                src={post.image}
                alt={post.dishName}
                className="w-full h-full group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center gap-2">
                <div className="font-semibold text-sm line-clamp-2">{post.dishName}</div>
                <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-current" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 fill-current" /> {post.comments.length}
                  </span>
                </div>
                <span className="text-[11px] underline">Bấm để xem & bình luận</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Facebook / Instagram Feed Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedPosts.map((post) => {
            const isFollowing = followedAuthors.includes(post.authorId);
            const isMyPost = post.authorId === 'user-me';

            return (
              <article
                key={post.id}
                className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Author Header */}
                  <div className="px-5 py-4 border-b border-[#E6EFE2] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
                        {isMyPost && userProfile.avatarUrl ? (
                          <img
                            src={userProfile.avatarUrl}
                            alt={userProfile.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.authorName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1B2A22] truncate">
                          {isMyPost ? userProfile.displayName : post.authorName}{' '}
                          <span className="text-xs font-normal text-[#5C7467]">
                            {isMyPost ? userProfile.handle : post.authorHandle} · {post.createdAt}
                          </span>
                        </div>
                        <div className="text-xs text-[#5C7467] truncate">
                          {isMyPost ? userProfile.bio : post.authorBio}
                        </div>
                      </div>
                    </div>

                    {!isMyPost ? (
                      <button
                        type="button"
                        onClick={() => onToggleFollow(post.authorId)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                          isFollowing
                            ? 'bg-[#EAF4EC] text-[#1B4332] border border-[#95D5B2]'
                            : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Đang theo dõi
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Theo dõi
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {onSimulateIncomingEngagement && (
                          <button
                            type="button"
                            onClick={() => onSimulateIncomingEngagement(post.id)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="Mô phỏng bạn bè trong cộng đồng vào thả tim và bình luận bài viết của bạn"
                          >
                            <Sparkles className="w-3 h-3" />
                            +Bạn bè tương tác
                          </button>
                        )}
                        {onDeletePost && (
                          <button
                            type="button"
                            onClick={() => onDeletePost(post.id)}
                            className="p-1.5 text-[#6B7F73] hover:text-[#DC2626] rounded-lg cursor-pointer"
                            title="Xóa bài đăng của tôi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dish Image (Double click to like like Instagram!) */}
                  <div
                    onDoubleClick={() => onToggleLike(post.id)}
                    className="aspect-16/9 w-full overflow-hidden bg-[#EEF4ED] cursor-pointer relative"
                    title="Nhấn đúp vào ảnh để thả tim ♥"
                  >
                    <DishImage src={post.image} alt={post.dishName} className="w-full h-full" />
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C7467]">
                      <div>
                        <span>Chi phí: </span>
                        <strong className="font-mono tabular-nums text-sm text-[#2D6A4F]">
                          {formatVND(post.costPerServing)}/phần
                        </strong>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{post.cookTimeMinutes} phút</span>
                        <span className="mx-1.5">·</span>
                        <span>{post.taste}</span>
                      </div>
                      <div className="font-mono tabular-nums text-[#B45309]">
                        {post.avgRating.toFixed(1)} ★ ({post.ratingCount} đánh giá)
                      </div>
                    </div>

                    <h3 className="text-lg font-display font-semibold text-[#1B2A22]">
                      {post.dishName}
                    </h3>

                    <p className="text-sm text-[#2A3C32] leading-relaxed">{post.caption}</p>

                    <div className="p-3 rounded-xl bg-[#FDF6F0] border border-[#F3DEC8] text-xs text-[#6E4726]">
                      <strong>Mẹo tiết kiệm:</strong> {post.smartTip}
                    </div>

                    {/* Ingredients & Steps Summary */}
                    <div className="p-3.5 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2] space-y-2 text-xs">
                      <div>
                        <strong className="text-[#1B2A22]">Nguyên liệu: </strong>
                        <span className="text-[#4A6355]">
                          {post.ingredientsSummary.join(' · ')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <strong className="text-[#1B2A22] block">Công thức tóm tắt:</strong>
                        {post.stepsSummary.map((s, idx) => (
                          <div key={idx} className="text-[#4A6355]">
                            <span className="font-mono tabular-nums text-[#2D6A4F] font-semibold">
                              0{idx + 1}.
                            </span>{' '}
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Actions & Comments (IG / FB style) */}
                <div className="px-5 py-4 bg-[#F8FBF7] border-t border-[#E6EFE2] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-transform active:scale-125 ${
                          post.isLiked ? 'text-[#E11D48]' : 'text-[#4A6355] hover:text-[#1B2A22]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-mono tabular-nums">{post.likes} Tim</span>
                      </button>

                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#4A6355]">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-mono tabular-nums">
                          {post.comments.length} Bình luận
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => onToggleSave(post.id)}
                        className={`flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                          post.isSaved ? 'text-[#2D6A4F]' : 'text-[#4A6355] hover:text-[#1B2A22]'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
                        <span>{post.isSaved ? 'Đã lưu' : 'Lưu'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1 text-xs text-[#4A6355] hover:text-[#1B2A22] cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{copiedPostId === post.id ? 'Đã chép!' : 'Chia sẻ'}</span>
                      </button>
                    </div>

                    {/* Star Rating Control */}
                    <div className="flex items-center gap-0.5" title="Đánh giá công thức này">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onRatePost(post.id, star)}
                          className={`p-0.5 cursor-pointer ${
                            star <= (post.userRating || Math.round(post.avgRating))
                              ? 'text-[#D97706]'
                              : 'text-[#CBD5E1]'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments list */}
                  {post.comments.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#E6EFE2] max-h-44 overflow-y-auto">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="text-xs text-[#2A3C32] bg-white px-3 py-2 rounded-xl border border-[#E6EFE2]"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="font-semibold text-[#1B2A22]">{c.author}</strong>
                            <span className="text-[10px] text-[#6B7F73]">{c.createdAt}</span>
                          </div>
                          <p className="mt-0.5">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const txt = (commentInputs[post.id] || '').trim();
                      if (!txt) return;
                      onAddPostComment(post.id, txt, activeCommenterName);
                      setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                    }}
                    className="flex gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder={`Bình luận dưới tên ${activeCommenterName.split(' (')[0]}...`}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3 h-3" />
                      Gửi
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Instagram Grid Lightbox Modal when clicking a photo in Grid Mode */}
      {activeModalPost && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedGridPost(null)}
        >
          <div
            className="bg-white border border-[#DCE5D8] rounded-2xl max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-7 bg-black flex items-center justify-center max-h-[50vh] md:max-h-[85vh]">
              <DishImage
                src={activeModalPost.image}
                alt={activeModalPost.dishName}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="md:col-span-5 flex flex-col justify-between p-5 overflow-y-auto max-h-[85vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6EFE2] pb-3">
                  <div>
                    <div className="text-sm font-semibold text-[#1B2A22]">
                      {activeModalPost.authorName}
                    </div>
                    <div className="text-xs text-[#5C7467]">{activeModalPost.createdAt}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGridPost(null)}
                    className="p-1.5 rounded-lg text-[#4A6355] hover:bg-[#EEF5EE] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-display font-semibold text-[#1B2A22]">
                    {activeModalPost.dishName}
                  </h3>
                  <p className="text-xs text-[#2A3C32] mt-1 leading-relaxed">
                    {activeModalPost.caption}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E6EFE2]">
                  <div className="text-xs font-semibold text-[#1B2A22]">
                    Bình luận ({activeModalPost.comments.length})
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {activeModalPost.comments.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs bg-[#F8FBF7] p-2.5 rounded-xl border border-[#E6EFE2]"
                      >
                        <strong className="text-[#1B2A22]">{c.author}: </strong>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6EFE2] space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onToggleLike(activeModalPost.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      activeModalPost.isLiked ? 'text-[#E11D48]' : 'text-[#4A6355]'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${activeModalPost.isLiked ? 'fill-current' : ''}`}
                    />
                    <span>{activeModalPost.likes} Tim</span>
                  </button>
                  {onSimulateIncomingEngagement && (
                    <button
                      type="button"
                      onClick={() => onSimulateIncomingEngagement(activeModalPost.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] rounded-lg cursor-pointer"
                    >
                      +Bạn bè thả tim & cmt
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const txt = (commentInputs[activeModalPost.id] || '').trim();
                    if (!txt) return;
                    onAddPostComment(activeModalPost.id, txt, activeCommenterName);
                    setCommentInputs((prev) => ({ ...prev, [activeModalPost.id]: '' }));
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={commentInputs[activeModalPost.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [activeModalPost.id]: e.target.value,
                      }))
                    }
                    placeholder="Viết bình luận..."
                    className="flex-1 px-3 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl cursor-pointer"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
