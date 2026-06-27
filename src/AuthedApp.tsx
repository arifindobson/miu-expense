import { useState } from 'react';
import { Keyboard, Home, BarChart3, MoreHorizontal, X } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useAppData } from './hooks/useAppData';
import { useSound } from './hooks/useSound';
import { getLocalYMD } from './utils/date';
import InputScreen from './screens/InputScreen';
import HomeScreen from './screens/HomeScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReceiptScanner from './components/ReceiptScanner';
import SheetModals from './components/Modals';
import DatePickerModal from './components/DatePickerModal';
import TransactionDetailModal from './components/TransactionDetailModal';
import GroupManagementModal from './components/GroupManagementModal';
import ManageResources from './components/ManageResources';
import type { Transaction } from './types';

type Tab = 'input' | 'home' | 'analytics' | 'others';
type Modal = 'account' | 'person' | 'theme' | 'date' | null;

export default function AuthedApp({ userId, userEmail, onLogout }: { userId: string | null; userEmail: string | null; onLogout: () => void }) {
  const { t, themeKey, setThemeKey, THEMES } = useTheme();
  const data = useAppData(userId, userEmail);
  const sound = useSound(userId);

  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [date, setDate] = useState(getLocalYMD());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [manageType, setManageType] = useState<'account' | 'category' | 'person' | null>(null);

  const startEdit = (tx: Transaction) => {
    setDetailTransaction(null);
    setEditingTransaction(tx);
    setDate(tx.date);
    setActiveTab('input');
  };

  const navItems: { tab: Tab; icon: typeof Home; label: string }[] = [
    { tab: 'input', icon: Keyboard, label: 'Input' },
    { tab: 'home', icon: Home, label: 'Home' },
    { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
    { tab: 'others', icon: MoreHorizontal, label: 'Others' },
  ];

  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-100 p-0 sm:p-4 overflow-hidden">
      <div className={`flex flex-col h-full w-full max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem] relative transition-colors duration-300`}>

        {/* Subtle data-loading indicator */}
        {data.dataLoading && (
          <div className="absolute top-0 inset-x-0 z-[80] h-0.5 overflow-hidden">
            <div className={`h-full w-1/3 ${t.primary} animate-[loading_1s_ease-in-out_infinite]`} style={{ animationName: 'loading' }} />
          </div>
        )}

        {/* Full-screen overlays */}
        <ReceiptScanner isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onScan={setReceiptImage} userId={userId} />

        <SheetModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          accounts={data.accountsList}
          selectedAccount={data.selectedAccount}
          onSelectAccount={(acc) => { data.setSelectedAccount(acc); setActiveModal(null); }}
          people={data.peopleList}
          selectedPerson={data.selectedPerson}
          onSelectPerson={(p) => { data.setSelectedPerson(p); setActiveModal(null); }}
          currentTheme={themeKey}
          onSelectTheme={(key) => { setThemeKey(key); setActiveModal(null); }}
          THEMES={THEMES}
          t={t}
        />

        <DatePickerModal isOpen={activeModal === 'date'} onClose={() => setActiveModal(null)} selectedDate={date} onConfirm={setDate} t={t} />

        <TransactionDetailModal
          transaction={detailTransaction}
          onClose={() => setDetailTransaction(null)}
          onEditClick={startEdit}
          peopleList={data.peopleList}
          t={t}
          isReadOnly={data.userRole === 'member'}
        />

        <GroupManagementModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          activeGroup={data.activeGroup}
          groupMembers={data.groupMembers}
          userRole={data.userRole}
          onInviteMember={data.onInviteMember}
          onUpdateMemberRole={data.onUpdateMemberRole}
          onRemoveMember={data.onRemoveMember}
          peopleList={data.peopleList}
          onAddPerson={data.onAddPerson}
          onDeletePerson={data.onDeletePerson}
          onUpdateGroupName={data.onUpdateGroupName}
          t={t}
        />

        <ManageResources
          isOpen={manageType !== null}
          onClose={() => setManageType(null)}
          type={manageType}
          accounts={data.accountsList}
          categories={data.categoriesList}
          people={data.peopleList}
          onRefresh={data.reload}
          onReorderAccounts={data.reorderAccounts}
          t={t}
          userId={userId}
          groupId={data.activeGroup?.id || null}
        />

        {/* Active screen */}
        {activeTab === 'input' && (
          <InputScreen
            data={data}
            editingTransaction={editingTransaction}
            onClearEditing={() => setEditingTransaction(null)}
            date={date}
            onOpenModal={setActiveModal}
            receiptImage={receiptImage}
            setReceiptImage={setReceiptImage}
            onOpenCamera={() => setIsCameraOpen(true)}
            onPreview={setPreviewImage}
            playCoin={sound.playCoin}
          />
        )}
        {activeTab === 'home' && (
          <HomeScreen data={data} userId={userId} onSelectTransaction={setDetailTransaction} onPreview={setPreviewImage} />
        )}
        {activeTab === 'analytics' && <AnalyticsScreen data={data} />}
        {activeTab === 'others' && (
          <SettingsScreen
            userEmail={userEmail}
            userRole={data.userRole}
            groupName={data.activeGroup?.name || null}
            memberCount={data.groupMembers.length}
            onOpenGroupModal={() => setIsGroupModalOpen(true)}
            onManage={setManageType}
            onLogout={onLogout}
            sound={sound}
          />
        )}

        {/* Bottom navigation */}
        <nav className={`flex items-center justify-around py-3 border-t ${t.border} ${t.bg} shrink-0 z-10 pb-safe transition-colors duration-300`}>
          {navItems.map(({ tab, icon: Icon, label }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} aria-label={label}
              className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${activeTab === tab ? t.primaryText : t.textSub}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wider">{label}</span>
            </button>
          ))}
        </nav>

        {/* Receipt preview */}
        {previewImage && (
          <div className="absolute inset-0 z-[70] flex flex-col justify-between p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex justify-between items-center text-white z-10 pt-safe">
              <button onClick={() => setPreviewImage(null)} aria-label="Close preview" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 transition-all">
                <X className="w-5 h-5" />
              </button>
              <span className="font-bold text-sm tracking-wider uppercase">Receipt Preview</span>
              <div className="w-10" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img src={previewImage} alt="Receipt" className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
            </div>
            <div className="h-10 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}
