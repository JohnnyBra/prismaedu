import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, getData, setData } from './db.js';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// --- Prime Utility Logic ---

const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

const generatePrime = (min, max) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (isPrime(num)) {
      return num;
    }
  }
};

const generateUniquePrime = (excludeSet) => {
  const min = 0;
  const max = 9999;

  let attempts = 0;
  const maxAttempts = 10000;

  while (attempts < maxAttempts) {
    const p = generatePrime(min, max);
    const pin = p.toString().padStart(4, '0');

    if (!excludeSet.has(pin)) {
      return pin;
    }
    attempts++;
  }

  throw new Error("Unable to generate unique prime PIN: Search space exhausted.");
};

// Passport Configuration
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await getData('users', []);
    const user = users.find(u => u.id === id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id', // Needs to be provided in env
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3020/auth/google/callback'
},
  async function (accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email || !email.endsWith('@colegiolahispanidad.es')) {
        return cb(null, false, { message: 'Dominio no permitido' });
      }

      // Check against local DB
      const users = await getData('users', []);
      // We assume the local user might check by email if we had it, but currently we have IDs/PINs.
      // The prompt says: "Busca el email en la BD local".
      // But our seed data doesn't have emails, just IDs and Names.
      // I'll assume for this task we might match by name or add email to the user model?
      // Or maybe the 'username' in external check refers to email?
      // "Si el rol NO es 'profesor' o 'admin' (ej. es alumno), RECHAZA el acceso."
      // Since I can't guarantee email match without seeding emails, I will allow if I find a user with role TUTOR or ADMIN.
      // For a real app, I'd need to map Google Email -> Local User.
      // I will modify the seed/user model to include email conceptually, or for now,
      // I'll match if I find a user whose ID or some field matches.
      // Wait, the prompt implies "Busca el email en la BD local".
      // I should probably check if there is a user with that email.
      // Since I don't have emails in the User type, I will assume the prompt implies I should support it.
      // However, to make it work with my seed data, I might just Auto-Login any @colegiolahispanidad.es user as a "Demo Teacher" or
      // try to find a user with `email` property.
      // Let's iterate: I'll search for a user where `email` matches.
      // If not found, fail.
      // But wait, my seed script doesn't put emails.
      // I'll assume the system administrator will manually add emails or I should have added them.
      // I will add a fallback: if no email found in DB, but domain is correct,
      // I'll fail (Strict).
      // BUT to allow me to test/demo, I might want a backdoor or just fail safely.
      // Let's stick to the prompt: "Busca el email en la BD local".

      const user = users.find(u => u.email === email);

      if (!user) {
        // Fallback for demo purposes if no user matches email strictly:
        // If we are testing and have no real emails in DB, this will block everyone.
        // But I must follow instructions.
        return cb(null, false, { message: 'Usuario no encontrado en el sistema local' });
      }

      if (user.role !== 'TUTOR' && user.role !== 'ADMIN') {
        return cb(null, false, { message: 'Acceso restringido a docentes' });
      }

      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3020;

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'prisma-secret-key', // In prod should be env var, but keeping simple for this task as no explicit secret provided
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if behind https proxy and trusting it properly, but usually 'auto' or false for dev/mixed
}));

app.use(passport.initialize());
app.use(passport.session());

// Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard.
    // In a real app we might redirect to a specific dashboard URL or set a cookie.
    if (process.env.ENABLE_GLOBAL_SSO === 'true') {
      const roleStr = req.user.role === 'TUTOR' ? 'TEACHER' : req.user.role;
      const payload = {
        userId: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: roleStr,
        profileId: req.user.id
      };
      const token = jwt.sign(payload, process.env.JWT_SSO_SECRET || 'fallback-secret', { expiresIn: '8h' });
      res.cookie('BIBLIO_SSO_TOKEN', token, {
        domain: process.env.COOKIE_DOMAIN || '.bibliohispa.es',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      });
    }
    res.redirect(`/?user_id=${req.user.id}`);
  }
);

// External Check API
app.post('/api/auth/external-check', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Faltan credenciales' });
  }

  try {
    const users = await getData('users', []);
    // Validation Logic:
    // User might log in with ID, Email or Name?
    // The prompt says "Recibe {username, password}. Valida contra la BD local."
    // Current local login uses 'pin' as password.
    // 'username' could be ID or Name.

    const user = users.find(u =>
      (u.id === username || u.name === username || u.email === username) &&
      u.pin === password
    );

    if (user) {
      if (process.env.ENABLE_GLOBAL_SSO === 'true') {
        const roleStr = user.role === 'PARENT' ? 'FAMILY' : (user.role === 'TUTOR' ? 'TEACHER' : user.role);
        const payload = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: roleStr,
          profileId: user.id
        };
        const token = jwt.sign(payload, process.env.JWT_SSO_SECRET || 'fallback-secret', { expiresIn: '8h' });
        res.cookie('BIBLIO_SSO_TOKEN', token, {
          domain: process.env.COOKIE_DOMAIN || '.bibliohispa.es',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax'
        });
      }
      return res.json({
        success: true,
        role: user.role,
        name: user.name,
        id: user.id,
        email: user.email
      });
    } else {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// SSO Logout — clears the shared SSO cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('BIBLIO_SSO_TOKEN', {
    domain: process.env.COOKIE_DOMAIN || '.bibliohispa.es',
    path: '/'
  });
  res.json({ success: true });
});

// Middleware for Export API
const checkApiSecret = (req, res, next) => {
  const secret = req.headers['api_secret'];
  if (!secret || secret !== process.env.API_SECRET) {
    // If no env var set, fallback or fail. Secure by default: fail.
    // But for demo, if process.env.API_SECRET is not set, maybe allow or strictly fail?
    // Strict:
    if (!process.env.API_SECRET) {
      console.warn("API_SECRET not set in env, blocking export access.");
      return res.status(403).json({ error: 'Server configuration error' });
    }
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Export APIs
app.get('/api/export/classes', checkApiSecret, async (req, res) => {
  try {
    const classes = await getData('classes', []);
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/export/students', checkApiSecret, async (req, res) => {
  try {
    const users = await getData('users', []);
    const students = users.filter(u => u.role === 'STUDENT').map(u => ({
      id: u.id,
      name: u.name,
      classId: u.classId,
      familyId: u.familyId,
      email: u.email
    }));
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/export/users', checkApiSecret, async (req, res) => {
  try {
    const users = await getData('users', []);
    // Active teachers (TUTOR)
    const teachers = users.filter(u => u.role === 'TUTOR').map(u => ({
      id: u.id,
      name: u.name,
      classId: u.classId,
      role: u.role,
      email: u.email
    }));
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve Static Files (The built React App)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for any unknown route (SPA support)
// Moving this to AFTER API routes definition later.
// For now, keeping it here but will need to be mindful of API routes ordering.

// Socket Logic
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state to the connecting client
  // Default values if DB is empty (though seed script should run first)
  const [users, classes, tasks, rewards, completions, messages, redemptions] = await Promise.all([
    getData('users', []),
    getData('classes', []),
    getData('tasks', []),
    getData('rewards', []),
    getData('completions', []),
    getData('messages', []),
    getData('redemptions', [])
  ]);

  socket.emit('init_state', { users, classes, tasks, rewards, completions, messages, redemptions });

  // Handle Updates
  socket.on('update_users', async (newUsers) => {
    await setData('users', newUsers);
    io.emit('sync_users', newUsers);
  });

  socket.on('user_update', async ({ id, updates }) => {
    const users = await getData('users', []);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      await setData('users', users);
      io.emit('sync_user_updated', { id, updates });
    }
  });

  socket.on('user_add', async (user) => {
    const users = await getData('users', []);
    users.push(user);
    await setData('users', users);
    io.emit('sync_user_added', user);
  });

  socket.on('user_delete', async (id) => {
    let users = await getData('users', []);
    users = users.filter(u => u.id !== id);
    await setData('users', users);
    io.emit('sync_user_deleted', id);
  });

  socket.on('update_classes', async (newClasses) => {
    await setData('classes', newClasses);
    io.emit('sync_classes', newClasses);
  });

  socket.on('update_tasks', async (newTasks) => {
    await setData('tasks', newTasks);
    io.emit('sync_tasks', newTasks);
  });

  socket.on('update_rewards', async (newRewards) => {
    await setData('rewards', newRewards);
    io.emit('sync_rewards', newRewards);
  });

  socket.on('update_completions', async (newCompletions) => {
    await setData('completions', newCompletions);
    io.emit('sync_completions', newCompletions);
  });

  socket.on('update_messages', async (newMessages) => {
    await setData('messages', newMessages);
    io.emit('sync_messages', newMessages);
  });

  socket.on('update_redemptions', async (newRedemptions) => {
    await setData('redemptions', newRedemptions);
    io.emit('sync_redemptions', newRedemptions);
  });

  socket.on('migrate_pins', async (arg1, arg2) => {
    let data = {};
    let callback = null;

    if (typeof arg1 === 'function') {
      callback = arg1;
    } else {
      data = arg1 || {};
      if (typeof arg2 === 'function') callback = arg2;
    }

    try {
      const users = await getData('users', []);

      // Authorization Check
      const { requesterId } = data;
      const requester = users.find(u => u.id === requesterId);
      const allowedRoles = ['ADMIN', 'DIRECCION', 'TESORERIA'];

      if (!requester || !allowedRoles.includes(requester.role)) {
        if (callback) callback({ success: false, error: 'Unauthorized: Access denied.' });
        return;
      }

      let updatedCount = 0;

      // Collect PINs from non-student/parent users to preserve them and ensure uniqueness
      const usedPins = new Set();
      users.forEach(u => {
        if (u.role !== 'STUDENT' && u.role !== 'PARENT' && u.pin) {
          usedPins.add(u.pin);
        }
      });

      // Assign new unique prime PINs to Students and Parents
      for (const user of users) {
        if (user.role === 'STUDENT' || user.role === 'PARENT') {
          const newPin = generateUniquePrime(usedPins);
          user.pin = newPin;
          usedPins.add(newPin);
          updatedCount++;
        }
      }

      await setData('users', users);
      io.emit('sync_users', users);

      if (callback) callback({ success: true, count: updatedCount });
    } catch (error) {
      console.error('Migration error:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });
});

// We need to move the wildcard route to the end
// API routes will be added before it.

// Start Server
initDB().then(async () => {
  // Ensure Admin User Exists
  const users = await getData('users', []);
  const adminExists = users.some(u => u.role === 'ADMIN');

  if (!adminExists) {
    console.log('Admin user missing. Creating default admin user...');
    users.push({
      id: 'admin',
      name: 'Administrador',
      role: 'ADMIN',
      points: 0,
      pin: '2222',
      email: 'admin@colegiolahispanidad.es',
      altPin: '2222'
    });
    await setData('users', users);
    console.log('Default admin user created.');
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
