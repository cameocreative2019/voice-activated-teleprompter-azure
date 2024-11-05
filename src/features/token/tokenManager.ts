import axios from 'axios';
import { store } from '@/app/store';
import { setToken, clearToken } from './tokenSlice';

interface TokenResponse {
  token: string;
  region: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  // Rest of the code remains exactly the same
  private readonly initialRetryDelay = 1000; // 1 second
  private readonly maxRetryDelay = 16000; // 16 seconds
  private readonly maxRetries = 3;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('Initializing token manager');
    await this.refreshToken();
  }

  private async fetchToken(retryCount = 0): Promise<TokenResponse> {
    try {
      console.log('Requesting new token...');
      const response = await axios.get<TokenResponse>('/api/get-speech-token', {
        timeout: 5000, // 5 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      console.log('Token retrieved successfully');
      return response.data;
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        console.error('Max retries reached for token fetch');
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        this.initialRetryDelay * Math.pow(2, retryCount),
        this.maxRetryDelay
      );

      console.log(`Retrying token fetch in ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.fetchToken(retryCount + 1);
    }
  }

  private scheduleTokenRefresh(expiresInMs: number): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    // Refresh the token 1 minute before it expires
    const refreshDelay = Math.max(0, expiresInMs - 60000);

    this.tokenRefreshTimeout = setTimeout(() => {
      this.refreshToken().catch(error => {
        console.error('Failed to refresh token:', error);
      });
    }, refreshDelay);
  }

  async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      console.log('Token refresh already in progress');
      return;
    }

    this.isRefreshing = true;

    try {
      const { token, region } = await this.fetchToken();

      // Store token in Redux
      store.dispatch(setToken({
        token,
        region,
        timestamp: Date.now(),
        expiresIn: 540000 // 9 minutes in milliseconds
      }));

      // Schedule next refresh
      this.scheduleTokenRefresh(540000);
    } catch (error) {
      console.error('Token refresh failed:', error);
      store.dispatch(clearToken());
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async getToken(): Promise<{ token: string; region: string }> {
    const state = store.getState();
    const tokenData = state.token;

    if (!tokenData.token || !tokenData.region) {
      console.log('No token available, fetching new token');
      await this.refreshToken();
      const newState = store.getState();
      return {
        token: newState.token.token,
        region: newState.token.region
      };
    }

    const tokenAge = Date.now() - tokenData.timestamp;
    if (tokenAge > tokenData.expiresIn) {
      console.log('Token expired, fetching new token');
      await this.refreshToken();
      const newState = store.getState();
      return {
        token: newState.token.token,
        region: newState.token.region
      };
    }

    return {
      token: tokenData.token,
      region: tokenData.region
    };
  }

  cleanup(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    store.dispatch(clearToken());
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();