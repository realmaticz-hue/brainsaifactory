// =============================================================================
// COLLABORATION PANEL — Real-Time Presence & Activity Feed
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Users, Activity, Circle, MousePointer, MessageSquare, Eye } from 'lucide-react';
import {
  getOrCreateSession,
  joinSession,
  leaveSession,
  getPresenceState,
  getActivityFeed,
  syncPresence,
  type CollaborativeSession,
  type PresenceState,
  type ActivityEvent,
  type Participant
} from '../utils/realTimeCollaboration';

interface CollaborationPanelProps {
  isopen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: 'blog_post' | 'email' | 'social_post';
}

export function CollaborationPanel({ isopen, onClose, documentId, documentType }: CollaborationPanelProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [presence, setPresence] = useState<PresenceState | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [viewMode, setViewMode] = useState<'presence' | 'activity'>('presence');

  useEffect(() => {
    if (isopen) {
      // Initialize session
      const sess = getOrCreateSession(documentId, documentType);
      setSession(sess);
      joinSession(sess.id);

      // Initial load
      updatePresence(sess.id);
      updateActivity(sess.id);

      // Set up polling for real-time updates
      const interval = setInterval(() => {
        syncPresence(sess.id);
        updatePresence(sess.id);
        updateActivity(sess.id);
      }, 2000); // Poll every 2 seconds

      return () => {
        clearInterval(interval);
        if (sess) {
          leaveSession(sess.id);
        }
      };
    }
  }, [isopen, documentId, documentType]);

  const updatePresence = (sessionId: string) => {
    const state = getPresenceState(sessionId);
    setPresence(state);
  };

  const updateActivity = (sessionId: string) => {
    const feed = getActivityFeed(sessionId, 50);
    setActivityFeed(feed);
  };

  if (!isopen || !session || !presence) return null;

  const getStatusColor = (status: Participant['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'join': return <Users className="w-3 h-3" />;
      case 'leave': return <Users className="w-3 h-3" />;
      case 'edit': return <Activity className="w-3 h-3" />;
      case 'comment': return <MessageSquare className="w-3 h-3" />;
      case 'cursor_move': return <MousePointer className="w-3 h-3" />;
      case 'selection': return <Eye className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const getActivityText = (event: ActivityEvent) => {
    switch (event.type) {
      case 'join': return 'joined the session';
      case 'leave': return 'left the session';
      case 'edit': return 'made an edit';
      case 'comment': return 'added a comment';
      case 'cursor_move': return 'moved cursor';
      case 'selection': return 'selected text';
      default: return event.type;
    }
  };

  const renderPresenceView = () => (
    <div className="space-y-4">
      {/* Active Editors Count */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {presence.activeEditors}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Editor{presence.activeEditors !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Participants ({presence.participants.length})
        </h3>

        <div className="space-y-2">
          {presence.participants.map(participant => (
            <div
              key={participant.id}
              className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                {/* Avatar with color */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}

                  {/* Status indicator */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getStatusColor(participant.status)}`} />
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {participant.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {participant.email}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-semibold capitalize ${participant.status === 'active'
                      ? 'text-green-600 dark:text-green-400'
                      : participant.status === 'idle'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {participant.status}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {participant.status !== 'offline' && participant.lastSeen && (
                      <>Last seen {Math.round((Date.now() - participant.lastSeen.getTime()) / 1000)}s ago</>
                    )}
                  </div>
                </div>
              </div>

              {/* Cursor/Selection Info */}
              {participant.status === 'active' && (participant.cursor || participant.selection) && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  {participant.cursor && (
                    <div className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3" />
                      Cursor at line {participant.cursor.line}, col {participant.cursor.column}
                    </div>
                  )}
                  {participant.selection && (
                    <div className="flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />
                      Selected {participant.selection.end - participant.selection.start} characters
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivityView = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        Recent Activity
      </h3>

      {activityFeed.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No activity yet
        </div>
      ) : (
        <div className="space-y-2">
          {activityFeed.map(event => {
            const participant = presence.participants.find(p => p.id === event.userId);

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: participant?.color || '#9CA3AF' }}
                  >
                    {event.userName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {event.userName}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {getActivityText(event)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>

                    {/* Event-specific metadata */}
                    {event.metadata && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                        {event.type === 'edit' && event.metadata.edit && (
                          <div>
                            <span className="font-semibold">{event.metadata.edit.type}:</span>{' '}
                            {event.metadata.edit.content.substring(0, 50)}
                            {event.metadata.edit.content.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Activity Icon */}
                  <div className="text-gray-400">
                    {getActivityIcon(event.type)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed right-4 top-20 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Collaboration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setViewMode('presence')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'presence'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              Presence
            </div>
          </button>
          <button
            onClick={() => setViewMode('activity')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'activity'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" />
              Activity
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'presence' && renderPresenceView()}
        {viewMode === 'activity' && renderActivityView()}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            Live
          </div>
          <div>
            Last synced: {presence.lastSync.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Collaborative Cursor Component
 */
export function CollaborativeCursor({ participant }: { participant: Participant }) {
  if (!participant.cursor) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${participant.cursor.column * 8}px`,
        top: `${participant.cursor.line * 24}px`,
      }}
    >
      <div className="flex items-center gap-1">
        <MousePointer
          className="w-4 h-4 drop-shadow-lg"
          style={{ color: participant.color }}
        />
        <div
          className="px-2 py-0.5 rounded text-white text-xs font-semibold whitespace-nowrap drop-shadow-lg"
          style={{ backgroundColor: participant.color }}
        >
          {participant.name}
        </div>
      </div>
    </div>
  );
}

/**
 * Collaborative Selection Component
 */
export function CollaborativeSelection({ participant }: { participant: Participant }) {
  if (!participant.selection) return null;

  return (
    <div
      className="absolute pointer-events-none opacity-30 rounded"
      style={{
        backgroundColor: participant.color,
        left: 0,
        right: 0,
        // Note: In production, calculate actual position based on selection
      }}
    />
  );
}
