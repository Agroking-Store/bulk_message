const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
headers: {
  ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
},
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}
