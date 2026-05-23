export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token;
};

export const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
};

export const clearAuth = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
};
