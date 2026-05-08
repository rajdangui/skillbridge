import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.response.use(
  res => res,
  err => { return Promise.reject(err); }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.get('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  verifyEmail: (token) => API.get(`/auth/verify-email?token=${token}`),
  resendVerification: (data) => API.post('/auth/resend-verification', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  validateResetToken: (token) => API.get(`/auth/validate-reset-token?token=${token}`),
};

export const userAPI = {
  getProfile: (id) => API.get(`/users/profile/${id}`),
  updateProfile: (id, data) => API.put(`/users/profile/${id}`, data),
  uploadResume: (formData) => API.post('/users/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  parseResume: (formData) => API.post('/users/parse-resume', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  getStudents: () => API.get('/users/students'),
};

export const opportunityAPI = {
  getAll: (params) => API.get('/opportunities', { params }),
  getPublicStats: () => API.get('/opportunities/public-stats'),
  getById: (id) => API.get(`/opportunities/${id}`),
  getMine: () => API.get('/opportunities/my'),
  create: (data) => API.post('/opportunities', data),
  update: (id, data) => API.put(`/opportunities/${id}`, data),
  delete: (id) => API.delete(`/opportunities/${id}`),
};

export const applicationAPI = {
  apply: (data) => API.post('/applications/apply', data),
  getMyApplications: () => API.get('/applications/my'),
  getCompanyApplications: () => API.get('/applications/company'),
  getCompanyStats: () => API.get('/applications/company/stats'),
  getOpportunityApplications: (opportunityId) => API.get(`/applications/opportunity/${opportunityId}`),
  updateStatus: (id, data) => API.put(`/applications/status/${id}`, data),
};

export const learningAPI = {
  searchVideos: (q, maxResults = 12) => API.get('/learn/search', { params: { q, maxResults } }),
  getVideoDetails: (videoId) => API.get(`/learn/video/${videoId}`),
};

export const savedAPI = {
  getSaved: () => API.get('/saved'),
  toggle: (opportunityId) => API.post('/saved/toggle', { opportunityId }),
};

export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  getUserById: (id) => API.get(`/admin/users/${id}`),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getOpportunities: (params) => API.get('/admin/opportunities', { params }),
  toggleOpportunity: (id) => API.patch(`/admin/opportunities/${id}/toggle`),
  deleteOpportunity: (id) => API.delete(`/admin/opportunities/${id}`),
  getApplications: (params) => API.get('/admin/applications', { params }),
};

export const coverLetterAPI = {
  generate: (data) => API.post('/coverletter/generate', data),
};

export const skillGapAPI = {
  analyze: (opportunityId) => API.get(`/skillgap/${opportunityId}`),
  batchAnalyze: () => API.get('/skillgap/batch/all'),
};

export const atsAPI = {
  analyze: (data) => API.post('/ats/analyze', data),
};

export const academicAPI = {
  getProfile:        ()       => API.get('/academic'),
  updateProfile:     (data)   => API.put('/academic', data),
  upsertSemester:    (data)   => API.post('/academic/semester', data),
  addAssignment:     (data)   => API.post('/academic/assignments', data),
  updateAssignment:  (id, data) => API.put(`/academic/assignments/${id}`, data),
  deleteAssignment:  (id)     => API.delete(`/academic/assignments/${id}`),
  addExam:           (data)   => API.post('/academic/exams', data),
  updateExam:        (id, data) => API.put(`/academic/exams/${id}`, data),
  deleteExam:        (id)     => API.delete(`/academic/exams/${id}`),
  saveTimetable:     (slots)  => API.put('/academic/timetable', { slots }),
  updateAttendance:  (data)   => API.put('/academic/attendance', { attendance: data }),
  parseMarksheet:    (formData) => API.post('/academic/marksheet/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  applyParsedData:   (data)   => API.post('/academic/marksheet/apply', data),
  deleteSemester:    (number) => API.delete(`/academic/semester/${number}`),
};

export const chatAPI = {
  send: (messages) => API.post('/chat', { messages }),
};

export const notificationAPI = {
  getAll:        (params) => API.get('/notifications', { params }),
  getUnreadCount:()       => API.get('/notifications/unread-count'),
  markRead:      (id)     => API.put(`/notifications/${id}/read`),
  markAllRead:   ()       => API.put('/notifications/all/read'),
  delete:        (id)     => API.delete(`/notifications/${id}`),
  generateReminders: ()   => API.post('/notifications/reminders'),
};

export const resumeAPI = {
  getData:     ()     => API.get('/resume'),
  saveData:    (data) => API.put('/resume', data),
  generatePDF: (data) => API.post('/resume/pdf', data, { responseType:'blob', timeout:60000 }),
};
