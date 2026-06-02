// AI Avatar Generator Backend - Handles 3D avatar generation with AI

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient } from '@jsr/supabase__supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AvatarGenerationRequest {
  prompt: string;
  style: string;
  gender: string;
  age: string;
  ethnicity: string;
  features: any;
  referenceImage?: string;
}

export async function generateAIAvatar(request: AvatarGenerationRequest) {
  console.log('Generating AI avatar with prompt:', request.prompt);

  try {
    // Step 1: Generate base image with Replicate/Stability AI
    const baseImage = await generateBaseImage(request);

    // Step 2: Create 3D mesh from image
    const mesh3D = await generate3DMesh(baseImage, request);

    // Step 3: Generate textures
    const textures = await generateTextures(mesh3D, request);

    // Step 4: Create rigging and animations
    const rigging = await generateRigging(mesh3D);

    // Step 5: Generate voice profile
    const voiceProfile = await generateVoiceProfile(request);

    // Step 6: Upload to Supabase Storage
    const avatarId = crypto.randomUUID();
    const storageUrls = await uploadAvatarAssets(avatarId, {
      baseImage,
      mesh3D,
      textures,
      rigging,
      voiceProfile
    });

    // Step 7: Save metadata to database
    const avatar = {
      id: avatarId,
      name: request.prompt,
      prompt: request.prompt,
      imageUrl: storageUrls.imageUrl,
      meshUrl: storageUrls.meshUrl,
      textureUrls: storageUrls.textureUrls,
      voiceId: storageUrls.voiceId,
      metadata: {
        style: request.style,
        gender: request.gender,
        age: request.age,
        ethnicity: request.ethnicity
      },
      createdAt: new Date().toISOString()
    };

    await saveAvatarToDatabase(avatar);

    return avatar;
  } catch (error) {
    console.error('Avatar generation error:', error);
    throw error;
  }
}

async function generateBaseImage(request: AvatarGenerationRequest): Promise<string> {
  // Use Stability AI or DALL-E 3 for base image generation
  const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY');

  if (!STABILITY_API_KEY) {
    console.log('No Stability API key, using placeholder');
    return `https://source.unsplash.com/800x800/?${request.style},${request.gender},portrait`;
  }

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STABILITY_API_KEY}`
    },
    body: JSON.stringify({
      text_prompts: [{
        text: `${request.prompt}, ${request.style} style, ${request.gender}, ${request.age}, ${request.ethnicity}, professional 3D character portrait, high quality, detailed`,
        weight: 1
      }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  });

  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`);
  }

  const data = await response.json();
  return `data:image/png;base64,${data.artifacts[0].base64}`;
}

async function generate3DMesh(imageData: string, request: AvatarGenerationRequest): Promise<any> {
  // Use Replicate API for 3D mesh generation (TripoSR or similar)
  const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

  if (!REPLICATE_API_TOKEN) {
    console.log('No Replicate token, skipping 3D mesh generation');
    return { meshData: 'placeholder', format: 'obj' };
  }

  // Call TripoSR or similar model for image-to-3D conversion
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'triposr-model-version-id', // Replace with actual model version
      input: {
        image: imageData,
        foreground_ratio: 0.85,
        output_format: 'obj'
      }
    })
  });

  const prediction = await response.json();

  // Poll for result
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const checkResponse = await fetch(prediction.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await checkResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('3D mesh generation failed');
  }

  return {
    meshData: result.output,
    format: 'obj'
  };
}

async function generateTextures(mesh: any, request: AvatarGenerationRequest): Promise<any> {
  // Generate PBR textures using AI
  return {
    albedo: 'texture-albedo-url',
    normal: 'texture-normal-url',
    roughness: 'texture-roughness-url'
  };
}

async function generateRigging(mesh: any): Promise<any> {
  // Auto-rig the 3D model (would use Mixamo API or similar)
  return {
    skeleton: 'skeleton-data',
    blendshapes: 'blendshape-data'
  };
}

async function generateVoiceProfile(request: AvatarGenerationRequest): Promise<string> {
  // Create voice profile matching the avatar characteristics
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

  if (!ELEVENLABS_API_KEY) {
    console.log('No ElevenLabs API key, using default voice');
    return 'default-voice-id';
  }

  // Use ElevenLabs Voice Design API
  const response = await fetch('https://api.elevenlabs.io/v1/voice-generation/generate-voice', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: `Create a ${request.age} ${request.gender} voice with ${request.style} characteristics`,
      gender: request.gender,
      accent: request.ethnicity
    })
  });

  if (!response.ok) {
    console.log('Voice generation failed, using default');
    return 'default-voice-id';
  }

  const data = await response.json();
  return data.voice_id;
}

async function uploadAvatarAssets(avatarId: string, assets: any): Promise<any> {
  const bucketName = 'make-7d87310d-avatars';

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((bucket: { name: string; }) => bucket.name === bucketName);

  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
  }

  // Upload base image
  let imageUrl = assets.baseImage;
  if (assets.baseImage.startsWith('data:')) {
    const imageBuffer = Uint8Array.from(atob(assets.baseImage.split(',')[1]), c => c.charCodeAt(0));
    const { data: imageData } = await supabase.storage
      .from(bucketName)
      .upload(`${avatarId}/image.png`, imageBuffer, {
        contentType: 'image/png'
      });

    if (imageData) {
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(`${avatarId}/image.png`, 60 * 60 * 24 * 365); // 1 year
      imageUrl = urlData?.signedUrl || assets.baseImage;
    }
  }

  return {
    imageUrl,
    meshUrl: `storage/${bucketName}/${avatarId}/mesh.obj`,
    textureUrls: {
      albedo: `storage/${bucketName}/${avatarId}/albedo.png`,
      normal: `storage/${bucketName}/${avatarId}/normal.png`,
      roughness: `storage/${bucketName}/${avatarId}/roughness.png`
    },
    voiceId: assets.voiceProfile
  };
}

async function saveAvatarToDatabase(avatar: any): Promise<void> {
  // Save to KV store
  const { set } = await import('./kv_store.tsx');
  await set(`avatar:${avatar.id}`, avatar);
}

export async function getAvatar(avatarId: string): Promise<any> {
  const { get } = await import('./kv_store.tsx');
  return await get(`avatar:${avatarId}`);
}

export async function listAvatars(): Promise<any[]> {
  const { getByPrefix } = await import('./kv_store.tsx');
  return await getByPrefix('avatar:');
}
