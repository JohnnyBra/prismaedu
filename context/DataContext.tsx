import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Task, Reward, Role, ContextType, AvatarItem, TaskCompletion, ClassGroup, Message, Redemption } from '../types';
import { AVATAR_ITEMS, INITIAL_TASKS, INITIAL_REWARDS, INITIAL_CLASSES } from '../constants';

interface DataContextType {
  currentUser: User | null;
  users: User[];
  classes: ClassGroup[];
  tasks: Task[];
  rewards: Reward[];
  completions: TaskCompletion[];
  messages: Message[];
  redemptions: Redemption[];
  
  // Actions
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  assignPoints: (studentId: string, amount: number) => void;
  createTask: (task: Omit<Task, 'id'>) => void;
  completeTask: (taskId: string, studentId: string) => void;
  toggleTaskCompletion: (taskId: string, studentId: string) => void; // Admin/Tutor override
  createReward: (reward: Omit<Reward, 'id'>) => void;
  deleteReward: (id: string) => void;
  redeemReward: (rewardId: string, studentId: string) => boolean;
  updateAvatar: (config: User['avatarConfig']) => void;
  buyAvatarItem: (itemId: string) => boolean;
  updatePin: (newPin: string) => void;
  sendMessage: (toId: string, content: string) => void;
  markMessagesRead: (fromId: string, toId: string) => void;
  
  // Admin Actions
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteFamily: (familyId: string) => void;
  updateFamilyId: (oldId: string, newId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to generate mock users
const generateUsers = (): User[] => {
  const users: User[] = [];

  // Admin
  users.push({
    id: 'admin',
    name: 'Administrador',
    role: Role.ADMIN,
    points: 0,
    pin: '1234'
  });
  
  // Tutor
  users.push({
    id: 'tutor1',
    name: 'Sr. García',
    role: Role.TUTOR,
    classId: 'classA',
    points: 0,
    pin: '9999'
  });

  // Parent
  users.push({
    id: 'parent1',
    name: 'Sra. López',
    role: Role.PARENT,
    familyId: 'familyA',
    points: 0,
    pin: '8888'
  });

  // Students (24 students)
  for (let i = 1; i <= 24; i++) {
    const paddedId = i.toString().padStart(2, '0');
    users.push({
      id: `student${i}`,
      name: `Alumno ${i}`,
      role: Role.STUDENT,
      classId: 'classA',
      familyId: i <= 2 ? 'familyA' : `family${i}`, // First 2 are Mrs. Johnson's kids
      points: 100 + (Math.floor(Math.random() * 50)),
      pin: `00${paddedId}`, // 0001, 0002, etc.
      inventory: ['base_1', 'top_1', 'bot_1'],
      avatarConfig: {
        baseId: 'base_1',
        topId: 'top_1',
        bottomId: 'bot_1'
      }
    });
  }
  return users;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use ID to track session, deriving the user object from the 'users' array ensures reactivity across tabs
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sc_users');
    return saved ? JSON.parse(saved) : generateUsers();
  });
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem('sc_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sc_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS as Task[];
  });
  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem('sc_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS as Reward[];
  });
  const [completions, setCompletions] = useState<TaskCompletion[]>(() => {
    const saved = localStorage.getItem('sc_completions');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('sc_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => {
    const saved = localStorage.getItem('sc_redemptions');
    return saved ? JSON.parse(saved) : [];
  });

  // Derived current user
  const currentUser = users.find(u => u.id === currentUserId) || null;

  // --- Persistence & Synchronization ---

  // Separate effects for granularity to avoid race conditions rewriting unrelated data
  useEffect(() => { localStorage.setItem('sc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sc_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('sc_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('sc_rewards', JSON.stringify(rewards)); }, [rewards]);
  useEffect(() => { localStorage.setItem('sc_completions', JSON.stringify(completions)); }, [completions]);
  useEffect(() => { localStorage.setItem('sc_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('sc_redemptions', JSON.stringify(redemptions)); }, [redemptions]);

  // Listen for changes in other tabs to keep UI synchronized
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sc_users' && e.newValue) setUsers(JSON.parse(e.newValue));
      if (e.key === 'sc_classes' && e.newValue) setClasses(JSON.parse(e.newValue));
      if (e.key === 'sc_tasks' && e.newValue) setTasks(JSON.parse(e.newValue));
      if (e.key === 'sc_rewards' && e.newValue) setRewards(JSON.parse(e.newValue));
      if (e.key === 'sc_completions' && e.newValue) setCompletions(JSON.parse(e.newValue));
      if (e.key === 'sc_messages' && e.newValue) setMessages(JSON.parse(e.newValue));
      if (e.key === 'sc_redemptions' && e.newValue) setRedemptions(JSON.parse(e.newValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Actions ---

  const login = (userId: string, pin: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.pin === pin) {
      setCurrentUserId(user.id);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUserId(null);

  const updatePin = (newPin: string) => {
    if (!currentUserId) return;
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, pin: newPin } : u));
  };

  const assignPoints = (studentId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === studentId) {
        return { ...u, points: u.points + amount };
      }
      return u;
    }));
  };

  const createTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const createReward = (rewardData: Omit<Reward, 'id'>) => {
     const newReward: Reward = {
       ...rewardData,
       id: `reward_${Date.now()}`
     };
     setRewards(prev => [newReward, ...prev]);
  };

  const deleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const completeTask = (taskId: string, studentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check if already completed today (simple check)
    // In a real app we'd check timestamps more carefully
    const alreadyDone = completions.some(c => c.taskId === taskId && c.userId === studentId);
    if (alreadyDone && task.isUnique) return;

    setCompletions(prev => [...prev, { taskId, userId: studentId, timestamp: Date.now() }]);
    assignPoints(studentId, task.points);
    
    if (currentUser?.role === Role.STUDENT && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Allows teacher/admin to Toggle completion (Undo or Do)
  const toggleTaskCompletion = (taskId: string, studentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingCompletionIndex = completions.findIndex(c => c.taskId === taskId && c.userId === studentId);

    if (existingCompletionIndex >= 0) {
      // Undo completion: Remove record and deduct points
      setCompletions(prev => prev.filter((_, i) => i !== existingCompletionIndex));
      assignPoints(studentId, -task.points);
    } else {
      // Do completion: Add record and add points
      setCompletions(prev => [...prev, { taskId, userId: studentId, timestamp: Date.now() }]);
      assignPoints(studentId, task.points);
    }
  };

  const redeemReward = (rewardId: string, studentId: string): boolean => {
    const user = users.find(u => u.id === studentId);
    const reward = rewards.find(r => r.id === rewardId);
    if (!user || !reward) return false;
    
    if (user.points >= reward.cost) {
      // Deduct points
      assignPoints(studentId, -reward.cost);
      
      // Update Stock
      if (reward.stock && reward.stock > 0) {
         setRewards(prev => prev.map(r => r.id === rewardId ? {...r, stock: (r.stock || 0) - 1} : r));
      }

      // Add to history
      const redemption: Redemption = {
        id: `red_${Date.now()}`,
        userId: studentId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        timestamp: Date.now(),
        context: reward.context
      };
      setRedemptions(prev => [redemption, ...prev]);

      return true;
    }
    return false;
  };

  const buyAvatarItem = (itemId: string): boolean => {
    const user = users.find(u => u.id === currentUserId);
    if (!user) return false;
    const item = AVATAR_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (user.inventory?.includes(itemId)) return true; 

    if (user.points >= item.cost) {
      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            points: u.points - item.cost,
            inventory: [...(u.inventory || []), itemId]
          };
        }
        return u;
      }));
      return true;
    }
    return false;
  };

  const updateAvatar = (config: User['avatarConfig']) => {
    if (!currentUserId) return;
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, avatarConfig: { ...u.avatarConfig, ...config } } : u));
  };

  // --- Messaging ---
  const sendMessage = (toId: string, content: string) => {
    if (!currentUserId) return;
    const msg: Message = {
      id: `msg_${Date.now()}`,
      fromId: currentUserId,
      toId,
      content,
      timestamp: Date.now(),
      read: false
    };
    setMessages(prev => [...prev, msg]);
  };

  const markMessagesRead = (fromId: string, toId: string) => {
    setMessages(prev => prev.map(m => 
      (m.fromId === fromId && m.toId === toId) ? { ...m, read: true } : m
    ));
  };

  // --- Admin Functions ---

  const addClass = (name: string) => {
    setClasses(prev => [...prev, { id: `class_${Date.now()}`, name }]);
  };

  const updateClass = (id: string, name: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteClass = (id: string) => {
    setUsers(prev => prev.map(u => u.classId === id ? { ...u, classId: undefined } : u));
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      points: 0,
      inventory: ['base_1', 'top_1', 'bot_1'],
      avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' }
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const deleteFamily = (familyId: string) => {
    setUsers(prev => prev.filter(u => u.familyId !== familyId));
  };

  const updateFamilyId = (oldId: string, newId: string) => {
    setUsers(prev => prev.map(u => u.familyId === oldId ? { ...u, familyId: newId } : u));
  };

  return (
    <DataContext.Provider value={{
      currentUser,
      users,
      classes,
      tasks,
      rewards,
      completions,
      messages,
      redemptions,
      login,
      logout,
      assignPoints,
      createTask,
      completeTask,
      toggleTaskCompletion,
      createReward,
      deleteReward,
      redeemReward,
      updateAvatar,
      buyAvatarItem,
      updatePin,
      sendMessage,
      markMessagesRead,
      addClass,
      updateClass,
      deleteClass,
      addUser,
      updateUser,
      deleteUser,
      updateTask,
      deleteTask,
      deleteFamily,
      updateFamilyId
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};