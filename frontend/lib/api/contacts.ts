const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export interface Contact {
    _id?: string;
    name: string;
    phone: string;
    email?: string;
    group?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const contactsApi = {
    async getAll(page = 1, limit = 10): Promise<{ records: Contact[], total: number, page: number, limit: number }> {
        const response = await fetch(`${API_BASE_URL}/contacts?page=${page}&limit=${limit}`, {
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch contacts');
        }
        return response.json();
    },

    async create(contact: Contact): Promise<Contact> {
        const response = await fetch(`${API_BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(contact),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to create contact' }));
            throw new Error(error.message || (response.status === 401 ? 'Unauthorized' : 'Failed to create contact'));
        }
        return response.json();
    },

    async search(query: string, page = 1, limit = 10): Promise<{ records: Contact[], total: number, page: number, limit: number }> {
        const response = await fetch(`${API_BASE_URL}/contacts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) throw new Error('Failed to search contacts');
        return response.json();
    },

    async uploadCsv(file: File): Promise<{ status: string, message?: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/contacts/upload`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Cannot POST /contacts/upload' }));
            throw new Error(error.message || (response.status === 401 ? 'Unauthorized' : 'Failed to upload CSV'));
        }

        return response.json();
    },

    async delete(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });
        if (!response.ok) throw new Error('Failed to delete contact');
        return response.json();
    },

    async update(id: string, contact: Partial<Contact>): Promise<Contact> {
        const url = `${API_BASE_URL}/contacts/${id}`;
        console.log('UPDATING CONTACT AT: - contacts.ts:91', url);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(contact),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to update contact' }));
            console.error('UPDATE FAILED: - contacts.ts:104', response.status, error);
            throw new Error(error.message || 'Failed to update contact');
        }

        return response.json();
    },
};