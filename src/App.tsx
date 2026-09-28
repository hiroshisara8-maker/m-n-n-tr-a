/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Compass,
  Refrigerator,
  ShoppingCart,
  CalendarDays,
  Users,
  Shuffle,
  Wallet,
  Menu,
  X,
  Plus,
  Palette,
} from 'lucide-react';
import {
  CustomShoppingItem,
  Dish,
  ExpenseRecord,
  MealSlotType,
  NavTab,
  PantryItem,
  PlannedMeal,
  CommunityPost,
  DishTaste,
  DishDifficulty,
  UserThemeConfig,
} from './types';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_DISHES,
  INITIAL_EXPENSES,
  INITIAL_PANTRY,
  INITIAL_PLANNED_MEALS,
} from './data/initialData';
import {
  evaluateDishWithPantry,
  formatVND,
  normalizeName,
  REFERENCE_TODAY,
} from './utils/mealMath';
import { HomeView } from './components/HomeView';
import { ExploreView } from './components/ExploreView';
import { PantryView } from './components/PantryView';
import { ShoppingView } from './components/ShoppingView';
import { MealPlanView } from './components/MealPlanView';
import { CommunityView } from './components/CommunityView';
import { RandomView } from './components/RandomView';
import { ExpensesView } from './components/ExpensesView';
import { DishDetailModal } from './components/DishDetailModal';
import { BrandLogo } from './components/BrandLogo';
import {
  ThemeCustomizerModal,
  DEFAULT_THEME_CONFIG,
  THEME_PRESETS,
} from './components/ThemeCustomizerModal';

const STORAGE_KEY = 'mon_khon_app_state_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Budget & Planning Parameters
  const [budget, setBudget] = useState<number>(300000);
  const [daysCount, setDaysCount] = useState<number>(3);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [diningMode, setDiningMode] = useState<'cook' | 'eat_out'>('cook');

  // Data States
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [pantry, setPantry] = useState<PantryItem[]>(INITIAL_PANTRY);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(INITIAL_PLANNED_MEALS);
  const [customShoppingItems, setCustomShoppingItems] = useState<CustomShoppingItem[]>([
    {
      id: 'cs-1',
      name: 'Nước mắm Nam Ngư',
      amount: 1,
      unit: 'chai',
      estimatedPrice: 18000,
      category: 'Gia vị & Đồ khô',
      checked: false,
    },
  ]);
  const [communityPosts, setCommunityPosts] =
    useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(['user-lan']);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);

  // Modal State
  const [selectedDishForModal, setSelectedDishForModal] = useState<Dish | null>(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<UserThemeConfig>(DEFAULT_THEME_CONFIG);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.budget === 'number') setBudget(parsed.budget);
        if (typeof parsed.daysCount === 'number') setDaysCount(parsed.daysCount);
        if (typeof parsed.peopleCount === 'number') setPeopleCount(parsed.peopleCount);
        if (parsed.diningMode) setDiningMode(parsed.diningMode);
        if (Array.isArray(parsed.pantry)) setPantry(parsed.pantry);
        if (Array.isArray(parsed.plannedMeals)) setPlannedMeals(parsed.plannedMeals);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (parsed.themeConfig && parsed.themeConfig.primary) {
          setThemeConfig(parsed.themeConfig);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Apply themeConfig CSS variables to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--mk-primary', themeConfig.primary);
    root.style.setProperty('--mk-primary-dark', themeConfig.primaryDark);
    root.style.setProperty('--mk-bg', themeConfig.bg);
    root.style.setProperty('--mk-surface', themeConfig.surface);
    root.style.setProperty('--mk-soft', themeConfig.soft);
    root.style.setProperty('--mk-border', themeConfig.border);
    root.style.setProperty('--mk-text', themeConfig.text);
    root.style.setProperty('--mk-muted', themeConfig.muted);
    root.style.setProperty(
      '--font-display',
      themeConfig.fontStyle === 'editorial'
        ? "'Fraunces', Georgia, serif"
        : "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    );
    root.setAttribute('data-radius', themeConfig.radiusScale);
    root.setAttribute('data-font-scale', themeConfig.fontScale);
  }, [themeConfig]);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          budget,
          daysCount,
          peopleCount,
          diningMode,
          pantry,
          plannedMeals,
          expenses,
          themeConfig,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [budget, daysCount, peopleCount, diningMode, pantry, plannedMeals, expenses, themeConfig]);

  // Sync servings when peopleCount changes
  useEffect(() => {
    setPlannedMeals((prev) =>
      prev.map((m) => ({
        ...m,
        servings: peopleCount,
      }))
    );
  }, [peopleCount]);

  // Real-time financial calculations across all planned meals
  const { totalPlannedCost, totalSavedFromPantry, remainingBudget } = useMemo(() => {
    let cost = 0;
    let saved = 0;

    for (const meal of plannedMeals) {
      const dish = dishes.find((d) => d.id === meal.dishId);
      if (!dish) continue;
      const ev = evaluateDishWithPantry(dish, pantry, meal.servings, meal.mode);
      cost += ev.netOutOfPocketCost;
      saved += ev.savedFromPantryCost;
    }

    return {
      totalPlannedCost: cost,
      totalSavedFromPantry: saved,
      remainingBudget: budget - cost,
    };
  }, [plannedMeals, dishes, pantry, budget]);

  // Handlers
  const handleAddMealToSlot = (
    dishId: string,
    dayIndex: number,
    slot: MealSlotType,
    mode: 'cook' | 'eat_out'
  ) => {
    const newMeal: PlannedMeal = {
      id: 'pm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      dayIndex,
      slot,
      dishId,
      mode,
      servings: peopleCount,
      isCooked: false,
    };
    setPlannedMeals((prev) => [...prev, newMeal]);
  };

  // Quick add finds the next empty slot in Day 1..daysCount or appends to Day 1
  const handleQuickAddMeal = (dishId: string, mode: 'cook' | 'eat_out') => {
    const slots: MealSlotType[] = ['Sáng', 'Trưa', 'Tối'];
    for (let d = 1; d <= daysCount; d++) {
      for (const s of slots) {
        const exists = plannedMeals.some((m) => m.dayIndex === d && m.slot === s);
        if (!exists) {
          handleAddMealToSlot(dishId, d, s, mode);
          return;
        }
      }
    }
    handleAddMealToSlot(dishId, 1, 'Trưa', mode);
  };

  const handleRemovePlannedMeal = (mealId: string) => {
    setPlannedMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  // Mark meal as cooked: deduct ingredients from Pantry & log to Expenses
  const handleMarkMealCooked = (mealId: string) => {
    const meal = plannedMeals.find((m) => m.id === mealId);
    if (!meal || meal.isCooked) return;
    const dish = dishes.find((d) => d.id === meal.dishId);
    if (!dish) return;

    const ev = evaluateDishWithPantry(dish, pantry, meal.servings, meal.mode);

    if (meal.mode === 'cook') {
      setPantry((prevPantry) =>
        prevPantry
          .map((pItem) => {
            const matchedIng = dish.ingredients.find(
              (ing) =>
                normalizeName(ing.name) === normalizeName(pItem.name) ||
                normalizeName(pItem.name).includes(normalizeName(ing.name)) ||
                normalizeName(ing.name).includes(normalizeName(pItem.name))
            );
            if (!matchedIng) return pItem;
            const usedQty = matchedIng.amount * meal.servings;
            return {
              ...pItem,
              quantity: Math.max(0, pItem.quantity - usedQty),
            };
          })
          .filter((pItem) => pItem.quantity > 0)
      );
    }

    setPlannedMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, isCooked: true } : m))
    );

    const newExp: ExpenseRecord = {
      id: 'exp-' + Date.now(),
      date: REFERENCE_TODAY,
      title: `Ngày ${meal.dayIndex} (${meal.slot}): ${dish.name}`,
      category: meal.mode === 'cook' ? 'Đi chợ nấu ăn' : 'Ăn ngoài / Đặt món',
      plannedAmount: ev.baseTotalCost,
      actualAmount: ev.netOutOfPocketCost,
      savedFromPantry: ev.savedFromPantryCost,
      note:
        meal.mode === 'cook'
          ? 'Đã trừ nguyên liệu từ Kho đồ ăn'
          : 'Ăn ngoài theo kế hoạch',
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  // Auto-generate optimal meal plan fitting budget and rescuing pantry items
  const handleAutoGeneratePlan = () => {
    const slots: MealSlotType[] = ['Sáng', 'Trưa', 'Tối'];
    const sortedByEfficiency = [...dishes].sort((a, b) => {
      const evA = evaluateDishWithPantry(a, pantry, peopleCount, diningMode);
      const evB = evaluateDishWithPantry(b, pantry, peopleCount, diningMode);
      return evA.netOutOfPocketCost - evB.netOutOfPocketCost;
    });

    const generated: PlannedMeal[] = [];
    let runningCost = 0;
    let cursor = 0;

    for (let d = 1; d <= daysCount; d++) {
      for (const s of slots) {
        const candidate =
          s === 'Sáng'
            ? dishes.find((x) => x.category === 'Ăn sáng') ||
              sortedByEfficiency[cursor % sortedByEfficiency.length]
            : sortedByEfficiency[cursor % sortedByEfficiency.length];

        cursor++;
        if (!candidate) continue;
        const ev = evaluateDishWithPantry(candidate, pantry, peopleCount, diningMode);
        if (runningCost + ev.netOutOfPocketCost <= budget || generated.length < 3) {
          generated.push({
            id: `pm-auto-${d}-${s}-${Date.now()}-${cursor}`,
            dayIndex: d,
            slot: s,
            dishId: candidate.id,
            mode: diningMode,
            servings: peopleCount,
            isCooked: false,
          });
          runningCost += ev.netOutOfPocketCost;
        }
      }
    }

    setPlannedMeals(generated);
  };

  // Pantry handlers
  const handleAddPantryItem = (item: Omit<PantryItem, 'id'>) => {
    setPantry((prev) => {
      const existingIdx = prev.findIndex(
        (p) => normalizeName(p.name) === normalizeName(item.name)
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + item.quantity,
          expiryDate: item.expiryDate,
        };
        return updated;
      }
      return [
        { ...item, id: 'p-' + Date.now() + Math.random().toString(36).slice(2, 5) },
        ...prev,
      ];
    });
  };

  const handleUpdatePantryQuantity = (id: string, delta: number) => {
    setPantry((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const handleDeletePantryItem = (id: string) => {
    setPantry((prev) => prev.filter((p) => p.id !== id));
  };

  // Shopping -> Pantry restock handler
  const handlePurchaseToPantry = (
    itemsToRestock: Array<{
      name: string;
      amount: number;
      unit: string;
      category: PantryItem['category'];
      estimatedCost: number;
    }>
  ) => {
    let totalSpent = 0;
    itemsToRestock.forEach((item) => {
      totalSpent += item.estimatedCost;
      handleAddPantryItem({
        name: item.name,
        quantity: item.amount,
        unit: item.unit,
        category: item.category,
        purchaseDate: REFERENCE_TODAY,
        expiryDate: '2026-10-04',
        estimatedValue: item.amount > 0 ? Math.round(item.estimatedCost / item.amount) : 1000,
      });
    });

    // Clear checked custom items
    setCustomShoppingItems((prev) => prev.filter((c) => !c.checked));

    // Record expense
    if (totalSpent > 0) {
      const exp: ExpenseRecord = {
        id: 'exp-shop-' + Date.now(),
        date: REFERENCE_TODAY,
        title: `Đi chợ mua: ${itemsToRestock.map((i) => i.name).join(', ')}`,
        category: 'Đi chợ nấu ăn',
        plannedAmount: Math.round(totalSpent * 1.15),
        actualAmount: totalSpent,
        savedFromPantry: Math.round(totalSpent * 0.15),
        note: 'Đã cập nhật tự động vào Kho đồ ăn',
      };
      setExpenses((prev) => [exp, ...prev]);
    }
  };

  // Dish comment handler
  const handleAddDishComment = (
    dishId: string,
    author: string,
    role: string,
    rating: number,
    content: string
  ) => {
    const newComment = {
      id: 'dc-' + Date.now(),
      author,
      role,
      rating,
      content,
      createdAt: 'Vừa xong',
    };
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, comments: [newComment, ...d.comments] } : d))
    );
    if (selectedDishForModal && selectedDishForModal.id === dishId) {
      setSelectedDishForModal((prev) =>
        prev ? { ...prev, comments: [newComment, ...prev.comments] } : null
      );
    }
  };

  // Community handlers
  const handleToggleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const handleToggleSavePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const handleRatePost = (postId: string, rating: number) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, userRating: rating } : p))
    );
  };

  const handleAddPostComment = (postId: string, text: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: 'cc-' + Date.now(),
                  author: 'Bạn (@ban.monkhon)',
                  text,
                  createdAt: 'Vừa xong',
                },
              ],
            }
          : p
      )
    );
  };

  const handleToggleFollow = (authorId: string) => {
    setFollowedAuthors((prev) =>
      prev.includes(authorId) ? prev.filter((id) => id !== authorId) : [...prev, authorId]
    );
  };

  const handleCreatePost = (newPostData: {
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
  }) => {
    const created: CommunityPost = {
      id: 'post-' + Date.now(),
      authorId: 'user-me',
      authorName: 'Bạn · Đầu Bếp Khôn Ngoan',
      authorHandle: '@ban.monkhon',
      authorBio: 'Thành viên Món Khôn · Ăn ngon tiết kiệm mỗi ngày.',
      ...newPostData,
      likes: 1,
      isLiked: true,
      isSaved: true,
      userRating: 5,
      avgRating: 5.0,
      ratingCount: 1,
      comments: [],
      createdAt: 'Vừa xong',
    };
    setCommunityPosts((prev) => [created, ...prev]);
  };

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    meta?: string;
  }> = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'explore', label: 'Khám phá món ăn', icon: Compass, meta: `${dishes.length}` },
    { id: 'pantry', label: 'Kho đồ ăn', icon: Refrigerator, meta: `${pantry.length}` },
    { id: 'shopping', label: 'Đi chợ', icon: ShoppingCart },
    { id: 'mealplan', label: 'Kế hoạch ăn', icon: CalendarDays, meta: `${plannedMeals.length} bữa` },
    { id: 'community', label: 'Cộng đồng & Hồ sơ', icon: Users },
    { id: 'random', label: 'Random món', icon: Shuffle },
    { id: 'expenses', label: 'Chi phí ăn uống', icon: Wallet },
  ];

  const activeNavItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleSelectNav = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F6F9F5] text-[#1B2A22]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1B2A22]/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Vertical Left Sidebar (264px width) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#FFFFFF] border-r border-[#DCE5D8] flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand & Vertical Navigation */}
        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6EFE2]">
            <BrandLogo size="md" showText={true} onClick={() => handleSelectNav('home')} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-[#4A6355] hover:bg-[#EEF5EE] md:hidden"
              aria-label="Đóng thanh công cụ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="Menu chức năng chính">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2D6A4F] text-white font-semibold'
                      : 'text-[#385747] hover:bg-[#EEF5EE] hover:text-[#1B2A22]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#2D6A4F]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.meta && (
                    <span
                      className={`font-mono tabular-nums text-xs ${
                        isActive ? 'text-[#D8F3DC]' : 'text-[#5C7467]'
                      }`}
                    >
                      {item.meta}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Theme Customizer Section inside Vertical Sidebar */}
          <div className="pt-4 border-t border-[#E6EFE2] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#385747]">
                Chủ đề màu sắc
              </span>
              <button
                type="button"
                onClick={() => setThemeModalOpen(true)}
                className="text-xs font-medium text-[#2D6A4F] hover:underline cursor-pointer"
              >
                Tùy chỉnh sâu →
              </button>
            </div>
            <div className="flex items-center gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setThemeConfig({
                      ...themeConfig,
                      presetId: preset.id,
                      primary: preset.primary,
                      primaryDark: preset.primaryDark,
                      bg: preset.bg,
                      surface: preset.surface,
                      soft: preset.soft,
                      border: preset.border,
                      text: preset.text,
                      muted: preset.muted,
                    })
                  }
                  title={preset.name}
                  className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    themeConfig.presetId === preset.id
                      ? 'scale-115 ring-2 ring-[#2D6A4F] border-white'
                      : 'border-black/15 hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.primary }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Live Budget Summary inside Vertical Sidebar */}
        <div className="p-4 m-3 rounded-2xl bg-[#EEF5EE] border border-[#CFE0D2] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#385747]">
            <span>Số tiền còn lại</span>
            <span className="font-mono tabular-nums">
              {daysCount} ngày · {peopleCount} người
            </span>
          </div>
          <div
            className={`font-mono tabular-nums text-xl font-semibold ${
              remainingBudget >= 0 ? 'text-[#1B4332]' : 'text-[#DC2626]'
            }`}
          >
            {formatVND(remainingBudget)}
          </div>
          <div className="pt-2 border-t border-[#D6E6D9] space-y-1 text-xs">
            <div className="flex justify-between text-[#4A6355]">
              <span>Ngân sách:</span>
              <span className="font-mono tabular-nums font-medium text-[#1B2A22]">
                {formatVND(budget)}
              </span>
            </div>
            <div className="flex justify-between text-[#4A6355]">
              <span>Đã chọn ({plannedMeals.length} bữa):</span>
              <span className="font-mono tabular-nums font-medium text-[#B45309]">
                -{formatVND(totalPlannedCost)}
              </span>
            </div>
            <div className="flex justify-between text-[#2D6A4F]">
              <span>Đỡ tốn nhờ Kho:</span>
              <span className="font-mono tabular-nums font-semibold">
                +{formatVND(totalSavedFromPantry)}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Workspace Column: Contextual Top Header + Main Content + Footer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Workspace Header */}
        <header className="sticky top-0 z-30 h-15 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#DCE5D8] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-[#1B2A22] hover:bg-[#EEF5EE] md:hidden cursor-pointer"
              aria-label="Mở thanh công cụ dọc"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-[#5C7467] truncate">
              <div className="md:hidden">
                <BrandLogo size="sm" showText={false} onClick={() => setActiveTab('home')} />
              </div>
              <span className="font-medium text-[#D85A7F]">Món Khôn</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-[#1B2A22] truncate">
                {activeNavItem.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Tùy chỉnh chủ đề</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pantry')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Nhập Kho đồ ăn ({pantry.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="px-3.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              Ví còn: {formatVND(remainingBudget)}
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">
          {activeTab === 'home' && (
            <HomeView
              budget={budget}
              setBudget={setBudget}
              daysCount={daysCount}
              setDaysCount={setDaysCount}
              peopleCount={peopleCount}
              setPeopleCount={setPeopleCount}
              diningMode={diningMode}
              setDiningMode={setDiningMode}
              dishes={dishes}
              pantry={pantry}
              plannedMeals={plannedMeals}
              totalPlannedCost={totalPlannedCost}
              totalSavedFromPantry={totalSavedFromPantry}
              remainingBudget={remainingBudget}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onQuickAddMeal={handleQuickAddMeal}
              onRemovePlannedMeal={handleRemovePlannedMeal}
              onNavigateTab={setActiveTab}
              onAutoGeneratePlan={handleAutoGeneratePlan}
            />
          )}

          {activeTab === 'explore' && (
            <ExploreView
              dishes={dishes}
              pantry={pantry}
              peopleCount={peopleCount}
              diningMode={diningMode}
              plannedMeals={plannedMeals}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onQuickAddMeal={handleQuickAddMeal}
            />
          )}

          {activeTab === 'pantry' && (
            <PantryView
              pantry={pantry}
              onAddPantryItem={handleAddPantryItem}
              onUpdateQuantity={handleUpdatePantryQuantity}
              onDeletePantryItem={handleDeletePantryItem}
              dishes={dishes}
              peopleCount={peopleCount}
              plannedMeals={plannedMeals}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onQuickAddMeal={handleQuickAddMeal}
            />
          )}

          {activeTab === 'shopping' && (
            <ShoppingView
              plannedMeals={plannedMeals}
              dishes={dishes}
              pantry={pantry}
              customShoppingItems={customShoppingItems}
              onAddCustomShoppingItem={(item) =>
                setCustomShoppingItems((prev) => [
                  ...prev,
                  { ...item, id: 'cs-' + Date.now(), checked: false },
                ])
              }
              onToggleCustomShoppingItem={(id) =>
                setCustomShoppingItems((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
                )
              }
              onDeleteCustomShoppingItem={(id) =>
                setCustomShoppingItems((prev) => prev.filter((c) => c.id !== id))
              }
              onPurchaseToPantry={handlePurchaseToPantry}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'mealplan' && (
            <MealPlanView
              budget={budget}
              daysCount={daysCount}
              peopleCount={peopleCount}
              dishes={dishes}
              pantry={pantry}
              plannedMeals={plannedMeals}
              totalPlannedCost={totalPlannedCost}
              totalSavedFromPantry={totalSavedFromPantry}
              remainingBudget={remainingBudget}
              onAddMealToSlot={handleAddMealToSlot}
              onRemovePlannedMeal={handleRemovePlannedMeal}
              onMarkMealCooked={handleMarkMealCooked}
              onAutoGeneratePlan={handleAutoGeneratePlan}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'community' && (
            <CommunityView
              posts={communityPosts}
              followedAuthors={followedAuthors}
              onToggleLike={handleToggleLikePost}
              onToggleSave={handleToggleSavePost}
              onRatePost={handleRatePost}
              onAddPostComment={handleAddPostComment}
              onToggleFollow={handleToggleFollow}
              onCreatePost={handleCreatePost}
              totalSavedOverall={totalSavedFromPantry + 55000}
            />
          )}

          {activeTab === 'random' && (
            <RandomView
              dishes={dishes}
              communityPosts={communityPosts}
              pantry={pantry}
              peopleCount={peopleCount}
              remainingBudget={remainingBudget}
              onQuickAddMeal={handleQuickAddMeal}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              budget={budget}
              totalPlannedCost={totalPlannedCost}
              totalSavedFromPantry={totalSavedFromPantry}
              expenses={expenses}
              onAddExpense={(rec) =>
                setExpenses((prev) => [{ ...rec, id: 'exp-' + Date.now() }, ...prev])
              }
              onDeleteExpense={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
            />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-[#DCE5D8] bg-white py-4 px-4 sm:px-8 mt-8">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#5C7467]">
            <span>
              Món Khôn ? — Lên thực đơn theo ngân sách & tận dụng nguyên liệu tủ lạnh.
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="hover:text-[#1B2A22] cursor-pointer"
              >
                Trang chủ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pantry')}
                className="hover:text-[#1B2A22] cursor-pointer"
              >
                Kho đồ ăn
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shopping')}
                className="hover:text-[#1B2A22] cursor-pointer"
              >
                Đi chợ
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Dish Detail Modal */}
      <DishDetailModal
        dish={selectedDishForModal}
        pantry={pantry}
        servings={peopleCount}
        daysCount={daysCount}
        defaultMode={diningMode}
        onClose={() => setSelectedDishForModal(null)}
        onAddToMealPlan={handleAddMealToSlot}
        onAddComment={handleAddDishComment}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={themeModalOpen}
        theme={themeConfig}
        onChangeTheme={setThemeConfig}
        onClose={() => setThemeModalOpen(false)}
      />
    </div>
  );
}
