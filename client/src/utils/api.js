const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
  } catch (_error) {
    throw new Error('Could not reach the app server. Make sure the frontend and backend are both running.');
  }

  const rawBody = await response.text();
  let payload = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (_error) {
      throw new Error(`Server returned a non-JSON response (${response.status}). Make sure the backend is running on port 3001.`);
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`);
  }

  if (!payload) {
    throw new Error('Server returned an empty response.');
  }

  if (payload.success === false) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload.data;
};

export const api = {
  createGoal: (body) => request('/api/goal', { method: 'POST', body: JSON.stringify(body) }),
  submitDiagnostic: (body) => request('/api/diagnostic/submit', { method: 'POST', body: JSON.stringify(body) }),
  getDashboard: (userId) => request(`/api/session/dashboard/${userId}`),
  getChallenge: (userId, day) => request(`/api/session/challenge/${userId}/${day}`),
  submitSession: (body) => request('/api/session/submit', { method: 'POST', body: JSON.stringify(body) }),
  generateReport: (userId) => request('/api/report/generate', { method: 'POST', body: JSON.stringify({ userId }) }),
  getReport: (userId) => request(`/api/report/${userId}`),
  getGoal: (userId) => request(`/api/goal/${userId}`)
};

export const scoreColor = (score) => {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
};
