import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { Plus, Minus, LogOut, Home, Star, Settings, X, MessageSquare, Send, Gift, ListChecks, Trash2, CheckCircle, School, BookOpen, Mailbox } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Role } from '../types';

const ParentDashboard: React.FC = () => {
  const { users, currentUser, logout, assignPoints, createTask, updatePin, messages, sendMessage, rewards, createReward, deleteReward, tasks, completions, markMessagesRead } = useData();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REWARDS' | 'BUZON'>('DASHBOARD');
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const myKids = users.filter(u => u.role === Role.STUDENT && u.familyId === currentUser?.familyId);
  const myRewards = rewards.filter(r =>
    r.context === 'HOME' &&
    (r.familyId === currentUser?.familyId || !r.familyId)
  );
  const classId = myKids[0]?.classId;
  const tutor = users.find(u => u.role === Role.TUTOR && u.classId === classId);
  const unreadMessages = tutor && currentUser ? messages.filter(m => m.fromId === tutor.id && m.toId === currentUser.id && !m.read && m.type !== 'BUZON').length : 0;

  const unreadBuzonCount = currentUser ? messages.filter(m => m.type === 'BUZON' && m.context === 'HOME' && m.toId === currentUser.id && !m.read).length : 0;

  const handleCreateChore = () => {
    if (!taskTitle) return;
    createTask({
      title: taskTitle,
      points: Number(taskPoints),
      icon: 'Home',
      context: 'HOME',
      assignedTo: myKids.map(k => k.id),
      createdBy: currentUser!.id,
    });
    setTaskTitle('');
    setTaskPoints(10);
    setShowTaskModal(false);
  };

  const handleCreateReward = () => {
    if (!rewardTitle) return;
    createReward({
      title: rewardTitle,
      cost: Number(rewardCost),
      icon: 'Gift',
      context: 'HOME',
      familyId: currentUser?.familyId
    });
    setRewardTitle('');
    setRewardCost(50);
    setShowRewardModal(false);
  };

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

  const tabs = [
    { id: 'DASHBOARD' as const, icon: ListChecks, label: 'Dashboard' },
    { id: 'REWARDS' as const, icon: Gift, label: 'Premios' },
    { id: 'BUZON' as const, icon: Mailbox, label: 'Buzón Rojo' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] mesh-parent flex flex-col font-body relative">

      {/* Top Bar */}
      <header className="glass-medium sticky top-0 z-40 px-4 py-3" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-500/20 flex items-center justify-center text-secondary-400">
              <Home size={20} />
            </div>
            <div>
              <h1 className="font-display font-bold text-white/90 text-base leading-none">Panel Familiar</h1>
              <p className="text-xs text-white/40 mt-0.5">{currentUser?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowChat(true);
                if (tutor && currentUser) markMessagesRead(tutor.id, currentUser.id);
              }}
              className="glass rounded-xl p-2.5 text-white/40 hover:text-white/80 transition-colors relative"
            >
              <MessageSquare size={18} />
              {unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {unreadMessages}
                </div>
              )}
            </button>
            {activeTab === 'DASHBOARD' && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-gradient-to-r from-secondary-600 to-secondary-500 text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/40 transition-all active:scale-95"
              >
                <Plus size={14} /> Tarea
              </button>
            )}
            {activeTab === 'REWARDS' && (
              <button
                onClick={() => setShowRewardModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
              >
                <Plus size={14} /> Premio
              </button>
            )}
            <ThemeToggle className="glass rounded-xl text-white/40 hover:text-white/80" />
            <button onClick={() => setShowSettings(true)} className="glass rounded-xl p-2.5 text-white/40 hover:text-white/80 transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={logout} className="glass rounded-xl p-2.5 text-red-400/60 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs - Desktop inline, Mobile bottom nav */}
      <div className="hidden md:flex glass sticky top-[60px] z-30 justify-center gap-6 px-6 py-0">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 font-display font-bold text-sm flex items-center gap-2 transition-all duration-200 ${active
                ? tab.id === 'DASHBOARD' ? 'border-secondary-500 text-secondary-400' : tab.id === 'BUZON' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-white/30 hover:text-white/50'
                }`}
            >
              <Icon size={16} /> {tab.label}
              {tab.id === 'BUZON' && unreadBuzonCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -ml-1">{unreadBuzonCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <main className="flex-1 p-4 md:p-6 relative z-10 pb-24 md:pb-6">

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
              </div>
              <button onClick={handleUpdatePin} className="w-full bg-gradient-to-r from-secondary-600 to-secondary-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-secondary-500/25 transition-all active:scale-[0.98]">
                Guardar Nuevo PIN
              </button>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl w-full max-w-md shadow-glass-lg flex flex-col h-[500px] overflow-hidden modal-content">
              <div className="px-4 py-3 glass-medium flex justify-between items-center">
                <div className="font-display font-bold text-white/90 text-sm flex items-center gap-2">
                  <MessageSquare size={16} className="text-accent-400" />
                  Chat con {tutor?.name || 'Tutor'}
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/30 hover:text-white/70 transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-hide">
                {conversation.map(msg => {
                  const isMe = msg.fromId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${isMe
                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-br-md'
                        : 'glass-light text-white/80 rounded-bl-md'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {conversation.length === 0 && <p className="text-center text-white/20 text-sm mt-10">Inicia una conversacion con el tutor.</p>}
              </div>
              <div className="p-3 glass-medium flex gap-2">
                <input
                  className="input-glass flex-1 rounded-full text-sm py-2"
                  placeholder="Mensaje..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-2.5 rounded-full shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto w-full animate-slide-up">
            {myKids.map((kid, kidIndex) => (
              <div
                key={kid.id}
                className="glass rounded-2xl overflow-hidden flex flex-col glow-border-orange"
                style={{ animation: `slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${kidIndex * 0.1}s both` }}
              >
                <div className="p-5 flex items-center gap-4">
                  <Avatar config={kid.avatarConfig} size={56} showRing glowColor="rgba(249,115,22,0.3)" />
                  <div>
                    <h3 className="font-display font-bold text-white/90">{kid.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} fill="currentColor" className="text-amber-400" />
                      <span className="font-display font-bold text-amber-400 text-sm">{kid.points}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 flex-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase mb-3 tracking-wider">Acciones Rapidas</h4>
                  <div className="flex gap-2 mb-5">
                    <button
                      onClick={() => assignPoints(kid.id, -5)}
                      className="flex-1 py-2.5 rounded-xl glass text-red-400 font-bold text-xs hover:bg-red-500/10 transition-all active:scale-95"
                    >
                      <Minus size={14} className="inline mr-1" /> Mal
                    </button>
                    <button
                      onClick={() => assignPoints(kid.id, 5)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
                    >
                      <Plus size={14} className="inline mr-1" /> Bien
                    </button>
                  </div>

                  <h4 className="text-[10px] font-bold text-white/30 uppercase mb-3 tracking-wider flex items-center gap-1.5">
                    <ListChecks size={12} /> Tareas Pendientes
                  </h4>
                  <div className="space-y-2">
                    {tasks
                      .filter(t => (t.assignedTo.length === 0 || t.assignedTo.includes(kid.id)))
                      .filter(t => !completions.some(c => c.taskId === t.id && c.userId === kid.id))
                      .map(task => {
                        let iconEl = <School size={14} className="text-primary-400" />;
                        let label = 'Clase';
                        let accentClass = 'bg-primary-500/10 border-primary-500/15';

                        if (task.context === 'SCHOOL' && task.workType === 'HOMEWORK') {
                          iconEl = <BookOpen size={14} className="text-accent-400" />;
                          label = 'Deberes';
                          accentClass = 'bg-accent-500/10 border-accent-500/15';
                        } else if (task.context === 'HOME') {
                          iconEl = <Home size={14} className="text-secondary-400" />;
                          label = 'Casa';
                          accentClass = 'bg-secondary-500/10 border-secondary-500/15';
                        }

                        return (
                          <div key={task.id} className={`p-2.5 rounded-xl border ${accentClass} flex items-center justify-between`}>
                            <div className="flex items-center gap-2.5">
                              <div className="glass p-1.5 rounded-lg">{iconEl}</div>
                              <div>
                                <h5 className="font-semibold text-white/80 text-xs">{task.title}</h5>
                                <span className="text-[9px] font-bold text-white/25 uppercase">{label}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-display font-bold text-amber-400">+{task.points}</span>
                          </div>
                        );
                      })
                    }
                    {tasks
                      .filter(t => (t.assignedTo.length === 0 || t.assignedTo.includes(kid.id)))
                      .filter(t => !completions.some(c => c.taskId === t.id && c.userId === kid.id))
                      .length === 0 && (
                        <p className="text-center text-white/20 text-xs py-4">Todo al dia!</p>
                      )
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REWARDS TAB */}
        {activeTab === 'REWARDS' && (
          <div className="max-w-5xl mx-auto w-full animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myRewards.length === 0 && (
                <div className="col-span-3 text-center py-16 glass rounded-2xl">
                  <Gift size={40} className="mx-auto mb-3 text-white/15" />
                  <p className="text-white/30 text-sm">No has creado premios para casa.</p>
                  <button onClick={() => setShowRewardModal(true)} className="mt-3 text-secondary-400 font-bold text-sm hover:text-secondary-300 transition-colors">
                    Crear el primero
                  </button>
                </div>
              )}
              {myRewards.map((reward, i) => (
                <div
                  key={reward.id}
                  className="group glass rounded-2xl p-4 flex items-center justify-between glow-border-green"
                  style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Gift size={18} />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-white/80 text-sm">{reward.title}</h4>
                      <span className="text-xs text-white/30 font-bold">{reward.cost} pts</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="text-white/15 hover:text-red-400 p-2 transition-colors"
                    title="Borrar Premio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUZON TAB */}
        {activeTab === 'BUZON' && (
          <div className="max-w-5xl mx-auto w-full animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <Mailbox size={20} />
              </div>
              <h2 className="font-display text-lg font-bold text-white/90">Buzón Rojo</h2>
            </div>

            <div className="space-y-3">
              {(() => {
                const buzonMsgs = messages.filter(m => m.type === 'BUZON' && m.context === 'HOME' && m.toId === currentUser?.id).sort((a, b) => b.timestamp - a.timestamp);

                if (buzonMsgs.length === 0) {
                  return (
                    <div className="text-center py-16 glass rounded-2xl">
                      <Mailbox size={40} className="mx-auto mb-3 text-white/15" />
                      <p className="text-white/30 text-sm">No hay mensajes en el buzón rojo de casa.</p>
                    </div>
                  );
                }

                return buzonMsgs.map(msg => {
                  const student = users.find(u => u.id === msg.fromId);
                  const senderName = msg.isAnonymous ? 'Anónimo' : student?.name || 'Desconocido';

                  return (
                    <div key={msg.id} className={`glass rounded-2xl p-4 flex flex-col glow-border-red ${!msg.read ? 'bg-red-500/10' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white/90 text-sm flex items-center gap-2">
                          {senderName}
                          {!msg.read && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">Nuevo</span>}
                        </span>
                        <span className="text-[10px] text-white/40">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-white/80 text-sm italic mb-4">"{msg.content}"</p>

                      {!msg.read && (
                        <button
                          onClick={() => markMessagesRead(msg.fromId, currentUser!.id)}
                          className="self-end bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                          <CheckCircle size={14} /> Marcar como visto
                        </button>
                      )}
                      {msg.read && (
                        <div className="self-end text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Visto
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-medium px-2 pt-2" style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}>
        <div className="flex justify-around">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1.5 px-6 rounded-xl transition-all duration-200 relative ${active ? 'text-white' : 'text-white/30'
                  }`}
              >
                {tab.id === 'BUZON' && unreadBuzonCount > 0 && (
                  <div className="absolute top-0 right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadBuzonCount}
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

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl shadow-glass-lg w-full max-w-sm overflow-hidden modal-content">
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-white/90 mb-4">Asignar Tarea de Casa</h3>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="input-glass w-full mb-3"
                placeholder="ej. Poner el lavavajillas"
              />
              <input
                type="number"
                value={taskPoints}
                onChange={(e) => setTaskPoints(Number(e.target.value))}
                className="input-glass w-full mb-6"
                placeholder="Puntos"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowTaskModal(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={handleCreateChore} className="flex-1 py-2.5 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white rounded-xl font-bold shadow-lg shadow-secondary-500/25 transition-all active:scale-[0.98]">Asignar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reward Creation Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl shadow-glass-lg w-full max-w-sm overflow-hidden modal-content">
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-white/90 mb-4">Crear Premio de Casa</h3>
              <input
                type="text"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="input-glass w-full mb-3"
                placeholder="ej. Ver una peli"
              />
              <div className="mb-6">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Coste (Pts)</label>
                <input
                  type="number"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(Number(e.target.value))}
                  className="input-glass w-full mt-1"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRewardModal(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={handleCreateReward} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]">Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
