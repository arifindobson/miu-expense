import React from 'react';

export interface ThemeConfig {
  name: string;
  bg: string;
  textMain: string;
  textMuted: string;
  textSub: string;
  textSubHover: string;
  placeholder: string;
  border: string;
  surface: string;
  surfaceHover: string;
  surfaceBorder: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  primarySoftText: string;
  primaryBorder: string;
  primarySoftBorder: string;
  primaryRing: string;
  primaryActiveOp: string;
  toggleActive: string;
  keypadContainer: string;
  btnNum: string;
  btnSpecial: string;
  inputCard: string;
  modalBg: string;
  modalOverlay: string;
  successBg: string;
  successIcon: string;
}

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  currency: string;
  balance?: number;
}

export interface Person {
  id: string;
  user_id?: string;
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export interface Category {
  id?: string;
  user_id?: string | null;
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}

export interface Transaction {
  id?: string;
  user_id?: string;
  type: 'expense' | 'income';
  amount: number;
  category_id?: string | null;
  category_name?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  person_id?: string | null;
  person_name?: string | null;
  note: string;
  date: string;
  location_lat?: number | null;
  location_lng?: number | null;
  receipt_url?: string | null;
  created_at?: string;
}
