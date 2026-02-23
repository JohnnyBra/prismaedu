import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import { Plus, Minus, Send, Users, LogOut, CheckSquare, Settings, X, MessageSquare, Gift, School, Trash2, CheckCircle, Circle, ArrowRight, ExternalLink, BookOpen, Monitor, Map, Newspaper, LayoutDashboard, ListChecks, ChevronRight, ChevronDown } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
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

  const renderSettingsModal = () => (
    showSettings && (
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
            <p className="text-[10px] text-white/30 mt-2">Introduce 4 números nuevos</p>
          </div>

          <button
            onClick={handleUpdatePin}
            className="btn-primary w-full"
          >
            Guardar Nuevo PIN
          </button>
        </div>
      </div>
    )
  );

  // Hub Renderer
  const renderHub = () => {
    // Definimos los enlaces y sus propiedades
    const hubItems = [
      {
        type: 'link' as const,
        href: "https://bibliohispa.es/",
        title: "Biblioteca",
        desc: "Gestión de préstamos y catálogo.",
        icon: <BookOpen size={24} />,
        color: "bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30",
        border: "glow-border-green",
        pos: { x: 0, y: -230 }
      },
      {
        type: 'link' as const,
        href: "https://aulas.bibliohispa.es/",
        title: "Reservas Aulas",
        desc: "Gestión de aulas digitales.",
        icon: <Monitor size={24} />,
        color: "bg-accent-500/20 text-accent-400 group-hover:bg-accent-500/30",
        border: "glow-border-purple",
        pos: { x: 250, y: -70 }
      },
      {
        type: 'link' as const,
        href: "https://excursiones.bibliohispa.es/",
        title: "Excursiones",
        desc: "Planificación y gestión de salidas.",
        icon: <Map size={24} />,
        color: "bg-secondary-500/20 text-secondary-400 group-hover:bg-secondary-500/30",
        border: "glow-border-orange",
        pos: { x: 155, y: 190 }
      },
      {
        type: 'link' as const,
        href: "https://intranet.bibliohispa.es/",
        title: "Intranet",
        desc: "Portal del profesorado.",
        icon: <Newspaper size={24} />,
        color: "bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30",
        border: "glow-border-purple",
        pos: { x: -155, y: 190 }
      },
      {
        type: 'button' as const,
        onClick: () => setShowHub(false),
        title: "Prisma Aula",
        desc: "Gestión gamificada del aula.",
        icon: <School size={24} />,
        color: "bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30",
        border: "glow-border-blue",
        pos: { x: -250, y: -70 }
      }
    ];

    return (
      <div className="min-h-screen min-h-[100dvh] mesh-tutor flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
        {/* Decorative Background Glow Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" style={{ animation: 'float 10s ease-in-out infinite 2s' }}></div>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle className="glass text-white/70 hover:text-white" />
        </div>

        <div className="w-full max-w-5xl z-10 flex flex-col items-center animate-fade-in relative mt-8">

          {/* Greeting */}
          <div className="text-center mb-8 relative z-30">
            {/* Ocultamos el logo estático en desktop ya que tenemos el central */}
            <div className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 flex justify-center w-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-auto drop-shadow-2xl text-slate-800 dark:text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" fill="#3b82f6" stroke="#3b82f6" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-white/90 drop-shadow-md">Hola, {currentUser?.name}</h2>
            <p className="text-white/40 text-lg font-body">Prisma Educación - La Hispanidad</p>
          </div>

          {/* MOBILE VIEW (Grid Layout) */}
          <div className="flex flex-col gap-4 px-4 w-full md:hidden">
            {hubItems.map((item, i) => {
              const content = (
                <>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-display font-bold text-white/90 text-lg leading-tight mb-1">{item.title}</h3>
                    <p className="text-sm text-white/40 leading-snug">{item.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </>
              );
              const className = `glass rounded-2xl p-5 ${item.border} hover:bg-white/10 transition-all group flex items-center gap-4`;
              const animStyle = { animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` };

              if (item.type === 'button') {
                return (
                  <button key={i} onClick={item.onClick} className={className} style={animStyle}>
                    {content}
                  </button>
                );
              }
              return (
                <a key={i} href={item.href} className={className} style={animStyle}>
                  {content}
                </a>
              );
            })}
          </div>

          {/* DESKTOP VIEW (Pentagon Layout with SVG Prism Animation) */}
          <div className="hidden md:flex relative w-full h-[600px] mt-4 mx-auto justify-center items-center">
            {/* Scoped Animations */}
            <style>{`
              @keyframes prism-draw {
                0% { stroke-dashoffset: 1500; fill: transparent; }
                50% { stroke-dashoffset: 0; fill: transparent; }
                100% { stroke-dashoffset: 0; fill: rgba(59, 130, 246, 0.04); }
              }
              @keyframes line-shoot {
                0% { stroke-dashoffset: 600; opacity: 1; }
                80% { stroke-dashoffset: 0; opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0; }
              }
              @keyframes card-fly {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.1); }
                40% { opacity: 1; transform: translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) scale(0.6); }
                100% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1); }
              }
              @keyframes logo-pulse {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              }
              @keyframes prism-fade {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes glow-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

            {/* SVG Prism Background */}
            <svg className="absolute w-full h-full z-10 pointer-events-none" viewBox="-450 -300 900 600" style={{ animation: 'prism-fade 0.6s ease-out' }}>
              {/* Inner Back Pentagon */}
              <polygon points="0,-60 38,-7.6 23.5,12.3 -23.5,12.3 -38,-7.6" fill="rgba(0,0,0,0.2)" stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="1" />

              {/* Connecting edges from back to front */}
              <line x1="0" y1="-90" x2="0" y2="-60" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" />
              <line x1="85.6" y1="-27.8" x2="38" y2="-7.6" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" />
              <line x1="52.9" y1="72.8" x2="23.5" y2="12.3" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" />
              <line x1="-52.9" y1="72.8" x2="-23.5" y2="12.3" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" />
              <line x1="-85.6" y1="-27.8" x2="-38" y2="-7.6" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" />

              {/* Outer Front Pentagon (Prism Face) */}
              <polygon
                points="0,-90 85.6,-27.8 52.9,72.8 -52.9,72.8 -85.6,-27.8"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeDasharray="1500"
                style={{ animation: 'prism-draw 2s ease-out forwards' }}
              />

              {/* Beams shooting from prism vertices to final card positions */}
              {hubItems.map((item, i) => {
                const startX = [0, 85.6, 52.9, -52.9, -85.6][i];
                const startY = [-90, -27.8, 72.8, 72.8, -27.8][i];
                return (
                  <line
                    key={i}
                    x1={startX} y1={startY}
                    x2={item.pos.x} y2={item.pos.y}
                    stroke="#3b82f6"
                    strokeOpacity="0.6"
                    strokeWidth="2"
                    strokeDasharray="600"
                    strokeDashoffset="600"
                    style={{ animation: `line-shoot 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${1 + i * 0.15}s forwards` }}
                  />
                );
              })}
            </svg>

            {/* Center Logo */}
            <div
              className="absolute z-20 w-28 h-28 bg-slate-900/60 rounded-3xl border border-primary-500/40 flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.25)] ring-4 ring-primary-500/10"
              style={{
                left: '50%', top: '50%',
                animation: 'logo-pulse 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              }}
            >
              {/* Rotating glow ring in background */}
              <div className="absolute w-[150%] h-[150%] rounded-full opacity-30 select-none pointer-events-none" style={{ background: 'conic-gradient(from 0deg, transparent 0 340deg, #3b82f6 360deg)', animation: 'glow-spin 4s linear infinite' }} />

              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white drop-shadow-lg relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1.5" />
                <rect width="7" height="7" x="14" y="3" rx="1.5" fill="#3b82f6" stroke="#3b82f6" />
                <rect width="7" height="7" x="14" y="14" rx="1.5" />
                <rect width="7" height="7" x="3" y="14" rx="1.5" />
              </svg>
            </div>

            {/* Positioned Cards */}
            {hubItems.map((item, i) => {
              const content = (
                <>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0 pr-2">
                    <h3 className="font-display font-bold text-white/90 text-lg leading-tight mb-1 truncate">{item.title}</h3>
                    <p className="text-xs text-white/40 leading-snug line-clamp-2">{item.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </>
              );

              const className = `absolute z-30 glass rounded-[20px] p-4 ${item.border} hover:bg-white/10 transition-all group flex items-center gap-4 w-[280px] shadow-2xl shadow-black/20 hover:scale-105 active:scale-[0.98]`;

              const delay = 1.3 + (i * 0.15);
              const style = {
                '--tx': `${item.pos.x}px`,
                '--ty': `${item.pos.y}px`,
                animation: `card-fly 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards`,
                opacity: 0,
                // Start offset by its own size and animated tx/ty relative to center
                marginLeft: '-140px', // half of 280px
                marginTop: '-45px', // half of 90px (approx height)
                left: '50%',
                top: '50%',
              } as React.CSSProperties;

              if (item.type === 'button') {
                return (
                  <button key={i} onClick={item.onClick} className={className} style={style}>
                    {content}
                  </button>
                );
              }
              return (
                <a key={i} href={item.href} className={className} style={style}>
                  {content}
                </a>
              );
            })}
          </div>

          {/* User actions */}
          <div className="flex gap-3 mt-10 relative z-30 md:mt-4">
            <button onClick={() => setShowSettings(true)} className="glass rounded-xl px-4 py-2 text-white/40 hover:text-white/80 flex items-center gap-2 text-sm font-semibold transition-colors">
              <Settings size={16} /> Cambiar PIN
            </button>
            <button onClick={logout} className="glass rounded-xl px-4 py-2 text-red-400/60 hover:text-red-400 flex items-center gap-2 text-sm font-semibold transition-colors">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>

        </div>

        {renderSettingsModal()}
      </div>
    );
  };

  // If in Hub Mode, render that
  if (showHub) {
    return renderHub();
  }

  // --- DASHBOARD RENDERERS ---

  const renderTaskDashboard = () => {
    const schoolTasks = tasks.filter(t => t.context === 'SCHOOL');

    return (
      <div className="mb-10 animate-slide-up">
        <h2 className="font-display text-lg font-bold text-white/90 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <LayoutDashboard size={20} />
          </div>
          Dashboard de Tareas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {schoolTasks.map((task, i) => {
            const assignedStudentIds = task.assignedTo.length > 0 ? task.assignedTo : students.map(s => s.id);
            const relevantStudents = students.filter(s => assignedStudentIds.includes(s.id));
            const completedCount = completions.filter(c => c.taskId === task.id && relevantStudents.some(s => s.id === c.userId)).length;
            const total = relevantStudents.length;
            const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <button
                key={task.id}
                onClick={() => setSelectedTaskDetails(task)}
                className="glass rounded-2xl text-left p-5 glow-border-blue hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
                style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-500/30 transition-colors">
                      <ListChecks size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${percentage === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                      {percentage}%
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-white/90 text-base mb-1 truncate pr-2">{task.title}</h3>
                  <p className="text-white/30 text-xs font-medium mb-4">{completedCount} de {total} completados</p>

                  <div className="w-full bg-white/8 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center text-primary-400 text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver alumnos <ChevronRight size={14} />
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setShowTaskModal(true)}
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-white/15 hover:border-primary-500/40 hover:bg-white/5 text-white/30 hover:text-primary-400 transition-all group h-full min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full glass flex items-center justify-center mb-3 group-hover:bg-primary-500/15 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-display font-bold text-sm">Crear Nueva Tarea</span>
          </button>
        </div>
      </div>
    );
  };

  const renderClassroom = () => (
    <div className="animate-fade-in">

      {/* 1. Task Dashboard Section */}
      {renderTaskDashboard()}

      {/* 2. Students Grid Section */}
      <div>
        <h2 className="font-display text-lg font-bold text-white/90 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <Users size={20} />
          </div>
          Gestión de Alumnos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
          {students.map((student, i) => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="glass rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:bg-white/10 transition-all duration-300 group glow-border-blue"
              style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
            >
              <div className="p-5 flex flex-col items-center relative z-10">
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                  <Avatar config={student.avatarConfig} size={90} />
                </div>

                <div className="mt-4 text-center w-full">
                  <h3 className="font-display font-bold text-white/90 text-base truncate w-full">{student.name}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 rounded-full">
                    <span className="font-display font-bold text-amber-400 text-sm">{student.points}</span>
                    <span className="text-amber-400/60 text-[10px] uppercase tracking-wider font-bold">PTS</span>
                  </div>
                </div>
              </div>

              <div className="p-3 mt-auto glass-medium flex gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleAssignPointsWithNotification(student, -10)}
                  className="flex-1 glass rounded-xl py-2.5 flex justify-center items-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                  title="Restar Puntos"
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => handleAssignPointsWithNotification(student, 10)}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-2.5 flex justify-center items-center shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-95"
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
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-lg font-bold text-white/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gift size={20} />
            </div>
            Premios del Colegio
          </h2>
          <button
            onClick={() => setShowRewardModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95"
          >
            <Plus size={16} /> Crear Premio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {schoolRewards.length === 0 && (
            <div className="col-span-4 text-center py-16 glass rounded-2xl">
              <Gift size={40} className="mx-auto mb-3 text-white/15" />
              <p className="text-white/30 text-sm">No has creado premios todavía.</p>
            </div>
          )}
          {schoolRewards.map((reward, i) => (
            <div
              key={reward.id}
              className="glass rounded-2xl p-4 flex items-center justify-between glow-border-green"
              style={{ animation: `slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Gift size={18} />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white/80 text-sm">{reward.title}</h4>
                  <span className="text-xs text-white/30 font-bold">{reward.cost} pts | Stock: {reward.stock}</span>
                </div>
              </div>
              <button onClick={() => deleteReward(reward.id)} className="text-white/15 hover:text-red-400 p-2 transition-colors">
                <Trash2 size={16} />
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
      setExpandedFamilies(prev => ({ ...prev, [fid]: !prev[fid] }));
    };

    return (
      <div className="animate-slide-up flex h-[600px] glass rounded-2xl overflow-hidden glow-border-purple">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white/10 glass-light flex flex-col">
          <div className="p-4 glass-medium font-display font-bold text-white/80 text-sm">Familias</div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {Object.keys(families).length === 0 && noFamilyUsers.length === 0 && (
              <p className="text-white/30 text-sm text-center mt-4">No hay contactos.</p>
            )}

            {Object.entries(families).map(([fid, data]) => {
              const isExpanded = expandedFamilies[fid];
              const familyUnreadCount = data.members.reduce((acc, member) => acc + getUnreadCount(member.id), 0);

              return (
                <div key={fid} className="mb-2 glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFamily(fid)}
                    className="w-full flex justify-between items-center p-3 hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white/70">{data.name}</span>
                      {familyUnreadCount > 0 && !isExpanded && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{familyUnreadCount}</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown size={16} className="text-white/30" /> : <ChevronRight size={16} className="text-white/30" />}
                  </button>

                  {isExpanded && (
                    <div className="p-1">
                      {data.members.map(u => {
                        const unreadCount = getUnreadCount(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setChatUser(u);
                              if (currentUser) markMessagesRead(u.id, currentUser.id);
                            }}
                            className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${chatUser?.id === u.id ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-white/8'}`}
                          >
                            <div className="w-8 h-8 rounded-full glass flex items-center justify-center overflow-hidden shrink-0 relative">
                              {u.role === Role.STUDENT ? <Avatar config={u.avatarConfig} size={32} /> : <Users size={16} className="text-white/50" />}
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="overflow-hidden flex-1">
                              <div className="text-sm font-medium text-white/80 truncate">{u.name}</div>
                              <div className="text-[10px] text-white/30 truncate">{u.role === Role.PARENT ? 'Padre/Madre' : 'Alumno'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {noFamilyUsers.length > 0 && (
              <div className="mt-4">
                <h5 className="px-2 text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Otros</h5>
                {noFamilyUsers.map(u => {
                  const unreadCount = getUnreadCount(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setChatUser(u);
                        if (currentUser) markMessagesRead(u.id, currentUser.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${chatUser?.id === u.id ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-white/8'}`}
                    >
                      <div className="w-8 h-8 rounded-full glass flex items-center justify-center overflow-hidden shrink-0 relative">
                        {u.role === Role.STUDENT ? <Avatar config={u.avatarConfig} size={32} /> : <Users size={16} className="text-white/50" />}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-sm font-medium text-white/80 truncate">{u.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {chatUser ? (
            <>
              <div className="px-4 py-3 glass-medium font-display font-bold text-white/90 text-sm flex items-center gap-2">
                <MessageSquare size={16} className="text-accent-400" />
                <span>Chat con {chatUser.name}</span>
                <span className="text-[10px] font-normal text-white/30">({chatUser.role === Role.PARENT ? 'Padre/Madre' : 'Alumno'})</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {getConversation(chatUser.id).map(msg => {
                  const isMe = msg.fromId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-br-md' : 'glass-light text-white/80 rounded-bl-md'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {getConversation(chatUser.id).length === 0 && <p className="text-center text-white/20 text-sm mt-10">No hay mensajes. ¡Saluda!</p>}
              </div>
              <div className="p-3 glass-medium flex gap-2">
                <input
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="input-glass flex-1 rounded-full text-sm py-2"
                />
                <button onClick={handleSendMessage} className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-2.5 rounded-full shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-95">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <MessageSquare size={48} className="mb-3 text-white/15" />
              <p className="text-white/30 text-sm">Selecciona un contacto para chatear</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'CLASSROOM' as const, icon: Users, label: 'Alumnos', borderColor: 'border-primary-500', textColor: 'text-primary-400' },
    { id: 'REWARDS' as const, icon: Gift, label: 'Premios', borderColor: 'border-emerald-500', textColor: 'text-emerald-400' },
    { id: 'MESSAGES' as const, icon: MessageSquare, label: 'Mensajería', borderColor: 'border-accent-500', textColor: 'text-accent-400' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] mesh-tutor flex flex-col font-body relative">

      {/* Header */}
      <header className="glass-medium sticky top-0 z-50 px-4 py-3" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                <Users size={20} />
              </div>
              <div>
                <h1 className="font-display font-bold text-white/90 text-base leading-none">Panel {currentClass?.name || 'del Profesor'}</h1>
                <p className="text-xs text-white/40 mt-0.5">Bienvenido/a, {currentUser?.name}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHub(true)}
              className="glass rounded-xl p-2.5 text-white/40 hover:text-white/80 transition-colors flex flex-col items-center"
              title="Volver al Portal"
            >
              <School size={18} />
              <span className="text-[9px] font-bold mt-0.5">Portal</span>
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all active:scale-95"
            >
              <Send size={14} /> Nueva Tarea
            </button>
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

      {/* Desktop Tabs */}
      <div className="hidden md:flex glass sticky top-[60px] z-40 justify-center gap-6 px-6 py-0">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 font-display font-bold text-sm flex items-center gap-2 transition-all duration-200 relative ${active
                ? `${tab.borderColor} ${tab.textColor}`
                : 'border-transparent text-white/30 hover:text-white/50'
                }`}
            >
              <Icon size={16} /> {tab.label}
              {tab.id === 'MESSAGES' && getTotalUnreadCount() > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full -ml-1">{getTotalUnreadCount()}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto max-w-7xl mx-auto w-full relative z-10 pb-24 md:pb-6">

        {activeTab === 'CLASSROOM' && renderClassroom()}
        {activeTab === 'REWARDS' && renderRewards()}
        {activeTab === 'MESSAGES' && renderMessages()}

        {/* Settings Modal */}
        {renderSettingsModal()}

        {/* Selected Task Details Modal */}
        {selectedTaskDetails && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl w-full max-w-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[85vh] modal-content">
              <div className="p-5 glass-medium flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                    <ListChecks size={22} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-white/90">{selectedTaskDetails.title}</h2>
                    <p className="text-white/30 text-xs">Detalles de Tarea</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTaskDetails(null)} className="glass rounded-xl p-2 text-white/30 hover:text-white/70 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Completed Column */}
                  <div>
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2 tracking-wider glass rounded-xl p-2.5">
                      <CheckCircle size={14} /> Completado
                    </h3>
                    <div className="space-y-2">
                      {students.filter(s => {
                        const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                        const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                        return assigned && done;
                      }).map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 glass rounded-xl glow-border-green">
                          <Avatar config={s.avatarConfig} size={32} />
                          <span className="font-medium text-white/80 text-sm">{s.name}</span>
                        </div>
                      ))}
                      {students.filter(s => {
                        const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                        const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                        return assigned && done;
                      }).length === 0 && <p className="text-white/30 text-sm italic">Nadie ha completado aún.</p>}
                    </div>
                  </div>

                  {/* Pending Column */}
                  <div>
                    <h3 className="text-[10px] font-bold text-secondary-400 uppercase mb-3 flex items-center gap-2 tracking-wider glass rounded-xl p-2.5">
                      <Circle size={14} /> Pendiente
                    </h3>
                    <div className="space-y-2">
                      {students.filter(s => {
                        const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                        const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                        return assigned && !done;
                      }).map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 glass rounded-xl opacity-60">
                          <Avatar config={s.avatarConfig} size={32} />
                          <span className="font-medium text-white/60 text-sm">{s.name}</span>
                        </div>
                      ))}
                      {students.filter(s => {
                        const assigned = selectedTaskDetails.assignedTo.length === 0 || selectedTaskDetails.assignedTo.includes(s.id);
                        const done = completions.some(c => c.taskId === selectedTaskDetails.id && c.userId === s.id);
                        return assigned && !done;
                      }).length === 0 && <p className="text-white/30 text-sm italic">¡Todos han terminado!</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl w-full max-w-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh] modal-content">
              {/* Header */}
              <div className="p-5 glass-medium flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-1 rounded-full">
                    <Avatar config={selectedStudent.avatarConfig} size={48} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-white/90">{selectedStudent.name}</h2>
                    <p className="text-white/30 text-xs">Gestión de Alumno</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="glass rounded-xl p-2 text-white/30 hover:text-white/70 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                <h3 className="font-display font-bold text-white/80 mb-4 flex items-center gap-2 text-sm">
                  <School size={18} className="text-primary-400" /> Tareas Escolares Asignadas
                </h3>
                <div className="space-y-2">
                  {tasks.filter(t => t.context === 'SCHOOL' && (t.assignedTo.length === 0 || t.assignedTo.includes(selectedStudent.id))).map(task => {
                    const isCompleted = completions.some(c => c.taskId === task.id && c.userId === selectedStudent.id);
                    return (
                      <div key={task.id} className={`p-4 rounded-xl flex justify-between items-center transition-all ${isCompleted ? 'glass glow-border-green' : 'glass'}`}>
                        <div>
                          <h4 className={`font-display font-bold text-sm ${isCompleted ? 'text-emerald-400' : 'text-white/80'}`}>{task.title}</h4>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">+{task.points} pts</span>
                        </div>
                        <button
                          onClick={() => toggleTaskCompletion(task.id, selectedStudent.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCompleted ? 'glass text-emerald-400 hover:text-red-400' : 'glass text-white/40 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                        >
                          {isCompleted ? (
                            <><CheckCircle size={14} /> Hecho</>
                          ) : (
                            <><Circle size={14} /> Pendiente</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Chat Shortcut */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <button
                    onClick={() => {
                      setChatUser(selectedStudent);
                      setSelectedStudent(null);
                      setActiveTab('MESSAGES');
                    }}
                    className="w-full py-3 glass rounded-xl text-accent-400 font-display font-bold text-sm hover:bg-accent-500/15 transition-colors flex justify-center items-center gap-2"
                  >
                    <MessageSquare size={18} /> Abrir Chat con Alumno
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="font-semibold text-white/20 text-xs">Cooperativa de Enseñanza La Hispanidad</p>
          <p className="mt-1 text-white/15 text-xs">Creado por Javi Barrero</p>
        </footer>
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
                className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 relative ${active ? 'text-white' : 'text-white/30'
                  }`}
              >
                {tab.id === 'MESSAGES' && getTotalUnreadCount() > 0 && (
                  <div className="absolute top-0 right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {getTotalUnreadCount()}
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

      {/* Broadcast Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl shadow-glass-lg w-full max-w-md overflow-hidden modal-content">
            <div className="px-6 py-4 glass-medium flex justify-between items-center">
              <h3 className="font-display text-lg font-bold text-white/90">Crear Tarea de Clase</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Título de la Tarea</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="input-glass w-full"
                  placeholder="ej. Leer Capítulo 4"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Puntos de Recompensa</label>
                <input
                  type="number"
                  value={taskPoints}
                  onChange={(e) => setTaskPoints(Number(e.target.value))}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-2">Tipo de Tarea</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWorkType('CLASSWORK')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-display font-bold text-sm transition-all ${workType === 'CLASSWORK' ? 'glass-medium text-primary-400 glow-border-blue' : 'glass text-white/30 hover:text-white/50'}`}
                  >
                    Clase
                  </button>
                  <button
                    onClick={() => setWorkType('HOMEWORK')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-display font-bold text-sm transition-all ${workType === 'HOMEWORK' ? 'glass-medium text-accent-400 glow-border-purple' : 'glass text-white/30 hover:text-white/50'}`}
                  >
                    Casa (Deberes)
                  </button>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isPriority ? 'glass-medium glow-border-orange' : 'glass'}`}
                onClick={() => setIsPriority(!isPriority)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isPriority ? 'bg-red-500 border-red-500' : 'bg-transparent border-white/20'}`}>
                  {isPriority && <CheckSquare size={12} className="text-white" />}
                </div>
                <div>
                  <span className="font-bold text-red-400 text-sm">Modo Alta Prioridad</span>
                  <p className="text-[10px] text-white/30">Los alumnos verán una alerta inmediata.</p>
                </div>
              </div>
            </div>

            <div className="p-5 glass-medium flex gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleBroadcastTask}
                className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all active:scale-[0.98]"
              >
                Enviar a Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl shadow-glass-lg w-full max-w-sm overflow-hidden modal-content">
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-white/90 mb-4">Crear Premio Escolar</h3>
              <input
                type="text"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="input-glass w-full mb-3"
                placeholder="ej. Ayudante del día"
              />
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Coste (Pts)</label>
                  <input
                    type="number"
                    value={rewardCost}
                    onChange={(e) => setRewardCost(Number(e.target.value))}
                    className="input-glass w-full mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Stock</label>
                  <input
                    type="number"
                    value={rewardStock}
                    onChange={(e) => setRewardStock(Number(e.target.value))}
                    className="input-glass w-full mt-1"
                  />
                </div>
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

export default TutorDashboard;