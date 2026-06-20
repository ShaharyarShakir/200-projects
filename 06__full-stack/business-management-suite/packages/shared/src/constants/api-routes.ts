export const API_BASE = '/api/v1';

export const ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH: `${API_BASE}/auth/refresh`,
    LOGOUT: `${API_BASE}/auth/logout`,
    ME: `${API_BASE}/auth/me`,
  },
  USERS: {
    BASE: `${API_BASE}/users`,
    BY_ID: (id: string) => `${API_BASE}/users/${id}`,
  },
  EMPLOYEES: {
    BASE: `${API_BASE}/employees`,
    BY_ID: (id: string) => `${API_BASE}/employees/${id}`,
  },
  ATTENDANCE: {
    BASE: `${API_BASE}/attendance`,
    CHECKIN: `${API_BASE}/attendance/checkin`,
    CHECKOUT: `${API_BASE}/attendance/checkout`,
    BY_EMPLOYEE: (id: string) => `${API_BASE}/attendance/employee/${id}`,
  },
  INVENTORY: {
    BASE: `${API_BASE}/inventory`,
    BY_ID: (id: string) => `${API_BASE}/inventory/${id}`,
    LOW_STOCK: `${API_BASE}/inventory/low-stock`,
  },
  CUSTOMERS: {
    BASE: `${API_BASE}/customers`,
    BY_ID: (id: string) => `${API_BASE}/customers/${id}`,
  },
  REPORTS: {
    DASHBOARD: `${API_BASE}/reports/dashboard`,
    ATTENDANCE: `${API_BASE}/reports/attendance`,
    INVENTORY: `${API_BASE}/reports/inventory`,
    SALES: `${API_BASE}/reports/sales`,
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE}/notifications`,
    MARK_READ: (id: string) => `${API_BASE}/notifications/${id}/read`,
  },
  AI: {
    ANALYZE: `${API_BASE}/ai/analyze`,
    PREDICT: `${API_BASE}/ai/predict`,
    CHAT: `${API_BASE}/ai/chat`,
  },
  UPLOAD: {
    IMAGE: `${API_BASE}/upload/image`,
  },
} as const;
