import React, { useState } from 'react';
import { Shuffle, Sparkles, Check, Plus, Users, Utensils } from 'lucide-react';
import { CommunityPost, Dish, PantryItem } from '../types';
import { evaluateDishWithPantry, formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface RandomViewProps {
  dishes: Dish[];
  communityPosts: CommunityPost[];
  pantry: PantryItem[];
  peopleCount: number;
  remainingBudget: number;
  onQuickAddMeal: (dishId: string, mode: 'cook' | 'eat_out') => void;
  onSelectDishDetail: (dish: Dish) => void;
}

export const RandomView: React.FC<RandomViewProps> = ({
  dishes,
  communityPosts,
  pantry,
  peopleCount,
  remainingBudget,
  onQuickAddMeal,
  onSelectDishDetail,
}) => {
  const [maxMealBudget, setMaxMealBudget] = useState<number>(
    Math.min(50000, Math.max(20000, remainingBudget))
  );
  const [sourceMode, setSourceMode] = useState<'pantry_smart' | 'community'>('pantry_smart');
  const [customIngredientsInput, setCustomIngredientsInput] = useState<string>(
    pantry.slice(0, 4).map((p) => p.name).join(', ')
  );
  const [pickedDish, setPickedDish] = useState<Dish | null>(dishes[0] || null);
  const [pickedCommunity, setPickedCommunity] = useState<CommunityPost | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const handleSpinRandom = () => {
    setJustAdded(false);
    if (sourceMode === 'community' && communityPosts.length > 0) {
      const affordablePosts = communityPosts.filter(
        (p) => p.costPerServing * peopleCount <= maxMealBudget * 1.5
      );
      const pool = affordablePosts.length > 0 ? affordablePosts : communityPosts;
      const randomPost = pool[Math.floor(Math.random() * pool.length)];
      setPickedCommunity(randomPost);
      setPickedDish(null);
      return;
    }

    // Filter dishes matching budget or custom ingredients
    const keywords = customIngredientsInput
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const scoredDishes = dishes.map((dish) => {
      const ev = evaluateDishWithPantry(dish, pantry, peopleCount, 'cook');
      const keywordHits = keywords.filter((kw) =>
        dish.ingredients.some((i) => i.name.toLowerCase().includes(kw))
      ).length;
      const withinBudget = ev.netOutOfPocketCost <= maxMealBudget;
      return { dish, ev, keywordHits, withinBudget };
    });

    const eligible = scoredDishes.filter((d) => d.withinBudget);
    const pool = eligible.length > 0 ? eligible : scoredDishes;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    setPickedDish(chosen.dish);
    setPickedCommunity(null);
  };

  const pickedEval = pickedDish
    ? evaluateDishWithPantry(pickedDish, pantry, peopleCount, 'cook')
    : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Randomizer Controls */}
        <div className="lg:col-span-5 bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
              Random món — Hôm nay ăn gì?
            </h1>
            <p className="text-sm text-[#4A6355] mt-1">
              Khi không biết ăn gì, hãy nhập số tiền cho bữa này và nguyên liệu đang có để ứng dụng chọn giúp bạn 1 món hợp lý nhất!
            </p>
          </div>

          {/* Source Switch */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#385747]">
              Nguồn gợi ý món ăn
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF5EE] border border-[#DCE5D8] rounded-xl">
              <button
                type="button"
                onClick={() => setSourceMode('pantry_smart')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  sourceMode === 'pantry_smart'
                    ? 'bg-white text-[#1B4332] shadow-2xs'
                    : 'text-[#4A6355]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Tận dụng Kho đồ ăn
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('community')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  sourceMode === 'community'
                    ? 'bg-white text-[#1B4332] shadow-2xs'
                    : 'text-[#4A6355]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Random từ Cộng đồng
              </button>
            </div>
          </div>

          {/* Max Budget for this meal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#385747]">
              Số tiền tối đa muốn chi thêm cho bữa này ({peopleCount} người)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              value={maxMealBudget}
              onChange={(e) => setMaxMealBudget(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 font-mono tabular-nums text-base font-semibold bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[0, 15000, 25000, 40000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMaxMealBudget(val)}
                  className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-lg border cursor-pointer ${
                    maxMealBudget === val
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8]'
                  }`}
                >
                  {val === 0 ? '0đ (Chỉ dùng đồ có sẵn)' : `≤ ${formatVND(val)}`}
                </button>
              ))}
            </div>
          </div>

          {/* Current Ingredients Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#385747]">
              Nguyên liệu đang có sẵn (tự động đồng bộ từ Kho đồ ăn)
            </label>
            <input
              type="text"
              value={customIngredientsInput}
              onChange={(e) => setCustomIngredientsInput(e.target.value)}
              placeholder="VD: Trứng gà, Cà chua, Đậu hũ..."
              className="w-full px-3.5 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            />
          </div>

          <button
            type="button"
            onClick={handleSpinRandom}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            Quay chọn món ngẫu nhiên ngay!
          </button>
        </div>

        {/* Right 7 Cols: Result Card */}
        <div className="lg:col-span-7">
          {pickedDish && pickedEval && (
            <div className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
              <div className="px-6 py-3.5 bg-[#EEF5EE] border-b border-[#CFE0D2] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1B4332] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                  Kết quả Random từ Kho món ăn tiết kiệm
                </span>
                <span className="font-mono tabular-nums text-xs text-[#2D6A4F] font-semibold">
                  Khớp {pickedEval.pantryMatchPercent}% Kho đồ ăn
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5">
                  <div className="aspect-4/3 rounded-xl overflow-hidden border border-[#DCE5D8]">
                    <DishImage
                      src={pickedDish.image}
                      alt={pickedDish.name}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="text-xs text-[#5C7467]">
                    {pickedDish.category} · {pickedDish.taste} · {pickedDish.cookTimeMinutes} phút ·{' '}
                    {pickedDish.difficulty}
                  </div>

                  <h2 className="text-2xl font-display font-semibold text-[#1B2A22]">
                    {pickedDish.name}
                  </h2>

                  <p className="text-sm text-[#4A6355]">{pickedDish.subtitle}</p>

                  <div className="p-3.5 rounded-xl bg-[#F4F9F4] border border-[#D5E6D7] space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#4A6355]">
                        Số tiền cần chi thêm ({peopleCount} người):
                      </span>
                      <span className="font-mono tabular-nums text-xl font-semibold text-[#2D6A4F]">
                        {formatVND(pickedEval.netOutOfPocketCost)}
                      </span>
                    </div>
                    <div className="text-xs text-[#385747]">
                      Đã tiết kiệm{' '}
                      <strong className="font-mono tabular-nums">
                        {formatVND(pickedEval.savedFromPantryCost)}
                      </strong>{' '}
                      nhờ tận dụng nguyên liệu có sẵn trong tủ lạnh!
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onQuickAddMeal(pickedDish.id, 'cook');
                        setJustAdded(true);
                      }}
                      className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          Đã thêm vào Thực đơn & Trừ ngân sách
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Chốt món này vào Thực đơn
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectDishDetail(pickedDish)}
                      className="px-4 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-xl cursor-pointer"
                    >
                      Xem chi tiết cách làm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pickedCommunity && (
            <div className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
              <div className="px-6 py-3.5 bg-[#FDF6F0] border-b border-[#F3DEC8] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7C3A13]">
                  Khám phá ngẫu nhiên từ Cộng đồng: Đăng bởi {pickedCommunity.authorName}
                </span>
                <span className="font-mono tabular-nums text-xs text-[#B45309] font-semibold">
                  {pickedCommunity.avgRating.toFixed(1)} ★
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5">
                  <div className="aspect-4/3 rounded-xl overflow-hidden border border-[#DCE5D8]">
                    <DishImage
                      src={pickedCommunity.image}
                      alt={pickedCommunity.dishName}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3.5">
                  <div className="text-xs text-[#5C7467]">
                    {pickedCommunity.taste} · {pickedCommunity.cookTimeMinutes} phút ·{' '}
                    {pickedCommunity.difficulty}
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-[#1B2A22]">
                    {pickedCommunity.dishName}
                  </h2>
                  <p className="text-sm text-[#2A3C32]">{pickedCommunity.caption}</p>
                  <div className="p-3 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2] text-xs">
                    <strong>Mẹo của tác giả:</strong> {pickedCommunity.smartTip}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-[#5C7467] block">Chi phí tham khảo</span>
                      <span className="font-mono tabular-nums text-lg font-semibold text-[#2D6A4F]">
                        {formatVND(pickedCommunity.costPerServing)}/phần
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSpinRandom}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl cursor-pointer"
                    >
                      Random món cộng đồng khác
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
