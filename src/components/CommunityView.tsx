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
} from 'lucide-react';
import { CommunityPost, DishTaste, DishDifficulty } from '../types';
import { DISH_IMAGES } from '../data/initialData';
import { formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

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
 * Compress and resize an uploaded image file from user's device album
 * so it renders crisply and fits comfortably in localStorage.
 */
function readAndCompressImageFile(file: File, maxWidth = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Không đọc được file ảnh'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  followedAuthors,
  userProfile,
  onUpdateUserProfile,
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

  // Comment inputs & commenter persona (so user can test commenting as themselves or as friends)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommenterName, setActiveCommenterName] = useState<string>(
    `${userProfile.displayName} (${userProfile.handle})`
  );
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [selectedGridPost, setSelectedGridPost] = useState<CommunityPost | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Refs for file inputs (Album upload)
  const postImageInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle picking dish photo from user's device album
  const handlePickDishPhotoFromAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readAndCompressImageFile(file, 1080);
      setSelectedImg(compressed);
      setIsCustomAlbumPhoto(true);
      setShowCreateForm(true);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  // Handle picking Avatar photo from device album
  const handlePickAvatarFromAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readAndCompressImageFile(file, 400);
      onUpdateUserProfile({
        ...userProfile,
        avatarUrl: compressed,
      });
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  // Handle picking Cover photo from device album
  const handlePickCoverFromAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readAndCompressImageFile(file, 1200);
      onUpdateUserProfile({
        ...userProfile,
        coverUrl: compressed,
      });
    } catch {
      // ignore
    }
    e.target.value = '';
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

  return (
    <div className="space-y-8">
      {/* Hidden File Inputs for Album Photo Selection */}
      <input
        ref={postImageInputRef}
        type="file"
        accept="image/*"
        onChange={handlePickDishPhotoFromAlbum}
        className="hidden"
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handlePickAvatarFromAlbum}
        className="hidden"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handlePickCoverFromAlbum}
        className="hidden"
      />

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

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setTimeout(() => postImageInputRef.current?.click(), 100);
            }}
            className="px-4 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] border border-[#CFE0D2] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4" />
            Lấy ảnh từ Album & Đăng
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Đăng món ăn mới
          </button>
        </div>
      </section>

      {uploadNotice && (
        <div className="p-4 rounded-xl bg-[#EEF5EE] border border-[#95D5B2] text-sm font-medium text-[#1B4332] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#2D6A4F]" />
            {uploadNotice}
          </span>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="text-xs underline cursor-pointer"
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
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-4 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1B2A22] border border-[#DCE5D8] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
                    title="Đổi ảnh đại diện từ Album"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    Đổi ảnh
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
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-display font-bold text-[#1B2A22]">
                          {userProfile.displayName}
                        </h2>
                        <span className="text-xs text-[#5C7467]">{userProfile.handle}</span>
                      </div>
                      <p className="text-xs text-[#4A6355] mt-1 max-w-xl">{userProfile.bio}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="text-xs font-medium text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Chọn ảnh đại diện từ Album
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
                  onClick={() => postImageInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-[#EEF5EE] hover:bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  Ảnh từ Album
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Viết công thức
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
            {/* Step 1: Pick Photo from Album or Sample */}
            <div className="p-4 rounded-2xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1B2A22]">
                    1. Hình ảnh món ăn của bạn
                  </label>
                  <span className="text-xs text-[#4A6355]">
                     Tải ảnh chụp thực tế từ Album điện thoại/máy tính hoặc chọn ảnh minh họa bên dưới
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => postImageInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ImageIcon className="w-4 h-4" />
                  Chọn ảnh từ Album thiết bị
                </button>
              </div>

              {/* Current Photo Preview + Sample Thumbnails */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                  <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-[#DCE5D8] bg-white">
                    <DishImage src={selectedImg} alt="Ảnh món ăn chuẩn bị đăng" className="w-full h-full" />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[11px] font-medium">
                      {isCustomAlbumPhoto ? '✓ Ảnh lấy từ Album của bạn' : 'Ảnh mẫu minh họa'}
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
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={costPerServing}
                  onChange={(e) => setCostPerServing(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
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
            Hãy bấm <strong>"Lấy ảnh từ Album & Đăng"</strong> để tải ảnh món ăn của bạn lên Trang cá nhân cho mọi người cùng thả tim và bình luận!
          </p>
          <button
            type="button"
            onClick={() => postImageInputRef.current?.click()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            Chọn ảnh từ Album máy ngay
          </button>
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
