import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, getData, setData } from './db.js';

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

const PORT = process.env.PORT || 3005;

// Initial Data Generators (Copied logic from frontend to seed DB if empty)
const generateUsers = () => {
    const users = [];
    users.push({ id: 'admin', name: 'Administrador', role: 'ADMIN', points: 0, pin: '1234' });
    users.push({ id: 'tutor1', name: 'Sr. García', role: 'TUTOR', classId: 'classA', points: 0, pin: '9999' });
    users.push({ id: 'parent1', name: 'Sra. López', role: 'PARENT', familyId: 'familyA', points: 0, pin: '8888' });
    for (let i = 1; i <= 24; i++) {
      const paddedId = i.toString().padStart(2, '0');
      users.push({
        id: `student${i}`,
        name: `Alumno ${i}`,
        role: 'STUDENT',
        classId: 'classA',
        familyId: i <= 2 ? 'familyA' : `family${i}`,
        points: 100 + (Math.floor(Math.random() * 50)),
        pin: `00${paddedId}`,
        inventory: ['base_1', 'top_1', 'bot_1'],
        avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' }
      });
    }
    return users;
};

// Serve Static Files (The built React App)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for any unknown route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Socket Logic
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state to the connecting client
  const users = await getData('users', generateUsers());
  const classes = await getData('classes', [{ id: 'classA', name: '4º A - Primaria' }, { id: 'classB', name: '4º B - Primaria' }]);
  const tasks = await getData('tasks', [
    { id: 't1', title: 'Completar ficha de Mates', points: 15, icon: 'Calculator', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: true },
    { id: 't2', title: 'Ayudar a un compañero', points: 10, icon: 'Users', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: false },
    { id: 't3', title: 'Limpiar tu habitación', points: 20, icon: 'Home', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
    { id: 't4', title: 'Leer 20 minutos', points: 15, icon: 'BookOpen', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
  ]);
  const rewards = await getData('rewards', [
    { id: 'r1', title: 'Sentarse con un amigo', cost: 50, icon: 'Users', context: 'SCHOOL', stock: 10 },
    { id: 'r2', title: 'Pase sin deberes', cost: 100, icon: 'FileCheck', context: 'SCHOOL', stock: 5 },
    { id: 'r3', title: '30 Minutos TV', cost: 40, icon: 'Tv', context: 'HOME' },
    { id: 'r4', title: 'Salida a por Helado', cost: 200, icon: 'IceCream', context: 'HOME' },
  ]);
  const completions = await getData('completions', []);
  const messages = await getData('messages', []);
  const redemptions = await getData('redemptions', []);

  socket.emit('init_state', { users, classes, tasks, rewards, completions, messages, redemptions });

  // Handle Updates
  // NOTE: In a production app, we would validate permissions here.
  
  socket.on('update_users', async (newUsers) => {
    await setData('users', newUsers);
    io.emit('sync_users', newUsers); // Broadcast to ALL clients
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
});

// Start Server
initDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
