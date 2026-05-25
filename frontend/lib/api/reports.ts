import { apiFetch } from '../api';

export const reportsApi = {
    async getStats(days?: number) {
        let endpoint = `/reports/stats`;
        if (days) endpoint += `?days=${days}`;
        return apiFetch(endpoint);
    },

    async getTrends(days?: number) {
        let endpoint = `/reports/trends`;
        if (days) endpoint += `?days=${days}`;
        return apiFetch(endpoint);
    },

    async getGroups() {
        return apiFetch(`/reports/groups`);
    },

    async getEmailTrends(days?: number) {
        let endpoint = `/reports/trends/email`;
        if (days) endpoint += `?days=${days}`;
        return apiFetch(endpoint);
    },

    async getTopCampaigns(days?: number) {
        let endpoint = `/reports/top-campaigns`;
        if (days) endpoint += `?days=${days}`;
        return apiFetch(endpoint);

        
    }
};
