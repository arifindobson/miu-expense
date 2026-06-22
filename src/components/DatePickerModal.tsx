import React, { useState, useEffect, useRef } from 'react';

interface ThemeConfig {
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

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onConfirm: (dateStr: string) => void;
  t: ThemeConfig;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDayName = (y: number, m: number, d: number) => {
  const dateObj = new Date(y, m, d);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dateObj.getDay()];
};

const ITEM_HEIGHT = 36; // px

export default function DatePickerModal({ isOpen, onClose, selectedDate, onConfirm, t }: DatePickerModalProps) {
  // Parse date
  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10)
      };
    }
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate()
    };
  };

  const initial = parseDate(selectedDate);
  
  const [tempYear, setTempYear] = useState(initial.year);
  const [tempMonth, setTempMonth] = useState(initial.month);
  const [tempDay, setTempDay] = useState(initial.day);

  // Generate lists
  const years: number[] = [];
  for (let y = 1990; y <= 2040; y++) {
    years.push(y);
  }

  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const maxDays = getDaysInMonth(tempMonth, tempYear);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  
  const isProgrammaticScroll = useRef(false);

  // Synchronize scroll on open or state change
  const scrollToIndices = (d: number, m: number, y: number, smooth = false) => {
    isProgrammaticScroll.current = true;
    
    const dayIdx = days.indexOf(d);
    const monthIdx = m;
    const yearIdx = years.indexOf(y);

    const behavior = smooth ? 'smooth' : 'auto';

    if (dayRef.current && dayIdx !== -1) {
      dayRef.current.scrollTo({ top: dayIdx * ITEM_HEIGHT, behavior });
    }
    if (monthRef.current && monthIdx !== -1) {
      monthRef.current.scrollTo({ top: monthIdx * ITEM_HEIGHT, behavior });
    }
    if (yearRef.current && yearIdx !== -1) {
      yearRef.current.scrollTo({ top: yearIdx * ITEM_HEIGHT, behavior });
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 200);
  };

  // Run on mount or when visibility changes
  useEffect(() => {
    if (isOpen) {
      const current = parseDate(selectedDate);
      setTempYear(current.year);
      setTempMonth(current.month);
      setTempDay(current.day);

      // Delay slightly to allow DOM to render and setup scroll container heights
      setTimeout(() => {
        scrollToIndices(current.day, current.month, current.year, false);
      }, 50);
    }
  }, [isOpen, selectedDate]);

  // Adjust day value if month/year change results in fewer days
  useEffect(() => {
    const newMaxDays = getDaysInMonth(tempMonth, tempYear);
    if (tempDay > newMaxDays) {
      setTempDay(newMaxDays);
      scrollToIndices(newMaxDays, tempMonth, tempYear, true);
    }
  }, [tempMonth, tempYear]);

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    type: 'day' | 'month' | 'year',
    listLength: number
  ) => {
    if (isProgrammaticScroll.current || !ref.current) return;

    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const boundedIndex = Math.max(0, Math.min(index, listLength - 1));

    if (type === 'day') {
      const d = days[boundedIndex];
      if (d && d !== tempDay) setTempDay(d);
    } else if (type === 'month') {
      if (boundedIndex !== tempMonth) setTempMonth(boundedIndex);
    } else if (type === 'year') {
      const y = years[boundedIndex];
      if (y && y !== tempYear) setTempYear(y);
    }
  };

  const handleItemClick = (
    ref: React.RefObject<HTMLDivElement | null>,
    index: number
  ) => {
    if (!ref.current) return;
    isProgrammaticScroll.current = true;
    ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    
    // Sync states
    if (ref === dayRef) {
      setTempDay(days[index]);
    } else if (ref === monthRef) {
      setTempMonth(index);
    } else if (ref === yearRef) {
      setTempYear(years[index]);
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 250);
  };

  const handleToday = () => {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth();
    const y = today.getFullYear();
    setTempDay(d);
    setTempMonth(m);
    setTempYear(y);
    scrollToIndices(d, m, y, true);
  };

  const handleConfirm = () => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const dateStr = `${tempYear}-${pad(tempMonth + 1)}-${pad(tempDay)}`;
    onConfirm(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`absolute inset-0 z-50 flex flex-col justify-end ${t.modalOverlay} backdrop-blur-sm`}
      onClick={onClose}
    >
      <div 
        className={`${t.modalBg} rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom-full duration-300 border-t ${t.border}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar with select title & Today button */}
        <div className="flex justify-between items-center mb-4">
          <span className={`font-semibold ${t.textMain}`}>Select Date</span>
          <button 
            onClick={handleToday}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${t.primarySoft} ${t.primarySoftText} active:scale-95 transition-all`}
          >
            Today
          </button>
        </div>

        {/* Selected date preview banner */}
        <div className={`w-full py-3 mb-5 rounded-2xl flex items-center justify-center ${t.primarySoft}`}>
          <span className={`text-lg font-bold tracking-wide ${t.primarySoftText}`}>
            {getDayName(tempYear, tempMonth, tempDay)}, {MONTH_NAMES[tempMonth]} {tempDay}, {tempYear}
          </span>
        </div>

        {/* Picker scroll columns */}
        <div className="relative flex justify-center items-center gap-1 my-2">
          {/* Active selection row overlay lines */}
          <div className="absolute left-0 right-0 top-[72px] h-[36px] border-y border-violet-500/25 pointer-events-none bg-slate-500/5 z-0" />

          {/* DAY COLUMN */}
          <div 
            ref={dayRef}
            onScroll={() => handleScroll(dayRef, 'day', days.length)}
            className="w-16 h-[180px] overflow-y-auto no-scrollbar scroll-snap-y scroll-snap-mandatory z-10"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {/* Top spacers */}
            <div className="h-[72px]" />
            {days.map((d, i) => (
              <div 
                key={`d-${d}`}
                onClick={() => handleItemClick(dayRef, i)}
                className={`h-[36px] flex items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all duration-150 ${
                  d === tempDay ? `${t.primaryText} scale-110 font-bold` : t.textMuted
                }`}
                style={{ scrollSnapAlign: 'center' }}
              >
                {String(d).padStart(2, '0')}
              </div>
            ))}
            {/* Bottom spacers */}
            <div className="h-[72px]" />
          </div>

          {/* MONTH COLUMN */}
          <div 
            ref={monthRef}
            onScroll={() => handleScroll(monthRef, 'month', MONTH_NAMES.length)}
            className="flex-1 h-[180px] overflow-y-auto no-scrollbar scroll-snap-y scroll-snap-mandatory z-10"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {/* Top spacers */}
            <div className="h-[72px]" />
            {MONTH_NAMES.map((m, i) => (
              <div 
                key={`m-${m}`}
                onClick={() => handleItemClick(monthRef, i)}
                className={`h-[36px] flex items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all duration-150 ${
                  i === tempMonth ? `${t.primaryText} scale-110 font-bold` : t.textMuted
                }`}
                style={{ scrollSnapAlign: 'center' }}
              >
                {m}
              </div>
            ))}
            {/* Bottom spacers */}
            <div className="h-[72px]" />
          </div>

          {/* YEAR COLUMN */}
          <div 
            ref={yearRef}
            onScroll={() => handleScroll(yearRef, 'year', years.length)}
            className="w-24 h-[180px] overflow-y-auto no-scrollbar scroll-snap-y scroll-snap-mandatory z-10"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {/* Top spacers */}
            <div className="h-[72px]" />
            {years.map((y, i) => (
              <div 
                key={`y-${y}`}
                onClick={() => handleItemClick(yearRef, i)}
                className={`h-[36px] flex items-center justify-center text-sm font-semibold select-none cursor-pointer transition-all duration-150 ${
                  y === tempYear ? `${t.primaryText} scale-110 font-bold` : t.textMuted
                }`}
                style={{ scrollSnapAlign: 'center' }}
              >
                {y}
              </div>
            ))}
            {/* Bottom spacers */}
            <div className="h-[72px]" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm ${t.btnSpecial} active:scale-95 transition-all text-center`}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 active:scale-95 transition-all text-center shadow-md`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
