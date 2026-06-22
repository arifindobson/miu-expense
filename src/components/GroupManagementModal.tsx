import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Shield, User, Crown, AlertCircle, 
  Smile, Users, Heart, Sparkles, Lock
} from 'lucide-react';
import type { ThemeConfig, Group, GroupMember, Person } from '../types';

const PEOPLE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Smile, Users, User, Heart, Sparkles
};

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroup: Group | null;
  groupMembers: GroupMember[];
  userRole: 'owner' | 'admin' | 'member';
  onInviteMember: (email: string, role: 'admin' | 'member') => Promise<void>;
  onUpdateMemberRole: (memberId: string, role: 'admin' | 'member') => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  peopleList: Person[];
  onAddPerson: (name: string, email: string | null, iconKey: string) => Promise<void>;
  onDeletePerson: (personId: string) => Promise<void>;
  onUpdateGroupName: (groupId: string, newName: string) => Promise<void>;
  t: ThemeConfig;
}

export default function GroupManagementModal({
  isOpen,
  onClose,
  activeGroup,
  groupMembers,
  userRole,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  peopleList,
  onAddPerson,
  onDeletePerson,
  onUpdateGroupName,
  t,
}: GroupManagementModalProps) {
  // Group Workspace Settings State
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isUpdatingGroupName, setIsUpdatingGroupName] = useState(false);
  
  // Member invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  
  // Sharing profile states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [selectedProfileIcon, setSelectedProfileIcon] = useState('Smile');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeGroup) {
      setGroupNameInput(activeGroup.name);
    }
  }, [activeGroup, isOpen]);

  if (!isOpen) return null;

  const isAuthorized = userRole === 'owner' || userRole === 'admin';

  // --- Group Workspace Name update ---
  const handleUpdateGroupName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized || !activeGroup) return;
    setError(null);
    setSuccess(null);

    const nameTrimmed = groupNameInput.trim();
    if (!nameTrimmed) {
      setError('Group name cannot be empty.');
      return;
    }

    setIsUpdatingGroupName(true);
    try {
      await onUpdateGroupName(activeGroup.id, nameTrimmed);
      setSuccess('Group name updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to update group name.');
    } finally {
      setIsUpdatingGroupName(false);
    }
  };

  // --- Member Actions ---
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;
    setError(null);
    setSuccess(null);

    const emailTrimmed = inviteEmail.trim();
    if (!emailTrimmed) {
      setError('Please enter an email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (groupMembers.some(m => m.email.toLowerCase() === emailTrimmed.toLowerCase())) {
      setError('This user is already a member of the group.');
      return;
    }

    setIsLoading(true);
    try {
      await onInviteMember(emailTrimmed, inviteRole);
      setSuccess(`Successfully added ${emailTrimmed} directly to the group!`);
      setInviteEmail('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add group member.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (member: GroupMember, newRole: 'admin' | 'member') => {
    if (!isAuthorized) return;
    if (userRole === 'admin' && member.role !== 'member') {
      setError('Admins can only modify Member roles.');
      return;
    }
    if (member.role === 'owner') {
      setError('Owner roles cannot be modified.');
      return;
    }

    try {
      await onUpdateMemberRole(member.id, newRole);
      setSuccess('Role updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!isAuthorized) return;
    if (userRole === 'admin' && member.role !== 'member') {
      setError('Admins can only remove Members.');
      return;
    }
    if (member.role === 'owner') {
      setError('The group owner cannot be removed.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.email} from the family ledger?`)) {
      return;
    }

    try {
      await onRemoveMember(member.id);
      setSuccess('Member removed successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to remove member.');
    }
  };

  // --- Sharing Profile Actions ---
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nameTrimmed = profileName.trim();
    if (!nameTrimmed) {
      setError('Please enter a profile name.');
      return;
    }

    setIsLoading(true);
    try {
      await onAddPerson(nameTrimmed, profileEmail.trim() || null, selectedProfileIcon);
      setSuccess(`Successfully added visual profile "${nameTrimmed}"!`);
      setProfileName('');
      setProfileEmail('');
      setSelectedProfileIcon('Smile');
    } catch (err: any) {
      setError(err?.message || 'Failed to add profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileDelete = async (personId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile "${name}"? Transactions linked to it will set reference to null.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await onDeletePerson(personId);
      setSuccess(`Successfully deleted profile: ${name}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete profile.');
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end ${t.modalOverlay} backdrop-blur-sm`}
      onClick={onClose}
    >
      <div 
        className={`${t.modalBg} rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom-full duration-300 border-t ${t.border} max-h-[90%] flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 shrink-0 border-b pb-2 border-slate-100 dark:border-slate-800">
          <div>
            <h3 className={`font-bold text-base ${t.textMain}`}>Group Management Dashboard</h3>
            <span className={`text-[10px] ${t.textSub} uppercase tracking-wider font-semibold`}>
              Ledger: {activeGroup?.name || 'Personal'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-4 pt-2">
          {/* Notification Messages */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-rose-700 text-left">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-emerald-700 text-left">{success}</span>
            </div>
          )}

          {/* SECTION 1: GROUP WORKSPACE SETTINGS */}
          <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className={`text-xs font-bold ${t.textMain} flex items-center gap-1.5`}>
                ⚙️ Group Workspace Settings
              </h4>
              <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-md border border-indigo-100">
                GMT+7 timezone
              </span>
            </div>
            <form onSubmit={handleUpdateGroupName} className="flex gap-2">
              <input
                type="text"
                placeholder="Group Name"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                disabled={!isAuthorized || isUpdatingGroupName}
                className={`flex-1 px-3 py-2 bg-white border ${t.border} rounded-xl text-sm ${t.textMain} focus:outline-none ${t.primaryRing} disabled:opacity-75`}
              />
              {isAuthorized && (
                <button
                  type="submit"
                  disabled={isUpdatingGroupName || groupNameInput.trim() === activeGroup?.name}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all ${t.primary} disabled:opacity-50 cursor-pointer`}
                >
                  {isUpdatingGroupName ? 'Saving...' : 'Save'}
                </button>
              )}
            </form>
          </section>

          {/* SECTION 2: MEMBERS & ACCESS */}
          <section className="space-y-3">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-3">
              <h4 className={`text-xs font-bold ${t.textMain} flex items-center gap-1.5`}>
                👥 Add New Group Member
              </h4>
              
              {isAuthorized ? (
                <form onSubmit={handleInviteSubmit} className="flex flex-col gap-2">
                  <input 
                    type="email" 
                    placeholder="registered-user@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm ${t.textMain} ${t.placeholder} focus:outline-none ${t.primaryRing}`}
                  />
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      className={`flex-1 px-3 py-2 bg-white border ${t.border} rounded-xl text-xs font-semibold ${t.textMain} focus:outline-none`}
                    >
                      <option value="member">Role: Member (Read & Create Only)</option>
                      <option value="admin">Role: Admin (Full CRUD Capabilities)</option>
                    </select>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all ${t.primary} disabled:opacity-50 cursor-pointer`}
                    >
                      {isLoading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 text-center">
                  <span className="text-[10px] text-amber-700 font-semibold">
                    🔒 You are registered as a **Member**. Only group **Owners** or **Admins** can add new members.
                  </span>
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider px-1">Active Ledger Members ({groupMembers.length})</span>
              
              <div className="space-y-2">
                {groupMembers.map((member) => {
                  const canModify = isAuthorized && 
                    member.role !== 'owner' && 
                    !(userRole === 'admin' && member.role === 'admin');

                  return (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 text-left">
                        <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100`}>
                          {member.role === 'owner' ? (
                            <Crown className="w-4 h-4 text-amber-500" />
                          ) : member.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-blue-500" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${t.textMain}`}>
                            {member.email}
                          </span>
                          <span className="text-[9px] text-slate-400 capitalize font-semibold block">
                            Role: {member.role}
                          </span>
                        </div>
                      </div>

                      {/* Action Select and Delete */}
                      {canModify && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={member.role === 'owner' ? 'owner' : member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'member')}
                            className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-semibold focus:outline-none"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: SHARING PROFILES */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5">
            {/* Add Profile Form */}
            <form onSubmit={handleProfileSubmit} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-3">
              <h4 className={`text-xs font-bold ${t.textMain} flex items-center gap-1.5`}>
                👤 Create Visual Sharing Profile
              </h4>
              
              <div className="space-y-2.5">
                <div>
                  <label className={`block text-[9px] font-bold uppercase ${t.textSub} mb-1`}>Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sister / Mom"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    maxLength={15}
                    required
                    className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm ${t.textMain} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-bold uppercase ${t.textSub} mb-1`}>Associated Email (Optional)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. farah@example.com (for auto-linking)"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm ${t.textMain} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                </div>

                {/* Icon Grid */}
                <div>
                  <label className={`block text-[9px] font-bold uppercase ${t.textSub} mb-1.5`}>Select Avatar Icon</label>
                  <div className="flex gap-2">
                    {['Smile', 'Users', 'User', 'Heart', 'Sparkles'].map((iconKey) => {
                      const IconComp = PEOPLE_ICON_MAP[iconKey];
                      const isSelected = selectedProfileIcon === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setSelectedProfileIcon(iconKey)}
                          className={`flex-1 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-bold shadow-sm' 
                              : `border-slate-200 bg-white text-slate-500 hover:bg-slate-50`
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !profileName.trim()}
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-[0.99] transition-all ${t.primary} disabled:opacity-50 cursor-pointer`}
                >
                  {isLoading ? 'Adding...' : 'Add Profile'}
                </button>
              </div>
            </form>

            {/* Profiles List */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider px-1">Visual Profiles ({peopleList.length})</span>
              
              <div className="space-y-2">
                {peopleList.map((p) => {
                  const PIcon = p.icon;
                  const isCustom = p.user_id && p.user_id !== 'system';
                  
                  return (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 text-left">
                        <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100`}>
                          <PIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${t.textMain}`}>
                            {p.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {p.email ? `Linked: ${p.email}` : isCustom ? 'Custom Profile' : 'Default Profile'}
                          </span>
                        </div>
                      </div>

                      {isCustom ? (
                        <button
                          onClick={() => handleProfileDelete(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-300 mr-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
