import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { Plus, Minus, LogOut, Home, Star, Settings, X, MessageSquare, Send, Gift, ListChecks, Trash2, CheckCircle, School, BookOpen } from 'lucide-react';
import { Role } from '../types';

const ParentDashboard: React.FC = () => {
  const { users, currentUser, logout, assignPoints, createTask, updatePin, messages, sendMessage, rewards, createReward, deleteReward, tasks, completions, markMessagesRead } = useData();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(50);

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REWARDS'>('DASHBOARD');

  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  
  // Messaging
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Filter only my kids
  const myKids = users.filter(u => u.role === Role.STUDENT && u.familyId === currentUser?.familyId);

  // Filter Rewards
  // Only show rewards created for this family (or by this parent, or generic home rewards without familyId if any)
  // Logic: context === 'HOME' AND (familyId matches OR familyId is missing)
  const myRewards = rewards.filter(r =>
      r.context === 'HOME' &&
      (r.familyId === currentUser?.familyId || !r.familyId)
  );
  // Find Tutor (Assuming first kid's class tutor)
  const classId = myKids[0]?.classId;
  const tutor = users.find(u => u.role === Role.TUTOR && u.classId === classId);

  // Unread messages
  const unreadMessages = tutor && currentUser ? messages.filter(m => m.fromId === tutor.id && m.toId === currentUser.id && !m.read).length : 0;

  const handleCreateChore = () => {
    if (!taskTitle) return;
    createTask({
      title: taskTitle,
      points: Number(taskPoints),
      icon: 'Home',
      context: 'HOME',
      assignedTo: myKids.map(k => k.id), // Assign to all kids for now
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
      alert('¡PIN actualizado!');
    } else {
      alert('El PIN debe tener 4 números');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-100 flex flex-col relative">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img src="/watermark.png" className="opacity-5 w-[60%] max-w-[500px] object-contain" />
      </div>

       <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <Home size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Panel Familiar</h1>
              <p className="text-sm text-gray-500">{currentUser?.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => {
               setShowChat(true);
               if (tutor && currentUser) markMessagesRead(tutor.id, currentUser.id);
             }} className="text-gray-500 hover:text-indigo-600 p-2 relative">
             <MessageSquare size={24} />
             {unreadMessages > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {unreadMessages}
                </div>
             )}
           </button>
           {activeTab === 'DASHBOARD' && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Añadir Tarea
              </button>
           )}
           {activeTab === 'REWARDS' && (
              <button
                onClick={() => setShowRewardModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Crear Premio
              </button>
           )}
          <button onClick={() => setShowSettings(true)} className="text-gray-500 hover:text-orange-500 p-2">
            <Settings size={24} />
          </button>
          <button onClick={logout} className="text-gray-500 hover:text-red-500 p-2">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm px-6 border-b border-gray-200 sticky top-[72px] z-40 mb-6 flex justify-center">
         <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`py-4 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}
            >
               <ListChecks size={20} /> Dashboard y Tareas
            </button>
            <button
              onClick={() => setActiveTab('REWARDS')}
              className={`py-4 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'REWARDS' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400'}`}
            >
               <Gift size={20} /> Premios de Casa
            </button>
         </div>
      </div>

      <main className="flex-1 p-6 flex flex-col relative z-10">
        
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20}/> Ajustes</h2>
                
                <div className="mb-4">
                   <label className="block text-sm font-bold text-gray-700 mb-2">Cambiar mi PIN</label>
                   <input 
                      type="text" 
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g,''))}
                      className="w-full text-center text-2xl tracking-widest border-2 border-orange-100 rounded-xl py-3 focus:border-orange-500 outline-none transition-colors"
                      placeholder="0000"
                   />
                   <p className="text-xs text-gray-400 mt-2">Introduce 4 números nuevos</p>
                </div>

                <button 
                  onClick={handleUpdatePin}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Guardar Nuevo PIN
                </button>
             </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden">
                <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                   <div className="font-bold">Chat con Profesor ({tutor?.name || 'No asignado'})</div>
                   <button onClick={() => setShowChat(false)}><X size={20}/></button>
                </div>
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
                   {conversation.map(msg => {
                      const isMe = msg.fromId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-500 text-white' : 'bg-white border text-gray-800'}`}>
                             {msg.content}
                           </div>
                        </div>
                      )
                   })}
                   {conversation.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Inicia una conversación con el tutor.</p>}
                </div>
                <div className="p-3 bg-white border-t flex gap-2">
                   <input 
                     className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                     placeholder="Mensaje..."
                     value={chatMessage}
                     onChange={e => setChatMessage(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   />
                   <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-full"><Send size={18}/></button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-8 animate-in fade-in duration-300">
            {myKids.map(kid => (
              <div key={kid.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-orange-100">
                <div className="p-6 flex items-center gap-4 border-b border-gray-50">
                  <Avatar config={kid.avatarConfig} size={70} />
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{kid.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded-md text-sm mt-1 w-fit">
                      <Star size={14} fill="currentColor" /> {kid.points}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50/50 flex-1">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Acciones Rápidas</h4>
                  <div className="flex gap-3 mb-6">
                      <button onClick={() => assignPoints(kid.id, -5)} className="flex-1 py-3 rounded-xl border border-red-100 bg-white text-red-500 font-bold hover:bg-red-50 transition-colors">
                        Mal Comportamiento
                      </button>
                      <button onClick={() => assignPoints(kid.id, 5)} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-green-200 shadow-lg">
                        Buen Trabajo
                      </button>
                  </div>

                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <ListChecks size={14}/> Tareas Pendientes
                  </h4>
                  <div className="space-y-2">
                    {tasks
                        .filter(t => (t.assignedTo.length === 0 || t.assignedTo.includes(kid.id)))
                        .filter(t => !completions.some(c => c.taskId === t.id && c.userId === kid.id))
                        .map(task => {
                            let icon = <School size={16} className="text-blue-500"/>;
                            let label = 'Clase';
                            let bgColor = 'bg-blue-50';
                            let borderColor = 'border-blue-100';

                            if (task.context === 'SCHOOL' && task.workType === 'HOMEWORK') {
                                icon = <BookOpen size={16} className="text-indigo-500"/>;
                                label = 'Deberes';
                                bgColor = 'bg-indigo-50';
                                borderColor = 'border-indigo-100';
                            } else if (task.context === 'HOME') {
                                icon = <Home size={16} className="text-orange-500"/>;
                                label = 'Casa';
                                bgColor = 'bg-orange-50';
                                borderColor = 'border-orange-100';
                            }

                            return (
                                <div key={task.id} className={`p-3 rounded-xl border ${borderColor} ${bgColor} flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                            {icon}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm">{task.title}</h5>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-600 bg-yellow-100/50 px-2 py-1 rounded">
                                        +{task.points}
                                    </span>
                                </div>
                            );
                        })
                    }
                    {tasks
                        .filter(t => (t.assignedTo.length === 0 || t.assignedTo.includes(kid.id)))
                        .filter(t => !completions.some(c => c.taskId === t.id && c.userId === kid.id))
                        .length === 0 && (
                            <p className="text-center text-gray-400 text-xs py-4 italic">¡Todo al día!</p>
                        )
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'REWARDS' && (
           <div className="max-w-5xl mx-auto w-full mb-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {myRewards.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                       <Gift size={48} className="mx-auto mb-2 opacity-50"/>
                       <p>No has creado premios para casa.</p>
                       <button onClick={() => setShowRewardModal(true)} className="mt-4 text-orange-500 font-bold hover:underline">Crear el primero</button>
                    </div>
                 )}
                 {myRewards.map(reward => (
                    <div key={reward.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <Gift size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{reward.title}</h4>
                            <span className="text-sm text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">{reward.cost} pts</span>
                          </div>
                       </div>
                       <button
                         onClick={() => deleteReward(reward.id)}
                         className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                         title="Borrar Premio"
                       >
                         <Trash2 size={20} />
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Footer */}
        <footer className="mt-auto py-4 text-center text-gray-400 text-xs">
          <p className="font-semibold text-gray-500">Cooperativa de Enseñanza La Hispanidad</p>
          <p className="mt-1">Creado por Javi Barrero</p>
        </footer>
      </main>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
             <div className="p-6">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Asignar Tarea de Casa</h3>
               <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none mb-3"
                  placeholder="ej. Poner el lavavajillas"
                />
                <input 
                  type="number" 
                  value={taskPoints}
                  onChange={(e) => setTaskPoints(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none mb-6"
                  placeholder="Puntos"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowTaskModal(false)} className="flex-1 py-2 text-gray-500">Cancelar</button>
                  <button onClick={handleCreateChore} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold">Asignar</button>
                </div>
             </div>
           </div>
        </div>
      )}

      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Premio de Casa</h3>
               <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none mb-3"
                  placeholder="ej. Ver una peli"
                />
                <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500">Coste (Pts)</label>
                    <input
                      type="number"
                      value={rewardCost}
                      onChange={(e) => setRewardCost(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRewardModal(false)} className="flex-1 py-2 text-gray-500 font-bold">Cancelar</button>
                  <button onClick={handleCreateReward} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Crear</button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ParentDashboard;