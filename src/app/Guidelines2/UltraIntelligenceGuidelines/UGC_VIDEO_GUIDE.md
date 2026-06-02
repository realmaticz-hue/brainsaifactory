# UGC Video Characters Feature

## Overview
The UGC (User Generated Content) Video Characters feature allows you to create shareable video content with animated AI characters speaking your blog post scripts. This is perfect for creating engaging social media content for platforms like TikTok, Instagram Reels, and YouTube Shorts.

## How It Works

### 1. Video Character Component
- **Animated Canvas**: Each character is rendered on an HTML5 canvas with dynamic animations
- **Lip Sync**: Simple mouth animation that syncs with the AI voice playback
- **Visual Effects**: Sound waves, glowing borders, and progress indicators for engagement
- **Live Indicator**: Red "LIVE" badge appears during recording

### 2. Video Recording
- **Canvas Capture**: Uses MediaRecorder API to capture the canvas at 30 FPS
- **Audio Integration**: Combines canvas video with AI voice audio stream
- **WebM Export**: Videos are exported in WebM format (vp9 codec) for high quality
- **Download**: One-click download of the finished video

### 3. Character Features
- **Sarah**: Professional female voice with higher pitch
- **Marcus**: Deep male voice with authoritative tone
- **Alex**: Energetic young voice with fast pace
- **Jordan**: Warm narrator with neutral, steady delivery

## Usage Instructions

### Creating a UGC Video:
1. Generate blog posts by entering a website URL
2. Click the "UGC Video" button on any blog post card
3. In the modal, click "Record Video" to start recording
4. Click "Play Voice" to have the character speak the blog post
5. Wait for the voice to complete
6. Click "Stop Recording" when finished
7. Download your video and share on social media!

## Technical Implementation

### Components Created:
- **VideoCharacter.tsx**: Animated canvas component with character rendering
- **VideoRecorder.tsx**: Video recording and export functionality
- **VideoModal.tsx**: Full-screen modal for video creation workflow

### Key Technologies:
- HTML5 Canvas API for animation
- Web Speech API for voice synthesis
- MediaRecorder API for video capture
- RequestAnimationFrame for smooth animations

## Best Practices

### For 7-Second Videos:
- Perfect for quick hooks and attention-grabbing content
- Use punchy, direct messaging
- Ideal for TikTok and Instagram Reels
- Focus on one key product or message

### For 30-Second Videos:
- Great for detailed product showcases
- Tell a complete story
- Include multiple product features
- Works well for YouTube Shorts and longer Reels

### Social Media Tips:
- Add captions in post-production (85% watch without sound)
- Use trending sounds or music after downloading
- Post during peak hours (6-9am, 5-9pm)
- Create multiple variations for A/B testing
- Optimize for vertical format (9:16 aspect ratio)

## Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 14.3+)
- ⚠️ Opera: Full support
- ⚠️ Older browsers: May not support MediaRecorder API

## Future Enhancements
- Multiple video templates and backgrounds
- Custom background music integration
- Text overlay options
- Video editing tools (trim, crop)
- Direct social media posting
- Multiple character animations
- Custom character uploads
