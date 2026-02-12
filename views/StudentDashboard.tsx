import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import TaskCard from '../components/TaskCard';
import { Role, Task } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { ShoppingBag, Star, LogOut, CheckCircle, Settings, X, MessageSquare, Send, History, Clock, Zap, Sparkles } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { users, currentUser, tasks, completions, completeTask, logout, buyAvatarItem, redeemReward, rewards, updatePin, messages, sendMessage, redemptions, markMessagesRead } = useData();
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'chat'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'SCHOOL' | 'HOME'>('ALL');
  const [shopView, setShopView] = useState<'CATALOG' | 'HISTORY'>('CATALOG');
  const [shopCategory, setShopCategory] = useState<'AVATAR' | 'SCHOOL_REWARDS' | 'HOME_REWARDS'>('AVATAR');
  const [priorityAck, setPriorityAck] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const tutor = users.find(u => u.role === Role.TUTOR && u.classId === currentUser?.classId);
  const unreadMessages = tutor && currentUser ? messages.filter(m => m.fromId === tutor.id && m.toId === currentUser.id && !m.read).length : 0;

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
    (m.fromId === currentUser?.id && m.toId === tutor.id) ||
    (m.fromId === tutor.id && m.toId === currentUser?.id)
  ).sort((a, b) => a.timestamp - b.timestamp) : [];

  const filteredTasks = myTasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    return t.context === taskFilter;
  });

  const avatarItems = AVATAR_ITEMS.filter(i => i.cost > 0);
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

  const tabs = [
    { id: 'tasks' as const, icon: CheckCircle, label: 'Tareas', color: 'primary' },
    { id: 'shop' as const, icon: ShoppingBag, label: 'Tienda', color: 'secondary' },
    { id: 'chat' as const, icon: MessageSquare, label: 'Profe', color: 'accent', badge: unreadMessages },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] mesh-student flex flex-col font-body relative">

      {/* Top Bar */}
      <div className="glass-medium sticky top-0 z-40 px-4 py-3" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowSettings(true)}>
            <Avatar config={currentUser?.avatarConfig} size={44} showRing glowColor="rgba(34,211,238,0.4)" />
            <div>
              <h1 className="font-display font-bold text-white/90 leading-none text-base">{currentUser?.name?.split(' ')[0]}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} fill="currentColor" className="text-amber-400" />
                <span className="font-display font-bold text-amber-400 text-sm">{currentUser?.points}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="glass rounded-xl p-2.5 text-white/40 hover:text-white/80 transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={logout} className="glass rounded-xl p-2.5 text-red-400/60 hover:text-red-400 transition-colors">
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
              <h2 className="font-display text-lg font-bold text-white/90 mb-4 flex items-center gap-2"><Settings size={18} /> Ajustes</h2>
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
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
                <Zap size={36} className="text-red-400" fill="currentColor" />
              </div>
              <h2 className="font-display text-2xl font-black text-white/90 mb-2">Nueva Tarea Prioritaria</h2>
              <p className="text-white/40 mb-6 text-sm">Tu profe ha mandado una tarea importante.</p>

              <div className="glass rounded-2xl p-4 mb-6 text-left glow-border-blue">
                <h3 className="font-display font-bold text-white/90">{pendingPriorityTask.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="bg-primary-500/20 text-primary-300 text-xs font-bold px-2.5 py-1 rounded-lg">COLEGIO</span>
                  <span className="font-display font-bold text-amber-400">+{pendingPriorityTask.points} pts</span>
                </div>
              </div>

              <button
                onClick={handlePriorityAck}
                className="btn-primary w-full py-4 text-lg"
              >
                <Sparkles size={18} className="inline mr-2" /> A ello!
              </button>
            </div>
          </div>
        )}

        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-3 mb-6 max-w-lg mx-auto">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-300 relative ${
                  active
                    ? `glass-medium text-white shadow-neon-${tab.color === 'primary' ? 'blue' : tab.color === 'secondary' ? 'orange' : 'purple'}`
                    : 'glass text-white/40 hover:text-white/60 hover:bg-white/8'
                }`}
              >
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce-subtle">
                    {tab.badge}
                  </div>
                )}
                <Icon size={18} />
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
                { key: 'ALL' as const, label: 'Todas', activeClass: 'bg-white/15 text-white border-white/20' },
                { key: 'SCHOOL' as const, label: 'Colegio', activeClass: 'bg-primary-500/20 text-primary-300 border-primary-500/30' },
                { key: 'HOME' as const, label: 'Casa', activeClass: 'bg-secondary-500/20 text-secondary-300 border-secondary-500/30' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTaskFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                    taskFilter === f.key ? f.activeClass : 'border-white/8 text-white/30 hover:text-white/50 hover:border-white/15'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 && (
                <div className="text-center py-16">
                  <CheckCircle size={40} className="mx-auto mb-3 text-white/15" />
                  <p className="text-white/30 font-medium text-sm">No hay tareas</p>
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
            {/* Shop Mode Toggle */}
            <div className="flex glass rounded-xl p-1 mb-5">
              <button
                onClick={() => setShopView('CATALOG')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${shopView === 'CATALOG' ? 'glass-medium text-white' : 'text-white/40'}`}
              >
                Catalogo
              </button>
              <button
                onClick={() => setShopView('HISTORY')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${shopView === 'HISTORY' ? 'glass-medium text-white' : 'text-white/40'}`}
              >
                <History size={12} /> Historial
              </button>
            </div>

            {shopView === 'CATALOG' && (
              <>
                <div className="flex gap-1 mb-5 glass rounded-xl p-1">
                  {[
                    { key: 'AVATAR' as const, label: 'Avatar', color: 'primary' },
                    { key: 'SCHOOL_REWARDS' as const, label: 'Colegio', color: 'school' },
                    { key: 'HOME_REWARDS' as const, label: 'Casa', color: 'home' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setShopCategory(cat.key)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                        shopCategory === cat.key ? 'glass-medium text-white' : 'text-white/40'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {shopCategory === 'AVATAR' && avatarItems.map((item, i) => {
                    const owned = currentUser?.inventory?.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="glass rounded-2xl p-4 flex flex-col items-center glow-border-purple"
                        style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
                      >
                        <div className="w-16 h-16 relative mb-3">
                          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                            <g dangerouslySetInnerHTML={{ __html: item.svg }} />
                          </svg>
                        </div>
                        <h3 className="font-display font-semibold text-xs text-white/80">{item.name}</h3>
                        <div className="mt-2 w-full">
                          {owned ? (
                            <button className="w-full py-1.5 glass text-white/30 rounded-lg text-[10px] font-bold cursor-default" disabled>
                              Tuyo
                            </button>
                          ) : (
                            <button
                              onClick={() => buyAvatarItem(item.id)}
                              disabled={currentUser!.points < item.cost}
                              className="w-full py-1.5 bg-gradient-to-r from-primary-600 to-accent-600 disabled:from-surface-700 disabled:to-surface-700 disabled:text-white/20 text-white rounded-lg text-[10px] font-bold transition-all hover:shadow-neon-purple active:scale-95"
                            >
                              <Star size={10} className="inline mr-1" fill="currentColor" />{item.cost}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {shopCategory === 'SCHOOL_REWARDS' && schoolRewards.map((reward, i) => (
                    <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} index={i} />
                  ))}

                  {shopCategory === 'HOME_REWARDS' && homeRewards.map((reward, i) => (
                    <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} index={i} />
                  ))}
                </div>
              </>
            )}

            {shopView === 'HISTORY' && (
              <div className="space-y-3 animate-slide-up">
                {myRedemptions.length === 0 && (
                  <div className="text-center py-16">
                    <ShoppingBag size={40} className="mx-auto mb-3 text-white/15" />
                    <p className="text-white/30 font-medium text-sm">Aun no has canjeado premios.</p>
                  </div>
                )}
                {myRedemptions.map((redemption, i) => (
                  <div
                    key={redemption.id}
                    className="glass rounded-2xl p-4 flex justify-between items-center"
                    style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
                  >
                    <div>
                      <h4 className="font-display font-semibold text-white/80 text-sm">{redemption.rewardTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          redemption.context === 'SCHOOL' ? 'bg-primary-500/15 text-primary-300' : 'bg-secondary-500/15 text-secondary-300'
                        }`}>
                          {redemption.context === 'SCHOOL' ? 'Colegio' : 'Casa'}
                        </span>
                        <span className="text-[10px] text-white/25 flex items-center gap-1">
                          <Clock size={10} /> {formatDate(redemption.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="font-display font-bold text-red-400 text-sm whitespace-nowrap">
                      -{redemption.cost}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="animate-slide-up h-[calc(100dvh-220px)] md:h-[60vh] flex flex-col glass rounded-2xl overflow-hidden glow-border-purple">
            <div className="px-4 py-3 glass-medium font-display font-bold text-white/90 text-sm flex items-center gap-2">
              <MessageSquare size={16} className="text-accent-400" />
              Chat con {tutor?.name || 'Tutor'}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {conversation.map(msg => {
                const isMe = msg.fromId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-br-md'
                        : 'glass-light text-white/80 rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {conversation.length === 0 && <p className="text-center text-white/20 text-sm mt-10">Saluda a tu profe!</p>}
            </div>
            <div className="p-3 glass-medium flex gap-2">
              <input
                className="input-glass flex-1 rounded-full text-sm py-2"
                placeholder="Mensaje..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-2.5 rounded-full shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-95">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-medium px-2 pt-2" style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}>
        <div className="flex justify-around">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 relative ${
                  active ? 'text-white' : 'text-white/30'
                }`}
              >
                {tab.badge && tab.badge > 0 && (
                  <div className="absolute top-0 right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {tab.badge}
                  </div>
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-white/15' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-semibold mt-0.5">{tab.label}</span>
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
      className={`glass rounded-2xl p-4 flex flex-col justify-between h-full ${isSchool ? 'glow-border-blue' : 'glow-border-orange'}`}
      style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both` }}
    >
      <div className="text-center mb-3">
        <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
          isSchool ? 'bg-primary-500/20 text-primary-400' : 'bg-secondary-500/20 text-secondary-400'
        }`}>
          <ShoppingBag size={18} />
        </div>
        <h3 className="font-display font-semibold text-xs text-white/80 leading-tight">{reward.title}</h3>
        {reward.stock !== undefined && <p className="text-[10px] text-white/25 mt-1">Quedan {reward.stock}</p>}
      </div>
      <button
        onClick={onRedeem}
        disabled={!canAfford || !inStock}
        className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
          canAfford && inStock
            ? `bg-gradient-to-r ${isSchool ? 'from-primary-600 to-primary-500 shadow-primary-500/20' : 'from-secondary-600 to-secondary-500 shadow-secondary-500/20'} text-white shadow-lg hover:shadow-xl`
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        }`}
      >
        <Star size={10} className="inline mr-1" fill="currentColor" />{reward.cost}
      </button>
    </div>
  );
};

export default StudentDashboard;
