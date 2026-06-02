// Caption AI Integration Service
// Complete avatar generation with voice synthesis, lip-sync, and video creation

interface CaptionAIVideoRequest {
  avatarImageUrl: string;
  script: string;
  voiceId?: string;
  language?: string;
  emotion?: string;
  background?: string;
  settings?: {
    speed?: number;
    pitch?: number;
    volume?: number;
    lipSync?: boolean;
    gestures?: boolean;
  };
}

interface CaptionAIVideoResponse {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  status?: string;
  error?: string;
}

/**
 * Generate a talking avatar video using Caption AI
 * 
 * @param apiKey - Caption AI API key
 * @param request - Video generation request
 * @returns Video generation response
 */
export async function generateVideoWithCaptionAI(
  apiKey: string,
  request: CaptionAIVideoRequest
): Promise<CaptionAIVideoResponse> {
  try {
    console.log('Starting Caption AI video generation...');

    // Step 1: Create video generation job
    const createResponse = await fetch('https://api.captions.ai/v1/videos/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar: {
          image_url: request.avatarImageUrl,
          emotion: request.emotion || 'neutral',
        },
        audio: {
          text: request.script,
          voice_id: request.voiceId || 'default',
          language: request.language || 'en-US',
          speed: request.settings?.speed || 1.0,
          pitch: request.settings?.pitch || 1.0,
          volume: request.settings?.volume || 1.0,
        },
        video: {
          background: request.background || 'transparent',
          lip_sync: request.settings?.lipSync !== false,
          gestures: request.settings?.gestures !== false,
          resolution: '1080p',
          format: 'mp4',
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Caption AI API error: ${errorData.message || 'Unknown error'}`);
    }

    const createData = await createResponse.json();
    const videoId = createData.id || createData.video_id;

    console.log(`Caption AI video job created: ${videoId}`);

    // Step 2: Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    let videoUrl = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://api.captions.ai/v1/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check video status');
      }

      const statusData = await statusResponse.json();
      console.log(`Caption AI status: ${statusData.status}`);

      if (statusData.status === 'completed') {
        videoUrl = statusData.video_url || statusData.url;
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Video generation failed: ${statusData.error || 'Unknown error'}`);
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    console.log(`Caption AI video completed: ${videoUrl}`);

    return {
      success: true,
      videoId,
      videoUrl,
      status: 'completed',
    };

  } catch (error) {
    console.error('Caption AI generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get available voices from Caption AI
 * 
 * @param apiKey - Caption AI API key
 * @param language - Optional language filter
 * @returns List of available voices
 */
export async function getCaptionAIVoices(apiKey: string, language?: string) {
  try {
    const url = language
      ? `https://api.captions.ai/v1/voices?language=${language}`
      : 'https://api.captions.ai/v1/voices';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return {
      success: true,
      voices: data.voices || [],
    };

  } catch (error) {
    console.error('Get voices error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      voices: [],
    };
  }
}

/**
 * Generate voice preview
 * 
 * @param apiKey - Caption AI API key
 * @param text - Text to synthesize
 * @param voiceId - Voice ID
 * @returns Audio URL
 */
export async function generateVoicePreview(
  apiKey: string,
  text: string,
  voiceId: string
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    const response = await fetch('https://api.captions.ai/v1/audio/synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate voice preview');
    }

    const data = await response.json();

    return {
      success: true,
      audioUrl: data.audio_url || data.url,
    };

  } catch (error) {
    console.error('Voice preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload avatar image to Caption AI
 * 
 * @param apiKey - Caption AI API key
 * @param imageData - Base64 image data
 * @returns Uploaded image URL
 */
export async function uploadAvatarImage(
  apiKey: string,
  imageData: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const response = await fetch('https://api.captions.ai/v1/images/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();

    return {
      success: true,
      imageUrl: data.image_url || data.url,
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Caption AI account status
 * 
 * @param apiKey - Caption AI API key
 * @returns Account information
 */
export async function checkCaptionAIAccount(apiKey: string) {
  try {
    const response = await fetch('https://api.captions.ai/v1/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API key or account error');
    }

    const data = await response.json();

    return {
      success: true,
      account: data,
    };

  } catch (error) {
    console.error('Account check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
