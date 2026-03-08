import axios from 'axios';

const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://16.171.162.197:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://16.171.162.197:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password) => api.post('/api/v1/auth/login', { email, password }),
  register: (data)            => api.post('/api/v1/auth/register', data),
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsAPI = {
  upload: (file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/v1/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  list:      ()   => api.get('/api/v1/documents'),
  get:       (id) => api.get(`/api/v1/documents/${id}`),
  getStatus: (id) => api.get(`/api/v1/documents/${id}/status`),
};

// ─── RAG ──────────────────────────────────────────────────────────────────────
export const ragAPI = {
  /** Save the Lambda RAG result to the backend and get a document_id back */
  save: (payload) => api.post('/api/v1/rag/save', payload),
};

// ─── Compliance ───────────────────────────────────────────────────────────────
export const complianceAPI = {
  analyze: (documentId, guidelines) =>
    api.post('/api/v1/compliance/analyze', { document_id: documentId, guidelines }),
  getFindings: (documentId, severity) =>
    api.get(`/api/v1/compliance/${documentId}/findings`, {
      params: severity ? { severity } : {},
    }),
  getStats: (documentId) =>
    api.get(`/api/v1/compliance/${documentId}/stats`),
  updateFindingStatus: (findingId, status) =>
    api.put(`/api/v1/compliance/findings/${findingId}/status`, null, {
      params: { status },
    }),
  submitFeedback: (findingId, feedbackType, comment) =>
    api.post(`/api/v1/compliance/findings/${findingId}/feedback`, {
      finding_id: findingId, feedback_type: feedbackType, comment,
    }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (documentId, message, history = []) =>
    api.post('/api/v1/chat', { document_id: documentId, message, conversation_history: history }),
  
  /** New intelligent chat endpoint with Claude AI */
  chatWithDocument: (documentId, message, history = []) =>
    api.post('/api/v1/chat/document', { 
      document_id: documentId, 
      message, 
      conversation_history: history 
    }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/api/v1/analytics/dashboard'),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditAPI = {
  getTrail: (documentId) =>
    api.get('/api/v1/audit/trail', { params: documentId ? { document_id: documentId } : {} }),
};

// ─── Users / Profile ──────────────────────────────────────────────────────────
export const usersAPI = {
  getMe:      ()     => api.get('/api/v1/users/me'),
  updateMe:   (data) => api.put('/api/v1/users/me', data),
  getMyStats: ()     => api.get('/api/v1/users/me/stats'),
};

// ─── History ──────────────────────────────────────────────────────────────────
export const historyAPI = {
  get: ()       => api.get('/api/v1/history'),
  add: (entry)  => api.post('/api/v1/history', entry),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  export: (documentId, format = 'pdf') =>
    api.post('/api/v1/reports/export', null, { params: { document_id: documentId, format } }),
};

export default api;
