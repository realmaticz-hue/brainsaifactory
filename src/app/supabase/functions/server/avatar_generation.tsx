// REAL Avatar Video Generation with AI APIs
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  writeFile(path: string, data: Uint8Array): Promise<void>;
};

import * as kv from "./kv_store.tsx";
import { generateVideoWithCaptionAI, getCaptionAIVoices, generateVoicePreview as captionAIVoicePreview, uploadAvatarImage as captionAIUploadImage } from "./captionai_service.tsx";
import { Context } from "hono";

// Main avatar generation route
export async function handleGenerateAvatar(c: Context) {
  try {
    const body = await c.req.json();
    const {
      avatarImageUrl,
      script,
      voiceId,
      voiceName,
      speechSpeed = 1.0,
      pitch = 1.0,
      emotion = 'neutral',
      background,
      provider = 'captionai', // 'captionai', 'did', 'heygen', 'azure+wav2lip', 'elevenlabs+wav2lip'
    } = body;

    if (!avatarImageUrl || !script) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get API key for provider
    const apiKeyConfig = await kv.get(`api-key-${provider}`);
    if (!apiKeyConfig) {
      return c.json({
        error: `No API key configured for ${provider}. Please set up your API key first.`,
        needsSetup: true
      }, 400);
    }

    let videoUrl: string;
    let method: string;

    // Choose generation method based on provider
    switch (provider) {
      case 'captionai':
        // Caption AI - Complete solution (recommended!)
        const captionResult = await generateVideoWithCaptionAI(apiKeyConfig.apiKey, {
          avatarImageUrl,
          script,
          voiceId: voiceId || 'default',
          emotion,
          background,
          settings: {
            speed: speechSpeed,
            pitch,
            lipSync: true,
            gestures: true,
          }
        });

        if (!captionResult.success) {
          throw new Error(captionResult.error || 'Caption AI generation failed');
        }

        videoUrl = captionResult.videoUrl!;
        method = 'Caption AI';
        break;

      case 'did':
        // D-ID - Complete solution (TTS + Lip-sync in one)
        videoUrl = await generateVideoWithDID(apiKeyConfig.apiKey, avatarImageUrl, script, voiceName || 'en-US-JennyNeural');
        method = 'D-ID API';
        break;

      case 'heygen':
        // HeyGen - Premium solution
        const videoId = await generateVideoWithHeyGen(apiKeyConfig.apiKey, avatarImageUrl, script, voiceId);
        videoUrl = `https://api.heygen.com/v1/video/${videoId}`;
        method = 'HeyGen API';
        break;

      case 'azure+wav2lip':
        // Azure TTS + Wav2Lip for lip-sync
        const azureAudio = await generateVoiceWithAzure(apiKeyConfig.apiKey, script, voiceName, speechSpeed, pitch);
        const wav2lipVideo = await generateVideoWithWav2Lip(avatarImageUrl, azureAudio);

        // Save to temp file and return URL
        const tempPath = `/tmp/video-${Date.now()}.mp4`;
        await Deno.writeFile(tempPath, wav2lipVideo);
        videoUrl = tempPath; // In production, upload to storage
        method = 'Azure TTS + Wav2Lip';
        break;

      case 'elevenlabs+wav2lip':
        // ElevenLabs + Wav2Lip
        const elevenLabsAudio = await generateVoiceWithElevenLabs(apiKeyConfig.apiKey, script, voiceId);
        const wav2lipVideoEL = await generateVideoWithWav2Lip(avatarImageUrl, elevenLabsAudio);

        const tempPathEL = `/tmp/video-${Date.now()}.mp4`;
        await Deno.writeFile(tempPathEL, wav2lipVideoEL);
        videoUrl = tempPathEL;
        method = 'ElevenLabs + Wav2Lip';
        break;

      default:
        return c.json({ error: 'Invalid provider' }, 400);
    }

    return c.json({
      success: true,
      videoUrl,
      method,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Avatar generation error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
}

// Voice preview route
export async function handleVoicePreview(c: Context) {
  try {
    const body = await c.req.json();
    const { text, voiceId, voiceName, provider = 'azure' } = body;

    let audioBuffer: Uint8Array;

    if (provider === 'azure') {
      const apiKeyConfig = await kv.get(`api-key-${provider}`);
      if (!apiKeyConfig) {
        return c.json({
          error: `No API key configured for ${provider}. Please set up your API key first.`,
          needsSetup: true
        }, 400);
      }
      audioBuffer = await generateVoiceWithAzure(apiKeyConfig.apiKey, text || 'Hello, this is a voice preview.', voiceName, 1.0, 1.0);
    } else if (provider === 'elevenlabs') {
      const apiKeyConfig = await kv.get(`api-key-${provider}`);
      if (!apiKeyConfig) {
        return c.json({
          error: `No API key configured for ${provider}. Please set up your API key first.`,
          needsSetup: true
        }, 400);
      }
      audioBuffer = await generateVoiceWithElevenLabs(apiKeyConfig.apiKey, text || 'Hello, this is a voice preview.', voiceId || 'default');
    } else {
      return c.json({ error: 'Invalid provider' }, 400);
    }

    // Return audio file
    return new Response(audioBuffer as BodyInit, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Voice preview error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

// Upload avatar image to storage
export async function handleUploadAvatar(c: Context) {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Read file data
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Save to temp file
    const filename = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const tempPath = `/tmp/${filename}`;
    await Deno.writeFile(tempPath, uint8Array);

    // In production, upload to Supabase Storage
    // const { createClient } = await import('npm:@supabase/supabase-js');
    // const supabase = createClient(...);
    // await supabase.storage.from('avatars').upload(filename, uint8Array);

    return c.json({
      success: true,
      url: tempPath,
      filename,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

// ============================================================
// Provider-specific implementations
// ============================================================

/**
 * Generate video with D-ID API
 */
async function generateVideoWithDID(
  apiKey: string,
  avatarImageUrl: string,
  script: string,
  voiceId: string
): Promise<string> {
  console.log('Starting D-ID video generation...');

  // Create talk
  const createResponse = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        input: script,
        provider: {
          type: 'microsoft',
          voice_id: voiceId,
        },
      },
      source_url: avatarImageUrl,
      config: {
        stitch: true,
        result_format: 'mp4',
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    throw new Error(`D-ID API error: ${errorData.message || 'Unknown error'}`);
  }

  const createData = await createResponse.json();
  const talkId = createData.id;

  console.log(`D-ID talk created: ${talkId}`);

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    const statusData = await statusResponse.json();
    console.log(`D-ID status: ${statusData.status}`);

    if (statusData.status === 'done') {
      return statusData.result_url;
    } else if (statusData.status === 'error') {
      throw new Error(`D-ID generation failed: ${statusData.error}`);
    }

    attempts++;
  }

  throw new Error('D-ID generation timed out');
}

/**
 * Generate video with HeyGen API
 */
async function generateVideoWithHeyGen(
  apiKey: string,
  avatarImageUrl: string,
  script: string,
  voiceId?: string
): Promise<string> {
  console.log('Starting HeyGen video generation...');

  const response = await fetch('https://api.heygen.com/v1/video.generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'photo',
          photo_url: avatarImageUrl,
        },
        voice: {
          type: 'text',
          input_text: script,
          voice_id: voiceId || 'default',
        },
      }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HeyGen API error: ${errorData.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.video_id;
}

/**
 * Generate voice with Azure TTS
 */
async function generateVoiceWithAzure(
  apiKey: string,
  text: string,
  voiceId: string,
  speed: number,
  pitch: number
): Promise<Uint8Array> {
  console.log('Generating voice with Azure TTS...');

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voiceId}">
        <prosody rate="${speed}" pitch="${pitch > 1 ? '+' : ''}${((pitch - 1) * 50).toFixed(0)}%">
          ${text}
        </prosody>
      </voice>
    </speak>
  `;

  const response = await fetch(
    'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    }
  );

  if (!response.ok) {
    throw new Error('Azure TTS failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate voice with ElevenLabs
 */
async function generateVoiceWithElevenLabs(
  apiKey: string,
  text: string,
  voiceId: string
): Promise<Uint8Array> {
  console.log('Generating voice with ElevenLabs...');

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
      }),
    }
  );

  if (!response.ok) {
    throw new Error('ElevenLabs TTS failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate video with Wav2Lip (placeholder - requires Python/ML setup)
 */
async function generateVideoWithWav2Lip(
  avatarImageUrl: string,
  audioBuffer: Uint8Array
): Promise<Uint8Array> {
  // This is a placeholder - actual implementation would require:
  // 1. Wav2Lip model running in a separate service
  // 2. Or integration with Replicate/Banana/similar ML hosting
  console.log('Wav2Lip integration not yet implemented - requires ML service');
  throw new Error('Wav2Lip requires additional ML infrastructure setup');
}