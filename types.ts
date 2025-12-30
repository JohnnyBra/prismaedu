
export enum Role {
  ADMIN = 'ADMIN',     // System Administrator
  DIRECCION = 'DIRECCION', // Management/Principal
  TESORERIA = 'TESORERIA', // Treasury
  TUTOR = 'TUTOR',     // Super Admin (Teacher) - Manages the whole class
  PARENT = 'PARENT',   // Family Admin - Manages only their kids
  STUDENT = 'STUDENT'  // The User doing tasks
}

export type ContextType = 'SCHOOL' | 'HOME'; // Determines where the task/reward comes from

// Class Entity (New)
export interface ClassGroup {
  id: string;
  name: string;
  stage?: string;
  cycle?: string;
  level?: string;
}

// Avatar System
export type AvatarItemType = 'base' | 'top' | 'bottom' | 'shoes' | 'accessory';
export interface AvatarItem {
  id: string;
  type: AvatarItemType;
  name: string;
  cost: number;
  svg: string; // The UI should render SVGs based on this ID
}
export interface AvatarConfig {
  baseId?: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  accessoryId?: string;
}

// User Entity
export interface User {
  id: string;
  name: string;
  firstName?: string; // For sorting
  lastName?: string;  // For sorting
  role: Role;
  // Relationships
  familyId?: string; // Links student to parents
  classId?: string;  // Links student to tutor
  // Profile
  avatarConfig?: AvatarConfig; 
  inventory?: string[]; // IDs of owned avatar items
  points: number;       // Unified balance
  pin: string;          // Simple login PIN (e.g., '0000')
  email?: string;       // For Google Auth
  altPin?: string;      // Alternative PIN
}

// Task Entity
export interface Task {
  id: string;
  title: string;
  points: number;
  icon: string;
  context: ContextType; // 'SCHOOL' or 'HOME'
  
  // Assignment Logic
  assignedTo: string[]; // User IDs
  createdBy: string;    // Tutor ID or Parent ID
  workType?: 'CLASSWORK' | 'HOMEWORK'; // Distinguish between Classwork and Homework (created by Tutor)
  
  // School Specifics
  isPriority?: boolean; // If true, shows as a POP-UP for the student (for Tutor tasks)
  
  // Scheduling
  recurrence?: number[]; // 0-6 (Sunday-Saturday)
  isUnique?: boolean;    // Only one person can do it per day
  isCompleted?: boolean; // (Virtual property for UI, technically stored in separate tracking)
}

// For tracking completions (Simplification for this demo: Task objects in state will carry completion status per user, 
// or we track completions separately. To keep it simple in a mock, we will store completions in a separate map).
export interface TaskCompletion {
  taskId: string;
  userId: string;
  timestamp: number;
}

// Reward Entity
export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  context: ContextType; // 'SCHOOL' (decided by Tutor) or 'HOME' (decided by Parent)
  stock?: number;       // Optional limit
  familyId?: string;    // Optional: Only for HOME rewards to link to a specific family
}

// Redemption History Entity
export interface Redemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  timestamp: number;
  context: ContextType;
}

// Messages
export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

// Events & Notifications
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'popup' | 'banner'; // Popups must be dismissed
  style: 'default' | 'golden' | 'sparkle';
  assignedTo: string[];
  readBy: string[]; 
}