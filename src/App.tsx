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
  ShieldAlert,
  LogIn,
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
  DietaryPreferences,
} from './types';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_DISHES,
  INITIAL_EXPENSES,
  INITIAL_PANTRY,
  INITIAL_PLANNED_MEALS,
  INITIAL_DIETARY_PREFERENCES,
} from './data/initialData';
import {
  evaluateDishWithPantry,
  formatVND,
  normalizeName,
  REFERENCE_TODAY,
  computeShoppingListFromMealPlan,
  getDaysUntilExpiry,
  generateSmartMealPlan,
} from './utils/mealMath';
import { HomeView } from './components/HomeView';
import { ExploreView } from './components/ExploreView';
import { PantryView } from './components/PantryView';
import { ShoppingView } from './components/ShoppingView';
import { MealPlanView } from './components/MealPlanView';
import { CommunityView, UserProfileInfo } from './components/CommunityView';
import { RandomView } from './components/RandomView';
import { ExpensesView } from './components/ExpensesView';
import { DietaryPreferencesView } from './components/DietaryPreferencesView';
import { DishDetailModal } from './components/DishDetailModal';
import { BrandLogo } from './components/BrandLogo';
import {
  ThemeCustomizerModal,
  DEFAULT_THEME_CONFIG,
  THEME_PRESETS,
} from './components/ThemeCustomizerModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal, AuthAccount } from './components/AuthModal';

const STORAGE_KEY = 'mon_khon_app_state_v1';
const AUTH_STORAGE_KEY = 'mon_khon_auth_account_v1';

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
  const [userProfile, setUserProfile] = useState<UserProfileInfo>({
    displayName: 'Bạn · Đầu Bếp Khôn Ngoan',
    handle: '@ban.monkhon',
    bio: 'Yêu bếp trọ · Chia sẻ thực đơn tự nấu ngon bổ rẻ dưới 30k/bữa.',
    avatarUrl: '',
    coverUrl: '',
    followersCount: 128,
  });
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [dietaryPreferences, setDietaryPreferences] =
    useState<DietaryPreferences>(INITIAL_DIETARY_PREFERENCES);

  // Modal State
  const [selectedDishForModal, setSelectedDishForModal] = useState<Dish | null>(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<UserThemeConfig>(DEFAULT_THEME_CONFIG);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(null);

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
        if (parsed.dietaryPreferences) {
          setDietaryPreferences({
            allergies: Array.isArray(parsed.dietaryPreferences.allergies) ? parsed.dietaryPreferences.allergies : [],
            dislikes: Array.isArray(parsed.dietaryPreferences.dislikes) ? parsed.dietaryPreferences.dislikes : [],
            customAllergies: Array.isArray(parsed.dietaryPreferences.customAllergies) ? parsed.dietaryPreferences.customAllergies : [],
            customDislikes: Array.isArray(parsed.dietaryPreferences.customDislikes) ? parsed.dietaryPreferences.customDislikes : [],
            customItems: Array.isArray(parsed.dietaryPreferences.customItems) ? parsed.dietaryPreferences.customItems : [],
            excludedDishIds: Array.isArray(parsed.dietaryPreferences.excludedDishIds) ? parsed.dietaryPreferences.excludedDishIds : [],
          });
        }
        if (Array.isArray(parsed.communityPosts) && parsed.communityPosts.length > 0) {
          setCommunityPosts(parsed.communityPosts);
        }
        if (parsed.userProfile && parsed.userProfile.displayName) {
          setUserProfile(parsed.userProfile);
        }
        if (parsed.themeConfig && parsed.themeConfig.primary) {
          setThemeConfig(parsed.themeConfig);
        }
      }

      // Load auth account
      const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (rawAuth) {
        const parsedAuth = JSON.parse(rawAuth);
        if (parsedAuth && parsedAuth.id) {
          setAuthAccount(parsedAuth);
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
          communityPosts,
          userProfile,
          themeConfig,
          dietaryPreferences,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [
    budget,
    daysCount,
    peopleCount,
    diningMode,
    pantry,
    plannedMeals,
    expenses,
    communityPosts,
    userProfile,
    themeConfig,
    dietaryPreferences,
  ]);

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

  // Mobile badges: count of expiring ingredients and missing shopping items
  const expiringCount = useMemo(
    () => pantry.filter((i) => getDaysUntilExpiry(i.expiryDate) <= 2).length,
    [pantry]
  );
  const shoppingMissingCount = useMemo(
    () => computeShoppingListFromMealPlan(plannedMeals, dishes, pantry).length,
    [plannedMeals, dishes, pantry]
  );

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

  // Auto-generate optimal meal plan fitting budget, eliminating allergens/dislikes, and rescuing pantry items
  const handleAutoGeneratePlan = (options?: {
    avoidDuplicates?: boolean;
    strategy?: 'balanced' | 'budget_saver' | 'pantry_first';
    slots?: MealSlotType[];
    seed?: number;
    filterDietary?: boolean;
  }) => {
    const generated = generateSmartMealPlan(dishes, pantry, {
      daysCount,
      peopleCount,
      budget,
      diningMode,
      avoidDuplicates: options?.avoidDuplicates ?? true,
      strategy: options?.strategy ?? 'balanced',
      slots: options?.slots ?? ['Sáng', 'Trưa', 'Tối'],
      seed: options?.seed ?? Math.random(),
      dietaryPreferences,
      filterDietary: options?.filterDietary ?? true,
    });

    setPlannedMeals(generated);
  };

  const handleToggleExcludeDish = (dishId: string) => {
    setDietaryPreferences((prev) => {
      const cur = prev.excludedDishIds || [];
      const exists = cur.includes(dishId);
      return {
        ...prev,
        excludedDishIds: exists ? cur.filter((id) => id !== dishId) : [...cur, dishId],
      };
    });
  };

  const handleUpdatePlannedMeal = (
    mealId: string,
    updates: {
      dishId: string;
      servings: number;
      mode: 'cook' | 'eat_out';
      slot?: MealSlotType;
      dayIndex?: number;
    }
  ) => {
    setPlannedMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, ...updates } : m))
    );
  };

  const handleClearPlannedMeals = () => {
    setPlannedMeals([]);
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

  const handleAddPostComment = (postId: string, text: string, customAuthor?: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
                  author: customAuthor || `${userProfile.displayName} (${userProfile.handle})`,
                  text,
                  createdAt: 'Vừa xong',
                },
              ],
            }
          : p
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleSimulateIncomingEngagement = (postId: string) => {
    const sampleFriends = [
      {
        author: 'Lan Chi · Bếp Sinh Viên',
        text: 'Nhìn đĩa đồ ăn bạn chụp hấp dẫn quá! Cho mình lưu lại công thức cuối tuần nấu thử nhé ❤️',
      },
      {
        author: 'Đức Minh · Meal Prep',
        text: 'Chi phí hợp lý mà đầy đặn thật sự, thả nhẹ 1 tim cho chủ thớt!',
      },
      {
        author: 'Thanh Huyền · Sống Một Mình',
        text: 'Món này ăn với cơm nóng là hết nước chấm luôn bạn ơi!',
      },
      {
        author: 'Quốc Bảo · Bách Khoa',
        text: 'Đỉnh quá, sinh viên tụi mình rất cần những mâm cơm tiết kiệm như thế này.',
      },
    ];
    const picked = sampleFriends[Math.floor(Math.random() * sampleFriends.length)];

    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes + Math.floor(Math.random() * 4) + 2,
              comments: [
                ...p.comments,
                {
                  id: 'cc-sim-' + Date.now(),
                  author: picked.author,
                  text: picked.text,
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
    const newId = 'post-' + Date.now();
    const created: CommunityPost = {
      id: newId,
      authorId: 'user-me',
      authorName: userProfile.displayName,
      authorHandle: userProfile.handle,
      authorBio: userProfile.bio,
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

    // Simulate a friendly community reaction shortly after posting
    setTimeout(() => {
      handleSimulateIncomingEngagement(newId);
    }, 1800);
  };

  const handleLoginSuccess = (account: AuthAccount) => {
    setAuthAccount(account);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
    } catch {
      // ignore
    }
    setUserProfile((prev) => ({
      ...prev,
      displayName: account.displayName,
      handle: account.handle,
      avatarUrl: account.avatarUrl,
      bio: account.bio || prev.bio,
    }));
  };

  const handleLogout = () => {
    setAuthAccount(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUserProfile({
      displayName: 'Bạn · Đầu Bếp Khôn Ngoan',
      handle: '@ban.monkhon',
      bio: 'Yêu bếp trọ · Chia sẻ thực đơn tự nấu ngon bổ rẻ dưới 30k/bữa.',
      avatarUrl: '',
      coverUrl: '',
      followersCount: 128,
    });
  };

  const totalDietaryRules =
    (dietaryPreferences?.allergies?.length || 0) +
    (dietaryPreferences?.customAllergies?.length || 0) +
    (dietaryPreferences?.dislikes?.length || 0) +
    (dietaryPreferences?.customDislikes?.length || 0) +
    (dietaryPreferences?.customItems?.length || 0) +
    (dietaryPreferences?.excludedDishIds?.length || 0);

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    meta?: string;
  }> = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'explore', label: 'Khám phá món ăn', icon: Compass, meta: `${dishes.length}` },
    { id: 'pantry', label: 'Kho đồ ăn', icon: Refrigerator, meta: `${pantry.length}` },
    { id: 'shopping', label: 'Đi chợ', icon: ShoppingCart },
    { id: 'mealplan', label: 'Kế hoạch ăn', icon: CalendarDays, meta: `${plannedMeals.length} bữa` },
    {
      id: 'dietary',
      label: 'Dị ứng & Món ghét',
      icon: ShieldAlert,
      meta: totalDietaryRules > 0 ? `${totalDietaryRules}` : undefined,
    },
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
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: themeConfig.bg, color: themeConfig.text }}
    >
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Vertical Left Sidebar (264px width) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-white border-r border-[#DCE5D8] flex flex-col justify-between transition-transform duration-200 ${
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

          {/* User Account / Login Portal Widget */}
          {authAccount ? (
            <div className="p-3 bg-[#F6F9F5] border border-[#DCE5D8] rounded-2xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={authAccount.avatarUrl}
                  alt={authAccount.displayName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#1B2A22] truncate block">
                    {authAccount.displayName}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {authAccount.provider === 'google' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#4285F4] font-medium">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Google
                      </span>
                    )}
                    {authAccount.provider === 'facebook' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#1877F2] font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[7px] font-bold">
                          f
                        </span>
                        Facebook
                      </span>
                    )}
                    {authAccount.provider === 'email' && (
                      <span className="text-[10px] text-[#5C7467]">Email</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-[11px] font-semibold text-[#2D6A4F] hover:underline cursor-pointer shrink-0"
              >
                Hồ sơ
              </button>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-br from-[#EEF5EE] to-[#E6EFE2] border border-[#CFE0D2] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1B2A22]">Cổng Đăng Nhập</span>
                <span className="text-[10px] font-semibold text-[#2D6A4F] bg-white px-2 py-0.5 rounded-full border border-[#CFE0D2]">
                  Google · FB
                </span>
              </div>
              <p className="text-[11px] text-[#5C7467] leading-snug">
                Đăng nhập để đồng bộ thực đơn và ngân sách tự động.
              </p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-1.5 px-3 bg-[#1B2A22] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          )}

          <nav className="space-y-1" aria-label="Menu chức năng chính">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  style={
                    isActive
                      ? { backgroundColor: themeConfig.primary, color: '#ffffff' }
                      : undefined
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'font-semibold shadow-xs'
                      : 'text-[#385747] hover:bg-[#EEF5EE] hover:text-[#1B2A22]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={!isActive ? { color: themeConfig.primary } : { color: '#ffffff' }}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.meta && (
                    <span
                      className={`font-mono tabular-nums text-xs ${
                        isActive ? 'text-white/85' : 'text-[#5C7467]'
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
                style={{ color: themeConfig.primary }}
                className="text-xs font-medium hover:underline cursor-pointer"
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
                      ? 'scale-115 ring-2 ring-offset-1 border-white shadow-2xs'
                      : 'border-black/15 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: preset.primary,
                    borderColor: '#ffffff',
                  }}
                />
              ))}
            </div>
          </div>
          {/* PWA Mobile Install inside Sidebar */}
          <div className="pt-2">
            <PWAInstallButton variant="sidebar" />
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
              <span className="font-medium" style={{ color: themeConfig.primary }}>
                Món Khôn
              </span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-[#1B2A22] truncate">
                {activeNavItem.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* PWA Install Button on mobile & desktop */}
            <PWAInstallButton variant="compact" />

            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              title="Tùy chỉnh chủ đề màu sắc & kiểu chữ"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
              <span className="hidden sm:inline">Chủ đề</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pantry')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
              Nhập Kho ({pantry.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              style={{ backgroundColor: themeConfig.primary }}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-white rounded-xl transition-colors whitespace-nowrap cursor-pointer hover:opacity-90 shadow-2xs"
            >
              Ví: {formatVND(remainingBudget)}
            </button>

            {/* User Account / Login Button in Header */}
            {authAccount ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 text-xs font-semibold text-[#1B2A22] bg-[#F6F9F5] hover:bg-[#EEF5EE] border border-[#DCE5D8] rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Quản lý tài khoản"
              >
                <img
                  src={authAccount.avatarUrl}
                  alt={authAccount.displayName}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-500"
                />
                <span className="max-w-[100px] truncate hidden md:inline">
                  {authAccount.displayName}
                </span>
                {authAccount.provider === 'google' && (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                {authAccount.provider === 'facebook' && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                    f
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1B2A22] hover:bg-black rounded-xl transition-all shadow-2xs hover:shadow-sm cursor-pointer whitespace-nowrap"
                title="Đăng nhập với Google hoặc Facebook"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng nhập</span>
                <div className="flex items-center gap-1 pl-1 border-l border-white/20">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[7px] font-bold">
                    f
                  </span>
                </div>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Viewport with mobile bottom bar padding */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 pt-4 pb-28 md:py-8">
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
              dietaryPreferences={dietaryPreferences}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onQuickAddMeal={handleQuickAddMeal}
              onRemovePlannedMeal={handleRemovePlannedMeal}
              onNavigateTab={setActiveTab}
              onAutoGeneratePlan={handleAutoGeneratePlan}
              onUpdatePlannedMeal={handleUpdatePlannedMeal}
            />
          )}

          {activeTab === 'explore' && (
            <ExploreView
              dishes={dishes}
              pantry={pantry}
              peopleCount={peopleCount}
              diningMode={diningMode}
              plannedMeals={plannedMeals}
              dietaryPreferences={dietaryPreferences}
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
              onUpdateCustomShoppingItem={(id, updated) =>
                setCustomShoppingItems((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
                )
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
              onUpdateBudget={(newBudget) => setBudget(newBudget)}
              daysCount={daysCount}
              peopleCount={peopleCount}
              dishes={dishes}
              pantry={pantry}
              plannedMeals={plannedMeals}
              totalPlannedCost={totalPlannedCost}
              totalSavedFromPantry={totalSavedFromPantry}
              remainingBudget={remainingBudget}
              dietaryPreferences={dietaryPreferences}
              onAddMealToSlot={handleAddMealToSlot}
              onRemovePlannedMeal={handleRemovePlannedMeal}
              onMarkMealCooked={handleMarkMealCooked}
              onAutoGeneratePlan={handleAutoGeneratePlan}
              onSelectDishDetail={(dish) => setSelectedDishForModal(dish)}
              onNavigateTab={setActiveTab}
              onUpdatePlannedMeal={handleUpdatePlannedMeal}
              onClearPlan={handleClearPlannedMeals}
            />
          )}

          {activeTab === 'dietary' && (
            <DietaryPreferencesView
              preferences={dietaryPreferences}
              onUpdatePreferences={setDietaryPreferences}
              dishes={dishes}
              plannedMeals={plannedMeals}
              pantry={pantry}
              onNavigateTab={setActiveTab}
              onAutoGeneratePlan={handleAutoGeneratePlan}
            />
          )}

          {activeTab === 'community' && (
            <CommunityView
              posts={communityPosts}
              followedAuthors={followedAuthors}
              userProfile={userProfile}
              onUpdateUserProfile={setUserProfile}
              authAccount={authAccount}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onToggleLike={handleToggleLikePost}
              onToggleSave={handleToggleSavePost}
              onRatePost={handleRatePost}
              onAddPostComment={handleAddPostComment}
              onDeletePost={handleDeletePost}
              onSimulateIncomingEngagement={handleSimulateIncomingEngagement}
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
              plannedMeals={plannedMeals}
              peopleCount={peopleCount}
              remainingBudget={remainingBudget}
              dietaryPreferences={dietaryPreferences}
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
              onUpdateExpense={(id, updated) =>
                setExpenses((prev) =>
                  prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
                )
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
              <button
                type="button"
                onClick={() => setActiveTab('dietary')}
                className="hover:text-[#1B2A22] cursor-pointer"
              >
                Dị ứng & Món ghét
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
        dietaryPreferences={dietaryPreferences}
        onToggleExcludeDish={handleToggleExcludeDish}
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

      {/* Auth Portal Modal (Google & Facebook) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentAccount={authAccount}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        primaryColor={themeConfig.primary}
        defaultEmail="vyt371953@gmail.com"
      />

      {/* Mobile Bottom Navigation Bar (Thumb navigation for phones) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectNav}
        onOpenMobileDrawer={() => setMobileMenuOpen(true)}
        pantryCount={pantry.length}
        expiringCount={expiringCount}
        shoppingMissingCount={shoppingMissingCount}
        primaryColor={themeConfig.primary}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
