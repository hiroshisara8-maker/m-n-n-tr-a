import React, { useState } from 'react';
import { Search, Plus, Check, RotateCcw } from 'lucide-react';
import {
  Dish,
  DishCategory,
  DishDifficulty,
  DishTaste,
  PantryItem,
  PlannedMeal,
} from '../types';
import { evaluateDishWithPantry, formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface ExploreViewProps {
  dishes: Dish[];
  pantry: PantryItem[];
  peopleCount: number;
  diningMode: 'cook' | 'eat_out';
  plannedMeals: PlannedMeal[];
  onSelectDishDetail: (dish: Dish) => void;
  onQuickAddMeal: (dishId: string, mode: 'cook' | 'eat_out') => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  dishes,
  pantry,
  peopleCount,
  diningMode,
  plannedMeals,
  onSelectDishDetail,
  onQuickAddMeal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(0); // 0 = all
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [tasteFilter, setTasteFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'pantry' | 'price_asc' | 'rating' | 'time'>('pantry');

  const categories: DishCategory[] = [
    'Món mặn',
    'Canh & Súp',
    'Rau & Đậu',
    'Cơm & Bún',
    'Ăn sáng',
  ];
  const tastes: DishTaste[] = ['Đậm đà', 'Thanh đạm', 'Chua ngọt', 'Cay nhẹ'];
  const difficulties: DishDifficulty[] = ['Dễ nấu', 'Trung bình', 'Cầu kỳ'];

  const resetFilters = () => {
    setSearchQuery('');
    setMaxPriceFilter(0);
    setCategoryFilter('ALL');
    setTasteFilter('ALL');
    setDifficultyFilter('ALL');
    setMinRatingFilter(0);
    setSortBy('pantry');
  };

  const filteredEvaluations = dishes
    .map((dish) => evaluateDishWithPantry(dish, pantry, peopleCount, diningMode))
    .filter((ev) => {
      const { dish } = ev;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesIng = dish.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesName && !matchesIng) return false;
      }
      if (maxPriceFilter > 0 && dish.cookCostPerPerson > maxPriceFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && dish.category !== categoryFilter) {
        return false;
      }
      if (tasteFilter !== 'ALL' && dish.taste !== tasteFilter) {
        return false;
      }
      if (difficultyFilter !== 'ALL' && dish.difficulty !== difficultyFilter) {
        return false;
      }
      if (minRatingFilter > 0 && dish.rating < minRatingFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'pantry') {
        if (b.pantryMatchPercent !== a.pantryMatchPercent) {
          return b.pantryMatchPercent - a.pantryMatchPercent;
        }
        return a.netOutOfPocketCost - b.netOutOfPocketCost;
      }
      if (sortBy === 'price_asc') {
        return a.netOutOfPocketCost - b.netOutOfPocketCost;
      }
      if (sortBy === 'rating') {
        return b.dish.rating - a.dish.rating;
      }
      return a.dish.cookTimeMinutes - b.dish.cookTimeMinutes;
    });

  return (
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
              Khám phá món ăn & Công thức tiết kiệm
            </h1>
            <p className="text-sm text-[#4A6355] mt-1">
              Tìm món theo mức giá, loại món, nguyên liệu trong tủ lạnh, khẩu vị, độ dễ nấu và đánh giá thực tế.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại bộ lọc
          </button>
        </div>

        {/* Search + Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#5C7467] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món hoặc nguyên liệu (vd: trứng, đậu hũ, ức gà, cà chua)..."
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22] focus:outline-none focus:border-[#2D6A4F]"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-xs font-medium bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            >
              <option value={0}>Mọi mức giá/người</option>
              <option value={18000}>Siêu rẻ (≤ 18.000đ)</option>
              <option value={25000}>Tiết kiệm (≤ 25.000đ)</option>
              <option value={35000}>Vừa túi tiền (≤ 35.000đ)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={tasteFilter}
              onChange={(e) => setTasteFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-medium bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            >
              <option value="ALL">Mọi khẩu vị</option>
              {tastes.map((t) => (
                <option key={t} value={t}>
                  Khẩu vị: {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2.5 text-xs font-medium bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            >
              <option value="pantry">Sắp xếp: Ưu tiên khớp Kho đồ ăn</option>
              <option value="price_asc">Sắp xếp: Chi phí thấp đến cao</option>
              <option value="rating">Sắp xếp: Đánh giá cao nhất</option>
              <option value="time">Sắp xếp: Nấu nhanh nhất</option>
            </select>
          </div>
        </div>

        {/* Interactive Category & Difficulty Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6EFE2]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#5C7467] mr-1">Loại món:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ALL'
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-[#F6F9F5] text-[#4A6355] hover:text-[#1B2A22]'
              }`}
            >
              Tất cả ({dishes.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#F6F9F5] text-[#4A6355] hover:text-[#1B2A22]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#5C7467] mr-1">Độ khó:</span>
            <button
              type="button"
              onClick={() => setDifficultyFilter('ALL')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                difficultyFilter === 'ALL'
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#F6F9F5] text-[#4A6355] hover:text-[#1B2A22]'
              }`}
            >
              Tất cả
            </button>
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  difficultyFilter === diff
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-[#F6F9F5] text-[#4A6355] hover:text-[#1B2A22]'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredEvaluations.length === 0 ? (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-12 text-center space-y-3">
          <div className="text-base font-semibold text-[#1B2A22]">
            Không tìm thấy món ăn phù hợp với bộ lọc hiện tại
          </div>
          <p className="text-sm text-[#5C7467]">
            Hãy thử mở rộng mức giá hoặc xóa từ khóa tìm kiếm để xem thêm các gợi ý món ăn khác.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl cursor-pointer"
          >
            Xem tất cả món ăn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluations.map((ev) => {
            const { dish } = ev;
            const selectedCount = plannedMeals.filter((m) => m.dishId === dish.id).length;

            return (
              <article
                key={dish.id}
                className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#2D6A4F] transition-colors"
              >
                <div>
                  <div
                    onClick={() => onSelectDishDetail(dish)}
                    className="aspect-4/3 w-full overflow-hidden bg-[#EEF4ED] cursor-pointer"
                  >
                    <DishImage
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full hover:scale-103 transition-transform duration-200"
                    />
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Clean unboxed metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C7467]">
                      <span>{dish.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dish.taste}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dish.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{dish.cookTimeMinutes} phút</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#B45309]">
                        {dish.rating.toFixed(1)} ★ ({dish.reviewCount + dish.comments.length})
                      </span>
                    </div>

                    <div>
                      <h2
                        onClick={() => onSelectDishDetail(dish)}
                        className="text-base font-semibold text-[#1B2A22] hover:text-[#2D6A4F] cursor-pointer leading-snug"
                      >
                        {dish.name}
                      </h2>
                      <p className="text-xs text-[#4A6355] mt-1 line-clamp-2">{dish.subtitle}</p>
                    </div>

                    {/* Ingredients summary */}
                    <div className="text-xs text-[#385747] pt-2 border-t border-[#EBF2E9] space-y-1">
                      <div>
                        <span className="text-[#5C7467]">Nguyên liệu chính: </span>
                        {dish.ingredients.map((i) => i.name).join(', ')}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C7467]">Dinh dưỡng:</span>
                        <span className="font-mono tabular-nums text-[#1B2A22]">
                          {dish.nutrition.calories} kcal · {dish.nutrition.protein}g đạm ·{' '}
                          {dish.nutrition.carbs}g tinh bột
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C7467]">Tận dụng Kho đồ ăn:</span>
                        <strong className="font-mono tabular-nums text-[#2D6A4F]">
                          Đáp ứng {ev.pantryMatchPercent}% (Tiết kiệm {formatVND(ev.savedFromPantryCost)})
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3.5 bg-[#F8FBF7] border-t border-[#E6EFE2] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-[#5C7467] block">
                      Chi phí tự nấu ({peopleCount} người)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono tabular-nums text-base font-semibold text-[#2D6A4F]">
                        {formatVND(ev.netOutOfPocketCost)}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-[#6B7F73]">
                        (Gốc {formatVND(ev.baseTotalCost)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDishDetail(dish)}
                      className="px-3 py-2 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-white border border-[#DCE5D8] rounded-xl cursor-pointer whitespace-nowrap"
                    >
                      Xem cách làm
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAddMeal(dish.id, diningMode)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        selectedCount > 0
                          ? 'bg-[#D8F3DC] text-[#1B4332] border border-[#95D5B2]'
                          : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                      }`}
                    >
                      {selectedCount > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã chọn ({selectedCount})
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Chọn ăn
                        </>
                      )}
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
