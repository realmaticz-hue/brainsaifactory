// =============================================================================
// WORKSPACE MANAGER — Multi-User Collaboration & Team Management
// =============================================================================

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  joinedAt: Date;
  lastActive?: Date;
  avatar?: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface WorkspaceSettings {
  allowPublicPosts: boolean;
  requireApproval: boolean;
  defaultRole: UserRole;
  allowedDomains?: string[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    customDomain?: string;
  };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

/**
 * Get all workspaces for current user
 */
export function getUserWorkspaces(): Workspace[] {
  const stored = localStorage.getItem('workspaces');
  if (!stored) {
    // Create default personal workspace
    const defaultWorkspace = createDefaultWorkspace();
    saveWorkspaces([defaultWorkspace]);
    return [defaultWorkspace];
  }

  const workspaces = JSON.parse(stored) as Workspace[];

  // Convert dates
  return workspaces.map(ws => ({
    ...ws,
    createdAt: new Date(ws.createdAt),
    updatedAt: new Date(ws.updatedAt),
    members: ws.members.map(m => ({
      ...m,
      joinedAt: new Date(m.joinedAt),
      lastActive: m.lastActive ? new Date(m.lastActive) : undefined,
    })),
  }));
}

/**
 * Create default personal workspace
 */
function createDefaultWorkspace(): Workspace {
  const now = new Date();
  const userId = getCurrentUserId();

  return {
    id: `ws-${Date.now()}`,
    name: 'Personal Workspace',
    slug: 'personal',
    description: 'Your personal workspace',
    createdAt: now,
    updatedAt: now,
    ownerId: userId,
    members: [
      {
        id: userId,
        email: 'user@example.com',
        name: 'You',
        role: 'owner',
        joinedAt: now,
        status: 'active',
      },
    ],
    settings: {
      allowPublicPosts: true,
      requireApproval: false,
      defaultRole: 'editor',
    },
    plan: 'free',
  };
}

/**
 * Save workspaces to storage
 */
function saveWorkspaces(workspaces: Workspace[]): void {
  localStorage.setItem('workspaces', JSON.stringify(workspaces));
}

/**
 * Get current user ID
 */
function getCurrentUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

/**
 * Get current workspace
 */
export function getCurrentWorkspace(): Workspace | null {
  const currentId = localStorage.getItem('currentWorkspaceId');
  const workspaces = getUserWorkspaces();

  if (!currentId) {
    return workspaces[0] || null;
  }

  return workspaces.find(ws => ws.id === currentId) || workspaces[0] || null;
}

/**
 * Switch workspace
 */
export function switchWorkspace(workspaceId: string): void {
  localStorage.setItem('currentWorkspaceId', workspaceId);
}

/**
 * Create new workspace
 */
export function createWorkspace(
  name: string,
  slug: string,
  description?: string
): Workspace {
  const workspaces = getUserWorkspaces();
  const userId = getCurrentUserId();
  const now = new Date();

  const newWorkspace: Workspace = {
    id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    slug,
    description,
    createdAt: now,
    updatedAt: now,
    ownerId: userId,
    members: [
      {
        id: userId,
        email: 'user@example.com',
        name: 'You',
        role: 'owner',
        joinedAt: now,
        status: 'active',
      },
    ],
    settings: {
      allowPublicPosts: true,
      requireApproval: false,
      defaultRole: 'editor',
    },
    plan: 'free',
  };

  workspaces.push(newWorkspace);
  saveWorkspaces(workspaces);

  return newWorkspace;
}

/**
 * Update workspace
 */
export function updateWorkspace(
  workspaceId: string,
  updates: Partial<Workspace>
): void {
  const workspaces = getUserWorkspaces();
  const index = workspaces.findIndex(ws => ws.id === workspaceId);

  if (index !== -1) {
    workspaces[index] = {
      ...workspaces[index],
      ...updates,
      updatedAt: new Date(),
    };
    saveWorkspaces(workspaces);
  }
}

/**
 * Delete workspace
 */
export function deleteWorkspace(workspaceId: string): void {
  const workspaces = getUserWorkspaces();
  const filtered = workspaces.filter(ws => ws.id !== workspaceId);
  saveWorkspaces(filtered);

  // Switch to first remaining workspace
  if (filtered.length > 0) {
    switchWorkspace(filtered[0].id);
  }
}

/**
 * Invite member to workspace
 */
export function inviteMember(
  workspaceId: string,
  email: string,
  role: UserRole
): WorkspaceInvite {
  const workspaces = getUserWorkspaces();
  const workspace = workspaces.find(ws => ws.id === workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check if user has permission
  const currentUserId = getCurrentUserId();
  const currentMember = workspace.members.find(m => m.id === currentUserId);

  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
    throw new Error('You do not have permission to invite members');
  }

  // Check if already a member
  if (workspace.members.some(m => m.email === email)) {
    throw new Error('User is already a member');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite: WorkspaceInvite = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    email,
    role,
    invitedBy: currentUserId,
    invitedAt: now,
    expiresAt,
    status: 'pending',
  };

  // Store invite
  const invites = getWorkspaceInvites();
  invites.push(invite);
  localStorage.setItem('workspaceInvites', JSON.stringify(invites));

  return invite;
}

/**
 * Accept workspace invite
 */
export function acceptInvite(inviteId: string): void {
  const invites = getWorkspaceInvites();
  const invite = invites.find(i => i.id === inviteId);

  if (!invite || invite.status !== 'pending') {
    throw new Error('Invalid or expired invite');
  }

  if (new Date() > invite.expiresAt) {
    invite.status = 'expired';
    localStorage.setItem('workspaceInvites', JSON.stringify(invites));
    throw new Error('Invite has expired');
  }

  // Add user to workspace
  const workspaces = getUserWorkspaces();
  const workspace = workspaces.find(ws => ws.id === invite.workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const userId = getCurrentUserId();
  const newMember: WorkspaceMember = {
    id: userId,
    email: invite.email,
    name: 'New Member',
    role: invite.role,
    joinedAt: new Date(),
    status: 'active',
  };

  workspace.members.push(newMember);
  workspace.updatedAt = new Date();

  saveWorkspaces(workspaces);

  // Mark invite as accepted
  invite.status = 'accepted';
  localStorage.setItem('workspaceInvites', JSON.stringify(invites));
}

/**
 * Get workspace invites
 */
export function getWorkspaceInvites(): WorkspaceInvite[] {
  const stored = localStorage.getItem('workspaceInvites');
  if (!stored) return [];

  const invites = JSON.parse(stored) as WorkspaceInvite[];

  return invites.map(inv => ({
    ...inv,
    invitedAt: new Date(inv.invitedAt),
    expiresAt: new Date(inv.expiresAt),
  }));
}

/**
 * Update member role
 */
export function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: UserRole
): void {
  const workspaces = getUserWorkspaces();
  const workspace = workspaces.find(ws => ws.id === workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check permission
  const currentUserId = getCurrentUserId();
  const currentMember = workspace.members.find(m => m.id === currentUserId);

  if (!currentMember || currentMember.role !== 'owner') {
    throw new Error('Only workspace owner can change roles');
  }

  // Cannot change owner role
  const targetMember = workspace.members.find(m => m.id === memberId);
  if (targetMember?.role === 'owner') {
    throw new Error('Cannot change owner role');
  }

  // Update role
  const memberIndex = workspace.members.findIndex(m => m.id === memberId);
  if (memberIndex !== -1) {
    workspace.members[memberIndex].role = newRole;
    workspace.updatedAt = new Date();
    saveWorkspaces(workspaces);
  }
}

/**
 * Remove member from workspace
 */
export function removeMember(workspaceId: string, memberId: string): void {
  const workspaces = getUserWorkspaces();
  const workspace = workspaces.find(ws => ws.id === workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check permission
  const currentUserId = getCurrentUserId();
  const currentMember = workspace.members.find(m => m.id === currentUserId);

  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
    throw new Error('You do not have permission to remove members');
  }

  // Cannot remove owner
  const targetMember = workspace.members.find(m => m.id === memberId);
  if (targetMember?.role === 'owner') {
    throw new Error('Cannot remove workspace owner');
  }

  // Remove member
  workspace.members = workspace.members.filter(m => m.id !== memberId);
  workspace.updatedAt = new Date();
  saveWorkspaces(workspaces);
}

/**
 * Check if user has permission
 */
export function hasPermission(
  workspaceId: string,
  permission: 'create' | 'edit' | 'delete' | 'publish' | 'invite' | 'manage'
): boolean {
  const workspace = getUserWorkspaces().find(ws => ws.id === workspaceId);
  if (!workspace) return false;

  const currentUserId = getCurrentUserId();
  const member = workspace.members.find(m => m.id === currentUserId);
  if (!member) return false;

  const rolePermissions: Record<UserRole, string[]> = {
    owner: ['create', 'edit', 'delete', 'publish', 'invite', 'manage'],
    admin: ['create', 'edit', 'delete', 'publish', 'invite'],
    editor: ['create', 'edit', 'publish'],
    viewer: [],
  };

  return rolePermissions[member.role].includes(permission);
}

/**
 * Get workspace statistics
 */
export function getWorkspaceStats(workspaceId: string): {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  roleBreakdown: Record<UserRole, number>;
} {
  const workspace = getUserWorkspaces().find(ws => ws.id === workspaceId);

  if (!workspace) {
    return {
      totalMembers: 0,
      activeMembers: 0,
      pendingInvites: 0,
      roleBreakdown: { owner: 0, admin: 0, editor: 0, viewer: 0 },
    };
  }

  const invites = getWorkspaceInvites().filter(
    i => i.workspaceId === workspaceId && i.status === 'pending'
  );

  const roleBreakdown: Record<UserRole, number> = {
    owner: 0,
    admin: 0,
    editor: 0,
    viewer: 0,
  };

  workspace.members.forEach(member => {
    roleBreakdown[member.role]++;
  });

  return {
    totalMembers: workspace.members.length,
    activeMembers: workspace.members.filter(m => m.status === 'active').length,
    pendingInvites: invites.length,
    roleBreakdown,
  };
}

/**
 * Transfer workspace ownership
 */
export function transferOwnership(
  workspaceId: string,
  newOwnerId: string
): void {
  const workspaces = getUserWorkspaces();
  const workspace = workspaces.find(ws => ws.id === workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const currentUserId = getCurrentUserId();
  if (workspace.ownerId !== currentUserId) {
    throw new Error('Only current owner can transfer ownership');
  }

  const newOwner = workspace.members.find(m => m.id === newOwnerId);
  if (!newOwner) {
    throw new Error('New owner must be a workspace member');
  }

  // Update roles
  const currentOwner = workspace.members.find(m => m.id === currentUserId);
  if (currentOwner) {
    currentOwner.role = 'admin';
  }

  newOwner.role = 'owner';
  workspace.ownerId = newOwnerId;
  workspace.updatedAt = new Date();

  saveWorkspaces(workspaces);
}
