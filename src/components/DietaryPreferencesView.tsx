import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Check,
  Plus,
  X,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Utensils,
  Info,
  CheckCircle2,
  Trash2,
  Edit2,
  Tag,
  ChefHat,
  Sliders,
} from 'lucide-react';
import { Dish, DietaryPreferences, CustomDietaryItem, PlannedMeal, PantryItem, NavTab } from '../types';
import { POPULAR_ALLERGIES, POPULAR_DISLIKES } from '../data/initialData';
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
  onNavigateTab,
  onAutoGeneratePlan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'allergies' | 'dislikes' | 'custom_items' | 'excluded_dishes' | 'audit'
  >('allergies');

  // Quick inputs
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customDislikeInput, setCustomDislikeInput] = useState('');

  // Searches & filters
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [dishFilterStatus, setDishFilterStatus] = useState<'all' | 'safe' | 'flagged'>('all');
  const [customItemsFilter, setCustomItemsFilter] = useState<'all' | 'allergy' | 'dislike' | 'dish' | 'ingredient'>('all');
  const [customItemsSearch, setCustomItemsSearch] = useState('');
  const [excludedDishesFilter, setExcludedDishesFilter] = useState<'all' | 'excluded' | 'available'>('all');
  const [excludedDishesSearch, setExcludedDishesSearch] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Modal State for creating or editing custom dietary items
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Modal Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryType, setFormCategoryType] = useState<'dish' | 'ingredient'>('dish');
  const [formType, setFormType] = useState<'allergy' | 'dislike'>('allergy');
  const [formSeverity, setFormSeverity] = useState<'high' | 'medium' | 'low'>('high');
  const [formIngredients, setFormIngredients] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  // Inline Tag Editing State
  const [editingTag, setEditingTag] = useState<{
    type: 'allergy' | 'dislike';
    originalValue: string;
    currentValue: string;
  } | null>(null);

  // Safe arrays
  const allergies = preferences?.allergies || [];
  const dislikes = preferences?.dislikes || [];
  const customAllergies = preferences?.customAllergies || [];
  const customDislikes = preferences?.customDislikes || [];
  const customItems = preferences?.customItems || [];
  const excludedDishIds = preferences?.excludedDishIds || [];

  // Counts
  const totalAllergiesCount =
    allergies.length +
    customAllergies.length +
    customItems.filter((i) => i.type === 'allergy').length;

  const totalDislikesCount =
    dislikes.length +
    customDislikes.length +
    customItems.filter((i) => i.type === 'dislike').length;

  const totalExcludedDishesCount = excludedDishIds.length;
  const totalCustomCreatedCount = customItems.length;

  // Audit planned meals currently scheduled
  const flaggedPlannedMeals = useMemo(() => {
    return (plannedMeals || [])
      .map((meal) => {
        const dish = dishes.find((d) => d.id === meal.dishId);
        if (!dish) return null;
        const restricted = isDishRestricted(dish, preferences);
        if (restricted.isRestricted) {
          return { meal, dish, restricted };
        }
        return null;
      })
      .filter(Boolean) as Array<{
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
    const exists = allergies.includes(id);
    const updated = exists ? allergies.filter((item) => item !== id) : [...allergies, id];
    onUpdatePreferences({ ...preferences, allergies: updated });
  };

  // Toggle popular dislike
  const handleTogglePopularDislike = (id: string) => {
    const exists = dislikes.includes(id);
    const updated = exists ? dislikes.filter((item) => item !== id) : [...dislikes, id];
    onUpdatePreferences({ ...preferences, dislikes: updated });
  };

  // Add quick custom allergy tag
  const handleAddCustomAllergy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customAllergyInput.trim();
    if (!clean) return;

    // Handle comma-separated items
    const parts = clean
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const newItems = parts.filter((p) => !customAllergies.includes(p));
    if (newItems.length > 0) {
      onUpdatePreferences({
        ...preferences,
        customAllergies: [...customAllergies, ...newItems],
      });
      setToastMessage(`Đã thêm ${newItems.length} nguyên liệu dị ứng: "${newItems.join(', ')}"`);
    }
    setCustomAllergyInput('');
  };

  // Remove quick custom allergy tag
  const handleRemoveCustomAllergy = (item: string) => {
    onUpdatePreferences({
      ...preferences,
      customAllergies: customAllergies.filter((a) => a !== item),
    });
    setToastMessage(`Đã xóa dị ứng "${item}"`);
  };

  // Add quick custom dislike tag
  const handleAddCustomDislike = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customDislikeInput.trim();
    if (!clean) return;

    const parts = clean
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const newItems = parts.filter((p) => !customDislikes.includes(p));
    if (newItems.length > 0) {
      onUpdatePreferences({
        ...preferences,
        customDislikes: [...customDislikes, ...newItems],
      });
      setToastMessage(`Đã thêm ${newItems.length} món ghét: "${newItems.join(', ')}"`);
    }
    setCustomDislikeInput('');
  };

  // Remove quick custom dislike tag
  const handleRemoveCustomDislike = (item: string) => {
    onUpdatePreferences({
      ...preferences,
      customDislikes: customDislikes.filter((d) => d !== item),
    });
    setToastMessage(`Đã xóa món ghét "${item}"`);
  };

  // Open Modal to Create New Item
  const handleOpenCreateModal = (
    defaultType: 'allergy' | 'dislike' = 'allergy',
    defaultCategory: 'dish' | 'ingredient' = 'dish'
  ) => {
    setModalMode('create');
    setEditingItemId(null);
    setFormName('');
    setFormCategoryType(defaultCategory);
    setFormType(defaultType);
    setFormSeverity(defaultType === 'allergy' ? 'high' : 'medium');
    setFormIngredients('');
    setFormNote('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal to Edit an Existing Item
  const handleOpenEditModal = (item: CustomDietaryItem) => {
    setModalMode('edit');
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormCategoryType(item.categoryType || 'dish');
    setFormType(item.type);
    setFormSeverity(item.severity || 'medium');
    setFormIngredients(item.ingredients ? item.ingredients.join(', ') : '');
    setFormNote(item.note || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Modal Form (Create or Edit)
  const handleSaveModalForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Vui lòng nhập tên món ăn hoặc nguyên liệu!');
      return;
    }

    const ingredientsList = formIngredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (modalMode === 'create') {
      const newItem: CustomDietaryItem = {
        id: `cdi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        categoryType: formCategoryType,
        type: formType,
        severity: formSeverity,
        ingredients: ingredientsList.length > 0 ? ingredientsList : undefined,
        note: formNote.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      onUpdatePreferences({
        ...preferences,
        customItems: [newItem, ...customItems],
      });
      setToastMessage(`Đã tạo thành công món/nguyên liệu "${cleanName}"!`);
    } else if (modalMode === 'edit' && editingItemId) {
      const updatedList = customItems.map((item) => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name: cleanName,
            categoryType: formCategoryType,
            type: formType,
            severity: formSeverity,
            ingredients: ingredientsList.length > 0 ? ingredientsList : undefined,
            note: formNote.trim() || undefined,
          };
        }
        return item;
      });

      onUpdatePreferences({
        ...preferences,
        customItems: updatedList,
      });
      setToastMessage(`Đã cập nhật chỉnh sửa cho "${cleanName}" thành công!`);
    }

    setIsModalOpen(false);
  };

  // Delete a Custom Item
  const handleDeleteCustomItem = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${name}" khỏi danh sách?`)) {
      onUpdatePreferences({
        ...preferences,
        customItems: customItems.filter((i) => i.id !== id),
      });
      if (isModalOpen && editingItemId === id) {
        setIsModalOpen(false);
      }
      setToastMessage(`Đã xóa "${name}"`);
    }
  };

  // Save Inline Tag Edit
  const handleSaveTagEdit = () => {
    if (!editingTag) return;
    const clean = editingTag.currentValue.trim();
    if (!clean) return;

    if (editingTag.type === 'allergy') {
      const updated = customAllergies.map((a) => (a === editingTag.originalValue ? clean : a));
      onUpdatePreferences({ ...preferences, customAllergies: updated });
    } else {
      const updated = customDislikes.map((d) => (d === editingTag.originalValue ? clean : d));
      onUpdatePreferences({ ...preferences, customDislikes: updated });
    }
    setEditingTag(null);
    setToastMessage(`Đã chỉnh sửa thành "${clean}"`);
  };

  // Toggle direct dish exclusion
  const handleToggleExcludeDish = (dishId: string) => {
    const exists = excludedDishIds.includes(dishId);
    const updated = exists
      ? excludedDishIds.filter((id) => id !== dishId)
      : [...excludedDishIds, dishId];
    onUpdatePreferences({ ...preferences, excludedDishIds: updated });
  };

  // Clear all preferences
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ cài đặt dị ứng và món ghét về mặc định?')) {
      onUpdatePreferences({
        allergies: [],
        dislikes: [],
        customAllergies: [],
        customDislikes: [],
        customItems: [],
        excludedDishIds: [],
      });
      setToastMessage('Đã đặt lại toàn bộ cài đặt dị ứng và món ghét.');
    }
  };

  // Filtered Custom Items List
  const filteredCustomItems = useMemo(() => {
    return customItems.filter((item) => {
      if (customItemsFilter === 'allergy' && item.type !== 'allergy') return false;
      if (customItemsFilter === 'dislike' && item.type !== 'dislike') return false;
      if (customItemsFilter === 'dish' && item.categoryType !== 'dish') return false;
      if (customItemsFilter === 'ingredient' && item.categoryType !== 'ingredient') return false;

      if (customItemsSearch.trim()) {
        const q = customItemsSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchIng = item.ingredients?.some((ing) => ing.toLowerCase().includes(q));
        const matchNote = item.note?.toLowerCase().includes(q);
        if (!matchName && !matchIng && !matchNote) return false;
      }
      return true;
    });
  }, [customItems, customItemsFilter, customItemsSearch]);

  // Filtered dishes for excluded dishes tab
  const filteredExcludedDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const isExcluded = excludedDishIds.includes(dish.id);
      if (excludedDishesFilter === 'excluded' && !isExcluded) return false;
      if (excludedDishesFilter === 'available' && isExcluded) return false;

      if (excludedDishesSearch.trim()) {
        const q = excludedDishesSearch.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchCat = dish.category.toLowerCase().includes(q);
        const matchIng = dish.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchIng) return false;
      }
      return true;
    });
  }, [dishes, excludedDishIds, excludedDishesFilter, excludedDishesSearch]);

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
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1B2A22] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Overview */}
      <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
              Tùy chỉnh các món ăn hoặc nguyên liệu bạn bị dị ứng hoặc không thích ăn. Hệ thống sẽ{' '}
              <strong className="text-[#1B2A22] font-semibold">tự động loại bỏ triệt để</strong> khỏi
              các gợi ý thực đơn thông minh, vòng quay ngẫu nhiên và danh sách nguyên liệu đi chợ.
            </p>
          </div>

          {/* Quick Actions & Status Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreateModal('allergy', 'dish')}
              className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tạo món ăn dị ứng / ghét mới
            </button>

            <div className="flex items-center gap-2">
              <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-center flex-1 sm:flex-initial">
                <span className="block text-[10px] font-medium text-[#991B1B]">Dị ứng</span>
                <span className="text-sm font-bold font-mono text-[#DC2626]">
                  {totalAllergiesCount}
                </span>
              </div>
              <div className="px-3 py-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-center flex-1 sm:flex-initial">
                <span className="block text-[10px] font-medium text-[#92400E]">Món ghét</span>
                <span className="text-sm font-bold font-mono text-[#D97706]">
                  {totalDislikesCount + totalExcludedDishesCount}
                </span>
              </div>
              <div className="px-3 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-center flex-1 sm:flex-initial">
                <span className="block text-[10px] font-medium text-[#065F46]">An toàn</span>
                <span className="text-sm font-bold font-mono text-[#059669]">
                  {safeDishesCount}/{dishes.length}
                </span>
              </div>
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
              className="text-[#15803D] hover:underline font-medium inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
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
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
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
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
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
          onClick={() => setActiveSubTab('custom_items')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'custom_items'
              ? 'bg-[#EFF6FF] text-[#2563EB] border-b-2 border-[#2563EB]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          3. Món tự tạo & Chỉnh sửa
          {totalCustomCreatedCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#2563EB] text-white text-[10px] rounded-full font-mono">
              {totalCustomCreatedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('excluded_dishes')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'excluded_dishes'
              ? 'bg-[#F3F4F6] text-[#374151] border-b-2 border-[#374151]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          4. Cấm từng món cụ thể
          {totalExcludedDishesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#4B5563] text-white text-[10px] rounded-full font-mono">
              {totalExcludedDishesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-[#ECFDF5] text-[#059669] border-b-2 border-[#059669]'
              : 'text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#F6F9F5]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          5. Kiểm tra An toàn ({safeDishesCount}/{dishes.length})
        </button>
      </div>

      {/* SUB-TAB 1: DỊ ỨNG */}
      {activeSubTab === 'allergies' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <button
              type="button"
              onClick={() => handleOpenCreateModal('allergy', 'dish')}
              className="px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo món dị ứng mới
            </button>
          </div>

          {/* Popular Vietnamese Allergies Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Các chất gây dị ứng phổ biến ở Việt Nam:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_ALLERGIES.map((item) => {
                const isSelected = allergies.includes(item.id);
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
                Nhập nhanh nguyên liệu / chất dị ứng riêng:
              </h3>
              <span className="text-[11px] text-[#5C7467]">
                Nhập nhiều mục phân cách bằng dấu phẩy
              </span>
            </div>
            <form onSubmit={handleAddCustomAllergy} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={customAllergyInput}
                onChange={(e) => setCustomAllergyInput(e.target.value)}
                placeholder="Ví dụ: Tôm sú, Cua đồng, Bột ngọt, Mắm ruốc..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Thêm nhanh
              </button>
            </form>

            {/* Custom Allergy Badges with Edit & Delete */}
            {customAllergies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customAllergies.map((tag) => {
                  const isBeingEdited =
                    editingTag?.type === 'allergy' && editingTag.originalValue === tag;

                  if (isBeingEdited) {
                    return (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-[#DC2626] rounded-lg shadow-sm"
                      >
                        <input
                          type="text"
                          value={editingTag.currentValue}
                          onChange={(e) =>
                            setEditingTag({ ...editingTag, currentValue: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTagEdit();
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          className="text-xs font-semibold text-[#991B1B] outline-none min-w-[80px]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveTagEdit}
                          className="text-[11px] bg-[#DC2626] text-white px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#B91C1C]"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTag(null)}
                          className="text-[11px] text-[#5C7467] hover:text-[#1B2A22] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    );
                  }

                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold rounded-lg group"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTag({
                            type: 'allergy',
                            originalValue: tag,
                            currentValue: tag,
                          })
                        }
                        className="p-0.5 hover:bg-[#FEE2E2] rounded text-[#DC2626] cursor-pointer ml-1"
                        title="Chỉnh sửa tên mục này"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomAllergy(tag)}
                        className="p-0.5 hover:bg-[#FEE2E2] rounded text-[#B91C1C] cursor-pointer"
                        title="Xoá mục này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Custom Allergic Dishes Created by User */}
          {customItems.filter((i) => i.type === 'allergy').length > 0 && (
            <div className="pt-4 border-t border-[#E6EFE2] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" /> Món ăn & thực phẩm dị ứng do bạn tạo (
                  {customItems.filter((i) => i.type === 'allergy').length} món):
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('custom_items')}
                  className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                >
                  Quản lý tất cả &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customItems
                  .filter((i) => i.type === 'allergy')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 bg-[#FEE2E2] rounded text-[#DC2626]">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-bold text-[#991B1B]">{item.name}</h4>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#DC2626] border border-[#FECACA] shrink-0">
                            {item.categoryType === 'dish' ? 'Món ăn' : 'Nguyên liệu'}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-[#7F1D1D] mt-1.5 line-clamp-2 italic">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-[#991B1B] border border-[#FECACA]"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FECACA]/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#1B2A22] border border-[#DCE5D8] text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-[#2563EB]" />
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomItem(item.id, item.name)}
                          className="p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded-lg cursor-pointer"
                          title="Xóa món này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MÓN & NGUYÊN LIỆU GHÉT */}
      {activeSubTab === 'dislikes' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <button
              type="button"
              onClick={() => handleOpenCreateModal('dislike', 'dish')}
              className="px-3 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo món ghét mới
            </button>
          </div>

          {/* Popular Vietnamese Dislikes Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
              Các món / nguyên liệu hay bị kén ăn nhất:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_DISLIKES.map((item) => {
                const isSelected = dislikes.includes(item.id);
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#385747] uppercase tracking-wider">
                Nhập nhanh món / nguyên liệu bạn ghét khác:
              </h3>
              <span className="text-[11px] text-[#5C7467]">
                Nhập nhiều mục phân cách bằng dấu phẩy
              </span>
            </div>
            <form onSubmit={handleAddCustomDislike} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={customDislikeInput}
                onChange={(e) => setCustomDislikeInput(e.target.value)}
                placeholder="Ví dụ: Sầu riêng, Rau răm, Tỏi sống, Lòng lợn..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Thêm nhanh
              </button>
            </form>

            {/* Custom Dislike Badges with Edit & Delete */}
            {customDislikes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customDislikes.map((tag) => {
                  const isBeingEdited =
                    editingTag?.type === 'dislike' && editingTag.originalValue === tag;

                  if (isBeingEdited) {
                    return (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-[#D97706] rounded-lg shadow-sm"
                      >
                        <input
                          type="text"
                          value={editingTag.currentValue}
                          onChange={(e) =>
                            setEditingTag({ ...editingTag, currentValue: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTagEdit();
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          className="text-xs font-semibold text-[#92400E] outline-none min-w-[80px]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveTagEdit}
                          className="text-[11px] bg-[#D97706] text-white px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#B45309]"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTag(null)}
                          className="text-[11px] text-[#5C7467] hover:text-[#1B2A22] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    );
                  }

                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold rounded-lg group"
                    >
                      <Ban className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTag({
                            type: 'dislike',
                            originalValue: tag,
                            currentValue: tag,
                          })
                        }
                        className="p-0.5 hover:bg-[#FEF3C7] rounded text-[#D97706] cursor-pointer ml-1"
                        title="Chỉnh sửa tên mục này"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDislike(tag)}
                        className="p-0.5 hover:bg-[#FEF3C7] rounded text-[#B45309] cursor-pointer"
                        title="Xoá mục này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Custom Disliked Dishes Created by User */}
          {customItems.filter((i) => i.type === 'dislike').length > 0 && (
            <div className="pt-4 border-t border-[#E6EFE2] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" /> Món ghét do bạn tạo (
                  {customItems.filter((i) => i.type === 'dislike').length} món):
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('custom_items')}
                  className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                >
                  Quản lý tất cả &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customItems
                  .filter((i) => i.type === 'dislike')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 bg-[#FEF3C7] rounded text-[#D97706]">
                              <Ban className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-bold text-[#92400E]">{item.name}</h4>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#D97706] border border-[#FDE68A] shrink-0">
                            {item.categoryType === 'dish' ? 'Món ăn' : 'Nguyên liệu'}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-[#78350F] mt-1.5 line-clamp-2 italic">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-[#92400E] border border-[#FDE68A]"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FDE68A]/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#1B2A22] border border-[#DCE5D8] text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-[#2563EB]" />
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomItem(item.id, item.name)}
                          className="p-1 hover:bg-[#FEF3C7] text-[#D97706] rounded-lg cursor-pointer"
                          title="Xóa món này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: MÓN TỰ TẠO & CHỈNH SỬA (DEDICATED MANAGEMENT VIEW) */}
      {activeSubTab === 'custom_items' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#EFF6FF] text-[#2563EB] rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-[#1B2A22]">
                  Danh sách Món ăn & Thực phẩm Dị ứng / Ghét đã tạo ({customItems.length})
                </h2>
              </div>
              <p className="text-xs text-[#5C7467]">
                Tự tạo các món hoặc thành phần đặc thù theo cơ địa gia đình bạn. Bạn có thể{' '}
                <strong className="text-[#2563EB] font-semibold">chỉnh sửa lại bất kỳ lúc nào</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('allergy', 'dish')}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tạo món ăn mới ngay
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-[#E6EFE2]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7A9283] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customItemsSearch}
                onChange={(e) => setCustomItemsSearch(e.target.value)}
                placeholder="Tìm món tự tạo theo tên, thành phần, ghi chú..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
              {customItemsSearch && (
                <button
                  type="button"
                  onClick={() => setCustomItemsSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'allergy', label: '🔴 Dị ứng' },
                { id: 'dislike', label: '🟠 Món ghét' },
                { id: 'dish', label: '🍲 Món ăn' },
                { id: 'ingredient', label: '🧄 Nguyên liệu' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCustomItemsFilter(filter.id as typeof customItemsFilter)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    customItemsFilter === filter.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F6F9F5] text-[#5C7467] hover:text-[#1B2A22] border border-[#DCE5D8]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Items Grid */}
          {filteredCustomItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomItems.map((item) => {
                const isAllergy = item.type === 'allergy';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isAllergy
                        ? 'bg-[#FEF2F2]/60 border-[#FECACA] hover:border-[#DC2626]/50'
                        : 'bg-[#FFFBEB]/60 border-[#FDE68A] hover:border-[#D97706]/50'
                    }`}
                  >
                    <div>
                      {/* Header with Type & Category Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg flex items-center justify-center ${
                              isAllergy
                                ? 'bg-[#FEE2E2] text-[#DC2626]'
                                : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}
                          >
                            {isAllergy ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </span>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-[#1B2A22]">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  isAllergy
                                    ? 'bg-[#DC2626] text-white'
                                    : 'bg-[#D97706] text-white'
                                }`}
                              >
                                {isAllergy ? 'Dị ứng thực phẩm' : 'Món ghét / Kén ăn'}
                              </span>
                              <span className="text-[10px] bg-white border border-gray-200 text-[#5C7467] px-1.5 py-0.5 rounded-md font-medium">
                                {item.categoryType === 'dish' ? '🍲 Món ăn' : '🧄 Nguyên liệu'}
                              </span>
                              {item.severity === 'high' && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-medium">
                                  Rất nặng
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Note */}
                      {item.note && (
                        <div className="mt-2.5 p-2 bg-white/80 rounded-xl border border-gray-200/60 text-xs text-[#374151]">
                          <span className="font-semibold text-gray-500 text-[10px] block uppercase">
                            Ghi chú:
                          </span>
                          <p className="mt-0.5 italic">{item.note}</p>
                        </div>
                      )}

                      {/* Ingredients keywords */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[10px] font-semibold text-[#5C7467] block mb-1">
                            Từ khóa nhận diện tự động:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-gray-200 font-mono text-[#374151]"
                              >
                                #{ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Chỉnh sửa & Xóa */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                          : 'Đã lưu'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:border-[#2563EB] text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomItem(item.id, item.name)}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:border-[#DC2626] text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title="Xóa mục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F9FBFA] border border-dashed border-[#DCE5D8] rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#1B2A22]">
                {customItemsSearch
                  ? 'Không tìm thấy món ăn nào khớp với tìm kiếm'
                  : 'Chưa có món ăn dị ứng hoặc ghét nào được tạo'}
              </h3>
              <p className="text-xs text-[#5C7467] max-w-md mx-auto">
                Bạn có thể tạo món ăn hoặc nguyên liệu riêng để hệ thống bảo vệ sức khỏe và khẩu vị
                khi gợi ý thực đơn, đi chợ và quay món ngẫu nhiên.
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('allergy', 'dish')}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Tạo món ăn dị ứng / ghét đầu tiên
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: MÓN ĂN CỤ THỂ BỊ CẤM */}
      {activeSubTab === 'excluded_dishes' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1B2A22]">
                Cấm từng món ăn cụ thể khỏi thực đơn ({totalExcludedDishesCount} món đang cấm)
              </h2>
              <p className="text-xs text-[#5C7467]">
                Nếu có một món cụ thể nào bạn không bao giờ muốn ăn, hãy ấn cấm món đó tại đây.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreateModal('dislike', 'dish')}
              className="px-3.5 py-2 bg-[#1B2A22] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo thêm món cấm mới
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#E6EFE2]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#7A9283] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={excludedDishesSearch}
                onChange={(e) => setExcludedDishesSearch(e.target.value)}
                placeholder="Tìm món ăn cần cấm..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#1B2A22]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `Tất cả (${dishes.length})` },
                { id: 'excluded', label: `Đang cấm (${totalExcludedDishesCount})` },
                { id: 'available', label: 'Chưa cấm' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setExcludedDishesFilter(f.id as typeof excludedDishesFilter)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    excludedDishesFilter === f.id
                      ? 'bg-[#1B2A22] text-white'
                      : 'bg-[#F6F9F5] text-[#5C7467] border border-[#DCE5D8]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExcludedDishes.map((dish) => {
              const isExcluded = excludedDishIds.includes(dish.id);
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
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

      {/* SUB-TAB 5: KIỂM TRA THỰC ĐƠN AN TOÀN (AUDIT MATRIX) */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-[#DCE5D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1B2A22]">
                Kiểm tra an toàn toàn bộ cơ sở dữ liệu ({safeDishesCount}/{dishes.length} món an toàn)
              </h2>
              <p className="text-xs text-[#5C7467]">
                Xem trạng thái kiểm tra tự động của từng món dựa theo cấu hình dị ứng & món ghét của bạn.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDishFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  dishFilterStatus === 'all'
                    ? 'bg-[#1B2A22] text-white'
                    : 'bg-[#F6F9F5] text-[#5C7467]'
                }`}
              >
                Tất cả ({dishes.length})
              </button>
              <button
                type="button"
                onClick={() => setDishFilterStatus('safe')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  dishFilterStatus === 'safe'
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#F6F9F5] text-[#059669]'
                }`}
              >
                An toàn ({safeDishesCount})
              </button>
              <button
                type="button"
                onClick={() => setDishFilterStatus('flagged')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  dishFilterStatus === 'flagged'
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#F6F9F5] text-[#DC2626]'
                }`}
              >
                Bị loại bỏ ({restrictedDishesCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[#7A9283] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dishSearchQuery}
              onChange={(e) => setDishSearchQuery(e.target.value)}
              placeholder="Tìm món ăn hoặc nguyên liệu..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F]"
            />
          </div>

          {/* Audit List */}
          <div className="divide-y divide-[#E6EFE2] border border-[#DCE5D8] rounded-xl overflow-hidden">
            {filteredDishAudit.map(({ dish, restricted }) => (
              <div
                key={dish.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  restricted.isRestricted ? 'bg-[#FEF2F2]/40' : 'bg-white hover:bg-[#F9FBFA]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <DishImage
                    src={dish.image}
                    alt={dish.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1B2A22] truncate">{dish.name}</h4>
                      <span className="text-[11px] text-[#5C7467]">({dish.category})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                      {dish.ingredients.map((ing) => (
                        <span key={ing.name} className="text-[#5C7467] bg-[#F1F5F0] px-1.5 py-0.2 rounded">
                          {ing.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {restricted.isRestricted ? (
                    <div className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {restricted.hasAllergy && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#DC2626] text-white px-2 py-0.5 rounded-md font-semibold">
                            <ShieldAlert className="w-3 h-3" /> Dị ứng
                          </span>
                        )}
                        {restricted.hasDislike && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#D97706] text-white px-2 py-0.5 rounded-md font-semibold">
                            <Ban className="w-3 h-3" /> Món ghét
                          </span>
                        )}
                        {restricted.isExcluded && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#4B5563] text-white px-2 py-0.5 rounded-md font-semibold">
                            Đã cấm
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#991B1B] font-medium block mt-0.5">
                        {restricted.reasons.join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-lg font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> An toàn 100%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white border border-[#DCE5D8] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#5C7467]">
          <Info className="w-4 h-4 text-[#2D6A4F] shrink-0" />
          <span>
            Đã lưu: <strong>{totalAllergiesCount}</strong> dị ứng, <strong>{totalDislikesCount}</strong> món ghét,{' '}
            <strong>{totalCustomCreatedCount}</strong> món tự tạo. Tự động áp dụng toàn ứng dụng.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer"
          >
            Đặt lại mặc định
          </button>
          <button
            type="button"
            onClick={() => onAutoGeneratePlan({ avoidDuplicates: true })}
            className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tạo thực đơn mới an toàn
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: TẠO HOẶC CHỈNH SỬA MÓN ĂN DỊ ỨNG & GHÉT (CREATE / EDIT) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-2xl border border-[#DCE5D8] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 flex items-center justify-between border-b ${
                formType === 'allergy'
                  ? 'bg-[#FEF2F2] border-[#FECACA]'
                  : 'bg-[#FFFBEB] border-[#FDE68A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`p-2 rounded-xl text-white ${
                    formType === 'allergy' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                  }`}
                >
                  {formType === 'allergy' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <Ban className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1B2A22]">
                    {modalMode === 'create'
                      ? 'Tạo món ăn dị ứng / ghét mới'
                      : 'Chỉnh sửa món ăn dị ứng / ghét'}
                  </h3>
                  <p className="text-xs text-[#5C7467]">
                    {modalMode === 'create'
                      ? 'Thiết lập món ăn hoặc thành phần đặc thù cần né tránh'
                      : 'Cập nhật lại tên, mức độ, từ khóa nhận diện hoặc ghi chú'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-black/5 rounded-xl text-[#5C7467] hover:text-[#1B2A22] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModalForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Tên món ăn hoặc nguyên liệu */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] block">
                  Tên món ăn hoặc nguyên liệu <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Ví dụ: Bún mắm, Canh khổ qua, Gỏi sứa, Mắm tôm..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                  autoFocus
                />
              </div>

              {/* 2. Loại phân loại: Dị ứng vs Ghét */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] block">
                  Phân loại (Mức độ ảnh hưởng) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('allergy');
                      setFormSeverity('high');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formType === 'allergy'
                        ? 'bg-[#FEF2F2] border-[#DC2626] ring-2 ring-[#DC2626]/20'
                        : 'bg-[#F9FBFA] border-[#DCE5D8] hover:bg-white'
                    }`}
                  >
                    <ShieldAlert
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        formType === 'allergy' ? 'text-[#DC2626]' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold block text-[#1B2A22]">
                        🔴 Dị ứng thực phẩm
                      </span>
                      <span className="text-[11px] text-[#5C7467] mt-0.5 block">
                        Nguy hiểm sức khỏe, cấm tuyệt đối
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('dislike');
                      setFormSeverity('medium');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formType === 'dislike'
                        ? 'bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/20'
                        : 'bg-[#F9FBFA] border-[#DCE5D8] hover:bg-white'
                    }`}
                  >
                    <Ban
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        formType === 'dislike' ? 'text-[#D97706]' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold block text-[#1B2A22]">
                        🟠 Món ghét / Kén ăn
                      </span>
                      <span className="text-[11px] text-[#5C7467] mt-0.5 block">
                        Không hợp khẩu vị, tránh gợi ý
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Đối tượng: Món ăn hay Nguyên liệu */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] block">
                  Đối tượng là gì?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormCategoryType('dish')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-colors ${
                      formCategoryType === 'dish'
                        ? 'bg-[#1B2A22] text-white border-[#1B2A22]'
                        : 'bg-[#F6F9F5] text-[#5C7467] border-[#DCE5D8] hover:bg-white'
                    }`}
                  >
                    🍲 Món ăn cụ thể (Bún, Canh, Kho...)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategoryType('ingredient')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-colors ${
                      formCategoryType === 'ingredient'
                        ? 'bg-[#1B2A22] text-white border-[#1B2A22]'
                        : 'bg-[#F6F9F5] text-[#5C7467] border-[#DCE5D8] hover:bg-white'
                    }`}
                  >
                    🧄 Nguyên liệu / Gia vị (Hành, Mắm...)
                  </button>
                </div>
              </div>

              {/* 4. Mức độ nghiêm trọng */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] block">
                  Mức độ nghiêm trọng
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'high', label: 'Rất nặng (Cấm 100%)', color: 'border-red-300' },
                    { id: 'medium', label: 'Trung bình', color: 'border-amber-300' },
                    { id: 'low', label: 'Nhẹ (Khẩu vị)', color: 'border-blue-300' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setFormSeverity(lvl.id as typeof formSeverity)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border text-center cursor-pointer transition-all ${
                        formSeverity === lvl.id
                          ? 'bg-[#1B2A22] text-white border-[#1B2A22]'
                          : 'bg-[#F9FBFA] text-[#5C7467] border-[#DCE5D8] hover:bg-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Từ khóa nhận diện tự động (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] flex items-center justify-between">
                  <span>Từ khóa hoặc thành phần nhận diện tự động</span>
                  <span className="text-[10px] text-gray-400 font-normal">Tùy chọn</span>
                </label>
                <input
                  type="text"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  placeholder="Ví dụ: mắm tôm, mắm nêm, đậu hũ (phân cách dấu phẩy)"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[10px] text-[#5C7467]">
                  Bất kỳ món ăn nào chứa các từ khóa này trong tên hoặc thành phần sẽ bị hệ thống tự
                  động cảnh báo.
                </p>
              </div>

              {/* 6. Ghi chú cá nhân */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B2A22] flex items-center justify-between">
                  <span>Ghi chú riêng / Triệu chứng</span>
                  <span className="text-[10px] text-gray-400 font-normal">Tùy chọn</span>
                </label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Ăn vào bị ngứa họng, nổi mẩn đỏ; Mùi tanh không chịu được..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E6EFE2] gap-2">
                {modalMode === 'edit' && editingItemId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomItem(editingItemId, formName)}
                    className="px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa món này
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#5C7467] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white cursor-pointer shadow-sm transition-all flex items-center gap-1.5 ${
                      formType === 'allergy'
                        ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                        : 'bg-[#D97706] hover:bg-[#B45309]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    {modalMode === 'create' ? 'Tạo món ăn dị ứng / ghét' : 'Lưu chỉnh sửa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
