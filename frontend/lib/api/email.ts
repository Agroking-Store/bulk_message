import { apiFetch } from '../api';

export const emailApi = {
  sendCampaign: async (data: {
    campaignName?: string;
    subject: string;
    body: string;
    group?: string;
    contactIds?: string[];
    media?: any[];
  }) => {
    return apiFetch('/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: async () => {
    return apiFetch('/email/history');
  },

  getStats: async () => {
    return apiFetch('/email/stats');
  },
};
