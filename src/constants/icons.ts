import type { ComponentType } from 'react';
import {
  // accounts / money
  CreditCard, Wallet, Landmark, Coins, Banknote, PiggyBank, HandCoins, Receipt,
  // people
  Smile, Users, User, Heart, Sparkles, Baby, Star,
  // food & drink
  Utensils, Coffee, Pizza, Salad, Croissant, Beer, Wine, GlassWater, Cake,
  // shopping & clothing
  ShoppingCart, ShoppingBag, Shirt, Gift,
  // transport
  Bus, Car, Bike, Train, Plane, Fuel,
  // home & bills
  Home, Plug, Wifi, Droplet,
  // tech & entertainment
  Smartphone, Monitor, Tv, Headphones, Music, Film, Gamepad2, Ticket,
  // health & education
  HeartPulse, Pill, Stethoscope, Dumbbell, GraduationCap, BookOpen,
  // misc
  PawPrint, Briefcase, Hammer, Globe, Leaf, Sun, Umbrella,
} from 'lucide-react';

export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

// Unified icon dictionary for mapping custom string keys from the DB to Lucide components
export const ICON_MAP: Record<string, IconComponent> = {
  CreditCard, Wallet, Landmark, Coins, Banknote, PiggyBank, HandCoins, Receipt,
  Smile, Users, User, Heart, Sparkles, Baby, Star,
  Utensils, Coffee, Pizza, Salad, Croissant, Beer, Wine, GlassWater, Cake,
  ShoppingCart, ShoppingBag, Shirt, Gift,
  Bus, Car, Bike, Train, Plane, Fuel,
  Home, Plug, Wifi, Droplet,
  Smartphone, Monitor, Tv, Headphones, Music, Film, Gamepad2, Ticket,
  HeartPulse, Pill, Stethoscope, Dumbbell, GraduationCap, BookOpen,
  PawPrint, Briefcase, Hammer, Globe, Leaf, Sun, Umbrella,
};

// Icons offered in the custom resource picker, grouped by resource type
export const AVAILABLE_ICONS: Record<'account' | 'person' | 'category', string[]> = {
  account: ['CreditCard', 'Wallet', 'Landmark', 'Coins', 'Banknote', 'PiggyBank', 'HandCoins', 'Smartphone'],
  person: ['Smile', 'Users', 'User', 'Heart', 'Sparkles', 'Baby', 'Star'],
  category: [
    'Utensils', 'Coffee', 'Pizza', 'Salad', 'Croissant', 'Beer', 'Wine', 'GlassWater', 'Cake',
    'ShoppingCart', 'ShoppingBag', 'Shirt', 'Gift',
    'Bus', 'Car', 'Bike', 'Train', 'Plane', 'Fuel',
    'Home', 'Plug', 'Wifi', 'Droplet',
    'Smartphone', 'Monitor', 'Tv', 'Headphones', 'Music', 'Film', 'Gamepad2', 'Ticket',
    'HeartPulse', 'Pill', 'Stethoscope', 'Dumbbell', 'GraduationCap', 'BookOpen',
    'PawPrint', 'Briefcase', 'Hammer', 'Globe', 'Leaf', 'Sun', 'Umbrella',
    'Receipt', 'Coins', 'Banknote', 'Star', 'Sparkles',
  ],
};

// Reverse-lookup: resolve the string key for a given icon component (used when seeding to the DB)
export function iconKeyFor(component: IconComponent, fallback = 'Utensils'): string {
  return Object.keys(ICON_MAP).find((key) => ICON_MAP[key] === component) || fallback;
}
