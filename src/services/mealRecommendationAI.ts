import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface MealPreference {
  menu_item_id: string;
  rating: number;
  dietary_restrictions: string[];
  allergies: string[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  nutritional_info: any;
  price: number;
}

interface MealPlan {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  menu_item_id: string;
  serving_date: string;
  serving_time: string;
  capacity: number;
  current_orders: number;
}

export class MealRecommendationAI {
  private static instance: MealRecommendationAI;

  private constructor() {}

  public static getInstance(): MealRecommendationAI {
    if (!MealRecommendationAI.instance) {
      MealRecommendationAI.instance = new MealRecommendationAI();
    }
    return MealRecommendationAI.instance;
  }

  async getUserPreferences(userId: string): Promise<MealPreference[]> {
    const { data, error } = await supabase
      .from('meal_preferences')
      .select('*')
      .eq('student_id', userId);

    if (error) throw error;
    return data;
  }

  async getAvailableMeals(date: string): Promise<MealPlan[]> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('serving_date', date)
      .lt('current_orders', 'capacity');

    if (error) throw error;
    return data;
  }

  async getMenuItems(menuItemIds: string[]): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', menuItemIds);

    if (error) throw error;
    return data;
  }

  private calculateMealScore(meal: MenuItem, preferences: MealPreference[]): number {
    let score = 0;
    
    // Find user's preference for this meal if it exists
    const preference = preferences.find(p => p.menu_item_id === meal.id);
    
    if (preference) {
      // Add rating score (1-5)
      score += preference.rating * 2;
      
      // Check for dietary restrictions and allergies
      const hasRestrictions = preference.dietary_restrictions.some(
        restriction => meal.description?.toLowerCase().includes(restriction.toLowerCase())
      );
      const hasAllergies = preference.allergies.some(
        allergy => meal.description?.toLowerCase().includes(allergy.toLowerCase())
      );
      
      if (hasRestrictions || hasAllergies) {
        score -= 10; // Significantly reduce score for restricted or allergic items
      }
    }
    
    return score;
  }

  async getPersonalizedRecommendations(
    userId: string,
    date: string,
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<MenuItem[]> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Get available meals for the date
      let availableMeals = await this.getAvailableMeals(date);
      
      // Filter by meal type if specified
      if (mealType) {
        availableMeals = availableMeals.filter(meal => meal.meal_type === mealType);
      }
      
      // Get menu items for available meals
      const menuItems = await this.getMenuItems(
        availableMeals.map(meal => meal.menu_item_id)
      );
      
      // Calculate scores for each menu item
      const scoredItems = menuItems.map(item => ({
        ...item,
        score: this.calculateMealScore(item, preferences)
      }));
      
      // Sort by score and return top recommendations
      return scoredItems
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...item }) => item);
    } catch (error) {
      console.error('Error getting meal recommendations:', error);
      throw error;
    }
  }
}

export const mealRecommendationAI = MealRecommendationAI.getInstance();