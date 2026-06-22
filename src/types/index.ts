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
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  currency: string;
  balance?: number;
}

export interface Person {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export interface Category {
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}

export interface Transaction {
  id?: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: string;
  accountId: string;
  personId: string;
  location?: { lat: number; lng: number };
  receiptImage?: string;
}
