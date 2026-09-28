import { Dish, DishIngredient, PantryItem, PlannedMeal } from '../types';

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
