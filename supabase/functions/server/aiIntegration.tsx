// =============================================================================
// AI INTEGRATION — Server-side AI Provider
// =============================================================================
//
// Server-side AI integration for blog post generation.
// Supports OpenAI, Anthropic, and Google AI APIs.
//
// =============================================================================

// AI Provider type
type AIProvider = 'openai' | 'anthropic' | 'google';

// Model pricing (per million tokens)
interface ModelPricing {
  input: number;
  output: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-haiku-4': { input: 0.25, output: 1.25 },
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-flash': { input: 0.075, output: 0.30 },
};

// =============================================================================
// OPENAI INTEGRATION
// =============================================================================

async function generateWithOpenAI(
  prompt: string,
  model: string = 'gpt-3.5-turbo',
  maxTokens: number = 2000
): Promise<{ content: string; tokens: { input: number; output: number } }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    tokens: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
    },
  };
}

// =============================================================================
// ANTHROPIC INTEGRATION
// =============================================================================

async function generateWithAnthropic(
  prompt: string,
  model: string = 'claude-sonnet-4-20250514',
  maxTokens: number = 2000
): Promise<{ content: string; tokens: { input: number; output: number } }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || '',
    tokens: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
  };
}

// =============================================================================
// GOOGLE AI INTEGRATION
// =============================================================================

async function generateWithGoogle(
  prompt: string,
  model: string = 'gemini-pro',
  maxTokens: number = 2000
): Promise<{ content: string; tokens: { input: number; output: number } }> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`Google AI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // Estimate tokens (Google doesn't provide exact counts in response)
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  const estimatedOutputTokens = Math.ceil(content.length / 4);

  return {
    content,
    tokens: {
      input: estimatedInputTokens,
      output: estimatedOutputTokens,
    },
  };
}

// =============================================================================
// UNIFIED AI GENERATION
// =============================================================================

export interface AIGenerateOptions {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  complexity?: 'low' | 'medium' | 'high';
  budgetPreference?: 'cost' | 'quality' | 'balanced';
}

export interface AIGenerateResult {
  content: string;
  provider: AIProvider;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  success: boolean;
  error?: string;
}

/**
 * Determine the best model based on complexity and budget
 */
function selectModel(
  complexity: 'low' | 'medium' | 'high' = 'medium',
  budgetPreference: 'cost' | 'quality' | 'balanced' = 'balanced'
): { provider: AIProvider; model: string } {
  // Check which providers are configured
  const hasOpenAI = !!Deno.env.get('OPENAI_API_KEY');
  const hasAnthropic = !!Deno.env.get('ANTHROPIC_API_KEY');
  const hasGoogle = !!Deno.env.get('GOOGLE_API_KEY');

  // If no providers configured, return null (will use fallback)
  if (!hasOpenAI && !hasAnthropic && !hasGoogle) {
    throw new Error('No AI providers configured');
  }

  // Select based on complexity and budget
  if (budgetPreference === 'cost') {
    // Cheapest options
    if (complexity === 'low' && hasGoogle) return { provider: 'google', model: 'gemini-flash' };
    if (complexity === 'low' && hasAnthropic) return { provider: 'anthropic', model: 'claude-haiku-4' };
    if (hasGoogle) return { provider: 'google', model: 'gemini-pro' };
    if (hasAnthropic) return { provider: 'anthropic', model: 'claude-haiku-4' };
    if (hasOpenAI) return { provider: 'openai', model: 'gpt-3.5-turbo' };
  } else if (budgetPreference === 'quality') {
    // Highest quality
    if (complexity === 'high' && hasAnthropic) return { provider: 'anthropic', model: 'claude-opus-4' };
    if (hasOpenAI) return { provider: 'openai', model: 'gpt-4-turbo' };
    if (hasAnthropic) return { provider: 'anthropic', model: 'claude-sonnet-4' };
    if (hasGoogle) return { provider: 'google', model: 'gemini-pro' };
  } else {
    // Balanced (best value)
    if (complexity === 'high' && hasAnthropic) return { provider: 'anthropic', model: 'claude-sonnet-4' };
    if (complexity === 'high' && hasOpenAI) return { provider: 'openai', model: 'gpt-4-turbo' };
    if (hasAnthropic) return { provider: 'anthropic', model: 'claude-haiku-4' };
    if (hasOpenAI) return { provider: 'openai', model: 'gpt-3.5-turbo' };
    if (hasGoogle) return { provider: 'google', model: 'gemini-flash' };
  }

  // Fallback to first available
  if (hasOpenAI) return { provider: 'openai', model: 'gpt-3.5-turbo' };
  if (hasAnthropic) return { provider: 'anthropic', model: 'claude-haiku-4' };
  if (hasGoogle) return { provider: 'google', model: 'gemini-flash' };

  throw new Error('No AI providers available');
}

/**
 * Calculate cost based on tokens and model
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 1, output: 2 };
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Generate content using AI with automatic provider selection
 */
export async function generateWithAI(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const {
    prompt,
    provider: requestedProvider,
    model: requestedModel,
    maxTokens = 2000,
    complexity = 'medium',
    budgetPreference = 'balanced',
  } = options;

  try {
    // Determine provider and model
    let provider: AIProvider;
    let model: string;

    if (requestedProvider && requestedModel) {
      provider = requestedProvider;
      model = requestedModel;
    } else {
      const selected = selectModel(complexity, budgetPreference);
      provider = selected.provider;
      model = selected.model;
    }

    console.log(`[AI] Generating with ${provider}/${model}`);

    // Generate content
    let result: { content: string; tokens: { input: number; output: number } };

    if (provider === 'openai') {
      result = await generateWithOpenAI(prompt, model, maxTokens);
    } else if (provider === 'anthropic') {
      result = await generateWithAnthropic(prompt, model, maxTokens);
    } else if (provider === 'google') {
      result = await generateWithGoogle(prompt, model, maxTokens);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Calculate cost
    const cost = calculateCost(model, result.tokens.input, result.tokens.output);
    const totalTokens = result.tokens.input + result.tokens.output;

    console.log(`[AI] Generated ${totalTokens} tokens for $${cost.toFixed(4)}`);

    return {
      content: result.content,
      provider,
      model,
      tokens: {
        input: result.tokens.input,
        output: result.tokens.output,
        total: totalTokens,
      },
      cost,
      success: true,
    };
  } catch (error: any) {
    console.error('[AI] Generation error:', error);
    return {
      content: '',
      provider: requestedProvider || 'openai',
      model: requestedModel || 'gpt-3.5-turbo',
      tokens: { input: 0, output: 0, total: 0 },
      cost: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(
    Deno.env.get('OPENAI_API_KEY') ||
    Deno.env.get('ANTHROPIC_API_KEY') ||
    Deno.env.get('GOOGLE_API_KEY')
  );
}

/**
 * Get configured providers
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (Deno.env.get('OPENAI_API_KEY')) providers.push('openai');
  if (Deno.env.get('ANTHROPIC_API_KEY')) providers.push('anthropic');
  if (Deno.env.get('GOOGLE_API_KEY')) providers.push('google');
  return providers;
}

// =============================================================================
// IMAGE GENERATION — DALL-E 3
// =============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number;
}

export interface ImageGenerationResult {
  url: string;
  revised_prompt?: string;
}

/**
 * Generate image using DALL-E 3
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<{ success: boolean; image?: ImageGenerationResult; error?: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Add OPENAI_API_KEY environment variable.',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: request.prompt,
        size: request.size || '1024x1024',
        quality: request.quality || 'hd',
        n: 1, // DALL-E 3 only supports n=1
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Image Generation] OpenAI API error:', error);
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !result.data[0]) {
      throw new Error('No image data in response');
    }

    return {
      success: true,
      image: {
        url: result.data[0].url,
        revised_prompt: result.data[0].revised_prompt,
      },
    };
  } catch (error: any) {
    console.error('[Image Generation] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate image',
    };
  }
}
