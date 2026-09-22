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
  writeAuthCache
} from './server/auth';
dotenv.config();

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

function getEnvAdminRecoveryKey(): string {
  return (
    process.env.ADMIN_RECOVERY_KEY ||
    process.env.ADMIN_MASTER_KEY ||
    process.env.ADMIN_RESET_KEY ||
    'GreatStarGem-Recovery-Key-2026'
  );
}

// In-memory rate limiting tracker for emergency recovery attempts (max 5 failed attempts per 15 min)
const failedRecoveryAttempts = new Map<string, { count: number; lockedUntil: number }>();

/**
 * Resolves the active administrator credentials.
 * NEVER returns plain text password if customized; returns passwordHash.
 *
 * PRIORITY ORDER:
 * 1. PostgreSQL Database (`AdminSetting` table row with custom password)
 * 2. Local Auth Cache (written when admin changes password)
 * 3. Initial default from .env / process.env.ADMIN_PASSWORD (ONLY when admin has never changed password)
 */
async function getActiveAdminCredentials(): Promise<{
  username: string;
  passwordHash: string;
  isCustomPassword: boolean;
}> {
  const pool = getPgPool();
  const prisma = getPrisma();
  const cache = readAuthCache();

  // 1. Check PostgreSQL Database first via pool (100% PgBouncer safe)
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT username, password FROM "AdminSetting" WHERE id = $1 LIMIT 1',
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
            });
            storedPassword = hashed;
          } catch (upgradeErr) {
            console.warn('Auto-hash migration warning:', upgradeErr);
          }
        }

        return {
          username: res.rows[0].username || getEnvDefaultUsername(),
          passwordHash: storedPassword,
          isCustomPassword: true,
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

        return {
          username: setting.username || getEnvDefaultUsername(),
          passwordHash: storedPassword,
          isCustomPassword: true,
        };
      }
    } catch (err) {
      console.warn('Prisma admin credential lookup warning:', err);
    }
  }

  // 2. Check server-side local auth cache if password was changed
  if (cache.passwordHash && cache.isCustomPassword) {
    return {
      username: cache.username || getEnvDefaultUsername(),
      passwordHash: cache.passwordHash,
      isCustomPassword: true,
    };
  }

  // 3. Fall back to initial environment default (used ONLY before any password change)
  return {
    username: getEnvDefaultUsername(),
    passwordHash: getEnvDefaultPassword(),
    isCustomPassword: false,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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
      });
    } catch (err) {
      return res.json({
        success: true,
        username: getEnvDefaultUsername(),
        isCustomPassword: false,
        hasEnvDefault: false,
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

  // Admin Change Username Endpoint (requires current password verification)
  app.post('/api/admin/change-username', async (req, res) => {
    const { newUsername, currentPassword } = req.body;

    // 1. Verify inputs
    if (!newUsername || typeof newUsername !== 'string' || !newUsername.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New username is required.',
      });
    }

    const trimmedNewUsername = newUsername.trim();

    if (trimmedNewUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.',
      });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedNewUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain alphanumeric characters, underscores, hyphens, and periods.',
      });
    }

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to verify administrator authorization.',
      });
    }

    try {
      const activeCreds = await getActiveAdminCredentials();

      // 2. Verify current password
      const isPasswordValid = await verifyPassword(currentPassword, activeCreds.passwordHash);
      if (!isPasswordValid) {
        return res.status(403).json({
          success: false,
          message: 'Current password verification failed. Please enter your valid current password to change username.',
        });
      }

      if (trimmedNewUsername.toLowerCase() === activeCreds.username.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'New username cannot be identical to your current username.',
        });
      }

      // 3. Persist new username to PostgreSQL database
      const pool = getPgPool();
      const prisma = getPrisma();
      let dbSaved = false;

      if (pool) {
        try {
          await pool.query(
            `INSERT INTO "AdminSetting" (id, username, password, "updatedAt")
             VALUES ('default', $1, $2, NOW())
             ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, "updatedAt" = NOW()`,
            [trimmedNewUsername, activeCreds.passwordHash]
          );
          dbSaved = true;
        } catch (poolErr) {
          console.warn('PostgreSQL pool username update warning:', poolErr);
        }
      }

      if (prisma && !dbSaved) {
        try {
          await prisma.adminSetting.upsert({
            where: { id: 'default' },
            update: {
              username: trimmedNewUsername,
              updatedAt: new Date(),
            },
            create: {
              id: 'default',
              username: trimmedNewUsername,
              password: activeCreds.passwordHash,
              updatedAt: new Date(),
            },
          });
          dbSaved = true;
        } catch (err) {
          console.error('Failed to update admin username via Prisma:', err);
        }
      }

      // 4. Update local cache
      writeAuthCache({
        username: trimmedNewUsername,
        passwordHash: activeCreds.passwordHash,
        isCustomPassword: activeCreds.isCustomPassword,
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: 'Admin username successfully updated and synchronized.',
        username: trimmedNewUsername,
      });
    } catch (err) {
      console.error('Change username error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error updating administrator username.',
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
      return res.json({
        success: true,
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

  // Recovery Status endpoint - provides public info on whether recovery is configured
  app.get('/api/admin/recovery-status', (req, res) => {
    const isCustomRecoveryKey = Boolean(process.env.ADMIN_RECOVERY_KEY || process.env.ADMIN_MASTER_KEY || process.env.ADMIN_RESET_KEY);
    res.json({
      enabled: true,
      hasCustomKey: isCustomRecoveryKey,
      defaultKeyHint: isCustomRecoveryKey ? undefined : 'GreatStarGem-Recovery-Key-2026',
    });
  });

  // Emergency Admin Password Recovery via Master Recovery Key
  app.post('/api/admin/recover-password', async (req, res) => {
    const { recoveryKey, newPassword, confirmPassword } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // 1. Check rate limit
    const attemptRecord = failedRecoveryAttempts.get(clientIp);
    const now = Date.now();
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Too many failed recovery attempts. Account recovery locked for ${waitMinutes} minute(s).`,
      });
    }

    // 2. Validate input presence
    if (!recoveryKey || typeof recoveryKey !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Master Recovery Key is required.',
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    // 3. Verify Master Recovery Key
    const configuredMasterKey = getEnvAdminRecoveryKey();
    const cleanKeyInput = recoveryKey.trim();
    const cleanConfigured = configuredMasterKey.trim();

    // Constant-time comparison
    let isKeyValid = false;
    try {
      const bufA = Buffer.from(cleanKeyInput, 'utf8');
      const bufB = Buffer.from(cleanConfigured, 'utf8');
      if (bufA.length === bufB.length) {
        isKeyValid = crypto.timingSafeEqual(bufA, bufB);
      }
    } catch {
      isKeyValid = false;
    }

    if (!isKeyValid) {
      const currentCount = (attemptRecord?.count || 0) + 1;
      const MAX_ATTEMPTS = 5;
      if (currentCount >= MAX_ATTEMPTS) {
        failedRecoveryAttempts.set(clientIp, {
          count: currentCount,
          lockedUntil: now + 15 * 60 * 1000, // Lock for 15 minutes
        });
        return res.status(429).json({
          success: false,
          message: 'Too many failed recovery attempts. Recovery has been temporarily locked for 15 minutes.',
        });
      } else {
        failedRecoveryAttempts.set(clientIp, {
          count: currentCount,
          lockedUntil: 0,
        });
        return res.status(401).json({
          success: false,
          message: `Invalid Master Recovery Key. (${MAX_ATTEMPTS - currentCount} attempt(s) remaining)`,
        });
      }
    }

    // 4. Reset failed attempts upon successful key verification
    failedRecoveryAttempts.delete(clientIp);

    // 5. Validate new password strength
    const activeCreds = await getActiveAdminCredentials();
    const targetUsername = activeCreds.username || getEnvDefaultUsername();

    const validation = checkPasswordStrength(newPassword, targetUsername);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errorMessage || 'New password does not meet security requirements.',
        requirements: validation.requirements,
      });
    }

    // 6. Hash new password with PBKDF2
    const hashedPassword = await hashPassword(newPassword);

    // 7. Persist to PostgreSQL database
    const pool = getPgPool();
    const prisma = getPrisma();
    let dbSaved = false;

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO "AdminSetting" (id, username, password, "updatedAt")
           VALUES ('default', $1, $2, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             username = EXCLUDED.username, 
             password = EXCLUDED.password, 
             "updatedAt" = NOW()`,
          [targetUsername, hashedPassword]
        );
        dbSaved = true;
      } catch (poolErr) {
        console.warn('PostgreSQL recovery update warning:', poolErr);
      }
    }

    if (prisma && !dbSaved) {
      try {
        const updateData: Record<string, any> = {
          password: hashedPassword,
          username: targetUsername,
          updatedAt: new Date(),
        };
        await prisma.adminSetting.upsert({
          where: { id: 'default' },
          update: updateData,
          create: {
            id: 'default',
            ...updateData,
          },
        });
        dbSaved = true;
      } catch (err) {
        console.error('Failed to update admin password via Prisma in recovery:', err);
      }
    }

    // 8. Update local cache
    writeAuthCache({
      username: targetUsername,
      passwordHash: hashedPassword,
      isCustomPassword: true,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      username: targetUsername,
      message: 'Administrator password reset successfully. You may now log in with your new password.',
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
    console.log(`Server running on http://localhost:${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer();
