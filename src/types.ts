export type DiningMode = 'cook' | 'eat_out' | 'hybrid';

export type DishCategory = 'Món mặn' | 'Canh & Súp' | 'Rau & Đậu' | 'Cơm & Bún' | 'Ăn sáng';
export type DishTaste = 'Đậm đà' | 'Thanh đạm' | 'Chua ngọt' | 'Cay nhẹ';
export type DishDifficulty = 'Dễ nấu' | 'Trung bình' | 'Cầu kỳ';

export interface DishIngredient {
  name: string;
  amount: number;
  unit: string;
  estimatedPrice: number; // VND for baseServings (usually 1 person or 2 people; we normalize per 1 serving)
  category: 'Thịt & Cá' | 'Rau củ' | 'Trứng & Đậu' | 'Gia vị & Đồ khô' | 'Tinh bột';
}

export interface DishComment {
  id: string;
  author: string;
  role: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface Dish {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  category: DishCategory;
  taste: DishTaste;
  difficulty: DishDifficulty;
  cookTimeMinutes: number;
  cookCostPerPerson: number; // Base cost per person if buying all ingredients
  eatOutCostPerPerson: number; // Cost per person if eating out / ordering delivery
  ingredients: DishIngredient[]; // Amounts per 1 person
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  smartTip: string;
  rating: number;
  reviewCount: number;
  comments: DishComment[];
  isCommunityDish?: boolean;
  authorName?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'Thịt & Cá' | 'Rau củ' | 'Trứng & Đậu' | 'Gia vị & Đồ khô' | 'Tinh bột';
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  estimatedValue: number; // VND per unit
}

export type MealSlotType = 'Sáng' | 'Trưa' | 'Tối';

export interface PlannedMeal {
  id: string;
  dayIndex: number; // 1..N
  slot: MealSlotType;
  dishId: string;
  mode: 'cook' | 'eat_out';
  servings: number;
  isCooked?: boolean;
}

export interface CustomShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  estimatedPrice: number;
  category: 'Thịt & Cá' | 'Rau củ' | 'Trứng & Đậu' | 'Gia vị & Đồ khô' | 'Tinh bột';
  checked: boolean;
}

export interface CommunityComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorBio: string;
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
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
  userRating: number;
  avgRating: number;
  ratingCount: number;
  comments: CommunityComment[];
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  title: string;
  category: 'Đi chợ nấu ăn' | 'Ăn ngoài / Đặt món' | 'Nguyên liệu dự trữ';
  plannedAmount: number;
  actualAmount: number;
  savedFromPantry: number;
  note: string;
}

export type NavTab =
  | 'home'
  | 'explore'
  | 'pantry'
  | 'shopping'
  | 'mealplan'
  | 'community'
  | 'random'
  | 'expenses';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  primaryDark: string;
  bg: string;
  surface: string;
  soft: string;
  border: string;
  text: string;
  muted: string;
}

export interface UserThemeConfig {
  presetId: string;
  primary: string;
  primaryDark: string;
  bg: string;
  surface: string;
  soft: string;
  border: string;
  text: string;
  muted: string;
  fontStyle: 'editorial' | 'modern';
  radiusScale: 'soft' | 'standard' | 'sharp';
  fontScale: 'compact' | 'normal' | 'large';
}
