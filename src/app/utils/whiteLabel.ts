// =============================================================================
// WHITE-LABEL SOLUTION — Custom Branding & Client Management
// =============================================================================

export interface WhiteLabelConfig {
  id: string;
  clientId: string;
  branding: BrandingSettings;
  domain: DomainSettings;
  features: FeatureToggles;
  limits: UsageLimits;
  customization: CustomizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingSettings {
  companyName: string;
  logo?: {
    light: string;
    dark: string;
  };
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  customCSS?: string;
}

export interface DomainSettings {
  customDomain?: string;
  subdomain?: string;
  ssl: boolean;
  redirectToCustomDomain: boolean;
}

export interface FeatureToggles {
  aiGeneration: boolean;
  multiPlatformPublishing: boolean;
  analytics: boolean;
  collaboration: boolean;
  api: boolean;
  whiteLabel: boolean;
  seoTools: boolean;
  emailNewsletter: boolean;
}

export interface UsageLimits {
  maxUsers: number;
  maxPosts: number;
  maxAIGenerations: number;
  maxStorage: number; // GB
  maxAPIRequests: number;
}

export interface CustomizationSettings {
  welcomeMessage?: string;
  supportEmail?: string;
  supportPhone?: string;
  termsOfServiceURL?: string;
  privacyPolicyURL?: string;
  customFooter?: string;
  hidePoweredBy: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'canceled';
  createdAt: Date;
  subscription: {
    startDate: Date;
    nextBillingDate: Date;
    amount: number;
  };
  usage: {
    users: number;
    posts: number;
    aiGenerations: number;
    storage: number;
    apiRequests: number;
  };
}

/**
 * Get white-label configuration
 */
export function getWhiteLabelConfig(clientId?: string): WhiteLabelConfig | null {
  const stored = localStorage.getItem('whiteLabelConfig');
  if (!stored) return null;

  const configs = JSON.parse(stored) as WhiteLabelConfig[];

  const config = clientId
    ? configs.find(c => c.clientId === clientId)
    : configs[0];

  if (!config) return null;

  return {
    ...config,
    createdAt: new Date(config.createdAt),
    updatedAt: new Date(config.updatedAt),
  };
}

/**
 * Save white-label configuration
 */
export function saveWhiteLabelConfig(config: WhiteLabelConfig): void {
  const stored = localStorage.getItem('whiteLabelConfig');
  let configs: WhiteLabelConfig[] = stored ? JSON.parse(stored) : [];

  const index = configs.findIndex(c => c.id === config.id);

  if (index !== -1) {
    configs[index] = { ...config, updatedAt: new Date() };
  } else {
    configs.push(config);
  }

  localStorage.setItem('whiteLabelConfig', JSON.stringify(configs));
}

/**
 * Create white-label configuration
 */
export function createWhiteLabelConfig(
  clientId: string,
  companyName: string
): WhiteLabelConfig {
  const config: WhiteLabelConfig = {
    id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clientId,
    branding: {
      companyName,
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
      },
    },
    domain: {
      ssl: true,
      redirectToCustomDomain: false,
    },
    features: {
      aiGeneration: true,
      multiPlatformPublishing: true,
      analytics: true,
      collaboration: true,
      api: false,
      whiteLabel: true,
      seoTools: true,
      emailNewsletter: true,
    },
    limits: {
      maxUsers: 10,
      maxPosts: 1000,
      maxAIGenerations: 1000,
      maxStorage: 10,
      maxAPIRequests: 10000,
    },
    customization: {
      supportEmail: 'support@example.com',
      hidePoweredBy: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  saveWhiteLabelConfig(config);

  return config;
}

/**
 * Update branding
 */
export function updateBranding(
  configId: string,
  branding: Partial<BrandingSettings>
): void {
  const config = getAllConfigs().find(c => c.id === configId);

  if (!config) {
    throw new Error('Configuration not found');
  }

  config.branding = { ...config.branding, ...branding };
  saveWhiteLabelConfig(config);
}

/**
 * Update domain settings
 */
export function updateDomain(
  configId: string,
  domain: Partial<DomainSettings>
): void {
  const config = getAllConfigs().find(c => c.id === configId);

  if (!config) {
    throw new Error('Configuration not found');
  }

  config.domain = { ...config.domain, ...domain };
  saveWhiteLabelConfig(config);
}

/**
 * Update feature toggles
 */
export function updateFeatures(
  configId: string,
  features: Partial<FeatureToggles>
): void {
  const config = getAllConfigs().find(c => c.id === configId);

  if (!config) {
    throw new Error('Configuration not found');
  }

  config.features = { ...config.features, ...features };
  saveWhiteLabelConfig(config);
}

/**
 * Get all configurations
 */
function getAllConfigs(): WhiteLabelConfig[] {
  const stored = localStorage.getItem('whiteLabelConfig');
  if (!stored) return [];

  const configs = JSON.parse(stored) as WhiteLabelConfig[];

  return configs.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));
}

/**
 * Get all clients
 */
export function getClients(): Client[] {
  const stored = localStorage.getItem('whiteLabelClients');
  if (!stored) return [];

  const clients = JSON.parse(stored) as Client[];

  return clients.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    subscription: {
      ...c.subscription,
      startDate: new Date(c.subscription.startDate),
      nextBillingDate: new Date(c.subscription.nextBillingDate),
    },
  }));
}

/**
 * Save clients
 */
function saveClients(clients: Client[]): void {
  localStorage.setItem('whiteLabelClients', JSON.stringify(clients));
}

/**
 * Create client
 */
export function createClient(
  name: string,
  email: string,
  company: string,
  plan: Client['plan']
): Client {
  const client: Client = {
    id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    email,
    company,
    plan,
    status: 'active',
    createdAt: new Date(),
    subscription: {
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: plan === 'starter' ? 49 : plan === 'professional' ? 99 : 299,
    },
    usage: {
      users: 0,
      posts: 0,
      aiGenerations: 0,
      storage: 0,
      apiRequests: 0,
    },
  };

  // Create white-label config for client
  createWhiteLabelConfig(client.id, company);

  const clients = getClients();
  clients.push(client);
  saveClients(clients);

  return client;
}

/**
 * Update client
 */
export function updateClient(
  clientId: string,
  updates: Partial<Client>
): void {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === clientId);

  if (index !== -1) {
    clients[index] = { ...clients[index], ...updates };
    saveClients(clients);
  }
}

/**
 * Delete client
 */
export function deleteClient(clientId: string): void {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== clientId);
  saveClients(filtered);

  // Also delete white-label config
  const configs = getAllConfigs();
  const filteredConfigs = configs.filter(c => c.clientId !== clientId);
  localStorage.setItem('whiteLabelConfig', JSON.stringify(filteredConfigs));
}

/**
 * Apply white-label theme to DOM
 */
export function applyWhiteLabelTheme(config: WhiteLabelConfig): void {
  const root = document.documentElement;

  // Apply colors
  root.style.setProperty('--color-primary', config.branding.colors.primary);
  root.style.setProperty('--color-secondary', config.branding.colors.secondary);
  root.style.setProperty('--color-accent', config.branding.colors.accent);

  // Apply fonts
  root.style.setProperty('--font-heading', config.branding.fonts.heading);
  root.style.setProperty('--font-body', config.branding.fonts.body);

  // Apply custom CSS
  if (config.branding.customCSS) {
    let styleEl = document.getElementById('white-label-custom-css');

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'white-label-custom-css';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = config.branding.customCSS;
  }

  // Update favicon
  if (config.branding.favicon) {
    let faviconEl = document.querySelector('link[rel="icon"]') as HTMLLinkElement;

    if (!faviconEl) {
      faviconEl = document.createElement('link');
      faviconEl.rel = 'icon';
      document.head.appendChild(faviconEl);
    }

    faviconEl.href = config.branding.favicon;
  }

  // Update title
  document.title = config.branding.companyName;
}

/**
 * Generate CSS variables from config
 */
export function generateCSSVariables(config: WhiteLabelConfig): string {
  return `
:root {
  --color-primary: ${config.branding.colors.primary};
  --color-secondary: ${config.branding.colors.secondary};
  --color-accent: ${config.branding.colors.accent};
  --color-background: ${config.branding.colors.background};
  --color-text: ${config.branding.colors.text};
  --font-heading: ${config.branding.fonts.heading};
  --font-body: ${config.branding.fonts.body};
}

${config.branding.customCSS || ''}
  `.trim();
}

/**
 * Export white-label configuration
 */
export function exportConfig(configId: string): string {
  const config = getAllConfigs().find(c => c.id === configId);

  if (!config) {
    throw new Error('Configuration not found');
  }

  return JSON.stringify(config, null, 2);
}

/**
 * Import white-label configuration
 */
export function importConfig(configJSON: string): WhiteLabelConfig {
  const config = JSON.parse(configJSON) as WhiteLabelConfig;

  config.id = `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  config.createdAt = new Date();
  config.updatedAt = new Date();

  saveWhiteLabelConfig(config);

  return config;
}

/**
 * Get client statistics
 */
export function getClientStats(): {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  avgUsage: {
    users: number;
    posts: number;
    storage: number;
  };
} {
  const clients = getClients();

  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.subscription.amount, 0),
    avgUsage: {
      users: 0,
      posts: 0,
      storage: 0,
    },
  };

  if (clients.length > 0) {
    stats.avgUsage.users = Math.round(
      clients.reduce((sum, c) => sum + c.usage.users, 0) / clients.length
    );
    stats.avgUsage.posts = Math.round(
      clients.reduce((sum, c) => sum + c.usage.posts, 0) / clients.length
    );
    stats.avgUsage.storage = Math.round(
      clients.reduce((sum, c) => sum + c.usage.storage, 0) / clients.length
    );
  }

  return stats;
}

/**
 * Check if feature is enabled for client
 */
export function isFeatureEnabled(
  clientId: string,
  feature: keyof FeatureToggles
): boolean {
  const config = getWhiteLabelConfig(clientId);

  if (!config) return false;

  return config.features[feature];
}

/**
 * Check if client is within limits
 */
export function checkClientLimits(
  clientId: string,
  limitType: keyof UsageLimits,
  currentValue: number
): { withinLimit: boolean; limit: number; remaining: number } {
  const config = getWhiteLabelConfig(clientId);

  if (!config) {
    return { withinLimit: false, limit: 0, remaining: 0 };
  }

  const limit = config.limits[limitType];
  const remaining = Math.max(0, limit - currentValue);

  return {
    withinLimit: currentValue < limit,
    limit,
    remaining,
  };
}
