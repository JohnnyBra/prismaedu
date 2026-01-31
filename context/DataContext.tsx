
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Task, Reward, Role, TaskCompletion, ClassGroup, Message, Redemption } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { io, Socket } from 'socket.io-client';

interface DataContextType {
  currentUser: User | null;
  users: User[];
  classes: ClassGroup[];
  tasks: Task[];
  rewards: Reward[];
  completions: TaskCompletion[];
  messages: Message[];
  redemptions: Redemption[];
  connected: boolean;
  
  // Actions
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  assignPoints: (studentId: string, amount: number) => void;
  createTask: (task: Omit<Task, 'id'>) => void;
  completeTask: (taskId: string, studentId: string) => void;
  toggleTaskCompletion: (taskId: string, studentId: string) => void;
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
  addUsers: (users: Omit<User, 'id'>[]) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteFamily: (familyId: string) => void;
  updateFamilyId: (oldId: string, newId: string) => void;
  setAllUsers: (users: User[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('sc_session_user'));

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  // Derived current user
  const currentUser = users.find(u => u.id === currentUserId) || null;

  // Check for Google Login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    if (userId) {
      setCurrentUserId(userId);
      localStorage.setItem('sc_session_user', userId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Initialize Socket
  useEffect(() => {
    // Si estamos en desarrollo (puerto 5173 p.ej.), nos conectamos explícitamente al 3020
    const socketUrl = import.meta.env.DEV ? 'http://localhost:3020' : '/';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('init_state', (data) => {
        setUsers(data.users);
        setClasses(data.classes);
        setTasks(data.tasks);
        setRewards(data.rewards);
        setCompletions(data.completions);
        setMessages(data.messages);
        setRedemptions(data.redemptions);
    });

    newSocket.on('sync_users', (data) => setUsers(data));
    newSocket.on('sync_user_updated', ({ id, updates }) => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    });
    newSocket.on('sync_user_added', (user) => {
      setUsers(prev => [...prev, user]);
    });
    newSocket.on('sync_user_deleted', (id) => {
      setUsers(prev => prev.filter(u => u.id !== id));
    });

    newSocket.on('sync_classes', (data) => setClasses(data));
    newSocket.on('sync_tasks', (data) => setTasks(data));
    newSocket.on('sync_rewards', (data) => setRewards(data));
    newSocket.on('sync_completions', (data) => setCompletions(data));
    newSocket.on('sync_messages', (data) => setMessages(data));
    newSocket.on('sync_redemptions', (data) => setRedemptions(data));

    return () => {
        newSocket.close();
    };
  }, []);

  const emitUsers = (newUsers: User[]) => socket?.emit('update_users', newUsers);
  const emitUserUpdate = (id: string, updates: Partial<User>) => socket?.emit('user_update', { id, updates });
  const emitUserAdd = (user: User) => socket?.emit('user_add', user);
  const emitUserDelete = (id: string) => socket?.emit('user_delete', id);

  const emitClasses = (newClasses: ClassGroup[]) => socket?.emit('update_classes', newClasses);
  const emitTasks = (newTasks: Task[]) => socket?.emit('update_tasks', newTasks);
  const emitRewards = (newRewards: Reward[]) => socket?.emit('update_rewards', newRewards);
  const emitCompletions = (newCompletions: TaskCompletion[]) => socket?.emit('update_completions', newCompletions);
  const emitMessages = (newMessages: Message[]) => socket?.emit('update_messages', newMessages);
  const emitRedemptions = (newRedemptions: Redemption[]) => socket?.emit('update_redemptions', newRedemptions);

  const login = (userId: string, pin: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.pin === pin) {
      setCurrentUserId(user.id);
      localStorage.setItem('sc_session_user', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
      setCurrentUserId(null);
      localStorage.removeItem('sc_session_user');
  };

  const updatePin = (newPin: string) => {
    if (!currentUserId) return;
    emitUserUpdate(currentUserId, { pin: newPin });
  };

  const assignPoints = (studentId: string, amount: number) => {
    const user = users.find(u => u.id === studentId);
    if (user) {
      emitUserUpdate(studentId, { points: user.points + amount });
    }
  };

  const createTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`
    };
    emitTasks([newTask, ...tasks]);
  };

  const createReward = (rewardData: Omit<Reward, 'id'>) => {
     const newReward: Reward = {
       ...rewardData,
       id: `reward_${Date.now()}`
     };
     emitRewards([newReward, ...rewards]);
  };

  const deleteReward = (id: string) => {
    emitRewards(rewards.filter(r => r.id !== id));
  };

  const completeTask = (taskId: string, studentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const alreadyDone = completions.some(c => c.taskId === taskId && c.userId === studentId);
    if (alreadyDone && task.isUnique) return;

    emitCompletions([...completions, { taskId, userId: studentId, timestamp: Date.now() }]);
    assignPoints(studentId, task.points);
    
    if (currentUser?.role === Role.STUDENT && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const toggleTaskCompletion = (taskId: string, studentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingCompletionIndex = completions.findIndex(c => c.taskId === taskId && c.userId === studentId);

    if (existingCompletionIndex >= 0) {
      const newCompletions = completions.filter((_, i) => i !== existingCompletionIndex);
      emitCompletions(newCompletions);
      assignPoints(studentId, -task.points);
    } else {
      emitCompletions([...completions, { taskId, userId: studentId, timestamp: Date.now() }]);
      assignPoints(studentId, task.points);
    }
  };

  const redeemReward = (rewardId: string, studentId: string): boolean => {
    const user = users.find(u => u.id === studentId);
    const reward = rewards.find(r => r.id === rewardId);
    if (!user || !reward) return false;
    
    if (user.points >= reward.cost) {
      assignPoints(studentId, -reward.cost);
      
      if (reward.stock && reward.stock > 0) {
         emitRewards(rewards.map(r => r.id === rewardId ? {...r, stock: (r.stock || 0) - 1} : r));
      }

      const redemption: Redemption = {
        id: `red_${Date.now()}`,
        userId: studentId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        timestamp: Date.now(),
        context: reward.context
      };
      emitRedemptions([redemption, ...redemptions]);
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
      emitUserUpdate(user.id, {
        points: user.points - item.cost,
        inventory: [...(user.inventory || []), itemId]
      });
      return true;
    }
    return false;
  };

  const updateAvatar = (config: User['avatarConfig']) => {
    if (!currentUserId) return;
    const user = users.find(u => u.id === currentUserId);
    if (user) {
      emitUserUpdate(user.id, { avatarConfig: { ...user.avatarConfig, ...config } });
    }
  };

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
    emitMessages([...messages, msg]);
  };

  const markMessagesRead = (fromId: string, toId: string) => {
    const newMessages = messages.map(m => 
      (m.fromId === fromId && m.toId === toId) ? { ...m, read: true } : m
    );
    emitMessages(newMessages);
  };

  const addClass = (name: string) => {
    emitClasses([...classes, { id: `class_${Date.now()}`, name }]);
  };

  const updateClass = (id: string, name: string) => {
    emitClasses(classes.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteClass = (id: string) => {
    const newUsers = users.map(u => u.classId === id ? { ...u, classId: undefined } : u);
    emitUsers(newUsers);
    emitClasses(classes.filter(c => c.id !== id));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      points: 0,
      inventory: ['base_1', 'top_1', 'bot_1'],
      avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' }
    };
    emitUserAdd(newUser);
  };

  const addUsers = (usersData: Omit<User, 'id'>[]) => {
    const newUsers: User[] = usersData.map((userData, index) => ({
      ...userData,
      id: `user_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
      points: userData.points ?? 0,
      inventory: userData.inventory ?? ['base_1', 'top_1', 'bot_1'],
      avatarConfig: userData.avatarConfig ?? { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' }
    }));
    emitUsers([...users, ...newUsers]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    emitUserUpdate(id, updates);
  };

  const deleteUser = (id: string) => {
    if (id === 'admin') return;
    emitUserDelete(id);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    emitTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    emitTasks(tasks.filter(t => t.id !== id));
  };

  const deleteFamily = (familyId: string) => {
    emitUsers(users.filter(u => u.familyId !== familyId));
  };

  const updateFamilyId = (oldId: string, newId: string) => {
    emitUsers(users.map(u => u.familyId === oldId ? { ...u, familyId: newId } : u));
  };

  const setAllUsers = (newUsersList: User[]) => {
    emitUsers(newUsersList);
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
      connected,
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
      addUsers,
      updateUser,
      deleteUser,
      updateTask,
      deleteTask,
      deleteFamily,
      updateFamilyId,
      setAllUsers
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
