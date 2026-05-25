"use client";

import { useUser } from "@/lib/context/UserContext";

export function useAuth() {
  const { user, loading, refreshUser } = useUser();

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const { access_token } = await response.json();
      localStorage.setItem('access_token', access_token);
      
      // Refresh user context after successful login
      await refreshUser();
      
      return access_token;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    // Refresh user context to clear user data
    refreshUser();
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };
}
