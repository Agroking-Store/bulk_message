const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const notificationsApi = {
    async getNotifications() {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        return response.json();
    },

    async markAllAsRead() {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            throw new Error('Failed to mark all as read');
        }
        return response.json();
    },

    async markAsRead(id: string) {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
        return response.json();
    },

    async deleteNotification(id: string) {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }
        return response.json();
    }
};
