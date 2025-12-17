import { AvatarItem } from './types';
import React from 'react';

// Avatar Assets Data
export const AVATAR_ITEMS: AvatarItem[] = [
  // Bases
  { id: 'base_1', type: 'base', name: 'Piel Clara', cost: 0, svg: '<circle cx="50" cy="50" r="40" fill="#fca" />' },
  { id: 'base_2', type: 'base', name: 'Piel Oscura', cost: 0, svg: '<circle cx="50" cy="50" r="40" fill="#8d5524" />' },
  { id: 'base_3', type: 'base', name: 'Robot', cost: 100, svg: '<rect x="15" y="15" width="70" height="70" rx="10" fill="#9ca3af" />' },
  
  // Tops
  { id: 'top_1', type: 'top', name: 'Camiseta Roja', cost: 0, svg: '<path d="M20 90 Q50 100 80 90 L80 110 L20 110 Z" fill="#ef4444" transform="translate(0, -10)" /> <rect x="25" y="80" width="50" height="40" rx="5" fill="#ef4444" />' },
  { id: 'top_2', type: 'top', name: 'Camisa Azul', cost: 50, svg: '<path d="M20 90 Q50 100 80 90 L80 110 L20 110 Z" fill="#3b82f6" transform="translate(0, -10)" /> <rect x="25" y="80" width="50" height="40" rx="5" fill="#3b82f6" />' },
  { id: 'top_3', type: 'top', name: 'Armadura Dorada', cost: 500, svg: '<rect x="20" y="80" width="60" height="45" rx="5" fill="#eab308" stroke="#a16207" stroke-width="2"/>' },

  // Accessory
  { id: 'acc_1', type: 'accessory', name: 'Gafas', cost: 30, svg: '<g><circle cx="35" cy="45" r="8" fill="none" stroke="black" stroke-width="2"/><circle cx="65" cy="45" r="8" fill="none" stroke="black" stroke-width="2"/><line x1="43" y1="45" x2="57" y2="45" stroke="black" stroke-width="2"/></g>' },
  { id: 'acc_2', type: 'accessory', name: 'Corona', cost: 1000, svg: '<path d="M30 30 L40 10 L50 30 L60 10 L70 30 L70 40 L30 40 Z" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>' },
  
  // Bottom
  { id: 'bot_1', type: 'bottom', name: 'Vaqueros', cost: 0, svg: '' }, 
];

export const INITIAL_CLASSES = [
  { id: 'classA', name: '4º A - Primaria' },
  { id: 'classB', name: '4º B - Primaria' },
];

// Initial Tasks
export const INITIAL_TASKS = [
  { id: 't1', title: 'Completar ficha de Mates', points: 15, icon: 'Calculator', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: true },
  { id: 't2', title: 'Ayudar a un compañero', points: 10, icon: 'Users', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: false },
  { id: 't3', title: 'Limpiar tu habitación', points: 20, icon: 'Home', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
  { id: 't4', title: 'Leer 20 minutos', points: 15, icon: 'BookOpen', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
];

export const INITIAL_REWARDS = [
  { id: 'r1', title: 'Sentarse con un amigo', cost: 50, icon: 'Users', context: 'SCHOOL', stock: 10 },
  { id: 'r2', title: 'Pase sin deberes', cost: 100, icon: 'FileCheck', context: 'SCHOOL', stock: 5 },
  { id: 'r3', title: '30 Minutos TV', cost: 40, icon: 'Tv', context: 'HOME' },
  { id: 'r4', title: 'Salida a por Helado', cost: 200, icon: 'IceCream', context: 'HOME' },
];