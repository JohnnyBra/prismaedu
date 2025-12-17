import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Task, Reward, Role, AvatarItem, TaskCompletion, ClassGroup, Message, Redemption } from '../types';
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
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteFamily: (familyId: string) => void;
  updateFamilyId: (oldId: string, newId: string) => void;
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

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(); // Connects to the same host/port serving the file
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    // Listen for Initial State
    newSocket.on('init_state', (data) => {
        setUsers(data.users);
        setClasses(data.classes);
        setTasks(data.tasks);
        setRewards(data.rewards);
        setCompletions(data.completions);
        setMessages(data.messages);
        setRedemptions(data.redemptions);
    });

    // Listen for Sync Updates (Push Data)
    newSocket.on('sync_users', (data) => setUsers(data));
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

  // Helpers to emit updates
  // We use references to current state inside functions to ensure we don't overwrite concurrent changes 
  // NOTE: In a fully robust app, the server would handle the merging logic. 
  // Here we optimistically assume the client has the latest array before pushing.
  // Because we receive 'sync' events instantly, our local state is usually fresh.

  const emitUsers = (newUsers: User[]) => socket?.emit('update_users', newUsers);
  const emitClasses = (newClasses: ClassGroup[]) => socket?.emit('update_classes', newClasses);
  const emitTasks = (newTasks: Task[]) => socket?.emit('update_tasks', newTasks);
  const emitRewards = (newRewards: Reward[]) => socket?.emit('update_rewards', newRewards);
  const emitCompletions = (newCompletions: TaskCompletion[]) => socket?.emit('update_completions', newCompletions);
  const emitMessages = (newMessages: Message[]) => socket?.emit('update_messages', newMessages);
  const emitRedemptions = (newRedemptions: Redemption[]) => socket?.emit('update_redemptions', newRedemptions);

  // --- Actions ---

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
    const newUsers = users.map(u => u.id === currentUserId ? { ...u, pin: newPin } : u);
    emitUsers(newUsers);
  };

  const assignPoints = (studentId: string, amount: number) => {
    const newUsers = users.map(u => {
      if (u.id === studentId) {
        return { ...u, points: u.points + amount };
      }
      return u;
    });
    emitUsers(newUsers);
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
      // Undo completion
      const newCompletions = completions.filter((_, i) => i !== existingCompletionIndex);
      emitCompletions(newCompletions);
      assignPoints(studentId, -task.points);
    } else {
      // Do completion
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
      const newUsers = users.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            points: u.points - item.cost,
            inventory: [...(u.inventory || []), itemId]
          };
        }
        return u;
      });
      emitUsers(newUsers);
      return true;
    }
    return false;
  };

  const updateAvatar = (config: User['avatarConfig']) => {
    if (!currentUserId) return;
    const newUsers = users.map(u => u.id === currentUserId ? { ...u, avatarConfig: { ...u.avatarConfig, ...config } } : u);
    emitUsers(newUsers);
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

  // --- Admin Functions ---

  const addClass = (name: string) => {
    emitClasses([...classes, { id: `class_${Date.now()}`, name }]);
  };

  const updateClass = (id: string, name: string) => {
    emitClasses(classes.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteClass = (id: string) => {
    // Also remove classId from users
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
    emitUsers([...users, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    emitUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    emitUsers(users.filter(u => u.id !== id));
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
