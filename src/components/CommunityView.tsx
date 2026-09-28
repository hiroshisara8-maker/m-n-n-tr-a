import React, { useState } from 'react';
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
} from 'lucide-react';
import { CommunityPost, DishTaste, DishDifficulty } from '../types';
import { DISH_IMAGES } from '../data/initialData';
import { formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface CommunityViewProps {
  posts: CommunityPost[];
  followedAuthors: string[];
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onRatePost: (postId: string, rating: number) => void;
  onAddPostComment: (postId: string, text: string) => void;
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

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  followedAuthors,
  onToggleLike,
  onToggleSave,
  onRatePost,
  onAddPostComment,
  onToggleFollow,
  onCreatePost,
  totalSavedOverall,
}) => {
  const [subView, setSubView] = useState<'feed' | 'profile'>('feed');
  const [profileTab, setProfileTab] = useState<'posted' | 'saved'>('posted');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // New Post Form State
  const [dishName, setDishName] = useState('');
  const [selectedPresetImg, setSelectedPresetImg] = useState<string>(DISH_IMAGES.thitKho);
  const [costPerServing, setCostPerServing] = useState<number>(20000);
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(15);
  const [taste, setTaste] = useState<DishTaste>('Đậm đà');
  const [difficulty, setDifficulty] = useState<DishDifficulty>('Dễ nấu');
  const [caption, setCaption] = useState('');
  const [smartTip, setSmartTip] = useState('');
  const [ingredientsText, setIngredientsText] = useState('2 quả trứng gà, 2 quả cà chua, Hành lá');
  const [stepsText, setStepsText] = useState(
    'Phi thơm hành với cà chua\nĐổ trứng đánh tan vào đảo đều\nRắc tiêu và hành lá'
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !caption.trim()) return;

    onCreatePost({
      dishName: dishName.trim(),
      image: selectedPresetImg,
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
    setShowCreateForm(false);
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
  const displayedPosts =
    subView === 'feed' ? posts : profileTab === 'posted' ? myPosted : mySaved;

  return (
    <div className="space-y-8">
      {/* Sub-navigation: Bảng tin Cộng đồng vs Trang cá nhân */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
            Cộng đồng Món Khôn & Trang cá nhân
          </h1>
          <p className="text-sm text-[#4A6355] mt-1">
            Chia sẻ mâm cơm sinh viên, công thức vét tủ lạnh, chi phí thực tế và mẹo nấu ăn tiết kiệm.
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
              Trang cá nhân của tôi (Đã lưu {mySaved.length})
            </button>
          </div>

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

      {/* Personal Profile Header when in 'profile' view */}
      {subView === 'profile' && (
        <section className="bg-[#EEF5EE] border border-[#CFE0D2] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center font-display text-xl font-semibold">
                MK
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1B2A22]">
                  Bạn · Đầu Bếp Khôn Ngoan (@ban.monkhon)
                </h2>
                <p className="text-xs text-[#4A6355]">
                  Thành viên tích cực · Ưu tiên nấu ăn tại nhà, giải cứu nguyên liệu tủ lạnh trước hạn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div>
                <div className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
                  {myPosted.length}
                </div>
                <div className="text-xs text-[#5C7467]">Món đã đăng</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
                  {mySaved.length}
                </div>
                <div className="text-xs text-[#5C7467]">Món đã lưu</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
                  {followedAuthors.length}
                </div>
                <div className="text-xs text-[#5C7467]">Đang theo dõi</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-lg font-semibold text-[#2D6A4F]">
                  {formatVND(totalSavedOverall)}
                </div>
                <div className="text-xs text-[#5C7467]">Đã tiết kiệm</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#D6E6D9]">
            <button
              type="button"
              onClick={() => setProfileTab('posted')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                profileTab === 'posted'
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white text-[#4A6355] border border-[#DCE5D8]'
              }`}
            >
              Các món tôi đã đăng ({myPosted.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileTab('saved')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                profileTab === 'saved'
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white text-[#4A6355] border border-[#DCE5D8]'
              }`}
            >
              Bộ sưu tập món đã lưu ({mySaved.length})
            </button>
          </div>
        </section>
      )}

      {/* Create Post Form */}
      {showCreateForm && (
        <section className="bg-white border border-[#95D5B2] rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-display font-semibold text-[#1B2A22]">
            Đăng chia sẻ món ăn & mẹo tiết kiệm của bạn
          </h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Tên món ăn
                </label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="VD: Trứng chiên hành tây 12k..."
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

            {/* Image Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#385747]">
                Chọn ảnh món ăn minh họa
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                    onClick={() => setSelectedPresetImg(opt.img)}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetImg === opt.img
                        ? 'border-[#2D6A4F] bg-[#EAF4EC]'
                        : 'border-[#DCE5D8] bg-[#F6F9F5]'
                    }`}
                  >
                    <div className="aspect-4/3 rounded-lg overflow-hidden mb-1">
                      <DishImage src={opt.img} alt={opt.label} className="w-full h-full" />
                    </div>
                    <div className="text-[11px] font-medium text-[#1B2A22] truncate">
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Chia sẻ câu chuyện / cảm nhận món ăn
                </label>
                <textarea
                  rows={2}
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Kể về cách bạn tận dụng đồ trong tủ lạnh cho món này..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Mẹo riêng của bạn
                </label>
                <textarea
                  rows={2}
                  value={smartTip}
                  onChange={(e) => setSmartTip(e.target.value)}
                  placeholder="Mẹo giúp món ngon hơn hoặc tiết kiệm hơn..."
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22]"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl cursor-pointer"
              >
                Đăng lên Cộng đồng
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Feed Cards */}
      {displayedPosts.length === 0 ? (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-12 text-center space-y-3">
          <Utensils className="w-8 h-8 text-[#2D6A4F] mx-auto opacity-75" />
          <div className="text-base font-semibold text-[#1B2A22]">
            Chưa có bài đăng nào trong mục này
          </div>
          <p className="text-xs text-[#5C7467]">
            Hãy bấm <strong>"Đăng món ăn mới"</strong> hoặc lưu các công thức hay từ bảng tin cộng đồng!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedPosts.map((post) => {
            const isFollowing = followedAuthors.includes(post.authorId);

            return (
              <article
                key={post.id}
                className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Author Header */}
                  <div className="px-5 py-4 border-b border-[#E6EFE2] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#1B2A22]">
                        {post.authorName}{' '}
                        <span className="text-xs font-normal text-[#5C7467]">
                          {post.authorHandle} · {post.createdAt}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C7467]">{post.authorBio}</div>
                    </div>

                    {post.authorId !== 'user-me' && (
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
                    )}
                  </div>

                  {/* Dish Image */}
                  <div className="aspect-16/9 w-full overflow-hidden bg-[#EEF4ED]">
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

                    {/* Ingredients & Steps Accordion/Summary */}
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

                {/* Social Actions & Comments */}
                <div className="px-5 py-4 bg-[#F8FBF7] border-t border-[#E6EFE2] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                          post.isLiked ? 'text-[#E11D48]' : 'text-[#4A6355] hover:text-[#1B2A22]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-mono tabular-nums">{post.likes} Thích</span>
                      </button>

                      <span className="flex items-center gap-1 text-xs text-[#4A6355]">
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
                        <span>{post.isSaved ? 'Đã lưu' : 'Lưu món'}</span>
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
                    <div className="space-y-1.5 pt-2 border-t border-[#E6EFE2]">
                      {post.comments.map((c) => (
                        <div key={c.id} className="text-xs text-[#2A3C32]">
                          <strong className="font-semibold text-[#1B2A22]">{c.author}: </strong>
                          <span>{c.text}</span>
                          <span className="text-[10px] text-[#6B7F73] ml-2">{c.createdAt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="Viết bình luận hoặc hỏi kinh nghiệm nấu..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const txt = (commentInputs[post.id] || '').trim();
                        if (!txt) return;
                        onAddPostComment(post.id, txt);
                        setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2D6A4F] rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      Gửi
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
