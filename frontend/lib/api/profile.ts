const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const profileApi = {
    async getProfile() {
        const headers = getAuthHeaders();
        if (!Object.keys(headers).length) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers,
        });

        if (response.status === 401) {
            throw new Error('Unauthorized - Please login again');
        }
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    async updateProfile(data: any) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    },

    async changePassword(data: any) {
        const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change password');
        }
        return response.json();
    },

    async send2FAOTP() {
        const response = await fetch(`${API_BASE_URL}/profile/2fa/send-otp`, {
            method: 'POST',
            headers: { ...getAuthHeaders() },
        });
        if (!response.ok) throw new Error('Failed to send OTP');
        return response.json();
    },

    async verify2FA(code: string) {
        const response = await fetch(`${API_BASE_URL}/profile/2fa/verify`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to verify 2FA');
        }
        return response.json();
    },

    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
            method: 'POST',
            headers: { ...getAuthHeaders() },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload avatar');
        return response.json();
    }
};
