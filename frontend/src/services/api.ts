const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://reqwise.onrender.com/api' : 'http://localhost:5000/api');

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('reqwise_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch (_) {
      // Ignore parse failure
    }
    throw new APIError(message, response.status);
  }

  // Handle empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
