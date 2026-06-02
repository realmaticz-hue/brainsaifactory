FIGMA MAKE — MASTER BRAIN COMMAND
ULTIMATE AI SOCIAL MEDIA PLATFORM BUILDER

MISSION
Build a complete AI-powered social media management platform that allows users to connect social accounts, generate content with AI, schedule posts, automatically publish content across multiple platforms, and analyze performance through advanced analytics dashboards.

The platform must function similarly to professional social management systems.

SUPPORTED SOCIAL PLATFORMS

Facebook
Instagram
X (Twitter)
TikTok
YouTube
LinkedIn
Pinterest

The platform must allow users to connect accounts from these providers and manage them from a unified dashboard.

PLATFORM MODULES

The system must include the following major components:

Social Account Connection System
Universal OAuth Handler
Social Account Discovery Engine
Social Posting Permission Validator
Multi-Platform Posting Engine
AI Content Generation Engine
Social Analytics Intelligence Engine

Each module must be implemented as part of a scalable architecture.

SOCIAL ACCOUNT CONNECTION SYSTEM

Create a Social Accounts dashboard:

/dashboard/social

Users must be able to connect social accounts using OAuth authentication.

Display connected accounts including:

provider name
account username
profile image
connection status
last token refresh time

Include Connect Account and Reconnect Account buttons.

UNIVERSAL OAUTH HANDLER

Create universal OAuth routes:

/oauth/:provider/login
/oauth/:provider/callback
/api/oauth/:provider

The callback route must never render a blank screen.

Display connection progress messages:

Connecting account
Retrieving permissions
Saving credentials
Finalizing connection

If connection fails display reconnect option.

SOCIAL ACCOUNT DISCOVERY ENGINE

After successful OAuth authentication automatically discover available accounts.

Examples:

Facebook Pages
Instagram Business Accounts
YouTube Channels
LinkedIn Organization Pages
TikTok Creator Accounts

Automatically connect discovered accounts and display them in the dashboard.

Duplicate accounts must not be created.

SOCIAL PERMISSION VALIDATION

Verify that connected accounts have correct permissions to publish content.

Examples:

Facebook pages_manage_posts
Instagram instagram_content_publish
LinkedIn organization posting permissions

If permissions are missing mark account status as permission_error and prompt user to reconnect.

MULTI-PLATFORM POST COMPOSER

Create post composer interface:

/dashboard/create-post

Include:

text editor
media uploader
platform selection
account selection
schedule date and time picker
publish now button
schedule post button

Display preview of post for each platform.

POST SCHEDULING ENGINE

Create queue-based posting system.

Scheduled posts must be stored with:

user_id
content
media_urls
target_accounts
target_platforms
scheduled_publish_time
status

Status values include:

scheduled
queued
publishing
published
failed

The queue engine must monitor scheduled posts and publish them automatically at the correct time.

RETRY SYSTEM

If a publishing attempt fails retry automatically using exponential backoff.

Retry attempts:

1 minute
5 minutes
15 minutes

If still unsuccessful mark post as failed and allow manual retry.

AI CONTENT GENERATION ENGINE

Add AI tools inside post composer.

Features must include:

Generate Caption
Generate Hashtags
Generate Post Variations
Suggest Best Posting Time
Optimize Content

The AI must tailor generated content for each platform.

Examples:

Instagram hashtag optimization
X character limit enforcement
LinkedIn professional tone
YouTube video title generation

AI CONTENT SCORING

Evaluate each post before publishing.

Score based on:

engagement potential
clarity
call to action strength
hashtag relevance

Display score meter from 0–100 in composer interface.

Provide suggestions for improving content quality.

MEDIA HANDLING

Allow uploading images and videos.

Supported formats:

JPG
PNG
MP4
MOV

Automatically resize and compress media for each platform's requirements.

SOCIAL ANALYTICS DASHBOARD

Create analytics page:

/dashboard/analytics

Display metrics including:

total followers
total impressions
total engagement
top performing posts
follower growth trends

Use visual charts and graphs to present analytics.

POST PERFORMANCE TRACKING

Track metrics for each published post:

likes
comments
shares
views
clicks
saves

Calculate engagement rate:

engagement_rate = total_engagement / total_impressions

Display these metrics inside analytics dashboard.

AI PERFORMANCE INSIGHTS

Analyze engagement data and generate insights such as:

best performing content types
optimal posting times
top performing hashtags
platform engagement comparisons

Display recommendations to improve social media strategy.

AUTOMATED REPORTS

Generate weekly analytics reports including:

posts published
engagement totals
top performing posts
follower growth
AI-generated recommendations

Display reports inside the analytics dashboard.

ACCOUNT PERFORMANCE OVERVIEW

Each connected social account must display performance summary:

followers
engagement rate
total posts
growth trends

SCALABLE ARCHITECTURE

All providers must use a modular configuration system including:

provider_name
oauth_authorize_url
token_endpoint
post_endpoint
analytics_endpoint
required_permissions

The platform must support adding future social providers without rewriting core systems.

USER EXPERIENCE GOAL

The platform must allow a user to:

Connect social accounts in seconds
Automatically discover all accounts they manage
Create AI-generated posts quickly
Schedule posts across multiple platforms
Publish posts reliably through a queue engine
Analyze performance with clear dashboards and insights

FINAL RESULT

The completed platform must function as a full AI-powered social media management system capable of connecting accounts, publishing posts, generating content, and analyzing engagement across multiple social platforms.

END COMMAND
