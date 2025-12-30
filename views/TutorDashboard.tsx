import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { Plus, Minus, Send, Users, LogOut, CheckSquare, Settings, X, MessageSquare, Gift, School, Trash2, CheckCircle, Circle, ArrowRight, ExternalLink, BookOpen, Monitor, Map, LayoutDashboard, ListChecks, ChevronRight, ChevronDown } from 'lucide-react';
import { Role, User, Task } from '../types';

type Tab = 'CLASSROOM' | 'REWARDS' | 'MESSAGES';

const TutorDashboard: React.FC = () => {
  const { users, currentUser, logout, assignPoints, createTask, updatePin, tasks, completions, toggleTaskCompletion, rewards, createReward, deleteReward, messages, sendMessage, classes } = useData();
  
  // New State: Teacher Hub View
  const [showHub, setShowHub] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('CLASSROOM');

  const currentClass = classes.find(c => c.id === currentUser?.classId);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null); // For detail view
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null); // For task detail view

  // Form States
  const [newPin, setNewPin] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);
  const [isPriority, setIsPriority] = useState(false);
  const [workType, setWorkType] = useState<'CLASSWORK' | 'HOMEWORK'>('CLASSWORK');
  
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const [rewardStock, setRewardStock] = useState(10);

  // Messaging State
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const { markMessagesRead } = useData();

  const students = users
      .filter(u => u.role === Role.STUDENT && u.classId === currentUser?.classId)
      .sort((a, b) => {
         const nameA = a.lastName || a.name;
         const nameB = b.lastName || b.name;
         return nameA.localeCompare(nameB);
      });
  const parents = users.filter(u => u.role === Role.PARENT && u.familyId && students.some(s => s.familyId === u.familyId)); // Only parents of my students

  // --- HELPERS ---

  const handleBroadcastTask = () => {
    if (!taskTitle) return;
    createTask({
      title: taskTitle,
      points: Number(taskPoints),
      icon: 'Book',
      context: 'SCHOOL',
      assignedTo: students.map(s => s.id),
      createdBy: currentUser!.id,
      isPriority: isPriority,
      workType: workType,
    });
    setTaskTitle('');
    setTaskPoints(10);
    setIsPriority(false);
    setWorkType('CLASSWORK');
    setShowTaskModal(false);
    alert('¡Tarea enviada a ' + students.length + ' alumnos!');
  };

  const handleCreateReward = () => {
    if (!rewardTitle) return;
    createReward({
      title: rewardTitle,
      cost: Number(rewardCost),
      stock: Number(rewardStock),
      icon: 'Star',
      context: 'SCHOOL'
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
    if (chatUser && chatMessage) {
      sendMessage(chatUser.id, chatMessage);
      setChatMessage('');
    }
  };

  const handleAssignPointsWithNotification = (student: User, amount: number) => {
    assignPoints(student.id, amount);

    // Notify parents
    const studentParents = parents.filter(p => p.familyId === student.familyId);
    const action = amount > 0 ? 'asignado' : 'retirado';
    const emoji = amount > 0 ? '🌟' : '⚠️';
    const msg = `${emoji} Hola. Se le han ${action} ${Math.abs(amount)} puntos a su hijo/a ${student.name} en clase.`;

    studentParents.forEach(p => {
        sendMessage(p.id, msg);
    });
  };

  const getConversation = (userId: string) => {
    return messages.filter(m => 
      (m.fromId === currentUser?.id && m.toId === userId) || 
      (m.fromId === userId && m.toId === currentUser?.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getUnreadCount = (userId: string) => {
    if (!currentUser) return 0;
    return messages.filter(m => m.fromId === userId && m.toId === currentUser.id && !m.read).length;
  };

  const getTotalUnreadCount = () => {
    if (!currentUser) return 0;
    return messages.filter(m => m.toId === currentUser.id && !m.read).length;
  };

  // --- RENDERERS ---

  // Hub Renderer
  const renderHub = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background Circles */}
       <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
       <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

       <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-8 duration-300 z-10 flex flex-col items-center">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">Hola, {currentUser?.name}</h2>
            <p className="text-indigo-100 text-lg">Portal del Profesorado - La Hispanidad</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 w-full">
            {/* External Tools */}
            <a href="https://bibliohispa.es/"
            className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all group flex items-center gap-4 border-l-4 border-emerald-500">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen size={28} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">Biblioteca</h3>
                <p className="text-sm text-gray-500">Gestión de préstamos y catálogo.</p>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
            </a>

            <a href="https://aulas.bibliohispa.es/"
            className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all group flex items-center gap-4 border-l-4 border-purple-500">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Monitor size={28} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">Reservas Aulas</h3>
                <p className="text-sm text-gray-500">Gestión de aulas digitales.</p>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
            </a>

            <a href="https://excursiones.bibliohispa.es/"
            className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all group flex items-center gap-4 border-l-4 border-orange-500">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Map size={28} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">Excursiones</h3>
                <p className="text-sm text-gray-500">Planificación y gestión de salidas.</p>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
            </a>

            {/* Internal App */}
            <button 
            onClick={() => setShowHub(false)}
            className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all group flex items-center gap-4 border-l-4 border-blue-600"
            >
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <School size={28} />
            </div>
            <div className="text-left flex-1">
                <h3 className="font-bold text-gray-800 text-lg">Prisma Aula</h3>
                <p className="text-sm text-gray-500">Gestión gamificada del aula.</p>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
            </button>
        </div>

        <button onClick={logout} className="mt-8 text-white/60 hover:text-white flex items-center gap-2 text-sm font-bold bg-black/20 px-4 py-2 rounded-full">
            <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );

  // If in Hub Mode, render that
  if (showHub) {
    return renderHub();
  }

  // --- DASHBOARD RENDERERS ---

  const renderTaskDashboard = () => {
    const schoolTasks = tasks.filter(t => t.context === 'SCHOOL');

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <LayoutDashboard size={24} />
                </div>
                Dashboard de Tareas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {schoolTasks.map(task => {
                     const assignedStudentIds = task.assignedTo.length > 0 ? task.assignedTo : students.map(s => s.id);
                     const relevantStudents = students.filter(s => assignedStudentIds.includes(s.id));
                     const completedCount = completions.filter(c => c.taskId === task.id && relevantStudents.some(s => s.id === c.userId)).length;
                     const total = relevantStudents.length;
                     const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                     return (
                         <button
                            key={task.id}
                            onClick={() => setSelectedTaskDetails(task)}
                            className="bg-white text-left p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                         >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                        <ListChecks size={22}/>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${percentage === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {percentage}%
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate pr-2">{task.title}</h3>
                                <p className="text-gray-400 text-xs font-medium mb-4">{completedCount} de {total} completados</p>

                                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-out ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex items-center text-blue-500 text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    Ver alumnos <ChevronRight size={14} />
                                </div>
                            </div>
                         </button>
                     );
                })}

                <button 
                    onClick={() => setShowTaskModal(true)}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 text-gray-400 hover:text-blue-500 transition-all group h-full min-h-[160px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-sm">Crear Nueva Tarea</span>
                </button>
            </div>
        </div>
    );
  };

  const renderClassroom = () => (
    <div className="animate-in fade-in duration-300">

      {/* 1. Task Dashboard Section */}
      {renderTaskDashboard()}

      {/* 2. Students Grid Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Users size={24} />
            </div>
            Gestión de Alumnos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
            {students.map(student => (
                <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group relative"
                >
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors"></div>

                <div className="p-5 flex flex-col items-center relative z-10">
                    <div className="transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                        <Avatar config={student.avatarConfig} size={90} />
                    </div>

                    <div className="mt-4 text-center w-full">
                        <h3 className="font-bold text-gray-800 text-lg truncate w-full">{student.name}</h3>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold shadow-sm">
                            <span>{student.points}</span>
                            <span className="text-yellow-600 text-xs uppercase tracking-wider">PTS</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-gray-50 bg-gray-50/50 flex gap-3" onClick={e => e.stopPropagation()}>
                    <button
                    onClick={() => handleAssignPointsWithNotification(student, -10)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 rounded-xl py-2.5 flex justify-center items-center transition-all shadow-sm hover:shadow active:scale-95"
                    title="Restar Puntos"
                    >
                    <Minus size={18} />
                    </button>
                    <button
                    onClick={() => handleAssignPointsWithNotification(student, 10)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border border-transparent rounded-xl py-2.5 flex justify-center items-center transition-all shadow-md hover:shadow-lg active:scale-95"
                    title="Sumar Puntos"
                    >
                    <Plus size={18} />
                    </button>
                </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderRewards = () => {
    const schoolRewards = rewards.filter(r => r.context === 'SCHOOL');
    return (
      <div className="animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Premios del Colegio</h2>
            <button onClick={() => setShowRewardModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
              <Plus size={18} /> Crear Premio
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {schoolRewards.length === 0 && <p className="text-gray-400 col-span-4 text-center py-10">No has creado premios todavía.</p>}
            {schoolRewards.map(reward => (
              <div key={reward.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                      <Gift size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{reward.title}</h4>
                      <span className="text-xs text-gray-500 font-bold">{reward.cost} pts | Stock: {reward.stock}</span>
                    </div>
                 </div>
                 <button onClick={() => deleteReward(reward.id)} className="text-gray-400 hover:text-red-500 p-2">
                   <Trash2 size={18} />
                 </button>
              </div>
            ))}
         </div>
      </div>
    );
  };

  const renderMessages = () => {
    // Group users by Family
    const families: Record<string, { name: string; members: User[] }> = {};
    const noFamilyUsers: User[] = [];

    // 1. Initialize families based on students
    students.forEach(s => {
      if (s.familyId) {
        if (!families[s.familyId]) {
          families[s.familyId] = {
            name: `Familia ${s.name.split(' ')[0]}`, // Approximate family name
            members: []
          };
        }
        families[s.familyId].members.push(s);
      } else {
        noFamilyUsers.push(s);
      }
    });

    // 2. Add parents to families
    parents.forEach(p => {
      if (p.familyId && families[p.familyId]) {
        families[p.familyId].members.push(p);
      } else {
        // Parents without linked student in this class or no familyId
        // We can just add them to noFamilyUsers or ignore?
        // Let's add them to "Otros"
        noFamilyUsers.push(p);
      }
    });

    // 3. Sort members: Parents first, then Students
    Object.values(families).forEach(fam => {
      fam.members.sort((a, b) => {
        if (a.role === Role.PARENT && b.role !== Role.PARENT) return -1;
        if (a.role !== Role.PARENT && b.role === Role.PARENT) return 1;
        return 0;
      });
    });

    const toggleFamily = (fid: string) => {
        setExpandedFamilies(prev => ({...prev, [fid]: !prev[fid]}));
    };

    return (
      <div className="animate-in fade-in duration-300 flex h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-700">Familias</div>
          <div className="flex-1 overflow-y-auto p-2">
             {Object.keys(families).length === 0 && noFamilyUsers.length === 0 && (
                <p className="text-gray-400 text-sm text-center mt-4">No hay contactos.</p>
             )}

             {Object.entries(families).map(([fid, data]) => {
                const isExpanded = expandedFamilies[fid];
                const familyUnreadCount = data.members.reduce((acc, member) => acc + getUnreadCount(member.id), 0);

                return (
                  <div key={fid} className="mb-2 border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFamily(fid)}
                      className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-sm text-gray-700">{data.name}</span>
                         {familyUnreadCount > 0 && !isExpanded && (
                           <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{familyUnreadCount}</span>
                         )}
                       </div>
                       {isExpanded ? <ChevronDown size={16} className="text-gray-500"/> : <ChevronRight size={16} className="text-gray-500"/>}
                    </button>

                    {isExpanded && (
                       <div className="bg-white p-1">
                          {data.members.map(u => {
                             const unreadCount = getUnreadCount(u.id);
                             return (
                             <button
                                key={u.id}
                                onClick={() => {
                                    setChatUser(u);
                                    if (currentUser) markMessagesRead(u.id, currentUser.id);
                                }}
                                className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${chatUser?.id === u.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50'}`}
                             >
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                                   {u.role === Role.STUDENT ? <Avatar config={u.avatarConfig} size={32}/> : <Users size={16}/>}
                                   {unreadCount > 0 && (
                                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                       {unreadCount}
                                     </span>
                                   )}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="text-sm font-medium truncate">{u.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{u.role === Role.PARENT ? 'Padre/Madre' : 'Alumno'}</div>
                                </div>
                             </button>
                          )})}
                       </div>
                    )}
                  </div>
                );
             })}

             {noFamilyUsers.length > 0 && (
               <div className="mt-4">
                  <h5 className="px-2 text-xs font-bold text-gray-400 uppercase mb-2">Otros</h5>
                  {noFamilyUsers.map(u => {
                     const unreadCount = getUnreadCount(u.id);
                     return (
                     <button
                        key={u.id}
                        onClick={() => {
                            setChatUser(u);
                            if (currentUser) markMessagesRead(u.id, currentUser.id);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${chatUser?.id === u.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0 relative">
                           {u.role === Role.STUDENT ? <Avatar config={u.avatarConfig} size={32}/> : <Users size={16}/>}
                           {unreadCount > 0 && (
                             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                               {unreadCount}
                             </span>
                           )}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <div className="text-sm font-medium truncate">{u.name}</div>
                        </div>
                      </button>
                  )})}
               </div>
             )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {chatUser ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-white font-bold text-gray-800 flex items-center gap-2">
                 <span>Chat con {chatUser.name}</span>
                 <span className="text-xs font-normal text-gray-400">({chatUser.role === Role.PARENT ? 'Padre/Madre' : 'Alumno'})</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {getConversation(chatUser.id).map(msg => {
                  const isMe = msg.fromId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                         {msg.content}
                       </div>
                    </div>
                  )
                })}
                {getConversation(chatUser.id).length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No hay mensajes. ¡Saluda!</p>}
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                 <input 
                   value={chatMessage}
                   onChange={e => setChatMessage(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Escribe un mensaje..."
                   className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
                 />
                 <button onClick={handleSendMessage} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                   <Send size={20} />
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <MessageSquare size={48} className="mb-2" />
               <p>Selecciona un contacto para chatear</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col relative">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img src="/watermark.png" className="opacity-5 w-[60%] max-w-[500px] object-contain" />
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Panel {currentClass?.name || 'del Profesor'}</h1>
              <p className="text-sm text-gray-500">Bienvenido/a, {currentUser?.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHub(true)}
            className="text-gray-500 hover:text-blue-600 p-2 font-bold text-xs flex flex-col items-center"
            title="Volver al Portal"
          >
            <School size={20} />
            <span>Portal</span>
          </button>
          <div className="w-px h-8 bg-gray-200 mx-1"></div>
          <button 
            onClick={() => setShowTaskModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Send size={18} /> Nueva Tarea
          </button>
          <button onClick={() => setShowSettings(true)} className="text-gray-500 hover:text-blue-600 p-2">
            <Settings size={24} />
          </button>
          <button onClick={logout} className="text-gray-500 hover:text-red-500 p-2">
            <LogOut size={24} />
          </button>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="bg-white shadow-sm px-6 border-b border-gray-200 sticky top-[72px] z-40">
        <div className="flex gap-6">
           <button onClick={() => setActiveTab('CLASSROOM')} className={`py-4 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'CLASSROOM' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
              <Users size={18} /> Alumnos
           </button>
           <button onClick={() => setActiveTab('REWARDS')} className={`py-4 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'REWARDS' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400'}`}>
              <Gift size={18} /> Premios
           </button>
           <button onClick={() => setActiveTab('MESSAGES')} className={`py-4 border-b-2 font-bold text-sm flex items-center gap-2 relative ${activeTab === 'MESSAGES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
              <MessageSquare size={18} /> Mensajería
              {getTotalUnreadCount() > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -ml-1">{getTotalUnreadCount()}</span>
              )}
           </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 p-6 overflow-auto max-w-7xl mx-auto w-full relative z-10">
        
        {activeTab === 'CLASSROOM' && renderClassroom()}
        {activeTab === 'REWARDS' && renderRewards()}
        {activeTab === 'MESSAGES' && renderMessages()}

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
                      className="w-full text-center text-2xl tracking-widest border-2 border-blue-100 rounded-xl py-3 focus:border-blue-500 outline-none transition-colors"
                      placeholder="0000"
                   />
                   <p className="text-xs text-gray-400 mt-2">Introduce 4 números nuevos</p>
                </div>

                <button 
                  onClick={handleUpdatePin}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Guardar Nuevo PIN
                </button>
             </div>
          </div>
        )}

        {/* Selected Task Details Modal */}
        {selectedTaskDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                    <div className="p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <ListChecks size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{selectedTaskDetails.title}</h2>
                                <p className="text-indigo-200 text-sm">Detalles de Tarea</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedTaskDetails(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Completed Column */}
                            <div>
                                <h3 className="text-sm font-bold text-green-700 uppercase mb-3 flex items-center gap-2 bg-green-50 p-2 rounded-lg">
                                    <CheckCircle size={16}/> Completado
                                </h3>
                                <div className="space-y-2">
                                    {students.filter(s => {
                                         const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                                         const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                                         return assigned && done;
                                    }).map(s => (
                                        <div key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <Avatar config={s.avatarConfig} size={32} />
                                            <span className="font-medium text-gray-700 text-sm">{s.name}</span>
                                        </div>
                                    ))}
                                    {students.filter(s => {
                                         const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                                         const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                                         return assigned && done;
                                    }).length === 0 && <p className="text-gray-400 text-sm italic">Nadie ha completado aún.</p>}
                                </div>
                            </div>

                            {/* Pending Column */}
                            <div>
                                <h3 className="text-sm font-bold text-orange-700 uppercase mb-3 flex items-center gap-2 bg-orange-50 p-2 rounded-lg">
                                    <Circle size={16}/> Pendiente
                                </h3>
                                <div className="space-y-2">
                                    {students.filter(s => {
                                         const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                                         const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                                         return assigned && !done;
                                    }).map(s => (
                                        <div key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100 shadow-sm opacity-70">
                                            <Avatar config={s.avatarConfig} size={32} />
                                            <span className="font-medium text-gray-700 text-sm">{s.name}</span>
                                        </div>
                                    ))}
                                    {students.filter(s => {
                                         const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                                         const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                                         return assigned && !done;
                                    }).length === 0 && <p className="text-gray-400 text-sm italic">¡Todos han terminado!</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
               {/* Header */}
               <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/20 p-1 rounded-full">
                        <Avatar config={selectedStudent.avatarConfig} size={48} />
                     </div>
                     <div>
                       <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                       <p className="text-blue-100 text-sm">Gestión de Alumno</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white">
                    <X size={24} />
                  </button>
               </div>

               {/* Body */}
               <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><School size={20}/> Tareas Escolares Asignadas</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => t.context === 'SCHOOL' && (t.assignedTo.length === 0 || t.assignedTo.includes(selectedStudent.id))).map(task => {
                       const isCompleted = completions.some(c => c.taskId === task.id && c.userId === selectedStudent.id);
                       return (
                         <div key={task.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                            <div>
                               <h4 className={`font-bold ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>{task.title}</h4>
                               <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">+{task.points} pts</span>
                            </div>
                            <button 
                              onClick={() => toggleTaskCompletion(task.id, selectedStudent.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isCompleted ? 'bg-white text-green-600 border border-green-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'bg-gray-100 text-gray-500 hover:bg-green-600 hover:text-white'}`}
                            >
                               {isCompleted ? (
                                 <><CheckCircle size={16}/> Hecho</>
                               ) : (
                                 <><Circle size={16}/> Pendiente</>
                               )}
                            </button>
                         </div>
                       );
                    })}
                  </div>
                  
                  {/* Quick Chat Shortcut */}
                  <div className="mt-8 border-t border-gray-200 pt-6">
                     <button 
                       onClick={() => {
                         setChatUser(selectedStudent);
                         setSelectedStudent(null);
                         setActiveTab('MESSAGES');
                       }}
                       className="w-full py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition-colors flex justify-center items-center gap-2"
                     >
                       <MessageSquare size={20} /> Abrir Chat con Alumno
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center text-gray-400 text-xs">
          <p className="font-semibold text-gray-500">Cooperativa de Enseñanza La Hispanidad</p>
          <p className="mt-1">Creado por Javi Barrero</p>
        </footer>
      </main>

      {/* Broadcast Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Crear Tarea de Clase</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Tarea</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="ej. Leer Capítulo 4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntos de Recompensa</label>
                <input 
                  type="number" 
                  value={taskPoints}
                  onChange={(e) => setTaskPoints(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tarea</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWorkType('CLASSWORK')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-bold text-sm transition-all ${workType === 'CLASSWORK' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-blue-300'}`}
                  >
                    Clase
                  </button>
                  <button
                    onClick={() => setWorkType('HOMEWORK')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-bold text-sm transition-all ${workType === 'HOMEWORK' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400 hover:border-indigo-300'}`}
                  >
                    Casa (Deberes)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer" onClick={() => setIsPriority(!isPriority)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isPriority ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
                   {isPriority && <CheckSquare size={14} className="text-white" />}
                </div>
                <div>
                  <span className="font-bold text-red-700 text-sm">Modo Alta Prioridad</span>
                  <p className="text-xs text-red-500">Los alumnos verán una alerta inmediata.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleBroadcastTask}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Enviar a Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Premio Escolar</h3>
               <input 
                  type="text" 
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none mb-3"
                  placeholder="ej. Ayudante del día"
                />
                <div className="flex gap-2 mb-6">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500">Coste (Pts)</label>
                    <input 
                      type="number" 
                      value={rewardCost}
                      onChange={(e) => setRewardCost(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500">Stock</label>
                    <input 
                      type="number" 
                      value={rewardStock}
                      onChange={(e) => setRewardStock(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
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

export default TutorDashboard;