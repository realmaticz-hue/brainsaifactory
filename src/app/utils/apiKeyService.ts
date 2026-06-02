// API Key Service - Manage API keys for avatar generation providers
import { projectId, publicAnonKey } from './supabase/info';
import { serverFetch } from './serverFetch';

export type Provider = 'captionai' | 'did' | 'azure' | 'elevenlabs' | 'heygen';

interface APIKeyConfig {
  provider: Provider;
  apiKey: string;
  region?: string; // For Azure
  createdAt?: number;
}

// Check if API key is configured for a provider
export async function hasAPIKey(provider: Provider): Promise<boolean> {
  try {
    const config = await getAPIKey(provider);
    return !!config?.apiKey;
  } catch {
    return false;
  }
}

// Get API key configuration for a provider
export async function getAPIKey(provider: Provider): Promise<APIKeyConfig | null> {
  try {
    const response = await serverFetch(`/api-keys/${provider}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.config || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// Save API key configuration
export async function saveAPIKey(config: APIKeyConfig): Promise<boolean> {
  try {
    const response = await serverFetch('/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        createdAt: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save API key');
    }

    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

// Test API key validity
export async function testAPIKey(config: APIKeyConfig): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await serverFetch('/api-keys/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      return { valid: true };
    } else {
      return { valid: false, error: data.error || 'Invalid API key' };
    }
  } catch (error) {
    console.error('Error testing API key:', error);
    return { valid: false, error: 'Connection error' };
  }
}

// Delete API key
export async function deleteAPIKey(provider: Provider): Promise<boolean> {
  try {
    const response = await serverFetch(`/api-keys/${provider}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
}

// Get recommended provider based on what's configured
export async function getRecommendedProvider(): Promise<Provider> {
  const providers: Provider[] = ['captionai', 'did', 'azure', 'elevenlabs', 'heygen'];
  
  for (const provider of providers) {
    const hasKey = await hasAPIKey(provider);
    if (hasKey) {
      return provider;
    }
  }
  
  // Default to Caption AI (recommended)
  return 'captionai';
}

// Check all configured providers
export async function getConfiguredProviders(): Promise<Provider[]> {
  const providers: Provider[] = ['captionai', 'did', 'azure', 'elevenlabs', 'heygen'];
  const configured: Provider[] = [];
  
  for (const provider of providers) {
    const hasKey = await hasAPIKey(provider);
    if (hasKey) {
      configured.push(provider);
    }
  }
  
  return configured;
}