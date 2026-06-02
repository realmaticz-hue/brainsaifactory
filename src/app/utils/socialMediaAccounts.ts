// Social Media Account Management

export interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'youtube';
  username: string;
  profileUrl: string;
  accessToken?: string;
  isConnected: boolean;
  autoShare: boolean;
  connectedAt?: Date;
}

export class SocialMediaAccountManager {
  private accounts: SocialMediaAccount[] = [];

  constructor() {
    this.loadAccounts();
  }

  addAccount(account: Omit<SocialMediaAccount, 'id' | 'isConnected' | 'connectedAt'>): SocialMediaAccount {
    const newAccount: SocialMediaAccount = {
      ...account,
      id: `account-${Date.now()}`,
      isConnected: true,
      connectedAt: new Date()
    };

    this.accounts.push(newAccount);
    this.saveAccounts();
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<SocialMediaAccount>): void {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index >= 0) {
      this.accounts[index] = { ...this.accounts[index], ...updates };
      this.saveAccounts();
    }
  }

  removeAccount(id: string): void {
    this.accounts = this.accounts.filter(a => a.id !== id);
    this.saveAccounts();
  }

  getAccount(id: string): SocialMediaAccount | undefined {
    return this.accounts.find(a => a.id === id);
  }

  getAccountsByPlatform(platform: string): SocialMediaAccount[] {
    return this.accounts.filter(a => a.platform === platform);
  }

  getAllAccounts(): SocialMediaAccount[] {
    return [...this.accounts];
  }

  getAutoShareAccounts(): SocialMediaAccount[] {
    return this.accounts.filter(a => a.autoShare && a.isConnected);
  }

  toggleAutoShare(id: string): void {
    const account = this.accounts.find(a => a.id === id);
    if (account) {
      account.autoShare = !account.autoShare;
      this.saveAccounts();
    }
  }

  private saveAccounts(): void {
    try {
      localStorage.setItem('socialMediaAccounts', JSON.stringify(this.accounts));
    } catch (error) {
      console.error('Error saving social media accounts:', error);
    }
  }

  private loadAccounts(): void {
    try {
      const saved = localStorage.getItem('socialMediaAccounts');
      if (saved) {
        this.accounts = JSON.parse(saved).map((a: any) => ({
          ...a,
          connectedAt: a.connectedAt ? new Date(a.connectedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading social media accounts:', error);
    }
  }
}

export const socialAccountManager = new SocialMediaAccountManager();
