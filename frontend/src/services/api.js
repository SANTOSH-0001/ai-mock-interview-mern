const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  'http://localhost:5000/api'
).replace(/\/$/, '');

export async function apiRequest(path, { method = 'GET', body = null, token = null } = {}) {
  // 1. Normalize the entry path format to prevent route string doubling
  const formatPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${formatPath}`;

  // 2. Warn early in development if a protected path lost its token string
  if (!token && formatPath !== '/auth/login' && formatPath !== '/auth/register' && formatPath !== '/health') {
    console.warn(`[API Client Warning]: Requesting protected endpoint "${formatPath}" without a bearer token hook.`);
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const config = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    const contentType = response.headers.get('content-type');
    let payload = {};
    
    if (contentType && contentType.includes('application/json')) {
      payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      throw new Error(payload.message || `Server responded with state code: ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network connection error. Please verify your backend server port 5000 is running.');
    }
    throw error;
  }
}