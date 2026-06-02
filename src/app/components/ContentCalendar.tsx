// =============================================================================
// CONTENT CALENDAR — Visual Content Planning & Scheduling
// =============================================================================

import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Edit2, Trash2, Plus, Filter } from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import { toast } from 'sonner';

interface CalendarEvent extends BlogPost {
  scheduledDate?: Date;
  publishStatus?: 'draft' | 'scheduled' | 'published';
}

interface ContentCalendarProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  onSchedulePost: (postId: string, date: Date) => void;
  onDeleteSchedule: (postId: string) => void;
}

export function ContentCalendar({ isopen, onClose, posts, onSchedulePost, onDeleteSchedule }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');

  if (!isopen) return null;

  // Convert posts to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return posts.map(post => ({
      ...post,
      scheduledDate: post.timestamp ? new Date(post.timestamp) : undefined,
      publishStatus: 'draft' as const,
    }));
  }, [posts]);

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];

    return events.filter(event => {
      if (!event.scheduledDate) return false;
      const eventDate = new Date(event.scheduledDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        (filterStatus === 'all' || event.publishStatus === filterStatus)
      );
    });
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format month/year
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Calculate stats
  const totalScheduled = events.filter(e => e.scheduledDate).length;
  const thisMonthScheduled = events.filter(e => {
    if (!e.scheduledDate) return false;
    const date = new Date(e.scheduledDate);
    return date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear();
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Content Calendar</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {totalScheduled} posts scheduled · {thisMonthScheduled} this month
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

          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="min-w-[200px] text-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{monthYear}</h3>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-semibold"
              >
                Today
              </button>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Posts</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="text-center py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, idx) => {
              const isToday = date &&
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              const dayEvents = date ? getEventsForDate(date) : [];
              const isSelected = selectedDate && date &&
                selectedDate.getDate() === date.getDate() &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getFullYear() === date.getFullYear();

              return (
                <div
                  key={idx}
                  onClick={() => date && setSelectedDate(date)}
                  className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all ${date
                    ? isSelected
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : 'bg-gray-50 dark:bg-gray-900/50 cursor-default'
                    }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${isToday
                        ? 'w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center'
                        : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {date.getDate()}
                      </div>

                      {/* Event indicators */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded truncate font-medium"
                            title={event.seoTitle || event.content.substring(0, 100)}
                          >
                            {event.duration}s · {(event.seoTitle || event.content).substring(0, 20)}...
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Sidebar */}
        {selectedDate && (
          <div className="w-full border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {event.duration}s READ
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            {event.publishStatus}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                          {event.seoTitle || 'Untitled Post'}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {event.metaDescription || event.content.substring(0, 100)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            onDeleteSchedule(event.id);
                            toast.success('Removed from calendar');
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove from calendar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No posts scheduled for this date</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
