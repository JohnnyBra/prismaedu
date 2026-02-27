import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import TaskCard from '../components/TaskCard';
import { Role, Task, AvatarItemType, AvatarConfig } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { ShoppingBag, Star, LogOut, CheckCircle, Settings, X, MessageSquare, Send, History, Clock, Zap, Sparkles, Mailbox, Check } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

// Tier color borders based on price
const getTierClass = (cost: number): string => {
  if (cost === 0) return 'border-emerald-400/40';
  if (cost <= 50) return 'border-sky-400/40';
  if (cost <= 200) return 'border-purple-400/50';
  if (cost <= 500) return 'border-amber-400/50';
  return 'border-rose-400/60';
};

const getTierLabel = (cost: number): string => {
  if (cost === 0) return 'Gratis';
  if (cost <= 50) return 'Comun';
  if (cost <= 200) return 'Raro';
  if (cost <= 500) return 'Epico';
  return 'Legendario';
};

const getTierGlow = (cost: number): string => {
  if (cost === 0) return '';
  if (cost <= 50) return 'shadow-sky-400/10';
  if (cost <= 200) return 'shadow-purple-400/15';
  if (cost <= 500) return 'shadow-amber-400/20';
  return 'shadow-rose-400/25 shadow-lg';
};

const AVATAR_CATEGORIES: { key: AvatarItemType; label: string; emoji: string; configKey: keyof AvatarConfig }[] = [
  { key: 'base', label: 'Cuerpo', emoji: '🧍', configKey: 'baseId' },
  { key: 'hair', label: 'Pelo', emoji: '💇', configKey: 'hairId' },
  { key: 'top', label: 'Camiseta', emoji: '👕', configKey: 'topId' },
  { key: 'bottom', label: 'Pantalon', emoji: '👖', configKey: 'bottomId' },
  { key: 'shoes', label: 'Zapatos', emoji: '👟', configKey: 'shoesId' },
  { key: 'accessory', label: 'Accesorio', emoji: '✨', configKey: 'accessoryId' },
];

const StudentDashboard: React.FC = () => {
  const { users, currentUser, tasks, completions, completeTask, logout, buyAvatarItem, redeemReward, rewards, updatePin, messages, sendMessage, sendBuzonMessage, redemptions, markMessagesRead, updateAvatar } = useData();
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'chat' | 'buzon'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'SCHOOL' | 'HOME'>('ALL');
  const [shopView, setShopView] = useState<'CATALOG' | 'WARDROBE' | 'HISTORY'>('CATALOG');
  const [shopCategory, setShopCategory] = useState<'AVATAR' | 'SCHOOL_REWARDS' | 'HOME_REWARDS'>('AVATAR');
  const [avatarFilter, setAvatarFilter] = useState<AvatarItemType>('base');
  const [wardrobeFilter, setWardrobeFilter] = useState<AvatarItemType>('base');
  const [priorityAck, setPriorityAck] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [buzonMessage, setBuzonMessage] = useState('');
  const [buzonContext, setBuzonContext] = useState<'SCHOOL' | 'HOME'>('SCHOOL');
  const [buzonAnonymous, setBuzonAnonymous] = useState(false);
  const [previewItem, setPreviewItem] = useState<string | null>(null);

  const [greetingState, setGreetingState] = useState<'SHOWING' | 'CLOSING' | 'CLOSED'>('SHOWING');

  useEffect(() => {
    if (greetingState === 'SHOWING') {
      const t = setTimeout(() => setGreetingState('CLOSING'), 3000);
      return () => clearTimeout(t);
    }
  }, [greetingState]);

  useEffect(() => {
    if (greetingState === 'CLOSING') {
      const t = setTimeout(() => setGreetingState('CLOSED'), 600);
      return () => clearTimeout(t);
    }
  }, [greetingState]);

  const tutor = users.find(u => u.role === Role.TUTOR && u.classId === currentUser?.classId);
  const parent = users.find(u => u.role === Role.PARENT && u.familyId === currentUser?.familyId);
  const unreadMessages = tutor && currentUser ? messages.filter(m => m.fromId === tutor.id && m.toId === currentUser.id && !m.read && m.type !== 'BUZON').length : 0;

  const myTasks = tasks.filter(t =>
    (t.assignedTo.length === 0 || t.assignedTo.includes(currentUser!.id))
  );

  const getIsCompleted = (taskId: string) => {
    return completions.some(c => c.taskId === taskId && c.userId === currentUser!.id);
  };

  const pendingPriorityTask = myTasks.find(t =>
    t.isPriority && t.context === 'SCHOOL' && !getIsCompleted(t.id)
  );

  useEffect(() => {
    if (pendingPriorityTask) {
      setPriorityAck(pendingPriorityTask.id);
    }
  }, [pendingPriorityTask]);

  useEffect(() => {
    if (activeTab === 'chat' && tutor && currentUser && unreadMessages > 0) {
      markMessagesRead(tutor.id, currentUser.id);
    }
  }, [activeTab, tutor, currentUser, unreadMessages]);

  const handlePriorityAck = () => setPriorityAck(null);

  const handleUpdatePin = () => {
    if (newPin.length === 4) {
      updatePin(newPin);
      setNewPin('');
      setShowSettings(false);
      alert('PIN actualizado!');
    } else {
      alert('El PIN debe tener 4 numeros');
    }
  };

  const handleSendMessage = () => {
    if (tutor && chatMessage) {
      sendMessage(tutor.id, chatMessage);
      setChatMessage('');
    }
  };

  const conversation = tutor ? messages.filter(m =>
    m.type !== 'BUZON' && ((m.fromId === currentUser?.id && m.toId === tutor.id) ||
      (m.fromId === tutor.id && m.toId === currentUser?.id))
  ).sort((a, b) => a.timestamp - b.timestamp) : [];

  const myBuzonMessages = messages.filter(m => m.type === 'BUZON' && m.fromId === currentUser?.id).sort((a, b) => b.timestamp - a.timestamp);

  const handleSendBuzonMessage = () => {
    if (!buzonMessage) return;
    if (buzonContext === 'SCHOOL' && tutor) {
      sendBuzonMessage(tutor.id, buzonMessage, 'SCHOOL', buzonAnonymous);
    } else if (buzonContext === 'HOME' && parent) {
      sendBuzonMessage(parent.id, buzonMessage, 'HOME', false);
    }
    setBuzonMessage('');
    alert('Mensaje enviado al buzón rojo');
  };

  const filteredTasks = myTasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.context === taskFilter;
  });

  const schoolRewards = rewards.filter(r => r.context === 'SCHOOL');
  const homeRewards = rewards.filter(r =>
    r.context === 'HOME' &&
    (r.familyId === currentUser?.familyId || !r.familyId)
  );

  const myRedemptions = redemptions
    .filter(r => r.userId === currentUser?.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Avatar shop: items filtered by category, excluding owned free items
  const filteredAvatarItems = useMemo(() => {
    return AVATAR_ITEMS.filter(i => i.type === avatarFilter);
  }, [avatarFilter]);

  // Wardrobe: only owned items by category
  const wardrobeItems = useMemo(() => {
    return AVATAR_ITEMS.filter(i => i.type === wardrobeFilter && currentUser?.inventory?.includes(i.id));
  }, [wardrobeFilter, currentUser?.inventory]);

  // Preview config for shop/wardrobe
  const previewConfig = useMemo((): AvatarConfig | undefined => {
    if (!currentUser?.avatarConfig) return undefined;
    if (!previewItem) return currentUser.avatarConfig;
    const item = AVATAR_ITEMS.find(i => i.id === previewItem);
    if (!item) return currentUser.avatarConfig;
    const cat = AVATAR_CATEGORIES.find(c => c.key === item.type);
    if (!cat) return currentUser.avatarConfig;
    return { ...currentUser.avatarConfig, [cat.configKey]: previewItem };
  }, [currentUser?.avatarConfig, previewItem]);

  const handleEquip = (itemId: string) => {
    const item = AVATAR_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const cat = AVATAR_CATEGORIES.find(c => c.key === item.type);
    if (!cat) return;
    updateAvatar({ [cat.configKey]: itemId });
    setPreviewItem(null);
  };

  const handleUnequip = (type: AvatarItemType) => {
    const cat = AVATAR_CATEGORIES.find(c => c.key === type);
    if (!cat) return;
    updateAvatar({ [cat.configKey]: undefined });
  };

  const tabs = [
    { id: 'tasks' as const, icon: CheckCircle, label: 'Tareas', emoji: '📋', color: 'primary' },
    { id: 'shop' as const, icon: ShoppingBag, label: 'Tienda', emoji: '🎁', color: 'secondary' },
    { id: 'chat' as const, icon: MessageSquare, label: 'Profe', emoji: '💬', color: 'accent', badge: unreadMessages },
    { id: 'buzon' as const, icon: Mailbox, label: 'Buzón Rojo', emoji: '📮', color: 'danger' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] mesh-student flex flex-col font-body relative">

      {/* Greeting Overlay */}
      {greetingState !== 'CLOSED' && (
        <div
          className={`fixed inset-0 z-[100] ${greetingState === 'CLOSING' ? 'pointer-events-none' : 'cursor-pointer'}`}
          onClick={() => setGreetingState('CLOSING')}
        >
          <style>{`
            @keyframes wave-large {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-10deg); }
              75% { transform: rotate(10deg); }
            }
            .animate-wave-large {
              animation: wave-large 1s ease-in-out infinite;
              transform-origin: bottom center;
            }
            @keyframes move-to-header-overlay {
              from { opacity: 1; backdrop-filter: blur(12px); background: rgba(15, 23, 42, 0.9); }
              to { opacity: 0; backdrop-filter: blur(0px); background: rgba(15, 23, 42, 0); }
            }
            .animate-close-overlay {
              animation: move-to-header-overlay 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes move-to-header-avatar {
              from { 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%) scale(1); 
                opacity: 1;
              }
              to { 
                top: calc(0.75rem + var(--safe-top) + 24px); 
                left: calc(max(1rem, calc(50vw - 448px + 1rem)) + 24px); 
                transform: translate(-50%, -50%) scale(0.192); 
                opacity: 0.5;
              }
            }
            .animate-close-avatar {
              animation: move-to-header-avatar 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          {/* Background */}
          <div className={`absolute inset-0 ${greetingState === 'CLOSING' ? 'animate-close-overlay' : 'bg-[#0f172a]/90 backdrop-blur-md animate-fade-in'}`} />

          {/* Avatar */}
          <div className={`absolute z-10 ${greetingState === 'CLOSING' ? 'animate-close-avatar' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
            <div className={greetingState === 'SHOWING' ? 'animate-wave-large' : ''}>
              <Avatar config={currentUser?.avatarConfig} size={250} showRing glowColor="rgba(168,85,247,0.8)" />
            </div>
          </div>

          {/* Text and Close */}
          {greetingState === 'SHOWING' && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[150px] w-full text-center pointer-events-none">
                <h1 className="font-display font-black text-white text-4xl animate-slide-up bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 shadow-sm">
                  ¡Hola, {currentUser?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-white/60 mt-4 text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  Toca para continuar
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setGreetingState('CLOSING'); }}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white z-20"
              >
                <X size={24} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Top Bar */}
      <div className="glass-student sticky top-0 z-40 px-4 py-3" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div onClick={(e) => { e.stopPropagation(); setGreetingState('SHOWING'); }} className="hover:scale-110 transition-transform">
              <Avatar config={currentUser?.avatarConfig} size={48} showRing glowColor="rgba(168,85,247,0.5)" />
            </div>
            <div onClick={() => setShowSettings(true)}>
              <h1 className="font-display font-extrabold text-white leading-none text-base">
                ¡Hola, {currentUser?.name?.split(' ')[0]}! 👋
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 student-points-pill px-2.5 py-1 rounded-full w-fit">
                <Star size={13} fill="currentColor" className="text-amber-400" />
                <span className="font-display font-extrabold text-amber-400 text-sm">{currentUser?.points}</span>
                <span className="text-amber-400/70 text-[10px] font-bold">puntos</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle className="glass rounded-xl text-white/50 hover:text-white/90 hover:bg-white/10" />
            <button onClick={() => setShowSettings(true)} className="glass rounded-xl p-2.5 text-white/50 hover:text-white/90 hover:bg-white/10 transition-all hover:scale-105">
              <Settings size={18} />
            </button>
            <button onClick={logout} className="glass rounded-xl p-2.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all hover:scale-105">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 md:pb-6 max-w-4xl mx-auto w-full relative z-10 mt-4">

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 w-full max-w-sm shadow-glass-lg modal-content relative">
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                <X size={20} />
              </button>
              <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">⚙️ Ajustes</h2>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-white/50 mb-2">Cambiar mi PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="input-glass w-full text-center text-2xl tracking-[0.5em] font-display"
                  placeholder="0000"
                />
                <p className="text-[10px] text-white/30 mt-2">Introduce 4 numeros nuevos</p>
              </div>
              <button
                onClick={handleUpdatePin}
                className="btn-primary w-full"
              >
                Guardar Nuevo PIN
              </button>
            </div>
          </div>
        )}

        {/* Priority Modal */}
        {priorityAck && pendingPriorityTask && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-6">
            <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center shadow-glass-lg modal-content">
              <div className="text-5xl mb-4 animate-bounce-subtle">⚡</div>
              <h2 className="font-display text-2xl font-black text-white mb-2">¡Misión Especial!</h2>
              <p className="text-white/50 mb-6 text-sm">Tu profe te ha enviado una tarea importante 🚀</p>

              <div className="glass-student-card rounded-2xl p-4 mb-6 text-left glow-border-candy">
                <h3 className="font-display font-bold text-white">{pendingPriorityTask.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="bg-primary-400/20 text-primary-300 text-xs font-bold px-2.5 py-1 rounded-lg">🏫 COLEGIO</span>
                  <span className="font-display font-bold text-amber-400">+{pendingPriorityTask.points} ⭐</span>
                </div>
              </div>

              <button
                onClick={handlePriorityAck}
                className="w-full py-4 text-lg font-display font-bold text-white rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 shadow-lg hover:shadow-xl transition-all active:scale-95 hover:scale-[1.02]"
              >
                <Sparkles size={18} className="inline mr-2" /> ¡Vamos allá!
              </button>
            </div>
          </div>
        )}

        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-3 mb-6 max-w-lg mx-auto">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-300 relative ${active
                  ? 'glass-student-card text-white student-tab-active'
                  : 'glass text-white/40 hover:text-white/70 hover:bg-white/8 hover:scale-[1.02]'
                  }`}
              >
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce-subtle">
                    {tab.badge}
                  </div>
                )}
                <span className="text-lg">{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TASKS VIEW */}
        {activeTab === 'tasks' && (
          <div className="animate-slide-up">
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'ALL' as const, label: '✨ Todas', activeClass: 'bg-white/15 text-white border-white/25 shadow-sm' },
                { key: 'SCHOOL' as const, label: '🏫 Colegio', activeClass: 'bg-primary-400/20 text-primary-300 border-primary-400/30 shadow-sm' },
                { key: 'HOME' as const, label: '🏠 Casa', activeClass: 'bg-secondary-400/20 text-secondary-300 border-secondary-400/30 shadow-sm' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTaskFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 hover:scale-105 active:scale-95 ${taskFilter === f.key ? f.activeClass : 'border-white/10 text-white/35 hover:text-white/60 hover:border-white/20'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 && (
                <div className="text-center py-16 animate-fade-in">
                  <div className="text-5xl mb-4 animate-bounce-subtle">🎉</div>
                  <p className="text-white/60 font-display font-bold text-base">¡Todo hecho!</p>
                  <p className="text-white/30 text-sm mt-1">No tienes tareas pendientes. ¡Buen trabajo!</p>
                </div>
              )}
              {filteredTasks.map((task, i) => (
                <div key={task.id} style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}>
                  <TaskCard
                    task={task}
                    completed={getIsCompleted(task.id)}
                    onComplete={() => completeTask(task.id, currentUser!.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOP VIEW */}
        {activeTab === 'shop' && (
          <div className="animate-slide-up">
            {/* Shop Mode Toggle: Catálogo / Vestidor / Historial */}
            <div className="flex glass rounded-xl p-1 mb-5">
              <button
                onClick={() => setShopView('CATALOG')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${shopView === 'CATALOG' ? 'glass-student-card text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                🛍️ Catalogo
              </button>
              <button
                onClick={() => setShopView('WARDROBE')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${shopView === 'WARDROBE' ? 'glass-student-card text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                👗 Vestidor
              </button>
              <button
                onClick={() => setShopView('HISTORY')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${shopView === 'HISTORY' ? 'glass-student-card text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                📜 Historial
              </button>
            </div>

            {/* ═══ CATALOG VIEW ═══ */}
            {shopView === 'CATALOG' && (
              <>
                <div className="flex gap-1 mb-5 glass rounded-xl p-1">
                  {[
                    { key: 'AVATAR' as const, label: '🧑‍🎨 Avatar' },
                    { key: 'SCHOOL_REWARDS' as const, label: '🏫 Colegio' },
                    { key: 'HOME_REWARDS' as const, label: '🏠 Casa' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setShopCategory(cat.key)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${shopCategory === cat.key ? 'glass-student-card text-white' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Avatar subcategory filter */}
                {shopCategory === 'AVATAR' && (
                  <>
                    <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                      {AVATAR_CATEGORIES.map(cat => (
                        <button
                          key={cat.key}
                          onClick={() => setAvatarFilter(cat.key)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 ${avatarFilter === cat.key
                              ? 'bg-white/15 text-white border-white/25'
                              : 'border-white/10 text-white/35 hover:text-white/60 hover:border-white/20'
                            }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Preview avatar with hovered item */}
                    {previewItem && (
                      <div className="flex justify-center mb-4 animate-scale-in">
                        <div className="glass-student-card rounded-2xl p-4 flex items-center gap-4 glow-border-candy">
                          <Avatar config={previewConfig} size={80} showRing glowColor="rgba(168,85,247,0.5)" />
                          <div className="text-xs text-white/60">
                            <p className="font-display font-bold text-white text-sm">Vista previa</p>
                            <p>Asi se vera tu avatar</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredAvatarItems.map((item, i) => {
                        const owned = currentUser?.inventory?.includes(item.id);
                        const equipped = currentUser?.avatarConfig && AVATAR_CATEGORIES.find(c => c.key === item.type) &&
                          currentUser.avatarConfig[AVATAR_CATEGORIES.find(c => c.key === item.type)!.configKey] === item.id;
                        const tierClass = getTierClass(item.cost);
                        const tierGlow = getTierGlow(item.cost);
                        const tierLabel = getTierLabel(item.cost);

                        return (
                          <div
                            key={item.id}
                            className={`glass-student-card rounded-2xl p-4 flex flex-col items-center border-2 ${tierClass} ${tierGlow} hover:scale-[1.03] transition-transform duration-200`}
                            style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
                            onMouseEnter={() => setPreviewItem(item.id)}
                            onMouseLeave={() => setPreviewItem(null)}
                          >
                            <div className="w-16 h-16 relative mb-2">
                              <svg viewBox="-5 -10 110 115" className="w-full h-full drop-shadow-lg">
                                {/* Show base body outline for context */}
                                <g opacity="0.15">
                                  <circle cx="50" cy="22" r="16" fill="#CBD5E1" />
                                  <ellipse cx="50" cy="56" rx="20" ry="14" fill="#CBD5E1" />
                                  <rect x="36" y="68" width="12" height="22" rx="4" fill="#CBD5E1" />
                                  <rect x="52" y="68" width="12" height="22" rx="4" fill="#CBD5E1" />
                                </g>
                                <g dangerouslySetInnerHTML={{ __html: item.svg }} />
                              </svg>
                            </div>
                            <h3 className="font-display font-semibold text-xs text-white/90">{item.name}</h3>
                            <span className={`text-[9px] font-bold mt-0.5 ${item.cost === 0 ? 'text-emerald-400/70' :
                                item.cost <= 50 ? 'text-sky-400/70' :
                                  item.cost <= 200 ? 'text-purple-400/70' :
                                    item.cost <= 500 ? 'text-amber-400/70' :
                                      'text-rose-400/70'
                              }`}>{tierLabel}</span>
                            <div className="mt-2 w-full">
                              {owned ? (
                                equipped ? (
                                  <button className="w-full py-1.5 glass text-amber-400/60 rounded-lg text-[10px] font-bold cursor-default" disabled>
                                    ⭐ Equipado
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEquip(item.id)}
                                    className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                                  >
                                    👗 Equipar
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => buyAvatarItem(item.id)}
                                  disabled={currentUser!.points < item.cost}
                                  className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-surface-700 disabled:to-surface-700 disabled:text-white/20 text-white rounded-lg text-[10px] font-bold transition-all hover:shadow-neon-purple active:scale-95 hover:brightness-110"
                                >
                                  {item.cost === 0 ? '🎁 Gratis' : `⭐ ${item.cost}`}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* School/Home rewards grids */}
                {shopCategory !== 'AVATAR' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {shopCategory === 'SCHOOL_REWARDS' && schoolRewards.map((reward, i) => (
                      <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} index={i} />
                    ))}
                    {shopCategory === 'HOME_REWARDS' && homeRewards.map((reward, i) => (
                      <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} index={i} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ═══ WARDROBE (VESTIDOR) VIEW ═══ */}
            {shopView === 'WARDROBE' && (
              <div className="animate-slide-up">
                {/* Large avatar preview */}
                <div className="flex justify-center mb-6">
                  <div className="glass-student-card rounded-3xl p-6 glow-border-candy">
                    <Avatar config={previewConfig} size={140} showRing glowColor="rgba(168,85,247,0.5)" />
                    <p className="text-center text-white/50 text-xs mt-3 font-display font-bold">Tu Avatar</p>
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {AVATAR_CATEGORIES.map(cat => {
                    const equippedId = currentUser?.avatarConfig?.[cat.configKey];
                    const hasEquipped = !!equippedId;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setWardrobeFilter(cat.key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 relative ${wardrobeFilter === cat.key
                            ? 'bg-white/15 text-white border-white/25'
                            : 'border-white/10 text-white/35 hover:text-white/60 hover:border-white/20'
                          }`}
                      >
                        {cat.emoji} {cat.label}
                        {hasEquipped && <span className="ml-1 text-emerald-400">•</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Unequip button */}
                {currentUser?.avatarConfig?.[AVATAR_CATEGORIES.find(c => c.key === wardrobeFilter)!.configKey] && (
                  <button
                    onClick={() => handleUnequip(wardrobeFilter)}
                    className="w-full mb-3 py-2 glass rounded-xl text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    ✕ Quitar {AVATAR_CATEGORIES.find(c => c.key === wardrobeFilter)?.label}
                  </button>
                )}

                {/* Items grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {wardrobeItems.length === 0 && (
                    <div className="col-span-full text-center py-10 animate-fade-in">
                      <div className="text-4xl mb-3">🛒</div>
                      <p className="text-white/50 font-display font-bold text-sm">No tienes items de {AVATAR_CATEGORIES.find(c => c.key === wardrobeFilter)?.label}</p>
                      <p className="text-white/30 text-xs mt-1">¡Ve al catalogo a comprar!</p>
                    </div>
                  )}
                  {wardrobeItems.map((item, i) => {
                    const cat = AVATAR_CATEGORIES.find(c => c.key === item.type)!;
                    const equipped = currentUser?.avatarConfig?.[cat.configKey] === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item.id)}
                        onMouseEnter={() => setPreviewItem(item.id)}
                        onMouseLeave={() => setPreviewItem(null)}
                        className={`glass-student-card rounded-2xl p-3 flex flex-col items-center transition-all duration-200 hover:scale-[1.05] ${equipped ? 'ring-2 ring-amber-400/60 bg-amber-400/10' : ''
                          }`}
                        style={{ animation: `slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
                      >
                        <div className="w-12 h-12 mb-1">
                          <svg viewBox="-5 -10 110 115" className="w-full h-full">
                            <g opacity="0.1">
                              <circle cx="50" cy="22" r="16" fill="#CBD5E1" />
                              <ellipse cx="50" cy="56" rx="20" ry="14" fill="#CBD5E1" />
                              <rect x="36" y="68" width="12" height="22" rx="4" fill="#CBD5E1" />
                              <rect x="52" y="68" width="12" height="22" rx="4" fill="#CBD5E1" />
                            </g>
                            <g dangerouslySetInnerHTML={{ __html: item.svg }} />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/80 text-center leading-tight">{item.name}</span>
                        {equipped && <span className="text-[9px] text-amber-400 font-bold mt-0.5">Equipado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ HISTORY VIEW ═══ */}
            {shopView === 'HISTORY' && (
              <div className="space-y-3 animate-slide-up">
                {myRedemptions.length === 0 && (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="text-5xl mb-4">🛒</div>
                    <p className="text-white/50 font-display font-bold text-sm">¡Aun no has canjeado premios!</p>
                    <p className="text-white/30 text-xs mt-1">Completa tareas para ganar puntos ⭐</p>
                  </div>
                )}
                {myRedemptions.map((redemption, i) => (
                  <div
                    key={redemption.id}
                    className="glass-student-card rounded-2xl p-4 flex justify-between items-center"
                    style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
                  >
                    <div>
                      <h4 className="font-display font-semibold text-white/90 text-sm">{redemption.rewardTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${redemption.context === 'SCHOOL' ? 'bg-primary-400/15 text-primary-300' : 'bg-secondary-400/15 text-secondary-300'
                          }`}>
                          {redemption.context === 'SCHOOL' ? '🏫 Colegio' : '🏠 Casa'}
                        </span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Clock size={10} /> {formatDate(redemption.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="font-display font-bold text-red-400 text-sm whitespace-nowrap">
                      -⭐{redemption.cost}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="animate-slide-up h-[calc(100dvh-220px)] md:h-[60vh] flex flex-col glass-student-card rounded-2xl overflow-hidden glow-border-candy">
            <div className="px-4 py-3 glass-student font-display font-bold text-white text-sm flex items-center gap-2">
              💬 Chat con {tutor?.name || 'Tutor'}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {conversation.map(msg => {
                const isMe = msg.fromId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${isMe
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md shadow-lg shadow-purple-500/15'
                      : 'glass-student text-white/85 rounded-bl-md'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {conversation.length === 0 && <p className="text-center text-white/30 text-sm mt-10">👋 ¡Saluda a tu profe!</p>}
            </div>
            <div className="p-3 glass-student flex gap-2">
              <input
                className="input-glass flex-1 rounded-full text-sm py-2"
                placeholder="Escribe un mensaje... ✏️"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2.5 rounded-full shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95 hover:scale-105">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* BUZON VIEW */}
        {activeTab === 'buzon' && (
          <div className="animate-slide-up space-y-4">
            <div className="glass-student-card rounded-2xl p-5 glow-border-red">
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <Mailbox size={24} />
                <h2 className="font-display font-bold text-white text-lg">Buzón Rojo</h2>
              </div>
              <p className="text-white/60 text-sm mb-4">Expresa tus miedos, preocupaciones y deseos.</p>

              <div className="flex gap-2 mb-4 p-1 glass rounded-xl">
                <button
                  onClick={() => setBuzonContext('SCHOOL')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${buzonContext === 'SCHOOL' ? 'bg-red-500/80 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  🏫 Para el Cole
                </button>
                <button
                  onClick={() => setBuzonContext('HOME')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${buzonContext === 'HOME' ? 'bg-red-500/80 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  🏠 Para Casa
                </button>
              </div>

              <textarea
                className="input-glass w-full rounded-xl text-sm p-3 mb-3 resize-none h-24"
                placeholder={buzonContext === 'SCHOOL' ? "Escribe a tu tutor..." : "Escribe a tu familia..."}
                value={buzonMessage}
                onChange={e => setBuzonMessage(e.target.value)}
              />

              {buzonContext === 'SCHOOL' && (
                <label className="flex items-center gap-2 text-white/70 text-sm mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buzonAnonymous}
                    onChange={e => setBuzonAnonymous(e.target.checked)}
                    className="rounded text-red-500 bg-white/10 border-white/20 focus:ring-red-500/50"
                  />
                  Enviar de forma anónima
                </label>
              )}

              <button
                onClick={handleSendBuzonMessage}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send size={16} /> Enviar al Buzón
              </button>
            </div>

            <div className="glass-student-card rounded-2xl p-5">
              <h3 className="font-display font-bold text-white text-sm mb-4">Mis Envios al Buzón Rojo</h3>
              <div className="space-y-3">
                {myBuzonMessages.length === 0 ? (
                  <p className="text-white/30 text-xs text-center">Aún no has enviado nada al buzón rojo.</p>
                ) : (
                  myBuzonMessages.map(msg => (
                    <div key={msg.id} className="glass rounded-xl p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${msg.context === 'SCHOOL' ? 'bg-primary-400/15 text-primary-300' : 'bg-secondary-400/15 text-secondary-300'
                          }`}>
                          {msg.context === 'SCHOOL' ? '🏫 Cole' : '🏠 Casa'}
                          {msg.isAnonymous && msg.context === 'SCHOOL' && ' (Anónimo)'}
                        </span>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${msg.read ? 'text-emerald-400' : 'text-white/40'}`}>
                          {msg.read ? <><Check size={12} /> Visto por {msg.context === 'SCHOOL' ? 'Tutor' : 'Familia'}</> : 'Enviado'}
                        </div>
                      </div>
                      <p className="text-white/80 text-sm italic">"{msg.content}"</p>
                      <span className="text-[10px] text-white/30 block mt-2">{formatDate(msg.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-student px-2 pt-2" style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}>
        <div className="flex justify-around">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 relative ${active ? 'text-white scale-110' : 'text-white/35'
                  }`}
              >
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute top-0 right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce-subtle">
                    {tab.badge}
                  </div>
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-white/15 student-tab-active' : ''}`}>
                  <span className="text-lg">{tab.emoji}</span>
                </div>
                <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

const RewardCard: React.FC<{ reward: any, onRedeem: () => void, userPoints: number, index?: number }> = ({ reward, onRedeem, userPoints, index = 0 }) => {
  const canAfford = userPoints >= reward.cost;
  const inStock = reward.stock === undefined || reward.stock > 0;
  const isSchool = reward.context === 'SCHOOL';

  return (
    <div
      className={`glass-student-card rounded-2xl p-4 flex flex-col justify-between h-full hover:scale-[1.03] transition-transform duration-200 ${isSchool ? 'glow-border-blue' : 'glow-border-orange'}`}
      style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both` }}
    >
      <div className="text-center mb-3">
        <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${isSchool ? 'bg-primary-400/20 text-primary-300' : 'bg-secondary-400/20 text-secondary-300'
          }`}>
          <ShoppingBag size={18} />
        </div>
        <h3 className="font-display font-semibold text-xs text-white/90 leading-tight">{reward.title}</h3>
        {reward.stock !== undefined && <p className="text-[10px] text-white/30 mt-1">Quedan {reward.stock}</p>}
      </div>
      <button
        onClick={onRedeem}
        disabled={!canAfford || !inStock}
        className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${canAfford && inStock
          ? `bg-gradient-to-r ${isSchool ? 'from-primary-500 to-primary-400 shadow-primary-500/20' : 'from-secondary-500 to-secondary-400 shadow-secondary-500/20'} text-white shadow-lg hover:shadow-xl hover:brightness-110`
          : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
      >
        ⭐ {reward.cost}
      </button>
    </div>
  );
};

export default StudentDashboard;
