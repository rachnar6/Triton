// Set full backend URL as fallback if VITE_API_BASE is not in .env
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  googleAuth: (payload) => request('/auth/google', { method: 'POST', body: payload }),
  updateProfile: (data, token) => request('/auth/profile', { method: 'PUT', body: data, token }),
  me: (token) => request('/auth/me', { token }),
  getNearbyVolunteers: (token) => request('/auth/nearby-volunteers', { token }),

  // Public
  publicStats: () => request('/public/stats'),

  // Senior & Tasks
  createTask: (data, token) => request('/tasks', { method: 'POST', body: data, token }),
  myTask: (token) => request('/tasks/mine', { token }),
  cancelTask: (id, token) => request(`/tasks/${id}`, { method: 'DELETE', token }),

  // History Route
  taskHistory: (token) => request('/tasks/history', { token }),

  // Chat & Voice Notes
  getMessages: (id, token) => request(`/tasks/${id}/messages`, { token }),
  sendMessage: (id, payload, token) => request(`/tasks/${id}/messages`, { method: 'POST', body: payload, token }),

  // Rating & Review
  rateTask: (id, payload, token) => request(`/tasks/${id}/rate`, { method: 'POST', body: payload, token }),

  // Volunteer
  taskFeed: async (radiusKm, token) => {
    const res = await fetch(`${BASE}/tasks/feed?radius=${radiusKm}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch task feed');
    }
    return res.json();
  },
  // Payouts — Volunteer
  getPayoutStatus: (token) => request('/payouts/status', { token }),
  claimPayout: (year, month, token) =>
    request('/payouts/claim', { method: 'POST', body: { year, month }, token }),

  // Payouts — Admin
  adminPayouts: (status, token) => request(`/admin/payouts${status ? `?status=${status}` : ''}`, { token }),
  adminMarkPayoutPaid: (id, paymentRef, token) =>
    request(`/admin/payouts/${id}/pay`, { method: 'PATCH', body: { paymentRef }, token }),
  adminRejectPayout: (id, reason, token) =>
    request(`/admin/payouts/${id}/reject`, { method: 'PATCH', body: { reason }, token }),
  claimTask: (id, token) => request(`/tasks/${id}/claim`, { method: 'POST', token }),
  activeTask: (token) => request('/tasks/active', { token }),
  verifyPin: (id, pin, token) => request(`/tasks/${id}/verify-pin`, { method: 'POST', body: { pin }, token }),

  // Earnings — coins & monthly revenue (1 completed task = 1 coin = ₹100)
  getEarnings: (token) => request('/tasks/earnings', { token }),

  // Aadhaar OTP Verification
  requestAadhaarOtp: (data, token) =>
    request('/auth/aadhaar/request-otp', { method: 'POST', body: data, token }),
  verifyAadhaarOtp: (data, token) =>
    request('/auth/aadhaar/verify-otp', { method: 'POST', body: data, token }),

  // Admin
  adminUsers: (role, token) => request(`/admin/users${role ? `?role=${role}` : ''}`, { token }),
  adminVerifyUser: (id, token) => request(`/admin/users/${id}/verify`, { method: 'PATCH', token }),
  adminBlockUser: (id, blocked, token) => request(`/admin/users/${id}/block`, { method: 'PATCH', body: { blocked }, token }),
  adminSetRole: (id, role, token) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role }, token }),
  adminTasks: (params, token) => request(`/admin/tasks?${new URLSearchParams(params)}`, { token }),
  adminUpdateTask: (id, payload, token) => request(`/admin/tasks/${id}`, { method: 'PATCH', body: payload, token }),
  adminSosLog: (token) => request('/admin/sos-log', { token }),
  adminAnalytics: (token) => request('/admin/analytics', { token }),

  // Volunteer & Task Actions
  inviteVolunteer: (taskId, volunteerId, token) =>
    request(`/tasks/${taskId}/invite`, { method: 'PUT', body: { volunteerId }, token }),
  updateTaskStatus: (id, payload, token) =>
    request(`/tasks/${id}/status`, { method: 'PATCH', body: payload, token }),
  updateVolunteerLocation: (id, payload, token) =>
    request(`/tasks/${id}/location`, { method: 'PUT', body: payload, token }),

  // Notifications
  sendTestNotification: (token) =>
    request('/auth/test-notification', { method: 'POST', token }),
};
