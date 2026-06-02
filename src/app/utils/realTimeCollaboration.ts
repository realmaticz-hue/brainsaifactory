// =============================================================================
// REAL-TIME COLLABORATION — Live Editing & Presence
// =============================================================================

export interface CollaborativeSession {
  id: string;
  documentId: string;
  documentType: 'blog_post' | 'email' | 'social_post';
  participants: Participant[];
  createdAt: Date;
  lastActivity: Date;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: CursorPosition;
  selection?: TextSelection;
  lastSeen: Date;
  status: 'active' | 'idle' | 'offline';
}

export interface CursorPosition {
  line: number;
  column: number;
  elementId?: string;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface CollaborativeEdit {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  previousContent?: string;
}

export interface ActivityEvent {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor_move' | 'selection';
  metadata?: Record<string, any>;
}

export interface PresenceState {
  sessionId: string;
  participants: Participant[];
  activeEditors: number;
  lastSync: Date;
}

/**
 * Participant colors for visual identification
 */
const PARTICIPANT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

/**
 * Get or create collaborative session
 */
export function getOrCreateSession(
  documentId: string,
  documentType: CollaborativeSession['documentType']
): CollaborativeSession {
  const sessions = getSessions();
  let session = sessions.find(s => s.documentId === documentId);

  if (!session) {
    const currentUser = getCurrentUser();
    session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      documentType,
      participants: [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          color: PARTICIPANT_COLORS[0],
          lastSeen: new Date(),
          status: 'active',
        },
      ],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    sessions.push(session);
    saveSessions(sessions);
  }

  return session;
}

/**
 * Join collaborative session
 */
export function joinSession(sessionId: string): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const currentUser = getCurrentUser();
  const existingParticipant = session.participants.find(p => p.id === currentUser.id);

  if (!existingParticipant) {
    // Assign a color
    const usedColors = session.participants.map(p => p.color);
    const availableColors = PARTICIPANT_COLORS.filter(c => !usedColors.includes(c));
    const color = availableColors.length > 0 ? availableColors[0] : PARTICIPANT_COLORS[session.participants.length % PARTICIPANT_COLORS.length];

    session.participants.push({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      color,
      lastSeen: new Date(),
      status: 'active',
    });

    // Log join event
    logActivity(sessionId, 'join');
  } else {
    existingParticipant.status = 'active';
    existingParticipant.lastSeen = new Date();
  }

  session.lastActivity = new Date();
  saveSessions(sessions);
}

/**
 * Leave session
 */
export function leaveSession(sessionId: string): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  const currentUser = getCurrentUser();
  const participant = session.participants.find(p => p.id === currentUser.id);

  if (participant) {
    participant.status = 'offline';
    participant.lastSeen = new Date();
    logActivity(sessionId, 'leave');
  }

  session.lastActivity = new Date();
  saveSessions(sessions);
}

/**
 * Update cursor position
 */
export function updateCursor(
  sessionId: string,
  position: CursorPosition
): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  const currentUser = getCurrentUser();
  const participant = session.participants.find(p => p.id === currentUser.id);

  if (participant) {
    participant.cursor = position;
    participant.lastSeen = new Date();
    participant.status = 'active';
  }

  session.lastActivity = new Date();
  saveSessions(sessions);

  logActivity(sessionId, 'cursor_move', { position });
}

/**
 * Update text selection
 */
export function updateSelection(
  sessionId: string,
  selection: TextSelection | null
): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  const currentUser = getCurrentUser();
  const participant = session.participants.find(p => p.id === currentUser.id);

  if (participant) {
    participant.selection = selection || undefined;
    participant.lastSeen = new Date();
  }

  session.lastActivity = new Date();
  saveSessions(sessions);
}

/**
 * Apply collaborative edit
 */
export function applyEdit(
  sessionId: string,
  edit: Omit<CollaborativeEdit, 'id' | 'sessionId' | 'userId' | 'userName' | 'timestamp'>
): CollaborativeEdit {
  const currentUser = getCurrentUser();

  const collaborativeEdit: CollaborativeEdit = {
    id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    userId: currentUser.id,
    userName: currentUser.name,
    timestamp: new Date(),
    ...edit,
  };

  // Store edit
  const edits = getEdits(sessionId);
  edits.push(collaborativeEdit);
  localStorage.setItem(`edits-${sessionId}`, JSON.stringify(edits));

  logActivity(sessionId, 'edit', { edit: collaborativeEdit });

  return collaborativeEdit;
}

/**
 * Get edit history
 */
export function getEdits(sessionId: string): CollaborativeEdit[] {
  const stored = localStorage.getItem(`edits-${sessionId}`);
  if (!stored) return [];

  const edits = JSON.parse(stored) as CollaborativeEdit[];
  return edits.map(e => ({
    ...e,
    timestamp: new Date(e.timestamp),
  }));
}

/**
 * Get presence state
 */
export function getPresenceState(sessionId: string): PresenceState | null {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return null;

  // Update participant statuses based on last seen
  const now = new Date();
  const idleThreshold = 60 * 1000; // 1 minute
  const offlineThreshold = 5 * 60 * 1000; // 5 minutes

  session.participants.forEach(p => {
    const timeSinceLastSeen = now.getTime() - p.lastSeen.getTime();

    if (timeSinceLastSeen > offlineThreshold) {
      p.status = 'offline';
    } else if (timeSinceLastSeen > idleThreshold) {
      p.status = 'idle';
    }
  });

  const activeEditors = session.participants.filter(p => p.status === 'active').length;

  return {
    sessionId: session.id,
    participants: session.participants,
    activeEditors,
    lastSync: new Date(),
  };
}

/**
 * Get activity feed
 */
export function getActivityFeed(
  sessionId: string,
  limit: number = 50
): ActivityEvent[] {
  const stored = localStorage.getItem(`activity-${sessionId}`);
  if (!stored) return [];

  let events = JSON.parse(stored) as ActivityEvent[];

  events = events.map(e => ({
    ...e,
    timestamp: new Date(e.timestamp),
  }));

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events.slice(0, limit);
}

/**
 * Log activity event
 */
function logActivity(
  sessionId: string,
  type: ActivityEvent['type'],
  metadata?: Record<string, any>
): void {
  const currentUser = getCurrentUser();

  const event: ActivityEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    userId: currentUser.id,
    userName: currentUser.name,
    timestamp: new Date(),
    type,
    metadata,
  };

  const events = getActivityFeed(sessionId, 1000);
  events.unshift(event);

  // Keep last 1000 events
  localStorage.setItem(`activity-${sessionId}`, JSON.stringify(events.slice(0, 1000)));
}

/**
 * Resolve edit conflicts
 */
export function resolveConflicts(
  localContent: string,
  remoteEdits: CollaborativeEdit[]
): string {
  let resolved = localContent;

  // Apply remote edits in chronological order
  const sortedEdits = [...remoteEdits].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  );

  for (const edit of sortedEdits) {
    try {
      switch (edit.type) {
        case 'insert':
          resolved = resolved.slice(0, edit.position) + edit.content + resolved.slice(edit.position);
          break;

        case 'delete':
          const deleteEnd = edit.position + edit.content.length;
          resolved = resolved.slice(0, edit.position) + resolved.slice(deleteEnd);
          break;

        case 'replace':
          if (edit.previousContent) {
            const replaceEnd = edit.position + edit.previousContent.length;
            resolved = resolved.slice(0, edit.position) + edit.content + resolved.slice(replaceEnd);
          }
          break;
      }
    } catch (error) {
      console.error('Error applying edit:', edit, error);
    }
  }

  return resolved;
}

/**
 * Get sessions
 */
function getSessions(): CollaborativeSession[] {
  const stored = localStorage.getItem('collaborativeSessions');
  if (!stored) return [];

  const sessions = JSON.parse(stored) as CollaborativeSession[];

  return sessions.map(s => ({
    ...s,
    createdAt: new Date(s.createdAt),
    lastActivity: new Date(s.lastActivity),
    participants: s.participants.map(p => ({
      ...p,
      lastSeen: new Date(p.lastSeen),
    })),
  }));
}

/**
 * Save sessions
 */
function saveSessions(sessions: CollaborativeSession[]): void {
  localStorage.setItem('collaborativeSessions', JSON.stringify(sessions));
}

/**
 * Get current user
 */
function getCurrentUser(): { id: string; name: string; email: string } {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }

  return {
    id: userId,
    name: localStorage.getItem('userName') || 'User',
    email: localStorage.getItem('userEmail') || 'user@example.com',
  };
}

/**
 * Sync presence (call periodically)
 */
export function syncPresence(sessionId: string): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  const currentUser = getCurrentUser();
  const participant = session.participants.find(p => p.id === currentUser.id);

  if (participant) {
    participant.lastSeen = new Date();
  }

  saveSessions(sessions);
}

/**
 * Get active sessions
 */
export function getActiveSessions(): CollaborativeSession[] {
  const sessions = getSessions();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  return sessions.filter(s => s.lastActivity > thirtyMinutesAgo);
}

/**
 * Clean up old sessions
 */
export function cleanupSessions(): void {
  const sessions = getSessions();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const active = sessions.filter(s => s.lastActivity > oneDayAgo);
  saveSessions(active);
}

// Auto-cleanup on init
if (typeof window !== 'undefined') {
  cleanupSessions();
}
