import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Check,
  Plus,
  X,
  Search,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  RefreshCw,
  Utensils,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Dish, DietaryPreferences, PlannedMeal, PantryItem, NavTab } from '../types';
import { POPULAR_ALLERGIES, POPULAR_DISLIKES, DietaryOption } from '../data/initialData';
import {
  getDishAllergyMatches,
  getDishDislikeMatches,
  isDishRestricted,
  formatVND,
} from '../utils/mealMath';
import { DishImage } from './DishImage';

interface DietaryPreferencesViewProps {
  preferences: DietaryPreferences;
  onUpdatePreferences: (updated: DietaryPreferences) => void;
  dishes: Dish[];
  plannedMeals: PlannedMeal[];
  pantry: PantryItem[];
  onNavigateTab: (tab: NavTab) => void;
  onAutoGeneratePlan: (options?: { avoidDuplicates?: boolean }) => void;
  onSwapFlaggedMeals?: () => void;
}

export const DietaryPreferencesView: React.FC<DietaryPreferencesViewProps> = ({
  preferences,
  onUpdatePreferences,
  dishes,
  plannedMeals,
  pantry,
  onNavigateTab,
  onAutoGeneratePlan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'allergies' | 'dislikes' | 'excluded_dishes' | 'audit'>('allergies');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customDislikeInput, setCustomDislikeInput] = useState('');
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [dishFilterStatus, setDishFilterStatus] = useState<'all' | 'safe' | 'flagged'>('all');

  // Count active restrictions
  const totalAllergiesCount = preferences.allergies.length + preferences.customAllergies.length;
  const totalDislikesCount = preferences.dislikes.length + preferences.customDislikes.length;
  const totalExcludedDishesCount = preferences.excludedDishIds?.length || 0;

  // Audit planned meals currently scheduled
  const flaggedPlannedMeals = useMemo(() => {
    return plannedMeals.map((meal) => {
      const dish = dishes.find((d) => d.id === meal.dishId);
      if (!dish) return null;
      const restricted = isDishRestricted(dish, preferences);
      if (restricted.isRestricted) {
        return { meal, dish, restricted };
      }
      return null;
    }).filter(Boolean) as Array<{
      meal: PlannedMeal;
      dish: Dish;
      restricted: ReturnType<typeof isDishRestricted>;
    }>;
  }, [plannedMeals, dishes, preferences]);

  // Dishes categorization based on current preferences
  const dishAuditList = useMemo(() => {
    return dishes.map((dish) => {
      const restricted = isDishRestricted(dish, preferences);
      return { dish, restricted };
    });
  }, [dishes, preferences]);

  const safeDishesCount = dishAuditList.filter((d) => !d.restricted.isRestricted).length;
  const restrictedDishesCount = dishAuditList.filter((d) => d.restricted.isRestricted).length;

  // Toggle popular allergy
  const handleTogglePopularAllergy = (id: string) => {
    const current = preferences.allergies || [];
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    onUpdatePreferences({ ...preferences, allergies: updated });
  };

  // Add custom allergy
  const handleAddCustomAllergy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customAllergyInput.trim();
    if (!clean) return;
    const current = preferences.customAllergies || [];
    if (!current.includes(clean)) {
      onUpdatePreferences({
        ...preferences,
        customAllergies: [...current, clean],
      });
    }
    setCustomAllergyInput('');
  };

  // Remove custom allergy
  const handleRemoveCustomAllergy = (item: string) => {
    onUpdatePreferences({
      ...preferences,
      customAllergies: (preferences.customAllergies || []).filter((a) => a !== item),
    });
  };

  // Toggle popular dislike
  const handleTogglePopularDislike = (id: string) => {
    const current = preferences.dislikes || [];
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    onUpdatePreferences({ ...preferences, dislikes: updated });
  };

  // Add custom dislike
  const handleAddCustomDislike = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customDislikeInput.trim();
    if (!clean) return;
    const current = preferences.customDislikes || [];
    if (!current.includes(clean)) {
      onUpdatePreferences({
        ...preferences,
        customDislikes: [...current, clean],
      });
    }
    setCustomDislikeInput('');
  };

  // Remove custom dislike
  const handleRemoveCustomDislike = (item: string) => {
    onUpdatePreferences({
      ...preferences,
      customDislikes: (preferences.customDislikes || []).filter((d) => d !== item),
    });
  };

  // Toggle direct dish exclusion
  const handleToggleExcludeDish = (dishId: string) => {
    const current = preferences.excludedDishIds || [];
    const exists = current.includes(dishId);
    const updated = exists ? current.filter((id) => id !== dishId) : [...current, dishId];
    onUpdatePreferences({ ...preferences, excludedDishIds: updated });
  };

  // Clear all preferences
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ cài đặt dị ứng và món ghét?')) {
      onUpdatePreferences({
        allergies: [],
        dislikes: [],
        customAllergies: [],
        customDislikes: [],
        excludedDishIds: [],
      });
    }
  };

  // Filtered dishes for the audit tab
  const filteredDishAudit = useMemo(() => {
    return dishAuditList.filter(({ dish, restricted }) => {
      if (dishFilterStatus === 'safe' && restricted.isRestricted) return false;
      if (dishFilterStatus === 'flagged' && !restricted.isRestricted) return false;
      if (dishSearchQuery.trim()) {
        const q = dishSearchQuery.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchIng = dish.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchName && !matchIng) return false;
      }
      return true;
    });
  }, [dishAuditList, dishFilterStatus, dishSearchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Overview */}
      <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1B2A22]">
                Món ăn Dị ứng & Khẩu vị Ghét
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#5C7467] max-w-2xl leading-relaxed">
              Tùy chỉnh các nguyên liệu bạn bị dị ứng hoặc không thích ăn. Hệ thống sẽ{' '}
              <strong className="text-[#1B2A22] font-semibold">tự động loại bỏ triệt để</strong> khỏi
              các gợi ý thực đơn thông minh, vòng quay ngẫu nhiên và danh sách nguyên liệu đi chợ.
            </p>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-center">
              <span className="block text-[11px] font-medium text-[#991B1B]">Dị ứng đã chọn</span>
              <span className="text-base font-bold font-mono text-[#DC2626]">
                {totalAllergiesCount}
              </span>
            </div>
            <div className="px-3.5 py-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-center">
              <span className="block text-[11px] font-medium text-[#92400E]">Món ghét đã chọn</span>
              <span className="text-base font-bold font-mono text-[#D97706]">
                {totalDislikesCount + totalExcludedDishesCount}
              </span>
            </div>
            <div className="px-3.5 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-center">
              <span className="block text-[11px] font-medium text-[#065F46]">Món an toàn</span>
              <span className="text-base font-bold font-mono text-[#059669]">
                {safeDishesCount}/{dishes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Live Planned Meals Safety Alert */}
        {flaggedPlannedMeals.length > 0 ? (
          <div className="mt-5 p-4 bg-[#FEF2F2] border border-[#F87171] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#991B1B]">
                  Phát hiện {flaggedPlannedMeals.length} bữa ăn trong kế hoạch hiện tại chứa nguyên liệu cảnh báo!
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {flaggedPlannedMeals.map(({ meal, dish, restricted }, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] bg-white border border-[#FECACA] px-2 py-0.5 rounded-md text-[#B91C1C]"
                    >
                      <span>Ngày {meal.dayIndex} ({meal.slot}):</span>
                      <strong>{dish.name}</strong>
                      <span className="text-[10px] text-[#DC2626]">
                        ({restricted.reasons.join(', ')})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAutoGeneratePlan({ avoidDuplicates: true })}
              className="px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tạo lại thực đơn an toàn ngay
            </button>
          </div>
        ) : (
          <div className="mt-5 p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between gap-3 text-xs text-[#166534]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                <strong>100% An toàn:</strong> Toàn bộ {plannedMeals.length} bữa ăn trong Kế hoạch ăn hiện tại đều không chứa bất kỳ nguyên liệu dị ứng hay món ghét nào!
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('mealplan')}
              className="text-[#15803D] hover:underline font-medium inline-flex items-center gap-1 whitespace-nowrap"
            >
              Xem thực đơn <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE5D8] pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('allergies')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'allergies'
              ? 'bg-[#FEF2F2] text-[#DC2626] border-b-2 border-[#DC2626]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          1. Món / Thành phần Dị ứng
          {totalAllergiesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#DC2626] text-white text-[10px] rounded-full font-mono">
              {totalAllergiesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('dislikes')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'dislikes'
              ? 'bg-[#FFFBEB] text-[#D97706] border-b-2 border-[#D97706]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <Ban className="w-4 h-4" />
          2. Món & Nguyên liệu Ghét
          {totalDislikesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#D97706] text-white text-[10px] rounded-full font-mono">
              {totalDislikesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('excluded_dishes')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'excluded_dishes'
              ? 'bg-[#F3F4F6] text-[#374151] border-b-2 border-[#374151]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          3. Món ăn cụ thể bị cấm
          {totalExcludedDishesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#4B5563] text-white text-[10px] rounded-full font-mono">
              {totalExcludedDishesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-[#ECFDF5] text-[#059669] border-b-2 border-[#059669]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          4. Kiểm tra Thực đơn an toàn ({safeDishesCount}/{dishes.length})
        </button>
      </div>

      {/* SUB-TAB 1: DỊ ỨNG */}
      {activeSubTab === 'allergies' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold rounded-md uppercase">
                Ưu tiên số 1 - Sức khỏe
              </span>
              <h2 className="text-lg font-bold text-[#1B2A22]">
                Chọn các loại thực phẩm / nguyên liệu gây dị ứng
              </h2>
            </div>
            <p className="text-xs text-[#5C7467]">
              Các món có chứa bất kỳ nguyên liệu nào dưới đây sẽ bị{' '}
              <strong className="text-[#DC2626]">loại bỏ 100%</strong> khỏi thực đơn gợi ý.
            </p>
          </div>

          {/* Popular Vietnamese Allergies Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Các chất gây dị ứng phổ biến ở Việt Nam:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_ALLERGIES.map((item) => {
                const isSelected = preferences.allergies?.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTogglePopularAllergy(item.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FEF2F2] border-[#F87171] ring-2 ring-[#EF4444]/20 shadow-2xs'
                        : 'bg-[#F9FBFA] border-[#DCE5D8] hover:border-[#EF4444]/50 hover:bg-white'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{item.icon || '⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-[#991B1B]' : 'text-[#1B2A22]'
                          }`}
                        >
                          {item.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#DC2626] border-[#DC2626] text-white'
                              : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Allergy Tags Input */}
          <div className="pt-4 border-t border-[#E6EFE2] space-y-3">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Hoặc nhập nguyên liệu dị ứng riêng của bạn:
            </h3>
            <form onSubmit={handleAddCustomAllergy} className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={customAllergyInput}
                onChange={(e) => setCustomAllergyInput(e.target.value)}
                placeholder="Ví dụ: Tôm sú, cua đồng, bột ngọt, mắm ruốc..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Thêm dị ứng
              </button>
            </form>

            {/* Custom Allergy Badges */}
            {preferences.customAllergies && preferences.customAllergies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {preferences.customAllergies.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold rounded-lg"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomAllergy(tag)}
                      className="p-0.5 hover:bg-[#FEE2E2] rounded text-[#B91C1C] cursor-pointer"
                      title="Xoá mục này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MÓN & NGUYÊN LIỆU GHÉT */}
      {activeSubTab === 'dislikes' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] text-xs font-semibold rounded-md uppercase">
                Khẩu vị & Sở thích
              </span>
              <h2 className="text-lg font-bold text-[#1B2A22]">
                Chọn các món hoặc nguyên liệu bạn không thích ăn (ghét)
              </h2>
            </div>
            <p className="text-xs text-[#5C7467]">
              Hệ thống sẽ né tránh các món chứa nguyên liệu này để bữa ăn luôn hợp khẩu vị và ngon miệng nhất.
            </p>
          </div>

          {/* Popular Vietnamese Dislikes Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Các món / nguyên liệu hay bị kén ăn nhất:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_DISLIKES.map((item) => {
                const isSelected = preferences.dislikes?.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTogglePopularDislike(item.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFBEB] border-[#FBBF24] ring-2 ring-[#F59E0B]/20 shadow-2xs'
                        : 'bg-[#F9FBFA] border-[#DCE5D8] hover:border-[#F59E0B]/50 hover:bg-white'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{item.icon || '⛔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-[#92400E]' : 'text-[#1B2A22]'
                          }`}
                        >
                          {item.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#D97706] border-[#D97706] text-white'
                              : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Dislike Tags Input */}
          <div className="pt-4 border-t border-[#E6EFE2] space-y-3">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Hoặc nhập món / nguyên liệu bạn ghét khác:
            </h3>
            <form onSubmit={handleAddCustomDislike} className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={customDislikeInput}
                onChange={(e) => setCustomDislikeInput(e.target.value)}
                placeholder="Ví dụ: sầu riêng, rau răm, tỏi sống, lòng lợn..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Thêm món ghét
              </button>
            </form>

            {/* Custom Dislike Badges */}
            {preferences.customDislikes && preferences.customDislikes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {preferences.customDislikes.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold rounded-lg"
                  >
                    <Ban className="w-3.5 h-3.5 text-[#D97706]" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDislike(tag)}
                      className="p-0.5 hover:bg-[#FEF3C7] rounded text-[#B45309] cursor-pointer"
                      title="Xoá mục này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MÓN ĂN CỤ THỂ BỊ CẤM */}
      {activeSubTab === 'excluded_dishes' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1B2A22]">
              Cấm từng món ăn cụ thể khỏi thực đơn ({totalExcludedDishesCount} món đã cấm)
            </h2>
            <p className="text-xs text-[#5C7467]">
              Nếu có một món cụ thể nào bạn không bao giờ muốn ăn, hãy ấn cấm món đó tại đây.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishes.map((dish) => {
              const isExcluded = preferences.excludedDishIds?.includes(dish.id);
              return (
                <div
                  key={dish.id}
                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    isExcluded
                      ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                      : 'bg-[#F9FBFA] border-[#DCE5D8]'
                  }`}
                >
                  <DishImage
                    src={dish.image}
                    alt={dish.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#1B2A22] truncate">
                      {dish.name}
                    </h4>
                    <span className="text-[11px] text-[#5C7467]">
                      {dish.category} · {formatVND(dish.cookCostPerPerson)}/người
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleExcludeDish(dish.id)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isExcluded
                        ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                        : 'bg-white border border-[#DCE5D8] text-[#4A6355] hover:border-[#DC2626] hover:text-[#DC2626]'
                    }`}
                  >
                    {isExcluded ? 'Đang cấm' : 'Cấm món'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: KIỂM TRA THỰC ĐƠN AN TOÀN (AUDIT MATRIX) */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1B2A22]">
                Kiểm tra an toàn toàn bộ 28 món ăn
              </h2>
              <p className="text-xs text-[#5C7467]">
                Xem trạng thái kiểm tra tự động của từng món dựa theo cấu hình dị ứng & món ghét của bạn.
              </p>
            </div>

            {/* Search & Filter status */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={dishSearchQuery}
                  onChange={(e) => setDishSearchQuery(e.target.value)}
                  placeholder="Tìm tên món hoặc nguyên liệu..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F]"
                />
                <Search className="w-3.5 h-3.5 text-[#5C7467] absolute left-2.5 top-2.5" />
              </div>
              <select
                value={dishFilterStatus}
                onChange={(e) => setDishFilterStatus(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22] focus:outline-none"
              >
                <option value="all">Tất cả ({dishes.length})</option>
                <option value="safe">An toàn ({safeDishesCount})</option>
                <option value="flagged">Bị hạn chế ({restrictedDishesCount})</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDishAudit.map(({ dish, restricted }) => (
              <div
                key={dish.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  restricted.hasAllergy
                    ? 'bg-[#FEF2F2] border-[#F87171]'
                    : restricted.hasDislike || restricted.isExcluded
                    ? 'bg-[#FFFBEB] border-[#FCD34D]'
                    : 'bg-[#F9FBFA] border-[#DCE5D8]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <DishImage
                    src={dish.image}
                    alt={dish.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[#5C7467] bg-[#EEF4ED] px-1.5 py-0.5 rounded">
                        {dish.category}
                      </span>
                      {restricted.hasAllergy ? (
                        <span className="text-[10px] font-semibold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ShieldAlert className="w-3 h-3" /> Dị ứng
                        </span>
                      ) : restricted.hasDislike || restricted.isExcluded ? (
                        <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Ban className="w-3 h-3" /> Món ghét
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> An toàn
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1B2A22] truncate mt-1">
                      {dish.name}
                    </h4>
                    <p className="text-[11px] text-[#5C7467] truncate mt-0.5">
                      {dish.ingredients.map((i) => i.name).join(', ')}
                    </p>
                  </div>
                </div>

                {restricted.isRestricted && (
                  <div className="p-2 bg-white/80 rounded-lg text-[11px] text-[#991B1B] border border-[#FECACA] space-y-0.5">
                    {restricted.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Control Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-[#DCE5D8] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#5C7467]">
          <Info className="w-4 h-4 text-[#2D6A4F]" />
          <span>
            Đã lưu tự động: <strong>{totalAllergiesCount}</strong> dị ứng và{' '}
            <strong>{totalDislikesCount + totalExcludedDishesCount}</strong> món ghét.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(totalAllergiesCount > 0 || totalDislikesCount > 0 || totalExcludedDishesCount > 0) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Đặt lại từ đầu
            </button>
          )}

          <button
            type="button"
            onClick={() => onAutoGeneratePlan({ avoidDuplicates: true })}
            className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Tạo thực đơn mới (Tránh dị ứng & ghét)
          </button>
        </div>
      </div>
    </div>
  );
};
