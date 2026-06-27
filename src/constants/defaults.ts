import type { Account, Person, Category } from '../types';
import { ICON_MAP } from './icons';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'default-acc-1', name: 'Mandiri SkyZ', icon: ICON_MAP['CreditCard'], color: 'text-indigo-500', currency: 'IDR', balance: 0 },
  { id: 'default-acc-2', name: 'Cash', icon: ICON_MAP['Wallet'], color: 'text-emerald-500', currency: 'IDR', balance: 0 },
  { id: 'default-acc-3', name: 'Bank BCA', icon: ICON_MAP['Landmark'], color: 'text-blue-500', currency: 'IDR', balance: 0 },
];

export const DEFAULT_PEOPLE: Person[] = [
  { id: 'default-p-1', name: 'Me', icon: ICON_MAP['Smile'] },
  { id: 'default-p-2', name: 'Family', icon: ICON_MAP['Users'] },
  { id: 'default-p-3', name: 'Friend', icon: ICON_MAP['User'] },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-cat-1', name: 'Food', icon: ICON_MAP['Utensils'], color: 'text-blue-500' },
  { id: 'default-cat-2', name: 'Communicat', icon: ICON_MAP['Smartphone'], color: 'text-slate-500' },
  { id: 'default-cat-3', name: 'Daily', icon: ICON_MAP['Coffee'], color: 'text-green-500' },
  { id: 'default-cat-4', name: 'Transport', icon: ICON_MAP['Bus'], color: 'text-orange-500' },
  { id: 'default-cat-5', name: 'Tip', icon: ICON_MAP['Ticket'], color: 'text-yellow-500' },
  { id: 'default-cat-6', name: 'Fees', icon: ICON_MAP['Globe'], color: 'text-indigo-500' },
  { id: 'default-cat-7', name: 'SaaS Subs', icon: ICON_MAP['Monitor'], color: 'text-purple-500' },
  { id: 'default-cat-8', name: 'Social', icon: ICON_MAP['GlassWater'], color: 'text-pink-500' },
  { id: 'default-cat-9', name: 'Housing', icon: ICON_MAP['Home'], color: 'text-rose-500' },
  { id: 'default-cat-10', name: 'Gifts', icon: ICON_MAP['Gift'], color: 'text-red-500' },
  { id: 'default-cat-11', name: 'Clothing', icon: ICON_MAP['Shirt'], color: 'text-cyan-500' },
  { id: 'default-cat-12', name: 'Entertainme', icon: ICON_MAP['Tv'], color: 'text-violet-500' },
];
