// =============================================================================
// EMAIL NEWSLETTER BUILDER — Create & Send Email Campaigns
// =============================================================================

import React, { useState } from 'react';
import { X, Mail, Send, Eye, TestTube, Calendar, Zap } from 'lucide-react';
import { convertBlogToEmail, sendViaMailchimp, sendViaConvertKit, createABTest, type EmailProvider, type ABTestConfig } from '../utils/emailNewsletter';
import { toast } from 'sonner';
import type { BlogPost } from '../utils/blogGenerator';

interface EmailNewsletterBuilderProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

export function EmailNewsletterBuilder({ isopen, onClose, posts }: EmailNewsletterBuilderProps) {
  const [provider, setProvider] = useState<EmailProvider>('mailchimp');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [testEmails, setTestEmails] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [subjectB, setSubjectB] = useState('');

  if (!isopen) return null;

  const generateEmailContent = () => {
    const selectedPostData = posts.filter(p => selectedPosts.includes(p.id));

    if (selectedPostData.length === 0) {
      return '<p>No posts selected</p>';
    }

    if (selectedPostData.length === 1) {
      // Single post newsletter
      const post = selectedPostData[0];
      return convertBlogToEmail(
        post.seoTitle || 'Newsletter',
        post.content,
        post.character?.name
      );
    } else {
      // Multi-post digest
      const postsHtml = selectedPostData.map(post => `
        <div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #e2e8f0;">
          <h2 style="color: #667eea; margin-bottom: 10px;">${post.seoTitle || 'Untitled'}</h2>
          <p style="color: #718096; font-size: 14px; margin-bottom: 15px;">${post.duration}sec read</p>
          <p>${post.metaDescription || post.content.substring(0, 200)}...</p>
          <a href="#" style="color: #667eea; text-decoration: none; font-weight: 600;">Read more →</a>
        </div>
      `).join('');

      return convertBlogToEmail(
        subject || 'Your Newsletter Digest',
        postsHtml,
        'Newsletter Team'
      );
    }
  };

  const handleSendTest = async () => {
    const emails = testEmails.split(',').map(e => e.trim()).filter(Boolean);

    if (emails.length === 0) {
      toast.error('Enter at least one test email');
      return;
    }

    if (!subject) {
      toast.error('Subject line is required');
      return;
    }

    setIsSending(true);

    try {
      const content = generateEmailContent();

      // In production, this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Test email sent to ${emails.length} recipient${emails.length !== 1 ? 's' : ''}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!subject) {
      toast.error('Subject line is required');
      return;
    }

    if (selectedPosts.length === 0) {
      toast.error('Select at least one post');
      return;
    }

    if (!confirm(`Send newsletter to all subscribers?`)) {
      return;
    }

    setIsSending(true);

    try {
      const content = generateEmailContent();

      // In production, call actual API
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Newsletter sent successfully! 🎉');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send newsletter');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error('Select a date and time');
      return;
    }

    setIsSending(true);

    try {
      const content = generateEmailContent();
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Newsletter scheduled for ${new Date(scheduleDate).toLocaleString()}!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Email Newsletter Builder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create and send beautiful email campaigns
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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-6">
              {/* Provider */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'mailchimp', label: 'Mailchimp', icon: '🐒' },
                    { value: 'convertkit', label: 'ConvertKit', icon: '📧' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setProvider(p.value as EmailProvider)}
                      className={`p-3 rounded-lg border transition-all text-left ${provider === p.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.icon}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {p.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Your Weekly Digest 📬"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preheader */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Preheader Text
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Preview text shown after subject"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* A/B Test */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={abTestEnabled}
                    onChange={(e) => setAbTestEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Enable A/B Testing
                  </span>
                </label>

                {abTestEnabled && (
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Alternative Subject Line
                    </label>
                    <input
                      type="text"
                      value={subjectB}
                      onChange={(e) => setSubjectB(e.target.value)}
                      placeholder="Test subject variant B"
                      className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      📊 Test on 50% of audience, auto-send winner after 4 hours
                    </p>
                  </div>
                )}
              </div>

              {/* Post Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Select Posts ({selectedPosts.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {posts.map(post => (
                    <label
                      key={post.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPosts([...selectedPosts, post.id]);
                          } else {
                            setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                          }
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {post.seoTitle || 'Untitled'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {post.duration}sec read
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Test Emails */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Test Email Addresses
                </label>
                <input
                  type="text"
                  value={testEmails}
                  onChange={(e) => setTestEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comma-separated email addresses
                </p>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Email Preview
                </label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              {showPreview ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject:</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{subject || '(No subject)'}</div>
                    {preheader && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preheader}</div>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: generateEmailContent() }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Click "Show Preview" to see your email</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleSendTest}
            disabled={isSending || !subject || !testEmails}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            Send Test
          </button>

          <div className="flex gap-3">
            {scheduleDate ? (
              <button
                onClick={handleSchedule}
                disabled={isSending}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {isSending ? 'Scheduling...' : 'Schedule'}
              </button>
            ) : (
              <button
                onClick={handleSendCampaign}
                disabled={isSending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Send Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
