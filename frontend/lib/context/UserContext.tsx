"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { profileApi } from "@/lib/api/profile";
import { isAuthenticated } from "@/lib/utils/auth";
import { connectSocket } from "@/lib/socket";

interface UserContextType {
    user: any;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            // Only fetch profile if authenticated
            if (!isAuthenticated()) {
                setUser(null);
                setLoading(false);
                return;
            }

            const data = await profileApi.getProfile();
            setUser(data);
            if (data?._id) {
                connectSocket(data._id);
            }
        } catch (error: any) {
            console.error("User fetch error:", error);
            // Only set user to null if it's an auth error
            if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('No authentication token')) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    // Force refresh when token changes in current tab
    const forceRefresh = () => {
        setLoading(true);
        refreshUser();
    };

    useEffect(() => {
        refreshUser();
    }, []);

    // Listen for storage changes (for cross-tab updates)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                refreshUser();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Make forceRefresh available globally for login components
    useEffect(() => {
        (window as any).refreshUserContext = forceRefresh;
        return () => {
            delete (window as any).refreshUserContext;
        };
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
