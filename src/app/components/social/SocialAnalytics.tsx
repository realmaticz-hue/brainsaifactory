import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle,
  Share2, Bookmark, MousePointerClick, Sparkles, ArrowUpRight,
  Calendar, Target, Award, Zap, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  metadata?: {
    followers?: number;
    engagement?: number;
  };
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  createdAt: number;
  publishedAt?: number;
  aiScore?: number;
}

interface SocialAnalyticsProps {
  accounts: ConnectedAccount[];
  posts: ScheduledPost[];
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#010101',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  youtube: '#FF0000',
};

// Generate realistic mock analytics data
function generateAnalyticsData(accounts: ConnectedAccount[], posts: ScheduledPost[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const dailyEngagement = days.map(day => ({
    name: day,
    likes: Math.floor(Math.random() * 500) + 100,
    comments: Math.floor(Math.random() * 150) + 20,
    shares: Math.floor(Math.random() * 80) + 10,
    views: Math.floor(Math.random() * 5000) + 1000,
  }));

  const weeklyFollowers = weeks.map((week, i) => ({
    name: week,
    followers: 1200 + i * Math.floor(Math.random() * 300) + 100,
    newFollowers: Math.floor(Math.random() * 200) + 50,
  }));

  const platformDistribution = accounts.map(acc => ({
    name: acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
    value: Math.floor(Math.random() * 5000) + 500,
    color: platformColors[acc.platform] || '#6b7280',
  }));

  const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    engagement: Math.floor(Math.random() * 300) + (h >= 9 && h <= 21 ? 200 : 20),
  }));

  const topHashtags = [
    { tag: '#marketing', posts: 45, engagement: 12500 },
    { tag: '#business', posts: 38, engagement: 9800 },
    { tag: '#socialmedia', posts: 32, engagement: 8700 },
    { tag: '#growth', posts: 28, engagement: 7200 },
    { tag: '#content', posts: 25, engagement: 6100 },
  ];

  const contentTypes = [
    { type: 'Image Posts', engagement: 65, count: 42 },
    { type: 'Video Posts', engagement: 82, count: 18 },
    { type: 'Text Only', engagement: 35, count: 55 },
    { type: 'Carousel', engagement: 71, count: 12 },
    { type: 'Stories', engagement: 48, count: 30 },
  ];

  return { dailyEngagement, weeklyFollowers, platformDistribution, hourlyActivity, topHashtags, contentTypes };
}

export function SocialAnalytics({ accounts, posts }: SocialAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [showInsights, setShowInsights] = useState(true);

  const data = useMemo(() => generateAnalyticsData(accounts, posts), [accounts.length, posts.length]);

  const publishedPosts = posts.filter(p => p.status === 'published');
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.metadata?.followers || Math.floor(Math.random() * 5000) + 500), 0);
  const totalEngagement = data.dailyEngagement.reduce((sum, d) => sum + d.likes + d.comments + d.shares, 0);
  const totalImpressions = data.dailyEngagement.reduce((sum, d) => sum + d.views, 0);
  const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : '0';

  const insights = [
    { icon: TrendingUp, text: 'Video posts generate 2.3x more engagement than text-only posts', priority: 'high' },
    { icon: Calendar, text: `Best posting time: Wednesday 2:00 PM based on your audience activity`, priority: 'high' },
    { icon: Award, text: '#marketing is your top-performing hashtag with 12.5K total engagement', priority: 'medium' },
    { icon: Target, text: 'Instagram has the highest engagement rate among your connected platforms', priority: 'medium' },
    { icon: Users, text: 'Your follower growth is up 18% compared to last period', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Followers', value: totalFollowers.toLocaleString(), icon: Users, change: '+18%', positive: true, color: 'from-blue-500 to-indigo-600' },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: Eye, change: '+24%', positive: true, color: 'from-purple-500 to-pink-600' },
          { label: 'Engagement', value: totalEngagement.toLocaleString(), icon: Heart, change: '+12%', positive: true, color: 'from-rose-500 to-red-600' },
          { label: 'Engagement Rate', value: `${engagementRate}%`, icon: TrendingUp, change: '+0.5%', positive: true, color: 'from-emerald-500 to-green-600' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl p-5">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5 text-gray-400" />
                <span className={`text-xs font-bold flex items-center gap-0.5 ${stat.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Performance Overview
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Daily Engagement</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.dailyEngagement}>
              <defs>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="likes" stroke="#6366f1" fillOpacity={1} fill="url(#colorLikes)" strokeWidth={2} />
              <Area type="monotone" dataKey="comments" stroke="#ec4899" fillOpacity={1} fill="url(#colorComments)" strokeWidth={2} />
              <Area type="monotone" dataKey="shares" stroke="#10b981" fillOpacity={0.1} fill="#10b981" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Follower Growth */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Follower Growth</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.weeklyFollowers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="followers" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="newFollowers" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        {data.platformDistribution.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Engagement by Platform</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.platformDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.platformDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hourly Activity */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Hourly Activity Pattern</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={3} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 12 }} />
              <Line type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Performance & Hashtags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hashtags */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>#</span> Top Performing Hashtags
          </h4>
          <div className="space-y-3">
            {data.topHashtags.map((tag, i) => (
              <div key={tag.tag} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <span className="text-sm font-bold text-indigo-600 flex-1">{tag.tag}</span>
                <span className="text-xs text-gray-500">{tag.posts} posts</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(tag.engagement / data.topHashtags[0].engagement) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-16 text-right">{(tag.engagement / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Performance */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" /> Content Type Performance
          </h4>
          <div className="space-y-3">
            {data.contentTypes.map(ct => (
              <div key={ct.type} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-28">{ct.type}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ct.engagement >= 70 ? 'bg-green-500' : ct.engagement >= 50 ? 'bg-yellow-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${ct.engagement}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {ct.engagement}% eng. rate
                  </span>
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{ct.count} posts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {showInsights && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Performance Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-indigo-100">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    insight.priority === 'high' ? 'bg-indigo-100' : insight.priority === 'medium' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      insight.priority === 'high' ? 'text-indigo-600' : insight.priority === 'medium' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-700">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Performance Overview */}
      {accounts.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Account Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => {
              const followers = account.metadata?.followers || Math.floor(Math.random() * 5000) + 500;
              const engagement = account.metadata?.engagement || parseFloat((Math.random() * 5 + 1).toFixed(2));
              const totalPosts = posts.filter(p => p.platforms.includes(account.platform)).length;
              const growthPercent = (Math.random() * 20 - 5).toFixed(1);
              const isGrowing = parseFloat(growthPercent) > 0;

              return (
                <div key={account.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center text-xs font-bold`}
                      style={{ backgroundColor: platformColors[account.platform] || '#6b7280' }}
                    >
                      {account.platform.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">@{account.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{account.platform}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{followers.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Followers</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{engagement}%</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Eng. Rate</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-gray-900">{totalPosts}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Posts</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-lg font-black ${isGrowing ? 'text-green-600' : 'text-red-500'}`}>
                        {isGrowing ? '+' : ''}{growthPercent}%
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Growth</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
