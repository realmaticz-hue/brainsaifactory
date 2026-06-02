// =============================================================================
// WORKSPACE MANAGER — Team Collaboration & Member Management
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Settings, Crown, Shield, Edit3, Eye, Mail, Trash2, UserPlus, ChevronDown } from 'lucide-react';
import {
  getUserWorkspaces,
  getCurrentWorkspace,
  createWorkspace,
  switchWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
  getWorkspaceStats,
  hasPermission,
  type Workspace,
  type UserRole,
  type WorkspaceMember
} from '../utils/workspaceManager';
import { toast } from 'sonner';

interface WorkspaceManagerProps {
  isopen: boolean;
  onClose: () => void;
  onWorkspaceChange?: () => void;
}

type ViewMode = 'overview' | 'members' | 'settings';

export function WorkspaceManager({ isopen, onClose, onWorkspaceChange }: WorkspaceManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');

  useEffect(() => {
    if (isopen) {
      refreshData();
    }
  }, [isopen]);

  const refreshData = () => {
    setWorkspaces(getUserWorkspaces());
    setCurrentWorkspace(getCurrentWorkspace());
  };

  if (!isopen || !currentWorkspace) return null;

  const stats = getWorkspaceStats(currentWorkspace.id);
  const canManage = hasPermission(currentWorkspace.id, 'manage');
  const canInvite = hasPermission(currentWorkspace.id, 'invite');

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName || !newWorkspaceSlug) {
      toast.error('Name and slug are required');
      return;
    }

    const newWs = createWorkspace(newWorkspaceName, newWorkspaceSlug);
    switchWorkspace(newWs.id);
    refreshData();
    setShowCreateModal(false);
    setNewWorkspaceName('');
    setNewWorkspaceSlug('');
    toast.success('Workspace created!');
    onWorkspaceChange?.();
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    refreshData();
    toast.success('Switched workspace');
    onWorkspaceChange?.();
  };

  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }

    try {
      inviteMember(currentWorkspace.id, inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('editor');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateRole = (memberId: string, newRole: UserRole) => {
    try {
      updateMemberRole(currentWorkspace.id, memberId, newRole);
      refreshData();
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!confirm('Remove this member from the workspace?')) return;

    try {
      removeMember(currentWorkspace.id, memberId);
      refreshData();
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteWorkspace = () => {
    if (!confirm(`Delete workspace "${currentWorkspace.name}"? This cannot be undone.`)) return;

    deleteWorkspace(currentWorkspace.id);
    refreshData();
    toast.success('Workspace deleted');
    onWorkspaceChange?.();
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'editor': return <Edit3 className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'admin': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'editor': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'viewer': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const renderOverviewView = () => (
    <div className="space-y-6">
      {/* Current Workspace Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {currentWorkspace.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentWorkspace.description || 'No description'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentWorkspace.plan === 'enterprise'
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
            : currentWorkspace.plan === 'pro'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {currentWorkspace.plan.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalMembers}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Members</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.activeMembers}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.pendingInvites}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending Invites</div>
          </div>
        </div>
      </div>

      {/* All Workspaces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">All Workspaces</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>

        <div className="space-y-3">
          {workspaces.map(ws => {
            const isCurrent = ws.id === currentWorkspace.id;

            return (
              <div
                key={ws.id}
                className={`rounded-xl p-4 border transition-all ${isCurrent
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {ws.name}
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ws.members.length} member{ws.members.length !== 1 ? 's' : ''} · {ws.plan}
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleSwitchWorkspace(ws.id)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-sm"
                    >
                      Switch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Role Distribution</h3>
        <div className="space-y-3">
          {(Object.entries(stats.roleBreakdown) as [UserRole, number][]).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                  {getRoleIcon(role)}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {role}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-6">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMembersView = () => (
    <div className="space-y-6">
      {/* Invite Button */}
      {canInvite && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {currentWorkspace.members.map(member => (
          <div
            key={member.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {member.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {member.role === 'owner' ? (
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-2 ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    Owner
                  </span>
                ) : (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as UserRole)}
                      disabled={!canManage}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-semibold disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {canManage && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div>Joined {member.joinedAt.toLocaleDateString()}</div>
              {member.lastActive && (
                <div>Last active {member.lastActive.toLocaleDateString()}</div>
              )}
              <span className={`px-2 py-1 rounded text-xs font-bold ${member.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">General Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={currentWorkspace.name}
              onChange={(e) => {
                if (canManage) {
                  updateWorkspace(currentWorkspace.id, { name: e.target.value });
                  refreshData();
                }
              }}
              disabled={!canManage}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={currentWorkspace.description || ''}
              onChange={(e) => {
                if (canManage) {
                  updateWorkspace(currentWorkspace.id, { description: e.target.value });
                  refreshData();
                }
              }}
              disabled={!canManage}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Permissions</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Allow Public Posts</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Posts can be publicly visible</div>
            </div>
            <input
              type="checkbox"
              checked={currentWorkspace.settings.allowPublicPosts}
              onChange={(e) => {
                if (canManage) {
                  updateWorkspace(currentWorkspace.id, {
                    settings: {
                      ...currentWorkspace.settings,
                      allowPublicPosts: e.target.checked,
                    },
                  });
                  refreshData();
                }
              }}
              disabled={!canManage}
              className="rounded disabled:opacity-50"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Require Approval</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Posts need approval before publishing</div>
            </div>
            <input
              type="checkbox"
              checked={currentWorkspace.settings.requireApproval}
              onChange={(e) => {
                if (canManage) {
                  updateWorkspace(currentWorkspace.id, {
                    settings: {
                      ...currentWorkspace.settings,
                      requireApproval: e.target.checked,
                    },
                  });
                  refreshData();
                }
              }}
              disabled={!canManage}
              className="rounded disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      {canManage && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Deleting a workspace is permanent and cannot be undone.
          </p>
          <button
            onClick={handleDeleteWorkspace}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Delete Workspace
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workspace Manager</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage teams and collaboration
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1 p-2">
              {[
                { mode: 'overview', label: 'Overview' },
                { mode: 'members', label: 'Members' },
                { mode: 'settings', label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setViewMode(tab.mode as ViewMode)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'overview' && renderOverviewView()}
            {viewMode === 'members' && renderMembersView()}
            {viewMode === 'settings' && renderSettingsView()}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Workspace</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g., Marketing Team"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  value={newWorkspaceSlug}
                  onChange={(e) => setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g., marketing-team"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateWorkspace}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Invite Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleInviteMember}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Send Invite
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
