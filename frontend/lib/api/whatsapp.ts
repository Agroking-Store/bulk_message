const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const whatsappApi = {
    async uploadMedia(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/whatsapp/upload`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to upload media' }));
            throw new Error(error.message || 'Failed to upload media');
        }
        return response.json();
    },

    async createCampaign(data: { group: string; campaignName: string; message: string; templateType?: string; templateName?: string; templateParams?: any; media?: { url: string; type: string; originalName?: string }[]; contactIds?: string[]; }) {
        const response = await fetch(`${API_BASE_URL}/whatsapp/campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({
                ...data,
                templateType: data.templateType || 'utility'
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to create campaign' }));
            throw new Error(error.message || 'Failed to create campaign');
        }
        return response.json();
    },

    async scheduleCampaign(data: { group: string; campaignName: string; message: string; scheduledAt: string; sourceType?: string; templateType?: string; templateName?: string; templateParams?: any; media?: { url: string; type: string; originalName?: string }[]; contactIds?: string[]; }) {
        const response = await fetch(`${API_BASE_URL}/schedule-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({
                message: data.message,
                group: data.group,
                scheduledAt: data.scheduledAt,
                contactIds: data.contactIds,
                campaignId: data.campaignName,
                sourceType: data.sourceType,
                templateType: data.templateType || 'utility',
                templateName: data.templateName,
                templateParams: data.templateParams,
                media: data.media || []
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to schedule campaign' }));
            throw new Error(error.message || 'Failed to schedule campaign');
        }
        return response.json();
    },

    async getCampaigns(page = 1, limit = 10) {
        const response = await fetch(`${API_BASE_URL}/whatsapp/campaigns?page=${page}&limit=${limit}`, {
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch campaigns');
        }
        return response.json();
    },

    async getGroups() {
        const response = await fetch(`${API_BASE_URL}/whatsapp/groups`, {
            headers: {
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }
        return response.json();
    },

    async getTemplates() {
        const response = await fetch(`${API_BASE_URL}/template/all`, {
            headers: {
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch templates');
        }
        return response.json();
    }
};
