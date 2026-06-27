import { ChevronRight, Users, CreditCard, Palette, LogOut, Smile, Shield, Info, Volume2, VolumeX, Play } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Avatar, SectionLabel } from '../ui/kit';
import type { UseSound } from '../hooks/useSound';

interface SettingsScreenProps {
  userEmail: string | null;
  userRole: 'owner' | 'admin' | 'member';
  groupName: string | null;
  memberCount: number;
  onOpenGroupModal: () => void;
  onManage: (type: 'account' | 'category' | 'person') => void;
  onLogout: () => void;
  sound: UseSound;
}

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

function SettingRow({ icon, iconBg, title, subtitle, onClick }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; onClick: () => void }) {
  const { t } = useTheme();
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-[0.98] transition-all text-left cursor-pointer`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-sm block">{title}</span>
        <span className={`text-[10px] ${t.textSub} truncate block`}>{subtitle}</span>
      </div>
      <ChevronRight className={`w-4 h-4 ${t.textSub} shrink-0`} />
    </button>
  );
}

export default function SettingsScreen({
  userEmail, userRole, groupName, memberCount, onOpenGroupModal, onManage, onLogout, sound,
}: SettingsScreenProps) {
  const { t, themeKey, setThemeKey, THEMES } = useTheme();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <SectionLabel>App Configuration</SectionLabel>
        <h2 className="text-xl font-extrabold leading-none mt-1">Settings</h2>
      </div>

      {/* Profile card */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
        <Avatar name={userEmail || 'Me'} className="w-12 h-12 text-sm" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm block truncate">{userEmail || 'Active Session'}</span>
          <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold ${t.primarySoftText} ${t.primarySoft} px-2 py-0.5 rounded-full`}>
            <Shield className="w-2.5 h-2.5" /> {ROLE_LABELS[userRole] || 'Member'}
          </span>
        </div>
        <button onClick={onLogout} aria-label="Sign out" title="Sign out"
          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors active:scale-95 border border-transparent hover:border-rose-100">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Theme quick picker */}
      <div className="space-y-2">
        <SectionLabel className="px-1">Theme</SectionLabel>
        <div className="flex gap-2">
          {Object.entries(THEMES).map(([key, theme]) => {
            const active = themeKey === key;
            return (
              <button key={key} onClick={() => setThemeKey(key)} aria-label={theme.name}
                className={`flex-1 h-12 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${active ? `${theme.primaryBorder} ${theme.primarySoft}` : `${t.border} ${theme.surfaceHover}`}`}>
                <span className={`w-5 h-5 rounded-full ${theme.primary.split(' ')[0]} ${theme.bg === 'bg-slate-950' ? 'ring-2 ring-slate-700' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound */}
      <div className="space-y-2">
        <SectionLabel className="px-1">Sound</SectionLabel>
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} space-y-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sound.enabled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
              {sound.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block">Coin sound on save</span>
              <span className={`text-[10px] ${t.textSub}`}>Play a chime when an expense is submitted</span>
            </div>
            <button
              onClick={() => { const next = !sound.enabled; sound.setEnabled(next); if (next) sound.preview(); }}
              aria-label="Toggle coin sound"
              aria-pressed={sound.enabled}
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${sound.enabled ? t.toggleActive : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${sound.enabled ? 'translate-x-[22px] left-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {sound.enabled && (
            <div className="flex items-center gap-3 pt-1">
              <VolumeX className={`w-4 h-4 ${t.textSub} shrink-0`} />
              <input
                type="range" min={0} max={100} step={5}
                value={Math.round(sound.volume * 100)}
                onChange={(e) => sound.setVolume(Number(e.target.value) / 100)}
                onPointerUp={() => sound.preview()}
                aria-label="Coin sound volume"
                className={`flex-1 h-1.5 cursor-pointer ${t.primaryText}`}
                style={{ accentColor: 'currentColor' }}
              />
              <Volume2 className={`w-4 h-4 ${t.textSub} shrink-0`} />
              <button
                onClick={() => sound.preview()}
                aria-label="Test sound"
                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${t.primarySoft} ${t.primarySoftText} active:scale-95 transition-transform`}
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group + resources */}
      <div className="space-y-2">
        <SectionLabel className="px-1">Family & Sharing</SectionLabel>
        <SettingRow icon={<Users className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" title="Group Management" subtitle={`${groupName || 'Family Ledger'} · ${memberCount} member${memberCount === 1 ? '' : 's'}`} onClick={onOpenGroupModal} />
        <SettingRow icon={<Smile className="w-5 h-5 text-pink-500" />} iconBg="bg-pink-50" title="Sharing Profiles" subtitle="Manage people for shared expenses" onClick={() => onManage('person')} />
      </div>

      <div className="space-y-2">
        <SectionLabel className="px-1">Manage Resources</SectionLabel>
        <SettingRow icon={<CreditCard className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" title="Accounts" subtitle="Add or delete payment methods" onClick={() => onManage('account')} />
        <SettingRow icon={<Palette className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" title="Categories" subtitle="Customize categories & labels" onClick={() => onManage('category')} />
      </div>

      {/* About */}
      <div className={`mt-auto flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Info className="w-4 h-4" /></div>
        <div className="flex-1">
          <span className="font-bold text-sm block">Miu Expense</span>
          <span className={`text-[10px] ${t.textSub}`}>v1.0.0 · Vite + React + Supabase</span>
        </div>
      </div>
    </div>
  );
}
