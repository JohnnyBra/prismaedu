import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import TaskCard from '../components/TaskCard';
import { Role, Task } from '../types';
import { AVATAR_ITEMS } from '../constants';
import { ShoppingBag, Star, LogOut, Shirt, CheckCircle, Settings, X, MessageSquare, Send, History, Clock } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { users, currentUser, tasks, completions, completeTask, logout, buyAvatarItem, redeemReward, rewards, updatePin, messages, sendMessage, redemptions } = useData();
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'chat'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'SCHOOL' | 'HOME'>('ALL');
  
  // Shop Sub-views
  const [shopView, setShopView] = useState<'CATALOG' | 'HISTORY'>('CATALOG');
  const [shopCategory, setShopCategory] = useState<'AVATAR' | 'SCHOOL_REWARDS' | 'HOME_REWARDS'>('AVATAR');
  
  const [priorityAck, setPriorityAck] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  
  // Messaging
  const [chatMessage, setChatMessage] = useState('');
  const tutor = users.find(u => u.role === Role.TUTOR && u.classId === currentUser?.classId);

  // Logic to find priority tasks
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

  const handlePriorityAck = () => {
    setPriorityAck(null);
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
    return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  return (
    <div className="min-h-screen bg-indigo-50 pb-20 md:pb-0 flex flex-col font-sans">
      {/* Top Bar - Child Friendly Redesign */}
      <div className="bg-white border-b-4 border-indigo-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
             {/* Logo hidden on mobile to save space, maybe */}
             <img src="/logo.png" alt="Logo" className="hidden md:block h-10 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />

            <div className="flex items-center gap-3 bg-indigo-50 p-2 pr-4 rounded-full border-2 border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setShowSettings(true)}>
               <Avatar config={currentUser?.avatarConfig} size={48} className="border-2 border-white shadow-sm" />
               <div>
                 <h1 className="font-black text-indigo-900 leading-none text-lg">{currentUser?.name?.split(' ')[0]}</h1>
                 <div className="flex items-center gap-1 text-orange-500 font-black text-sm">
                   <Star size={14} fill="currentColor" /> {currentUser?.points}
                 </div>
               </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowSettings(true)} className="bg-gray-100 text-gray-400 hover:text-indigo-600 p-3 rounded-2xl hover:bg-indigo-50 transition-colors">
               <Settings size={24} />
             </button>
             <button onClick={logout} className="bg-red-50 text-red-300 hover:text-red-500 p-3 rounded-2xl hover:bg-red-100 transition-colors">
               <LogOut size={24} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto flex-1 w-full">
        
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
                      className="w-full text-center text-2xl tracking-widest border-2 border-indigo-100 rounded-xl py-3 focus:border-indigo-500 outline-none transition-colors"
                      placeholder="0000"
                   />
                   <p className="text-xs text-gray-400 mt-2">Introduce 4 números nuevos</p>
                </div>

                <button 
                  onClick={handleUpdatePin}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Guardar Nuevo PIN
                </button>
             </div>
          </div>
        )}

        {/* Priority Modal Overlay */}
        {priorityAck && pendingPriorityTask && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Star size={40} className="text-red-500" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">¡Nueva Tarea Prioritaria!</h2>
                <p className="text-gray-500 mb-6">Tu profe ha mandado una tarea importante.</p>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-left">
                  <h3 className="font-bold text-blue-900 text-lg">{pendingPriorityTask.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                     <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded">COLEGIO</span>
                     <span className="font-bold text-yellow-600">+{pendingPriorityTask.points} pts</span>
                  </div>
                </div>

                <button 
                  onClick={handlePriorityAck}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform"
                >
                  ¡A ello!
                </button>
             </div>
           </div>
        )}

        {/* Big Juicy Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center justify-center p-4 rounded-3xl border-b-4 transition-all duration-200 active:scale-95 ${activeTab === 'tasks' ? 'bg-blue-500 border-blue-700 text-white shadow-lg shadow-blue-200 translate-y-0' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
          >
            <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'tasks' ? 'bg-white/20' : 'bg-gray-100'}`}>
              <CheckCircle size={28} />
            </div>
            <span className="font-black text-sm uppercase tracking-wide">Tareas</span>
          </button>

          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center justify-center p-4 rounded-3xl border-b-4 transition-all duration-200 active:scale-95 ${activeTab === 'shop' ? 'bg-orange-500 border-orange-700 text-white shadow-lg shadow-orange-200 translate-y-0' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
          >
            <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'shop' ? 'bg-white/20' : 'bg-gray-100'}`}>
              <ShoppingBag size={28} />
            </div>
            <span className="font-black text-sm uppercase tracking-wide">Tienda</span>
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center p-4 rounded-3xl border-b-4 transition-all duration-200 active:scale-95 ${activeTab === 'chat' ? 'bg-indigo-500 border-indigo-700 text-white shadow-lg shadow-indigo-200 translate-y-0' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
          >
            <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'chat' ? 'bg-white/20' : 'bg-gray-100'}`}>
              <MessageSquare size={28} />
            </div>
            <span className="font-black text-sm uppercase tracking-wide">Profe</span>
          </button>
        </div>

        {/* TASKS VIEW */}
        {activeTab === 'tasks' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setTaskFilter('ALL')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border ${taskFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>Todas</button>
              <button onClick={() => setTaskFilter('SCHOOL')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border ${taskFilter === 'SCHOOL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>Colegio</button>
              <button onClick={() => setTaskFilter('HOME')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border ${taskFilter === 'HOME' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>Casa</button>
            </div>

            <div className="space-y-4">
              {filteredTasks.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <CheckCircle size={48} className="mx-auto mb-2"/>
                  <p>¡No hay tareas!</p>
                </div>
              )}
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  completed={getIsCompleted(task.id)}
                  onComplete={() => completeTask(task.id, currentUser!.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* SHOP VIEW */}
        {activeTab === 'shop' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             
             {/* Shop Mode Toggle */}
             <div className="flex bg-gray-200 rounded-lg p-1 mb-6">
                <button 
                  onClick={() => setShopView('CATALOG')} 
                  className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${shopView === 'CATALOG' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                  Catálogo
                </button>
                <button 
                  onClick={() => setShopView('HISTORY')} 
                  className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${shopView === 'HISTORY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                  <History size={14} /> Historial Canjes
                </button>
             </div>

             {shopView === 'CATALOG' && (
               <>
                 <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
                   <button onClick={() => setShopCategory('AVATAR')} className={`flex-1 pb-2 text-sm font-bold border-b-2 ${shopCategory === 'AVATAR' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Avatar</button>
                   <button onClick={() => setShopCategory('SCHOOL_REWARDS')} className={`flex-1 pb-2 text-sm font-bold border-b-2 ${shopCategory === 'SCHOOL_REWARDS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Colegio</button>
                   <button onClick={() => setShopCategory('HOME_REWARDS')} className={`flex-1 pb-2 text-sm font-bold border-b-2 ${shopCategory === 'HOME_REWARDS' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400'}`}>Casa</button>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {shopCategory === 'AVATAR' && avatarItems.map(item => {
                      const owned = currentUser?.inventory?.includes(item.id);
                      return (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center shadow-sm">
                          <div className="w-20 h-20 relative mb-3">
                              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                                <g dangerouslySetInnerHTML={{ __html: item.svg }} />
                              </svg>
                          </div>
                          <h3 className="font-bold text-sm text-gray-700">{item.name}</h3>
                          <div className="mt-2 w-full">
                            {owned ? (
                              <button 
                                  className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold cursor-default"
                                  disabled
                              >
                                Tuyo
                              </button>
                            ) : (
                                <button 
                                  onClick={() => buyAvatarItem(item.id)}
                                  disabled={currentUser!.points < item.cost}
                                  className="w-full py-2 bg-indigo-600 disabled:bg-gray-300 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                                >
                                  Comprar {item.cost}
                                </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {shopCategory === 'SCHOOL_REWARDS' && schoolRewards.map(reward => (
                      <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} />
                    ))}

                    {shopCategory === 'HOME_REWARDS' && homeRewards.map(reward => (
                      <RewardCard key={reward.id} reward={reward} onRedeem={() => redeemReward(reward.id, currentUser!.id)} userPoints={currentUser!.points} />
                    ))}
                 </div>
               </>
             )}

             {shopView === 'HISTORY' && (
               <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  {myRedemptions.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <ShoppingBag size={48} className="mx-auto mb-2 text-gray-300"/>
                      <p className="text-gray-400">Aún no has canjeado premios.</p>
                    </div>
                  )}
                  {myRedemptions.map(redemption => (
                    <div key={redemption.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                       <div>
                          <h4 className="font-bold text-gray-800 text-sm">{redemption.rewardTitle}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${redemption.context === 'SCHOOL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                               {redemption.context === 'SCHOOL' ? 'Colegio' : 'Casa'}
                             </span>
                             <span className="text-xs text-gray-400 flex items-center gap-1">
                               <Clock size={12}/> {formatDate(redemption.timestamp)}
                             </span>
                          </div>
                       </div>
                       <div className="font-bold text-red-500 text-sm whitespace-nowrap">
                         -{redemption.cost} pts
                       </div>
                    </div>
                  ))}
               </div>
             )}

          </div>
        )}

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 h-[60vh] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 bg-indigo-600 text-white font-bold">
               Chat con {tutor?.name || 'Tutor'}
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
               {conversation.map(msg => {
                 const isMe = msg.fromId === currentUser?.id;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                   </div>
                 )
               })}
               {conversation.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">¡Saluda a tu profe!</p>}
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
        )}

      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-400 text-xs">
         <p className="font-semibold text-gray-500">Cooperativa de Enseñanza La Hispanidad</p>
         <p className="mt-1">Creado por Javi Barrero</p>
      </footer>
    </div>
  );
};

// Helper Sub-component for Rewards
const RewardCard: React.FC<{ reward: any, onRedeem: () => void, userPoints: number }> = ({ reward, onRedeem, userPoints }) => {
  const canAfford = userPoints >= reward.cost;
  const inStock = reward.stock === undefined || reward.stock > 0;
  
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="text-center mb-3">
        <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${reward.context === 'SCHOOL' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
          <ShoppingBag size={20} />
        </div>
        <h3 className="font-bold text-sm text-gray-800 leading-tight">{reward.title}</h3>
        {reward.stock !== undefined && <p className="text-xs text-gray-400 mt-1">Quedan {reward.stock}</p>}
      </div>
      <button 
        onClick={onRedeem}
        disabled={!canAfford || !inStock}
        className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${canAfford && inStock ? 'bg-gray-800 text-white hover:bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Canjear {reward.cost}
      </button>
    </div>
  )
}

export default StudentDashboard;