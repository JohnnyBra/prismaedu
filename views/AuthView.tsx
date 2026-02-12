import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GraduationCap, Home, User as UserIcon, Delete, ArrowRight, ArrowLeft, School, Shield, KeyRound, Sparkles } from 'lucide-react';
import { Role, User } from '../types';
import Avatar from '../components/Avatar';

type LoginStep = 'MODE_SELECT' | 'TEACHER_METHOD_SELECT' | 'CLASS_SELECT' | 'GROUP_SELECT' | 'USER_SELECT' | 'PIN_ENTRY';

const AuthView: React.FC = () => {
  const { login, users, classes } = useData();

  const [step, setStep] = useState<LoginStep>('MODE_SELECT');
  const [selectedContext, setSelectedContext] = useState<'SCHOOL' | 'HOME' | 'ADMIN' | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmitPin = () => {
    if (selectedUser) {
      const success = login(selectedUser.id, pin);
      if (!success) {
        setError('PIN Incorrecto');
        setPin('');
      }
    } else if (selectedClassId && step === 'PIN_ENTRY') {
      const familyIdsInClass = new Set(
        users
          .filter(u => u.classId === selectedClassId && u.familyId)
          .map(u => u.familyId)
      );

      const user = users.find(u => {
        if (u.pin !== pin) return false;
        if (u.classId === selectedClassId) return true;
        if (u.role === Role.PARENT && u.familyId && familyIdsInClass.has(u.familyId)) return true;
        return false;
      });

      if (user) {
        login(user.id, pin);
      } else {
        setError('PIN Incorrecto');
        setPin('');
      }
    }
  };

  const goBack = () => {
    setError('');
    setPin('');
    if (step === 'PIN_ENTRY') {
      if (selectedClassId && !selectedUser) {
        setStep('CLASS_SELECT');
        setSelectedClassId(null);
      } else {
        setStep('USER_SELECT');
        setSelectedUser(null);
      }
    } else if (step === 'USER_SELECT') {
      if (selectedContext === 'ADMIN') {
          setStep('MODE_SELECT');
          setSelectedContext(null);
      } else if (selectedContext === 'SCHOOL') {
          setStep('TEACHER_METHOD_SELECT');
      } else {
          setStep('GROUP_SELECT');
          setSelectedGroupId(null);
      }
    } else if (step === 'TEACHER_METHOD_SELECT') {
      setStep('MODE_SELECT');
      setSelectedContext(null);
    } else if (step === 'GROUP_SELECT') {
      setStep('CLASS_SELECT');
      setSelectedGroupId(null);
    } else if (step === 'CLASS_SELECT') {
      setStep('MODE_SELECT');
      setSelectedContext(null);
      setSelectedClassId(null);
    }
  };

  // --- Views ---

  const renderModeSelect = () => (
    <div className="space-y-8 animate-slide-up w-full max-w-md px-4">
      <div className="text-center flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-500/30 rounded-full blur-2xl animate-glow-pulse" />
          <img src="/logo.png" alt="Logo" className="relative h-28 w-auto object-contain drop-shadow-2xl" onError={(e) => e.currentTarget.style.display = 'none'} />
        </div>
        <h1 className="font-display text-5xl font-black gradient-text mb-3 tracking-tight">Prisma</h1>
        <p className="text-white/50 text-sm font-medium tracking-wide uppercase">Cooperativa de Enseñanza La Hispanidad</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setSelectedContext('SCHOOL');
            setStep('TEACHER_METHOD_SELECT');
          }}
          className="group glass-light rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-blue flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 group-hover:shadow-neon-blue group-hover:scale-110">
            <School size={32} />
          </div>
          <span className="font-display text-lg font-bold text-white/90">Soy Profesor</span>
        </button>

        <button
          onClick={() => {
            setSelectedContext('HOME');
            setStep('CLASS_SELECT');
          }}
          className="group glass-light rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-orange flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary-500/20 flex items-center justify-center text-secondary-400 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300 group-hover:shadow-neon-orange group-hover:scale-110">
            <Home size={32} />
          </div>
          <span className="font-display text-lg font-bold text-white/90">Soy Familia</span>
        </button>
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={() => {
            setSelectedContext('ADMIN');
            setStep('USER_SELECT');
          }}
          className="text-xs text-white/30 hover:text-white/60 font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
        >
          <Shield size={12} /> Administrador
        </button>
      </div>
    </div>
  );

  const renderTeacherMethodSelect = () => (
    <div className="w-full max-w-lg px-4 animate-slide-up">
      <h2 className="font-display text-2xl font-bold text-center text-white/90 mb-8">Elige Método de Acceso</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setStep('USER_SELECT')}
          className="group glass-light rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-blue flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
            <KeyRound size={32} />
          </div>
          <div className="text-center">
            <span className="block font-display text-lg font-bold text-white/90">Usuario y PIN</span>
            <span className="text-xs text-white/40">Acceso Manual</span>
          </div>
        </button>

        <a
          href="/auth/google"
          className="group glass-light rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-purple flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center text-accent-400 group-hover:bg-accent-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block font-display text-lg font-bold text-white/90">Google</span>
            <span className="text-xs text-white/40">Cuenta Colegio</span>
          </div>
        </a>
      </div>
    </div>
  );

  const renderClassSelect = () => (
    <div className="w-full max-w-2xl px-4 animate-slide-up">
      <h2 className="font-display text-2xl font-bold text-center text-white/90 mb-8">Elige tu Clase</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {classes.map((cls, i) => (
          <button
            key={cls.id}
            onClick={() => {
              setSelectedClassId(cls.id);
              setStep('PIN_ENTRY');
              setSelectedUser(null);
            }}
            className={`group glass rounded-2xl p-5 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-blue text-center stagger-${Math.min(i + 1, 8)}`}
            style={{ animation: `slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 mb-3 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
              <School size={22} />
            </div>
            <span className="font-display font-semibold text-white/80 text-sm">{cls.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderGroupSelect = () => {
    const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedClassId);
    const familyIdsInClass = Array.from(new Set(studentsInClass.map(s => s.familyId))).filter(Boolean);

    const families = familyIdsInClass.map(famId => {
      const parent = users.find(u => u.familyId === famId && u.role === Role.PARENT);
      const displayName = parent ? parent.name : `Familia ${famId}`;
      return { id: famId, name: displayName };
    });

    return (
      <div className="w-full max-w-2xl px-4 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-center text-white/90 mb-8">Elige tu Familia</h2>
        {families.length === 0 ? (
          <div className="glass-medium rounded-2xl p-8 text-center">
            <p className="text-white/50 font-medium">No hay familias en esta clase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {families.map((fam, i) => (
              <button
                key={fam.id}
                onClick={() => {
                  setSelectedGroupId(fam.id!);
                  setStep('USER_SELECT');
                }}
                className="group glass rounded-2xl p-5 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-orange text-center"
                style={{ animation: `slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both` }}
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-secondary-500/20 flex items-center justify-center text-secondary-400 mb-3 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <Home size={22} />
                </div>
                <span className="font-display font-semibold text-white/80 text-sm">{fam.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderUserSelect = () => {
    let filteredUsers: User[] = [];

    if (selectedContext === 'ADMIN') {
      filteredUsers = users.filter(u => u.role === Role.ADMIN || u.role === Role.DIRECCION || u.role === Role.TESORERIA);
    } else if (selectedContext === 'SCHOOL') {
      filteredUsers = users.filter(u => u.role === Role.TUTOR);
    } else {
      filteredUsers = users.filter(u => u.familyId === selectedGroupId);
    }

    return (
      <div className="w-full max-w-4xl px-4 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-center text-white/90 mb-8">
          <Sparkles size={20} className="inline mr-2 text-primary-400" />
          ¿Quién eres?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredUsers.map((user, i) => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setStep('PIN_ENTRY');
              }}
              className="group glass rounded-2xl p-4 hover:bg-white/12 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center"
              style={{ animation: `slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both` }}
            >
              <div className="mb-3">
                {user.role === Role.TUTOR || user.role === Role.PARENT || user.role === Role.ADMIN || user.role === Role.DIRECCION || user.role === Role.TESORERIA ? (
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                    user.role === Role.ADMIN || user.role === Role.DIRECCION || user.role === Role.TESORERIA
                      ? 'bg-surface-700 text-white/70 group-hover:bg-surface-600'
                      : 'bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30'
                  }`}>
                    {user.role === Role.TUTOR ? <GraduationCap size={28} /> : user.role === Role.ADMIN ? <Shield size={28} /> : <UserIcon size={28} />}
                  </div>
                ) : (
                  <Avatar config={user.avatarConfig} size={64} showRing glowColor="rgba(99,102,241,0.3)" />
                )}
              </div>
              <span className="font-display font-semibold text-white/80 text-center text-sm">{user.name}</span>
              <span className="text-[10px] text-white/30 uppercase mt-1 font-semibold tracking-wider">
                {user.role === Role.TUTOR ? 'Profesor' : user.role === Role.PARENT ? 'Admin Familia' : user.role === Role.ADMIN ? 'Admin' : user.role === Role.DIRECCION ? 'Dirección' : user.role === Role.TESORERIA ? 'Tesorería' : 'Alumno'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderPinEntry = () => (
    <div className="glass-medium rounded-3xl shadow-glass-lg p-8 max-w-sm w-full mx-4 animate-scale-in">
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 mb-4">
          {selectedUser ? (
            selectedUser.role === Role.STUDENT ? (
              <Avatar config={selectedUser.avatarConfig} size={80} showRing glowColor="rgba(99,102,241,0.4)" />
            ) : (
              <div className={`w-full h-full rounded-2xl flex items-center justify-center ${
                selectedUser.role === Role.ADMIN || selectedUser.role === Role.DIRECCION || selectedUser.role === Role.TESORERIA
                  ? 'bg-surface-700 text-white/70'
                  : 'bg-primary-500/20 text-primary-400'
              }`}>
                {selectedUser.role === Role.ADMIN || selectedUser.role === Role.DIRECCION || selectedUser.role === Role.TESORERIA ? <Shield size={36} /> : <UserIcon size={36} />}
              </div>
            )
          ) : (
            <div className="w-full h-full rounded-2xl flex items-center justify-center bg-primary-500/20 text-primary-400">
              <KeyRound size={36} />
            </div>
          )}
        </div>
        <h2 className="font-display text-xl font-bold text-white/90">
          {selectedUser ? `Hola, ${selectedUser.name}` : 'Acceso de Alumno/Familia'}
        </h2>
        <p className="text-white/40 text-sm mt-1">Introduce tu PIN</p>
      </div>

      {/* PIN Display */}
      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
              pin[i]
                ? 'bg-primary-500/20 border-2 border-primary-500/50 text-primary-400 shadow-neon-blue scale-105'
                : 'bg-white/5 border-2 border-white/10 text-white/20'
            }`}
          >
            {pin[i] ? '•' : ''}
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-center mb-4 text-sm font-bold animate-pulse">{error}</p>}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num.toString())}
            className="h-14 rounded-xl bg-white/6 hover:bg-white/12 active:bg-white/18 active:scale-95 font-display font-bold text-xl text-white/80 transition-all duration-150"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-white/6 hover:bg-white/12 active:bg-white/18 active:scale-95 font-display font-bold text-xl text-white/80 transition-all duration-150"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-14 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 active:scale-95 flex items-center justify-center text-red-400 transition-all duration-150"
        >
          <Delete size={22} />
        </button>
      </div>

      <button
        onClick={handleSubmitPin}
        disabled={pin.length !== 4}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 transition-all duration-200 active:scale-[0.98]"
      >
        Entrar <ArrowRight size={18} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] mesh-auth flex flex-col items-center p-4 relative overflow-x-hidden">
      {/* Animated floating orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-primary-500/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-500/10 blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[20vw] h-[20vw] max-w-[250px] max-h-[250px] rounded-full bg-pink-500/8 blur-3xl animate-float pointer-events-none" />

      {step !== 'MODE_SELECT' && (
        <button
          onClick={goBack}
          className="fixed top-4 left-4 z-50 glass rounded-full px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/15 flex items-center gap-2 text-sm font-semibold transition-all duration-200"
          style={{ paddingTop: 'calc(0.625rem + var(--safe-top))' }}
        >
          <ArrowLeft size={16} /> Atrás
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        {step === 'MODE_SELECT' && renderModeSelect()}
        {step === 'TEACHER_METHOD_SELECT' && renderTeacherMethodSelect()}
        {step === 'CLASS_SELECT' && renderClassSelect()}
        {step === 'GROUP_SELECT' && renderGroupSelect()}
        {step === 'USER_SELECT' && renderUserSelect()}
        {step === 'PIN_ENTRY' && renderPinEntry()}
      </div>

      <footer className="mt-4 text-center text-white/20 text-[10px] py-3 z-10">
        <p className="font-semibold tracking-widest uppercase">Cooperativa de Enseñanza La Hispanidad</p>
        <p className="mt-1 opacity-60">Creado por Javi Barrero</p>
      </footer>
    </div>
  );
};

export default AuthView;
