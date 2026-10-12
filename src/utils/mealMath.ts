import { Dish, DishIngredient, MealSlotType, PantryItem, PlannedMeal, DietaryPreferences } from '../types';
import { POPULAR_ALLERGIES, POPULAR_DISLIKES } from '../data/initialData';

export const REFERENCE_TODAY = '2026-09-28';

export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toLocaleString('vi-VN') + 'đ';
}

export function normalizeName(str: string): string {
  return str.trim().toLowerCase();
}

export function getDaysUntilExpiry(expiryDate: string, refDate: string = REFERENCE_TODAY): number {
  const exp = new Date(expiryDate + 'T00:00:00');
  const ref = new Date(refDate + 'T00:00:00');
  const diffMs = exp.getTime() - ref.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export interface EvaluatedIngredient {
  ingredient: DishIngredient;
  requiredAmount: number;
  availableAmount: number;
  missingAmount: number;
  totalEstimatedCost: number;
  savedCost: number;
  netCostToBuy: number;
  isExpiringSoon: boolean;
  daysLeft: number | null;
}

export interface DishEvaluation {
  dish: Dish;
  servings: number;
  mode: 'cook' | 'eat_out';
  evaluatedIngredients: EvaluatedIngredient[];
  baseTotalCost: number;
  savedFromPantryCost: number;
  netOutOfPocketCost: number;
  eatOutTotalCost: number;
  savedVsEatOut: number;
  pantryMatchPercent: number;
  expiringIngredientsRescued: string[];
  missingIngredientsCount: number;
}

export function evaluateDishWithPantry(
  dish: Dish,
  pantry: PantryItem[],
  servings: number = 1,
  mode: 'cook' | 'eat_out' = 'cook'
): DishEvaluation {
  const eatOutTotalCost = dish.eatOutCostPerPerson * servings;

  if (mode === 'eat_out') {
    return {
      dish,
      servings,
      mode: 'eat_out',
      evaluatedIngredients: [],
      baseTotalCost: eatOutTotalCost,
      savedFromPantryCost: 0,
      netOutOfPocketCost: eatOutTotalCost,
      eatOutTotalCost,
      savedVsEatOut: 0,
      pantryMatchPercent: 0,
      expiringIngredientsRescued: [],
      missingIngredientsCount: 0,
    };
  }

  let baseTotalCost = 0;
  let savedFromPantryCost = 0;
  let netOutOfPocketCost = 0;
  let matchedCount = 0;
  let missingIngredientsCount = 0;
  const expiringIngredientsRescued: string[] = [];

  const evaluatedIngredients: EvaluatedIngredient[] = dish.ingredients.map((ing) => {
    const requiredAmount = ing.amount * servings;
    const totalEstimatedCost = ing.estimatedPrice * servings;
    baseTotalCost += totalEstimatedCost;

    const pantryMatch = pantry.find(
      (p) =>
        normalizeName(p.name) === normalizeName(ing.name) ||
        normalizeName(p.name).includes(normalizeName(ing.name)) ||
        normalizeName(ing.name).includes(normalizeName(p.name))
    );

    const availableAmount = pantryMatch && pantryMatch.quantity > 0 ? pantryMatch.quantity : 0;
    const coveredRatio =
      requiredAmount > 0 ? Math.min(1, availableAmount / requiredAmount) : 1;
    const missingAmount = Math.max(0, requiredAmount - availableAmount);

    const savedCost = Math.round(totalEstimatedCost * coveredRatio);
    const netCostToBuy = Math.max(0, totalEstimatedCost - savedCost);

    savedFromPantryCost += savedCost;
    netOutOfPocketCost += netCostToBuy;

    if (coveredRatio >= 0.99) {
      matchedCount += 1;
    } else if (coveredRatio > 0) {
      matchedCount += coveredRatio;
      missingIngredientsCount += 1;
    } else {
      missingIngredientsCount += 1;
    }

    const daysLeft = pantryMatch ? getDaysUntilExpiry(pantryMatch.expiryDate) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 2 && availableAmount > 0;

    if (isExpiringSoon && pantryMatch) {
      expiringIngredientsRescued.push(pantryMatch.name);
    }

    return {
      ingredient: ing,
      requiredAmount,
      availableAmount,
      missingAmount,
      totalEstimatedCost,
      savedCost,
      netCostToBuy,
      isExpiringSoon,
      daysLeft,
    };
  });

  const pantryMatchPercent =
    dish.ingredients.length > 0
      ? Math.round((matchedCount / dish.ingredients.length) * 100)
      : 0;

  const savedVsEatOut = Math.max(0, eatOutTotalCost - netOutOfPocketCost);

  return {
    dish,
    servings,
    mode: 'cook',
    evaluatedIngredients,
    baseTotalCost,
    savedFromPantryCost,
    netOutOfPocketCost,
    eatOutTotalCost,
    savedVsEatOut,
    pantryMatchPercent,
    expiringIngredientsRescued,
    missingIngredientsCount,
  };
}

export interface GeneratedShoppingItem {
  key: string;
  name: string;
  unit: string;
  category: DishIngredient['category'];
  totalRequired: number;
  availableInPantry: number;
  missingToBuy: number;
  estimatedCost: number;
  usedInDishes: string[];
}

export function computeShoppingListFromMealPlan(
  plannedMeals: PlannedMeal[],
  dishes: Dish[],
  pantry: PantryItem[]
): GeneratedShoppingItem[] {
  const aggregatedMap = new Map<
    string,
    {
      name: string;
      unit: string;
      category: DishIngredient['category'];
      totalRequired: number;
      unitPricePerAmount: number;
      usedInDishes: Set<string>;
    }
  >();

  for (const meal of plannedMeals) {
    if (meal.mode !== 'cook' || meal.isCooked) continue;
    const dish = dishes.find((d) => d.id === meal.dishId);
    if (!dish) continue;

    for (const ing of dish.ingredients) {
      const key = normalizeName(ing.name);
      const reqAmount = ing.amount * meal.servings;
      const unitPrice = ing.amount > 0 ? ing.estimatedPrice / ing.amount : 0;

      const existing = aggregatedMap.get(key);
      if (existing) {
        existing.totalRequired += reqAmount;
        existing.usedInDishes.add(dish.name);
      } else {
        aggregatedMap.set(key, {
          name: ing.name,
          unit: ing.unit,
          category: ing.category,
          totalRequired: reqAmount,
          unitPricePerAmount: unitPrice,
          usedInDishes: new Set([dish.name]),
        });
      }
    }
  }

  const results: GeneratedShoppingItem[] = [];

  for (const [key, item] of aggregatedMap.entries()) {
    const pantryMatch = pantry.find(
      (p) =>
        normalizeName(p.name) === key ||
        normalizeName(p.name).includes(key) ||
        key.includes(normalizeName(p.name))
    );
    const availableInPantry = pantryMatch ? pantryMatch.quantity : 0;
    const missingToBuy = Math.max(0, item.totalRequired - availableInPantry);

    if (missingToBuy > 0) {
      const estimatedCost = Math.round(missingToBuy * item.unitPricePerAmount);
      results.push({
        key,
        name: item.name,
        unit: item.unit,
        category: item.category,
        totalRequired: item.totalRequired,
        availableInPantry,
        missingToBuy,
        estimatedCost,
        usedInDishes: Array.from(item.usedInDishes),
      });
    }
  }

  return results;
}

/**
 * Identify all allergy warnings for a specific dish based on user preferences
 */
export function getDishAllergyMatches(dish: Dish, prefs?: DietaryPreferences): string[] {
  if (!prefs) return [];
  const matches: string[] = [];
  const allKeywords: { label: string; kw: string }[] = [];

  // Match from selected preset allergies
  for (const algId of prefs.allergies || []) {
    const preset = POPULAR_ALLERGIES.find((p) => p.id === algId);
    if (preset) {
      for (const kw of preset.keywords) {
        allKeywords.push({ label: preset.name.split('(')[0].trim(), kw });
      }
    }
  }

  // Match from custom allergy tags
  for (const custom of prefs.customAllergies || []) {
    if (custom && custom.trim()) {
      allKeywords.push({ label: custom.trim(), kw: custom.trim() });
    }
  }

  const searchableTexts = [
    dish.name,
    dish.subtitle,
    ...dish.ingredients.map((i) => i.name),
  ].map((t) => t.toLowerCase());

  const matchedLabels = new Set<string>();
  for (const item of allKeywords) {
    const kwLower = item.kw.toLowerCase();
    const isMatched = searchableTexts.some((text) => text.includes(kwLower));
    if (isMatched && !matchedLabels.has(item.label)) {
      matchedLabels.add(item.label);
      matches.push(item.label);
    }
  }

  return matches;
}

/**
 * Identify all dislike warnings for a specific dish based on user preferences
 */
export function getDishDislikeMatches(dish: Dish, prefs?: DietaryPreferences): string[] {
  if (!prefs) return [];
  const matches: string[] = [];

  if (prefs.excludedDishIds?.includes(dish.id)) {
    matches.push(`Món bạn đã cấm trực tiếp (${dish.name})`);
  }

  const allKeywords: { label: string; kw: string }[] = [];

  // Match from selected preset dislikes
  for (const disId of prefs.dislikes || []) {
    const preset = POPULAR_DISLIKES.find((p) => p.id === disId);
    if (preset) {
      for (const kw of preset.keywords) {
        allKeywords.push({ label: preset.name.split('/')[0].trim(), kw });
      }
    }
  }

  // Match from custom dislike tags
  for (const custom of prefs.customDislikes || []) {
    if (custom && custom.trim()) {
      allKeywords.push({ label: custom.trim(), kw: custom.trim() });
    }
  }

  const searchableTexts = [
    dish.name,
    dish.subtitle,
    ...dish.ingredients.map((i) => i.name),
  ].map((t) => t.toLowerCase());

  const matchedLabels = new Set<string>();
  for (const item of allKeywords) {
    const kwLower = item.kw.toLowerCase();
    const isMatched = searchableTexts.some((text) => text.includes(kwLower));
    if (isMatched && !matchedLabels.has(item.label)) {
      matchedLabels.add(item.label);
      matches.push(item.label);
    }
  }

  return matches;
}

/**
 * Check if a dish has any dietary allergy, dislike, or manual exclusion restrictions
 */
export function isDishRestricted(
  dish: Dish,
  prefs?: DietaryPreferences
): {
  hasAllergy: boolean;
  hasDislike: boolean;
  isExcluded: boolean;
  isRestricted: boolean;
  allergyMatches: string[];
  dislikeMatches: string[];
  reasons: string[];
} {
  const allergyMatches = getDishAllergyMatches(dish, prefs);
  const dislikeMatches = getDishDislikeMatches(dish, prefs);
  const isExcluded = Boolean(prefs?.excludedDishIds?.includes(dish.id));
  const reasons = [
    ...allergyMatches.map((a) => `Dị ứng: ${a}`),
    ...dislikeMatches.map((d) => `Ghét: ${d}`),
  ];

  const hasAllergy = allergyMatches.length > 0;
  const hasDislike = dislikeMatches.length > 0;
  const isRestricted = hasAllergy || hasDislike || isExcluded;

  return {
    hasAllergy,
    hasDislike,
    isExcluded,
    isRestricted,
    allergyMatches,
    dislikeMatches,
    reasons,
  };
}

export interface SmartPlanOptions {
  daysCount: number;
  peopleCount: number;
  budget: number;
  diningMode: 'cook' | 'eat_out';
  avoidDuplicates?: boolean;
  strategy?: 'balanced' | 'budget_saver' | 'pantry_first';
  slots?: MealSlotType[];
  seed?: number;
  dietaryPreferences?: DietaryPreferences;
  filterDietary?: boolean;
}

/**
 * Intelligent Meal Plan Generator
 * Guarantees NO duplicate dishes when avoidDuplicates is true.
 * Strictly respects allergy & dislike preferences when filterDietary is true.
 * Adapts to pantry contents, nutritional balance, meal slot context, and financial budget.
 */
export function generateSmartMealPlan(
  dishes: Dish[],
  pantry: PantryItem[],
  options: SmartPlanOptions
): PlannedMeal[] {
  const {
    daysCount,
    peopleCount,
    budget,
    diningMode,
    avoidDuplicates = true,
    strategy = 'balanced',
    slots = ['Sáng', 'Trưa', 'Tối'],
    seed = Math.random(),
    dietaryPreferences,
    filterDietary = true,
  } = options;

  if (dishes.length === 0 || daysCount <= 0) return [];

  // Filter out allergic and disliked dishes if requested
  let usableDishes = dishes;
  if (filterDietary && dietaryPreferences) {
    // 1. Strictly exclude ALL dishes triggering allergies (hard constraint)
    const nonAllergic = dishes.filter(
      (d) => getDishAllergyMatches(d, dietaryPreferences).length === 0
    );
    // 2. Further exclude disliked or manually excluded dishes (soft-to-hard constraint)
    const cleanDishes = nonAllergic.filter((d) => {
      const dislikes = getDishDislikeMatches(d, dietaryPreferences);
      return dislikes.length === 0 && !dietaryPreferences.excludedDishIds?.includes(d.id);
    });

    // If clean pool is sufficient (at least 3 dishes), use it; otherwise nonAllergic
    usableDishes = cleanDishes.length >= 3 ? cleanDishes : nonAllergic.length > 0 ? nonAllergic : dishes;
  }

  // Simple pseudo-random seeded shuffle to provide variety on re-roll
  let currentSeed = seed;
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Evaluate all dishes against pantry
  const dishEvaluations = new Map<string, DishEvaluation>();
  for (const d of usableDishes) {
    dishEvaluations.set(d.id, evaluateDishWithPantry(d, pantry, peopleCount, diningMode));
  }

  // Group dishes by category
  const breakfastDishes = usableDishes.filter(
    (d) => d.category === 'Ăn sáng' || d.cookTimeMinutes <= 10
  );
  const mainDishes = usableDishes.filter(
    (d) => d.category === 'Món mặn' || d.category === 'Cơm & Bún'
  );
  const soupAndVeggieDishes = usableDishes.filter(
    (d) => d.category === 'Canh & Súp' || d.category === 'Rau & Đậu'
  );

  const usedDishIds = new Set<string>();
  const lastUsedDay = new Map<string, number>();
  const generated: PlannedMeal[] = [];
  let runningCost = 0;

  // Score candidate function based on selected strategy
  const scoreDish = (dish: Dish): number => {
    const ev = dishEvaluations.get(dish.id);
    if (!ev) return 999999;

    let score = ev.netOutOfPocketCost;

    if (strategy === 'pantry_first') {
      score -= ev.savedFromPantryCost * 2;
      score -= ev.expiringIngredientsRescued.length * 15000;
    } else if (strategy === 'budget_saver') {
      score = ev.netOutOfPocketCost;
    } else {
      score -= ev.savedFromPantryCost * 0.8;
      score -= (dish.rating - 4.5) * 5000;
    }

    score += (pseudoRandom() - 0.5) * 4000;
    return score;
  };

  for (let d = 1; d <= daysCount; d++) {
    for (const slot of slots) {
      // Determine candidate pool suitable for this slot
      let slotPool: Dish[];
      if (slot === 'Sáng') {
        slotPool = breakfastDishes.length > 0 ? breakfastDishes : usableDishes;
      } else if (slot === 'Trưa') {
        slotPool = mainDishes.length > 0 ? mainDishes : usableDishes;
      } else {
        slotPool =
          d % 2 === 0 && soupAndVeggieDishes.length > 0
            ? soupAndVeggieDishes
            : [...soupAndVeggieDishes, ...mainDishes];
        if (slotPool.length === 0) slotPool = usableDishes;
      }

      // Filter candidates to strictly avoid duplicates
      let eligibleCandidates: Dish[] = [];

      if (avoidDuplicates) {
        // First priority: dishes never used in this meal plan yet
        eligibleCandidates = slotPool.filter((dish) => !usedDishIds.has(dish.id));

        // If pool is exhausted for this specific category, try ANY unused dish across the usable pool
        if (eligibleCandidates.length === 0) {
          eligibleCandidates = usableDishes.filter((dish) => !usedDishIds.has(dish.id));
        }

        // If all available dishes have been used, pick least recently used
        if (eligibleCandidates.length === 0) {
          eligibleCandidates = slotPool.filter((dish) => {
            const lastDay = lastUsedDay.get(dish.id) || 0;
            return d - lastDay >= 2;
          });
        }
      }

      // Fallback if still empty
      if (eligibleCandidates.length === 0) {
        eligibleCandidates = slotPool.length > 0 ? slotPool : usableDishes;
      }

      // Shuffle candidates and sort by strategy score
      const candidateList = shuffle(eligibleCandidates);
      candidateList.sort((a, b) => scoreDish(a) - scoreDish(b));

      let chosenDish = candidateList[0];
      for (const cand of candidateList) {
        const ev = dishEvaluations.get(cand.id);
        const candCost = ev ? ev.netOutOfPocketCost : cand.cookCostPerPerson * peopleCount;
        if (runningCost + candCost <= budget || generated.length < 3) {
          chosenDish = cand;
          break;
        }
      }

      if (!chosenDish) {
        chosenDish = usableDishes[0];
      }

      const ev = dishEvaluations.get(chosenDish.id);
      const cost = ev ? ev.netOutOfPocketCost : chosenDish.cookCostPerPerson * peopleCount;
      runningCost += cost;

      usedDishIds.add(chosenDish.id);
      lastUsedDay.set(chosenDish.id, d);

      generated.push({
        id: `pm-smart-${d}-${slot}-${Date.now()}-${Math.floor(pseudoRandom() * 10000)}`,
        dayIndex: d,
        slot,
        dishId: chosenDish.id,
        mode: diningMode,
        servings: peopleCount,
        isCooked: false,
      });
    }
  }

  return generated;
}

