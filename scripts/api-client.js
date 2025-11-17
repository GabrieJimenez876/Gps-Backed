/**
 * GPS App - API Client SDK
 * Utilities for frontend to connect to backend with JWT
 * 
 * Usage:
 *   import { GPSAppClient } from './api-client.js'
 *   const client = new GPSAppClient('http://localhost:3001')
 *   const result = await client.login('admin', 'admin123')
 */

export class GPSAppClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.loadTokensFromStorage();
  }

  // Storage Management
  loadTokensFromStorage() {
    const stored = localStorage.getItem('gps_app_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      this.accessToken = auth.accessToken;
      this.refreshToken = auth.refreshToken;
      this.user = auth.user;
    }
  }

  saveTokensToStorage() {
    localStorage.setItem('gps_app_auth', JSON.stringify({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      user: this.user
    }));
  }

  clearTokensFromStorage() {
    localStorage.removeItem('gps_app_auth');
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }

  // Helper: Make HTTP requests
  async _request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication Endpoints

  async login(username, password) {
    const data = await this._request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = data.user;
    this.saveTokensToStorage();

    return data;
  }

  async logout() {
    try {
      await this._request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokensFromStorage();
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await this._request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
      headers: { 'Authorization': '' } // Bypass auth header
    });

    this.accessToken = data.accessToken;
    this.saveTokensToStorage();

    return data;
  }

  async verifyToken(token) {
    return this._request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  async getCurrentUser() {
    return this._request('/auth/me', { method: 'GET' });
  }

  // Utility Methods

  isAuthenticated() {
    return !!this.accessToken;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.accessToken;
  }

  hasRole(roleName) {
    if (!this.user || !this.user.roles) return false;
    return this.user.roles.includes(roleName);
  }

  hasAnyRole(...roleNames) {
    if (!this.user || !this.user.roles) return false;
    return this.user.roles.some(r => roleNames.includes(r));
  }

  // Health Check
  async healthCheck() {
    return this._request('/health', { method: 'GET' });
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GPSAppClient };
}
