import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getPrisma, getPgPool, isDatabaseConfigured, testConnection, ensureTablesExist } from './server/db';
import { PROJECTS_DATA, TESTIMONIALS_DATA } from './src/data/content';
import { checkPasswordStrength } from './src/utils/passwordValidator';
import { 
  hashPassword, 
  verifyPassword, 
  isHashedPassword, 
  readAuthCache, 
  writeAuthCache,
  generateTotpSetup,
  verifyTotpToken,
  verifyAndConsumeBackupCode,
  generateBackupCodes
} from './server/auth';

dotenv.config();

// In-memory temporary sessions for pending 2FA login verifications
interface Pending2FASession {
  username: string;
  expiresAt: number;
}
const pending2FALoginSessions = new Map<string, Pending2FASession>();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of pending2FALoginSessions.entries()) {
    if (session.expiresAt < now) {
      pending2FALoginSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Initial fallback values from environment variables if provided in .env
function getEnvDefaultPassword(): string {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_DEFAULT_PASSWORD ||
    process.env.ADMIN_PASS ||
    process.env.DEFAULT_ADMIN_PASSWORD ||
    'admin123'
  );
}

function getEnvDefaultUsername(): string {
  return (
    process.env.ADMIN_USERNAME ||
    process.env.ADMIN_USER ||
    process.env.DEFAULT_ADMIN_USER ||
    'admin'
  );
}

/**
 * Resolves the active administrator credentials and 2FA configuration.
 * NEVER returns plain text password if customized; returns passwordHash.
 *
 * PRIORITY ORDER:
 * 1. PostgreSQL Database (`AdminSetting` table row with custom password and 2FA settings)
 * 2. Local Auth Cache (written when admin changes password or enables 2FA)
 * 3. Initial default from .env / process.env.ADMIN_PASSWORD (ONLY when admin has never changed password)
 */
async function getActiveAdminCredentials(): Promise<{
  username: string;
  passwordHash: string;
  isCustomPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
}> {
  const pool = getPgPool();
  const prisma = getPrisma();
  const cache = readAuthCache();

  // 1. Check PostgreSQL Database first via pool (100% PgBouncer safe)
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT username, password, "twoFactorEnabled", "twoFactorSecret", "twoFactorBackupCodes" FROM "AdminSetting" WHERE id = $1 LIMIT 1',
        ['default']
      );
      if (res.rows.length > 0 && res.rows[0].password) {
        let storedPassword = res.rows[0].password;
        // If legacy plain-text password exists in DB, automatically upgrade it to salted cryptographic hash
        if (!isHashedPassword(storedPassword)) {
          try {
            const hashed = await hashPassword(storedPassword);
            await pool.query('UPDATE "AdminSetting" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hashed, 'default']);
            writeAuthCache({
              username: res.rows[0].username || getEnvDefaultUsername(),
              passwordHash: hashed,
              isCustomPassword: true,
              twoFactorEnabled: Boolean(res.rows[0].twoFactorEnabled),
              twoFactorSecret: res.rows[0].twoFactorSecret || undefined,
            });
            storedPassword = hashed;
          } catch (upgradeErr) {
            console.warn('Auto-hash migration warning:', upgradeErr);
          }
        }

        let backupCodes: string[] | undefined;
        try {
          if (res.rows[0].twoFactorBackupCodes) {
            backupCodes = JSON.parse(res.rows[0].twoFactorBackupCodes);
          }
        } catch {}

        return {
          username: res.rows[0].username || getEnvDefaultUsername(),
          passwordHash: storedPassword,
          isCustomPassword: true,
          twoFactorEnabled: Boolean(res.rows[0].twoFactorEnabled),
          twoFactorSecret: res.rows[0].twoFactorSecret || undefined,
          twoFactorBackupCodes: backupCodes,
        };
      }
    } catch (err) {
      console.warn('PostgreSQL pool admin credential lookup warning:', err);
    }
  } else if (prisma) {
    try {
      const setting = await (prisma as any).adminSetting.findUnique({
        where: { id: 'default' },
      });
      if (setting && setting.password) {
        let storedPassword = setting.password;
        if (!isHashedPassword(storedPassword)) {
          try {
            const hashed = await hashPassword(storedPassword);
            await (prisma as any).adminSetting.update({
              where: { id: 'default' },
              data: { password: hashed, updatedAt: new Date() },
            });
            storedPassword = hashed;
          } catch (upgradeErr) {
            console.warn('Prisma auto-hash migration warning:', upgradeErr);
          }
        }
        let backupCodes: string[] | undefined;
        try {
          if (setting.twoFactorBackupCodes) {
            backupCodes = JSON.parse(setting.twoFactorBackupCodes);
          }
        } catch {}

        return {
          username: setting.username || getEnvDefaultUsername(),
          passwordHash: storedPassword,
          isCustomPassword: true,
          twoFactorEnabled: Boolean(setting.twoFactorEnabled),
          twoFactorSecret: setting.twoFactorSecret || undefined,
          twoFactorBackupCodes: backupCodes,
        };
      }
    } catch (err) {
      console.warn('Prisma admin credential lookup warning:', err);
    }
  }

  // 2. Check server-side local auth cache if password was changed or 2FA configured
  if (cache.passwordHash && cache.isCustomPassword) {
    return {
      username: cache.username || getEnvDefaultUsername(),
      passwordHash: cache.passwordHash,
      isCustomPassword: true,
      twoFactorEnabled: Boolean(cache.twoFactorEnabled),
      twoFactorSecret: cache.twoFactorSecret,
      twoFactorBackupCodes: cache.twoFactorBackupCodes,
    };
  }

  // 3. Fall back to initial environment default (used ONLY before any password change)
  return {
    username: getEnvDefaultUsername(),
    passwordHash: getEnvDefaultPassword(),
    isCustomPassword: false,
    twoFactorEnabled: Boolean(cache.twoFactorEnabled),
    twoFactorSecret: cache.twoFactorSecret,
    twoFactorBackupCodes: cache.twoFactorBackupCodes,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proactively ensure database tables and columns (including password) exist on boot
  ensureTablesExist().catch((err) => {
    console.warn('Initial ensureTablesExist warning:', err);
  });

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Great Star Gem Enterprise Backend',
      databaseConfigured: isDatabaseConfigured(),
      timestamp: new Date().toISOString(),
    });
  });

  // DB Connection status & diagnostic
  app.get('/api/db/status', async (req, res) => {
    try {
      const result = await testConnection();
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database check failed';
      res.status(500).json({ connected: false, message });
    }
  });

  // DB Sync / Initialize Tables & Seed Default Data
  app.post('/api/db/init', async (req, res) => {
    try {
      const initResult = await ensureTablesExist();
      if (!initResult.success) {
        return res.status(400).json(initResult);
      }

      const prisma = getPrisma();
      let seeded = { projects: 0, testimonials: 0 };

      if (prisma) {
        // Seed projects if empty
        const projectCount = await prisma.project.count();
        if (projectCount === 0) {
          for (const item of PROJECTS_DATA) {
            await prisma.project.create({
              data: {
                id: item.id,
                title: item.title,
                category: item.category,
                categoryName: item.categoryName,
                location: item.location || '',
                year: item.year,
                client: item.client,
                image: item.image,
                summary: item.summary,
                challenge: item.challenge || '',
                solution: item.solution || '',
                impactMetrics: item.impactMetrics || [],
                liveUrl: item.liveUrl || '',
                githubUrl: item.githubUrl || '',
                status: item.status || 'published',
              },
            });
            seeded.projects++;
          }
        }

        // Seed testimonials if empty
        const testimonialCount = await prisma.testimonial.count();
        if (testimonialCount === 0) {
          for (const t of TESTIMONIALS_DATA) {
            await prisma.testimonial.create({
              data: {
                id: t.id,
                name: t.name,
                role: t.role,
                organization: t.organization,
                country: t.country || '',
                serviceCategory: t.serviceCategory || 'conference',
                avatar: t.avatar || '',
                rating: t.rating || 5,
                quote: t.quote,
              },
            });
            seeded.testimonials++;
          }
        }
      }

      const status = await testConnection();

      return res.json({
        success: true,
        message: 'Database tables verified and initial records synchronized.',
        seeded,
        counts: status.counts,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize database';
      console.error('Error in /api/db/init:', message);
      return res.status(500).json({ success: false, message });
    }
  });

  // Projects API
  app.get('/api/projects', async (req, res) => {
    const pool = getPgPool();
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM "Project" ORDER BY "createdAt" DESC');
        if (result.rows.length > 0) {
          return res.json({ source: 'database', data: result.rows });
        }
      } catch (err) {
        console.warn('PostgreSQL pool project query error:', err);
      }
    }

    const prisma = getPrisma();
    if (!prisma) {
      // Return static default if DB not configured yet
      return res.json({
        source: 'local',
        data: PROJECTS_DATA,
      });
    }

    try {
      const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (projects.length === 0) {
        return res.json({ source: 'local', data: PROJECTS_DATA });
      }
      return res.json({ source: 'database', data: projects });
    } catch (err) {
      return res.json({ source: 'local_fallback', data: PROJECTS_DATA });
    }
  });

  app.post('/api/projects', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      const newProject = await prisma.project.create({
        data: {
          title: req.body.title,
          category: req.body.category,
          categoryName: req.body.categoryName || req.body.category,
          location: req.body.location || '',
          year: req.body.year || new Date().getFullYear().toString(),
          client: req.body.client || 'Confidential Client',
          image: req.body.image,
          summary: req.body.summary,
          challenge: req.body.challenge || '',
          solution: req.body.solution || '',
          impactMetrics: req.body.impactMetrics || [],
          liveUrl: req.body.liveUrl || '',
          githubUrl: req.body.githubUrl || '',
          status: req.body.status || 'published',
        },
      });
      return res.status(201).json(newProject);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      return res.status(500).json({ error: message });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      const updated = await prisma.project.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      return res.status(500).json({ error: message });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      await prisma.project.delete({
        where: { id: req.params.id },
      });
      return res.json({ success: true, id: req.params.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      return res.status(500).json({ error: message });
    }
  });

  // Testimonials API
  app.get('/api/testimonials', async (req, res) => {
    const pool = getPgPool();
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM "Testimonial" ORDER BY "createdAt" DESC');
        if (result.rows.length > 0) {
          return res.json({ source: 'database', data: result.rows });
        }
      } catch (err) {
        console.warn('PostgreSQL pool testimonials query error:', err);
      }
    }

    const prisma = getPrisma();
    if (!prisma) {
      return res.json({ source: 'local', data: TESTIMONIALS_DATA });
    }
    try {
      const items = await prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (items.length === 0) {
        return res.json({ source: 'local', data: TESTIMONIALS_DATA });
      }
      return res.json({ source: 'database', data: items });
    } catch (err) {
      return res.json({ source: 'local_fallback', data: TESTIMONIALS_DATA });
    }
  });

  app.post('/api/testimonials', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      const created = await prisma.testimonial.create({
        data: {
          name: req.body.name,
          role: req.body.role,
          organization: req.body.organization,
          country: req.body.country || 'Nigeria',
          serviceCategory: req.body.serviceCategory || 'conference',
          avatar: req.body.avatar || '',
          rating: Number(req.body.rating) || 5,
          quote: req.body.quote,
        },
      });
      return res.status(201).json(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create testimonial';
      return res.status(500).json({ error: message });
    }
  });

  app.put('/api/testimonials/:id', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      const updated = await prisma.testimonial.update({
        where: { id: req.params.id },
        data: req.body,
      });
      return res.json(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update testimonial';
      return res.status(500).json({ error: message });
    }
  });

  app.delete('/api/testimonials/:id', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }
    try {
      await prisma.testimonial.delete({
        where: { id: req.params.id },
      });
      return res.json({ success: true, id: req.params.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete testimonial';
      return res.status(500).json({ error: message });
    }
  });

  // Contact / Consultation Inquiries API
  app.post('/api/contact', async (req, res) => {
    const prisma = getPrisma();
    const { fullName, email, phone, serviceCategory, company, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    if (prisma) {
      try {
        const inquiry = await prisma.inquiry.create({
          data: {
            fullName,
            email,
            phone: phone || '',
            serviceCategory: serviceCategory || 'general',
            company: company || '',
            message,
          },
        });
        return res.status(201).json({ success: true, inquiry, storedInDb: true });
      } catch (err) {
        console.error('Failed to save inquiry to database:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Consultation request received successfully.',
      storedInDb: Boolean(prisma),
    });
  });

  app.get('/api/inquiries', async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.json({ data: [] });
    }
    try {
      const inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ data: inquiries });
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      return res.json({ data: [] });
    }
  });

  // Admin Authentication Status
  app.get('/api/admin/auth-status', async (req, res) => {
    try {
      const activeCreds = await getActiveAdminCredentials();
      return res.json({
        success: true,
        username: activeCreds.username,
        isCustomPassword: activeCreds.isCustomPassword,
        hasEnvDefault: Boolean(process.env.ADMIN_PASSWORD),
        twoFactorEnabled: activeCreds.twoFactorEnabled,
        isTwoFactorConfigured: Boolean(activeCreds.twoFactorSecret),
      });
    } catch (err) {
      return res.json({
        success: true,
        username: getEnvDefaultUsername(),
        isCustomPassword: false,
        hasEnvDefault: false,
        twoFactorEnabled: false,
        isTwoFactorConfigured: false,
      });
    }
  });

  // Admin Authentication & Password Management
  app.post('/api/admin/verify-current-password', async (req, res) => {
    const { currentPassword } = req.body;
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({
        valid: false,
        message: 'Current password is required to verify administrator authorization.',
      });
    }

    try {
      const activeCreds = await getActiveAdminCredentials();
      const isValid = await verifyPassword(currentPassword, activeCreds.passwordHash);

      if (isValid) {
        return res.json({
          valid: true,
          message: 'Current password verified successfully.',
        });
      } else {
        return res.status(403).json({
          valid: false,
          message: 'Current password does not match your active administrator password.',
        });
      }
    } catch (err) {
      console.error('Verify current password error:', err);
      return res.status(500).json({
        valid: false,
        message: 'Internal error verifying password.',
      });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const activeCreds = await getActiveAdminCredentials();
    const isUserMatch = username.trim().toLowerCase() === activeCreds.username.toLowerCase();
    const isPassMatch = await verifyPassword(password, activeCreds.passwordHash);

    if (isUserMatch && isPassMatch) {
      // If Two-Factor Authentication is active and configured, issue challenge
      if (activeCreds.twoFactorEnabled && activeCreds.twoFactorSecret) {
        const tempToken = crypto.randomBytes(32).toString('hex');
        pending2FALoginSessions.set(tempToken, {
          username: activeCreds.username,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        });

        return res.json({
          success: true,
          require2FA: true,
          tempToken,
          username: activeCreds.username,
          message: 'Two-Factor Authentication required. Enter the 6-digit code from your authenticator app.',
        });
      }

      return res.json({
        success: true,
        require2FA: false,
        message: 'Authentication successful.',
        username: activeCreds.username,
        isCustomPassword: activeCreds.isCustomPassword,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials. Please check your username and password.',
      });
    }
  });

  // Verify 2FA Code or Emergency Backup Code during Login
  app.post('/api/admin/2fa/verify-login', async (req, res) => {
    const { tempToken, code, isBackupCode } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Session token and 2FA verification code are required.',
      });
    }

    const session = pending2FALoginSessions.get(tempToken);
    if (!session || session.expiresAt < Date.now()) {
      pending2FALoginSessions.delete(tempToken);
      return res.status(401).json({
        success: false,
        sessionExpired: true,
        message: 'Authentication session expired. Please sign in again with your password.',
      });
    }

    const activeCreds = await getActiveAdminCredentials();
    if (!activeCreds.twoFactorSecret) {
      pending2FALoginSessions.delete(tempToken);
      return res.json({ success: true, username: session.username });
    }

    if (isBackupCode) {
      const { isValid, remainingCodes } = verifyAndConsumeBackupCode(
        code,
        activeCreds.twoFactorBackupCodes || []
      );

      if (isValid) {
        pending2FALoginSessions.delete(tempToken);

        // Update remaining backup codes in database and cache
        const pool = getPgPool();
        if (pool) {
          try {
            await pool.query(
              'UPDATE "AdminSetting" SET "twoFactorBackupCodes" = $1, "updatedAt" = NOW() WHERE id = $2',
              [JSON.stringify(remainingCodes), 'default']
            );
          } catch (e) {
            console.error('Failed to update remaining backup codes in DB:', e);
          }
        }
        writeAuthCache({
          ...readAuthCache(),
          twoFactorBackupCodes: remainingCodes,
        });

        return res.json({
          success: true,
          message: 'Emergency recovery code verified. Login successful.',
          username: session.username,
          remainingBackupCodes: remainingCodes.length,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid emergency backup code. Make sure each single-use code is entered accurately.',
        });
      }
    }

    // Standard 6-digit TOTP validation
    const isValid = verifyTotpToken(code, activeCreds.twoFactorSecret);
    if (isValid) {
      pending2FALoginSessions.delete(tempToken);
      return res.json({
        success: true,
        message: 'Two-Factor Authentication verified successfully.',
        username: session.username,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid 6-digit authentication code. Please check your authenticator app and try again.',
      });
    }
  });

  // Get current 2FA Status & configuration info
  app.get('/api/admin/2fa/status', async (req, res) => {
    try {
      const activeCreds = await getActiveAdminCredentials();
      const hasSecret = Boolean(activeCreds.twoFactorSecret);
      const isEnabled = Boolean(activeCreds.twoFactorEnabled && hasSecret);
      const backupCount = activeCreds.twoFactorBackupCodes ? activeCreds.twoFactorBackupCodes.length : 0;

      return res.json({
        success: true,
        twoFactorEnabled: isEnabled,
        isConfigured: hasSecret,
        backupCodesRemaining: backupCount,
      });
    } catch (err) {
      console.error('2FA status error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve 2FA status.' });
    }
  });

  // Generate a new TOTP setup (Secret, URI, QR Code, and Backup Codes)
  app.post('/api/admin/2fa/setup', async (req, res) => {
    try {
      const activeCreds = await getActiveAdminCredentials();
      const setup = await generateTotpSetup(activeCreds.username || 'admin');

      return res.json({
        success: true,
        secret: setup.secret,
        uri: setup.uri,
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
      });
    } catch (err) {
      console.error('2FA setup error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate 2FA setup.' });
    }
  });

  // Activate 2FA after verifying the first 6-digit code with the newly scanned secret
  app.post('/api/admin/2fa/activate', async (req, res) => {
    const { secret, code, backupCodes } = req.body;
    if (!secret || !code) {
      return res.status(400).json({
        success: false,
        message: 'Secret and verification code are required to activate 2FA.',
      });
    }

    const isValid = verifyTotpToken(code, secret);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Verification code incorrect. Please enter the current 6-digit code shown in your authenticator app.',
      });
    }

    const codes = Array.isArray(backupCodes) ? backupCodes : generateBackupCodes(6);
    const pool = getPgPool();
    let dbUpdated = false;

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO "AdminSetting" (id, "twoFactorEnabled", "twoFactorSecret", "twoFactorBackupCodes", "updatedAt")
           VALUES ('default', true, $1, $2, NOW())
           ON CONFLICT (id) DO UPDATE SET "twoFactorEnabled" = true, "twoFactorSecret" = EXCLUDED."twoFactorSecret", "twoFactorBackupCodes" = EXCLUDED."twoFactorBackupCodes", "updatedAt" = NOW()`,
          [secret, JSON.stringify(codes)]
        );
        dbUpdated = true;
      } catch (poolErr) {
        console.warn('PostgreSQL 2FA activation warning:', poolErr);
      }
    }

    writeAuthCache({
      ...readAuthCache(),
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: codes,
    });

    return res.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) is now active! Your admin account is protected by TOTP.',
      backupCodes: codes,
      storedInDb: dbUpdated,
    });
  });

  // Disable 2FA
  app.post('/api/admin/2fa/disable', async (req, res) => {
    const { currentPassword, code } = req.body;
    const activeCreds = await getActiveAdminCredentials();

    let authorized = false;
    if (currentPassword) {
      authorized = await verifyPassword(currentPassword, activeCreds.passwordHash);
    } else if (code && activeCreds.twoFactorSecret) {
      authorized = verifyTotpToken(code, activeCreds.twoFactorSecret);
    }

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Authorization failed. Please enter your valid current password or current 2FA code to disable 2FA.',
      });
    }

    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          'UPDATE "AdminSetting" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL, "twoFactorBackupCodes" = NULL, "updatedAt" = NOW() WHERE id = $1',
          ['default']
        );
      } catch (err) {
        console.warn('PostgreSQL disable 2FA warning:', err);
      }
    }

    writeAuthCache({
      ...readAuthCache(),
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
    });

    return res.json({
      success: true,
      message: 'Two-Factor Authentication has been successfully disabled.',
    });
  });

  // Regenerate emergency backup codes
  app.post('/api/admin/2fa/regenerate-backup-codes', async (req, res) => {
    const { currentPassword } = req.body;
    const activeCreds = await getActiveAdminCredentials();

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required.' });
    }

    const isMatch = await verifyPassword(currentPassword, activeCreds.passwordHash);
    if (!isMatch) {
      return res.status(403).json({ success: false, message: 'Current password verification failed.' });
    }

    const newCodes = generateBackupCodes(6);
    const pool = getPgPool();
    if (pool) {
      await pool.query(
        'UPDATE "AdminSetting" SET "twoFactorBackupCodes" = $1, "updatedAt" = NOW() WHERE id = $2',
        [JSON.stringify(newCodes), 'default']
      );
    }
    writeAuthCache({
      ...readAuthCache(),
      twoFactorBackupCodes: newCodes,
    });

    return res.json({
      success: true,
      message: 'New emergency backup codes generated.',
      backupCodes: newCodes,
    });
  });

  app.post('/api/admin/change-password', async (req, res) => {
    const { username, currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Current password input is strictly required before changing password
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to verify administrator authorization.',
      });
    }

    // 2. New password and confirmation must be provided
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password are required.',
      });
    }

    // 3. New password and confirmation must match exactly
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const activeCreds = await getActiveAdminCredentials();
    const targetUsername = username ? username.trim() : activeCreds.username;

    // 4. CRITICAL SECURITY CHECK: Current input password MUST match active password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, activeCreds.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(403).json({
        success: false,
        message: 'Current password verification failed. The provided current password does not match your active administrator password.',
      });
    }

    // 5. New password cannot be identical to current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to your current password. Please choose a different password.',
      });
    }

    // 6. Validate new password strength and security rules
    const validation = checkPasswordStrength(newPassword, targetUsername);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errorMessage || 'New password does not meet security requirements.',
        requirements: validation.requirements,
      });
    }

    // 7. CRITICAL: Never store plain text in the database!
    // Compute cryptographically secure, salted PBKDF2-SHA512 one-way hash
    const hashedPassword = await hashPassword(newPassword);

    // 8. Persist salted hash into PostgreSQL database
    const pool = getPgPool();
    const prisma = getPrisma();
    let dbSaved = false;

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO "AdminSetting" (id, username, password, "updatedAt")
           VALUES ('default', $1, $2, NOW())
           ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, "updatedAt" = NOW()`,
          [targetUsername, hashedPassword]
        );
        dbSaved = true;
      } catch (poolErr) {
        console.warn('PostgreSQL pool password update warning:', poolErr);
      }
    }

    if (prisma && !dbSaved) {
      try {
        await prisma.adminSetting.upsert({
          where: { id: 'default' },
          update: {
            password: hashedPassword,
            username: targetUsername,
            updatedAt: new Date(),
          },
          create: {
            id: 'default',
            username: targetUsername,
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
        dbSaved = true;
      } catch (err) {
        console.error('Failed to update admin password in database via Prisma:', err);
      }
    }

    // 9. Persist salted hash to local server file cache (NEVER plain-text)
    writeAuthCache({
      username: targetUsername,
      passwordHash: hashedPassword,
      isCustomPassword: true,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: dbSaved
        ? 'Admin password successfully hashed with cryptographic salt and updated in PostgreSQL database. Plain text is never stored.'
        : 'Admin password successfully hashed and persisted securely.',
      username: targetUsername,
      isCustomPassword: true,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
