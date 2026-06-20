import { create } from 'zustand';
import type { User, Requirement, Report, Notification, ValidationResult, AIQualityEvaluation } from '../types';
import { authService } from '../services/auth';
import { requirementService } from '../services/requirements';
import { reportService } from '../services/reports';
import type { DraftReportPayload } from '../services/reports';
import { notificationService } from '../services/notifications';
import { analyticsService } from '../services/analytics';
import type { AnalyticsResponse } from '../services/analytics';

interface State {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  requirements: Requirement[];
  currentRequirement: Requirement | null;
  currentReport: Report | null;
  currentValidationResult: ValidationResult | null;
  currentAIEvaluation: AIQualityEvaluation | null;
  analytics: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'ADMIN' | 'QA' | 'CLIENT') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  fetchRequirements: () => Promise<void>;
  fetchRequirement: (id: string) => Promise<void>;
  createRequirement: (data: { title: string; description: string; category: string; project: string }) => Promise<void>;
  assignQA: (reqId: string, qaId: string) => Promise<void>;

  fetchReport: (requirementId: string) => Promise<void>;
  draftReport: (data: DraftReportPayload) => Promise<void>;
  submitReport: (reportId: string) => Promise<void>;
  runValidation: (requirementId: string, qaFindings?: { summary: string; missingFeatures: string[]; risks: string[] }) => Promise<void>;
  runAIQualityGate: (requirementId: string) => Promise<void>;

  fetchAnalytics: () => Promise<void>;
  clearError: () => void;
}

export const useStore = create<State>((set, get) => ({
  user: null,
  token: localStorage.getItem('reqwise_token'),
  notifications: [],
  requirements: [],
  currentRequirement: null,
  currentReport: null,
  currentValidationResult: null,
  currentAIEvaluation: null,
  analytics: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('reqwise_token', token);
      set({ token, user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authService.register(name, email, password, role);
      localStorage.setItem('reqwise_token', token);
      set({ token, user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('reqwise_token');
    set({ token: null, user: null, requirements: [], notifications: [], currentRequirement: null, currentReport: null, currentValidationResult: null, analytics: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { user } = await authService.getCurrentUser();
      set({ user });
    } catch (err) {
      get().logout();
    }
  },

  fetchNotifications: async () => {
    try {
      const { notifications } = await notificationService.getNotifications();
      set({ notifications });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  markNotificationRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        )
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchRequirements: async () => {
    set({ loading: true, error: null });
    try {
      const { requirements } = await requirementService.getRequirements();
      set({ requirements, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchRequirement: async (id) => {
    set({ loading: true, error: null });
    try {
      const { requirement } = await requirementService.getRequirementById(id);
      set({ currentRequirement: requirement, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createRequirement: async (data) => {
    set({ loading: true, error: null });
    try {
      const { requirement } = await requirementService.createRequirement(data);
      set((state) => ({
        requirements: [requirement, ...state.requirements],
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  assignQA: async (reqId, qaId) => {
    set({ loading: true, error: null });
    try {
      const { requirement } = await requirementService.assignQA(reqId, qaId);
      set((state) => ({
        requirements: state.requirements.map((r) =>
          r._id === reqId ? requirement : r
        ),
        currentRequirement: state.currentRequirement?._id === reqId ? requirement : state.currentRequirement,
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchReport: async (requirementId) => {
    set({ loading: true, error: null, currentReport: null, currentValidationResult: null });
    try {
      const { report, validationResult } = await reportService.getReportByRequirement(requirementId);
      set({
        currentReport: report || null,
        currentValidationResult: (report && report.validationResult) || validationResult || null,
        loading: false
      });
    } catch (err: any) {
      // If report is not found, it's fine (status 404 is expected for new requirements)
      set({ loading: false });
    }
  },

  draftReport: async (data) => {
    set({ loading: true, error: null });
    try {
      const { report } = await reportService.draftReport(data);
      set({
        currentReport: report,
        currentValidationResult: report.validationResult || null,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  submitReport: async (reportId) => {
    set({ loading: true, error: null });
    try {
      const { report } = await reportService.submitReport(reportId);
      set({ currentReport: report, loading: false });
      // Reload requirement to get updated status
      const reqId = report.requirement;
      if (reqId) {
        const { requirement } = await requirementService.getRequirementById(reqId.toString());
        set({ currentRequirement: requirement });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  runValidation: async (requirementId, qaFindings) => {
    set({ loading: true, error: null });
    try {
      const { validationResult } = await reportService.runValidation(requirementId, qaFindings);
      set({ currentValidationResult: validationResult, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  runAIQualityGate: async (requirementId) => {
    set({ loading: true, error: null, currentAIEvaluation: null });
    try {
      const evaluation = await requirementService.evaluateQuality(requirementId);
      set({ currentAIEvaluation: evaluation, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const data = await analyticsService.getDashboardData();
      set({ analytics: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  }
}));
