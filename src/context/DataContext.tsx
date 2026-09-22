import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectItem, TestimonialItem, AdminSettings } from '../types';
import { PROJECTS_DATA, TESTIMONIALS_DATA } from '../data/content';
import { checkPasswordStrength } from '../utils/passwordValidator';

export interface DbStatus {
  connected: boolean;
  message: string;
  latencyMs?: number;
  serverTime?: string;
  counts?: {
    projects: number;
    testimonials: number;
    inquiries: number;
  };
  checking: boolean;
}

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  username: 'admin',
  email: 'admin@greatstargem.com',
  apiToken: 'gsg_live_sec_89f3b14092de718a22c4',
  webhookSecret: 'whsec_993417aa88de1b329419c',
  sessionTimeoutMinutes: 30,
  publicApiEnabled: true,
  lastUpdated: new Date().toISOString()
};

interface DataContextType {
  projects: ProjectItem[];
  testimonials: TestimonialItem[];
  addProject: (project: Omit<ProjectItem, 'id'>) => Promise<ProjectItem>;
  updateProject: (id: string, updated: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  resetProjects: () => void;
  addTestimonial: (testimonial: Omit<TestimonialItem, 'id'>) => Promise<TestimonialItem>;
  updateTestimonial: (id: string, updated: Partial<TestimonialItem>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  resetTestimonials: () => void;
  isAdminLoggedIn: boolean;
  adminLogin: (user: string, pass: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  adminLogout: (reason?: string) => void;
  sessionTimeoutNotice: string | null;
  clearSessionTimeoutNotice: () => void;
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;
  getActivePassword: () => string;
  verifyCurrentPassword: (currentPass: string) => Promise<{ valid: boolean; message?: string }>;
  changeAdminPassword: (currentPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  changeAdminUsername: (newUsername: string, currentPassword: string) => Promise<{ success: boolean; message: string }>;
  recoverAdminPassword: (
    recoveryKey: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  currentRoute: 'public' | 'admin';
  navigateTo: (route: 'public' | 'admin') => void;
  dbStatus: DbStatus;
  checkDbStatus: () => Promise<void>;
  initAndSeedDatabase: () => Promise<{ success: boolean; message: string }>;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEYS = {
  PROJECTS: 'gsg_projects_v2',
  TESTIMONIALS: 'gsg_testimonials_v2',
  AUTH: 'gsg_admin_auth_v2',
  SETTINGS: 'gsg_admin_settings_v2',
  PASSWORD: 'gsg_admin_pass_v2'
};

export function DataProvider({ children }: { children: ReactNode }) {
  // 1. Projects State
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    return PROJECTS_DATA;
  });

  // 2. Testimonials State
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load testimonials from localStorage', e);
    }
    return TESTIMONIALS_DATA;
  });

  // 3. Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch (e) {
      return false;
    }
  });

  // 4. Admin Settings State
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_ADMIN_SETTINGS;
  });

  // Session timeout banner notice
  const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(null);

  const clearSessionTimeoutNotice = () => {
    setSessionTimeoutNotice(null);
  };

  // 5. DB Status State
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    message: 'Checking PostgreSQL database status...',
    checking: true,
  });

  const checkDbStatus = async () => {
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          connected: data.connected,
          message: data.message,
          latencyMs: data.latencyMs,
          serverTime: data.serverTime,
          counts: data.counts,
          checking: false,
        });
      } else {
        setDbStatus({
          connected: false,
          message: 'Server error while checking database status.',
          checking: false,
        });
      }
    } catch {
      setDbStatus({
        connected: false,
        message: 'Could not reach backend API service.',
        checking: false,
      });
    }
  };

  const initAndSeedDatabase = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      await checkDbStatus();
      // Also reload projects and testimonials
      await refreshDataFromBackend();
      return {
        success: data.success ?? false,
        message: data.message || 'Database initialized.',
      };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Database sync failed',
      };
    }
  };

  const refreshDataFromBackend = async () => {
    try {
      const [projRes, testRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/testimonials'),
      ]);
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData.data) && projData.data.length > 0) {
          setProjects(projData.data);
          try {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projData.data));
          } catch {}
        }
      }
      if (testRes.ok) {
        const testData = await testRes.json();
        if (Array.isArray(testData.data) && testData.data.length > 0) {
          setTestimonials(testData.data);
          try {
            localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(testData.data));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Backend data refresh warning:', err);
    }
  };

  useEffect(() => {
    checkDbStatus();
    refreshDataFromBackend();
  }, []);

  // 6. URL Route State (/admin or /)
  const isUrlAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/admin' ||
      path.endsWith('/admin') ||
      path.endsWith('/admin/') ||
      path.includes('/admin') ||
      hash === '#/admin' ||
      hash === '#admin' ||
      hash.startsWith('#/admin') ||
      hash.startsWith('#admin') ||
      search.includes('admin')
    );
  };

  const [currentRoute, setCurrentRoute] = useState<'public' | 'admin'>(() => {
    return isUrlAdmin() ? 'admin' : 'public';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const shouldBeAdmin = isUrlAdmin();
      setCurrentRoute((prev) => {
        const next = shouldBeAdmin ? 'admin' : 'public';
        return prev !== next ? next : prev;
      });
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    const interval = setInterval(handleUrlChange, 300);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      clearInterval(interval);
    };
  }, []);

  const navigateTo = (route: 'public' | 'admin') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const targetUrl = route === 'admin' ? '/admin' : '/';
      try {
        window.history.pushState({}, '', targetUrl);
      } catch {
        window.location.hash = route === 'admin' ? '#/admin' : '';
      }
      if (route === 'public') {
        if (window.location.hash === '#/admin' || window.location.hash === '#admin') {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {
            window.location.hash = '';
          }
        }
      }
    }
  };

  // Projects CRUD with Backend Persistence
  const addProject = async (item: Omit<ProjectItem, 'id'>): Promise<ProjectItem> => {
    let newProject: ProjectItem = {
      ...item,
      id: `proj-${Date.now()}`
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          newProject = created;
        }
      }
    } catch (err) {
      console.warn('API add project fallback to local:', err);
    }

    setProjects((prev) => {
      const updated = [newProject, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    return newProject;
  };

  const updateProject = async (id: string, updatedFields: Partial<ProjectItem>) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.warn('API update project warning:', err);
    }
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('API delete project warning:', err);
    }
  };

  const resetProjects = () => {
    setProjects(PROJECTS_DATA);
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(PROJECTS_DATA));
    } catch (e) {
      console.error(e);
    }
  };

  // Testimonials CRUD with Backend Persistence
  const addTestimonial = async (item: Omit<TestimonialItem, 'id'>): Promise<TestimonialItem> => {
    let newTestimonial: TestimonialItem = {
      ...item,
      id: `test-${Date.now()}`
    };

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          newTestimonial = created;
        }
      }
    } catch (err) {
      console.warn('API add testimonial fallback to local:', err);
    }

    setTestimonials((prev) => {
      const updated = [newTestimonial, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    return newTestimonial;
  };

  const updateTestimonial = async (id: string, updatedFields: Partial<TestimonialItem>) => {
    setTestimonials((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t));
      try {
        localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.warn('API update testimonial warning:', err);
    }
  };

  const deleteTestimonial = async (id: string) => {
    setTestimonials((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('API delete testimonial warning:', err);
    }
  };

  const resetTestimonials = () => {
    setTestimonials(TESTIMONIALS_DATA);
    try {
      localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(TESTIMONIALS_DATA));
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Auth & Password Management
  const getActivePassword = (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PASSWORD) || '';
    } catch {
      return '';
    }
  };

  // Sync admin auth status on startup
  useEffect(() => {
    fetch('/api/admin/auth-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setAdminSettings((prev) => ({
            ...prev,
            username: data.username,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const adminLogin = async (
    user: string,
    pass: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const trimmedUser = user.trim();
    if (!trimmedUser || !pass) {
      return { success: false, message: 'Please provide both username and password.' };
    }

    // Try backend authentication first
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        setSessionTimeoutNotice(null);
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
          // Purge any plain-text password from localStorage for security
          localStorage.removeItem(STORAGE_KEYS.PASSWORD);
        } catch {}
        return { success: true };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid administrator credentials. Please check your username and password.',
        };
      }
    } catch (err) {
      console.warn('Backend login query fallback to local credentials:', err);
    }

    // Fallback to local credential check ONLY when backend is unreachable
    const storedPass = getActivePassword();
    const validUser = adminSettings.username || 'admin';

    if (storedPass && trimmedUser.toLowerCase() === validUser.toLowerCase() && pass === storedPass) {
      setIsAdminLoggedIn(true);
      setSessionTimeoutNotice(null);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      } catch (e) {
        console.error(e);
      }
      return { success: true };
    }

    return { success: false, message: 'Invalid administrator credentials. Please check your username and password.' };
  };

  const verifyCurrentPassword = async (
    currentPass: string
  ): Promise<{ valid: boolean; message?: string }> => {
    if (!currentPass) {
      return { valid: false, message: 'Current password is required to verify administrator authorization.' };
    }
    try {
      const res = await fetch('/api/admin/verify-current-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        return { valid: true, message: data.message };
      }
      return {
        valid: false,
        message: data.message || 'Current password does not match your active administrator password.',
      };
    } catch (err) {
      console.warn('Password verification network error:', err);
      return { valid: false, message: 'Failed to verify password with authentication service.' };
    }
  };

  const changeAdminPassword = async (
    currentPass: string,
    newPass: string,
    confirmPass: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Current Password check
    if (!currentPass) {
      return { success: false, message: 'Current password is required to verify your authorization.' };
    }

    // 2. New password non-empty check
    if (!newPass || !confirmPass) {
      return { success: false, message: 'New password and confirmation fields cannot be empty.' };
    }

    // 3. Confirm password equality check
    if (newPass !== confirmPass) {
      return { success: false, message: 'New password and confirmation password do not match.' };
    }

    // 4. Current password !== new password check
    if (currentPass === newPass) {
      return { success: false, message: 'New password cannot be identical to your current password.' };
    }

    // 5. Strength and security policy validation
    const validation = checkPasswordStrength(newPass, adminSettings.username || 'admin');
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errorMessage || 'New password does not meet security requirements.',
      };
    }

    // 6. Synchronize to backend & PostgreSQL database with salted cryptographic hashing
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminSettings.username || 'admin',
          currentPassword: currentPass,
          newPassword: newPass,
          confirmPassword: confirmPass,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to update administrative password.' };
      }

      // Purge any plain-text password from localStorage for security
      try {
        localStorage.removeItem(STORAGE_KEYS.PASSWORD);
      } catch (e) {
        console.error('Failed to clean up localStorage password', e);
      }

      return {
        success: true,
        message: data.message || 'Admin password successfully hashed and updated in PostgreSQL database.',
      };
    } catch (err) {
      console.error('Backend change password error:', err);
      return {
        success: false,
        message: 'Could not communicate with authentication server to update password.',
      };
    }
  };

  const recoverAdminPassword = async (
    recoveryKey: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!recoveryKey.trim()) {
      return { success: false, message: 'Master Recovery Key is required.' };
    }
    if (!newPassword || !confirmPassword) {
      return { success: false, message: 'New password and confirmation fields cannot be empty.' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'New password and confirmation password do not match.' };
    }

    const validation = checkPasswordStrength(newPassword, adminSettings.username || 'admin');
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errorMessage || 'New password does not meet security requirements.',
      };
    }

    try {
      const res = await fetch('/api/admin/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryKey: recoveryKey.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Failed to recover administrative credentials.',
        };
      }

      // Purge any legacy stored password
      try {
        localStorage.removeItem(STORAGE_KEYS.PASSWORD);
      } catch {}

      return {
        success: true,
        message: data.message || 'Password successfully reset! You can now log in with your new password.',
      };
    } catch (err) {
      console.error('Password recovery error:', err);
      return {
        success: false,
        message: 'Could not communicate with authentication server to reset credentials.',
      };
    }
  };

  const changeAdminUsername = async (
    newUsername: string,
    currentPass: string
  ): Promise<{ success: boolean; message: string }> => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
      return { success: false, message: 'Username cannot be empty.' };
    }
    if (!currentPass) {
      return { success: false, message: 'Current password is required to authorize username change.' };
    }

    try {
      const res = await fetch('/api/admin/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: trimmed,
          currentPassword: currentPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Failed to update administrator username.',
        };
      }

      // Update local adminSettings with new username
      setAdminSettings((prev) => {
        const updated = { ...prev, username: trimmed, lastUpdated: new Date().toISOString() };
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      return {
        success: true,
        message: data.message || 'Administrator username updated successfully.',
      };
    } catch (err) {
      console.error('Backend change username error:', err);
      return {
        success: false,
        message: 'Could not communicate with authentication server to update username.',
      };
    }
  };

  const adminLogout = (reason?: string) => {
    setIsAdminLoggedIn(false);
    if (reason) {
      setSessionTimeoutNotice(reason);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    } catch (e) {
      console.error(e);
    }
  };

  // Active Session Inactivity Timeout Enforcer
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // Timeout duration in minutes from adminSettings (default: 30 minutes, minimum: 1 minute)
    const timeoutMinutes = Number(adminSettings.sessionTimeoutMinutes) || 30;
    const timeoutMs = Math.max(1, timeoutMinutes) * 60 * 1000;

    let timeoutId: NodeJS.Timeout;

    const performTimeout = () => {
      console.warn(`[Security] Session timed out after ${timeoutMinutes} minutes of inactivity.`);
      adminLogout(`Your administrator session expired after ${timeoutMinutes} minutes of inactivity. Please log in again.`);
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performTimeout, timeoutMs);
    };

    // User interaction events that signal active use
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Attach listeners
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [isAdminLoggedIn, adminSettings.sessionTimeoutMinutes]);

  const updateAdminSettings = (settings: Partial<AdminSettings>) => {
    setAdminSettings((prev) => {
      const updated = { ...prev, ...settings, lastUpdated: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        testimonials,
        addProject,
        updateProject,
        deleteProject,
        resetProjects,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,
        resetTestimonials,
        isAdminLoggedIn,
        adminLogin,
        adminLogout,
        sessionTimeoutNotice,
        clearSessionTimeoutNotice,
        adminSettings,
        updateAdminSettings,
        getActivePassword,
        verifyCurrentPassword,
        changeAdminPassword,
        changeAdminUsername,
        recoverAdminPassword,
        currentRoute,
        navigateTo,
        dbStatus,
        checkDbStatus,
        initAndSeedDatabase,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
