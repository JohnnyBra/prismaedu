import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { GraduationCap, Home, User as UserIcon, Delete, ArrowRight, ArrowLeft, School, Shield } from 'lucide-react';
import { Role, User } from '../types';
import Avatar from '../components/Avatar';

type LoginStep = 'MODE_SELECT' | 'GROUP_SELECT' | 'USER_SELECT' | 'PIN_ENTRY';

const AuthView: React.FC = () => {
  const { login, users } = useData();
  
  // State Machine
  const [step, setStep] = useState<LoginStep>('MODE_SELECT');
  const [selectedContext, setSelectedContext] = useState<'SCHOOL' | 'HOME' | 'ADMIN' | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // FamilyId or 'tutors'
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pin State
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // --- Helpers ---
  
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
    }
  };

  const goBack = () => {
    setError('');
    setPin('');
    if (step === 'PIN_ENTRY') {
      setStep('USER_SELECT');
      setSelectedUser(null);
    } else if (step === 'USER_SELECT') {
      if (selectedContext === 'ADMIN') {
          setStep('MODE_SELECT'); 
          setSelectedContext(null);
      } else if (selectedContext === 'SCHOOL') {
          // Go back to mode select because we skipped group select for teachers
          setStep('MODE_SELECT');
          setSelectedContext(null);
      } else {
          setStep('GROUP_SELECT');
          setSelectedGroupId(null);
      }
    } else if (step === 'GROUP_SELECT') {
      setStep('MODE_SELECT');
      setSelectedContext(null);
    }
  };

  // --- Views ---

  // STEP 1: Mode Select
  const renderModeSelect = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative w-full max-w-md">
      <div className="text-center mb-8 flex flex-col items-center">
        {/* LOGO PLACEHOLDER */}
        <img src="/logo.png" alt="Logo Colegio" className="h-20 w-auto object-contain mb-4 drop-shadow-lg" onError={(e) => e.currentTarget.style.display = 'none'} />
        
        <h1 className="text-4xl font-extrabold text-white drop-shadow-md mb-2 tracking-tight">Prisma</h1>
        <p className="text-indigo-100 text-lg font-medium">Cooperativa de Enseñanza La Hispanidad</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => {
            setSelectedContext('SCHOOL');
            setStep('USER_SELECT'); // Direct to User Select for teachers
          }}
          className="p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-transparent hover:border-blue-400 hover:scale-105 transition-all flex flex-col items-center gap-4 group"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <School size={40} />
          </div>
          <span className="text-xl font-bold text-gray-800">Soy Profesor</span>
        </button>

        <button 
          onClick={() => {
            setSelectedContext('HOME');
            setStep('GROUP_SELECT');
          }}
          className="p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-transparent hover:border-orange-400 hover:scale-105 transition-all flex flex-col items-center gap-4 group"
        >
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <Home size={40} />
          </div>
          <span className="text-xl font-bold text-gray-800">Soy Familia</span>
        </button>
      </div>

      <div className="pt-8 text-center">
        <button 
          onClick={() => {
            setSelectedContext('ADMIN');
            setStep('USER_SELECT');
          }}
          className="text-xs text-white/60 hover:text-white font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          <Shield size={12} /> Soy Administrador
        </button>
      </div>
    </div>
  );

  // STEP 2: Group Select (Families)
  const renderGroupSelect = () => {
    // Get unique families
    const families = Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId)))
      .map(famId => {
        // Find a parent in this family to get a name
        const parent = users.find(u => u.familyId === famId && u.role === Role.PARENT);
        return {
          id: famId,
          name: parent ? `Familia de ${parent.name.split(' ')[1] || parent.name}` : `Familia ${famId}`
        };
      });

    return (
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-8 duration-300">
         <h2 className="text-3xl font-bold text-center text-white drop-shadow-md mb-8 mt-12">Elige tu Familia</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(fam => (
               <button
                  key={fam.id}
                  onClick={() => {
                    setSelectedGroupId(fam.id!);
                    setStep('USER_SELECT');
                  }}
                  className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all border border-white/20 text-center"
               >
                 <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-3">
                    <Home size={28} />
                 </div>
                 <span className="font-bold text-gray-700">{fam.name}</span>
               </button>
            ))}
         </div>
      </div>
    );
  };

  // STEP 3: User Select
  const renderUserSelect = () => {
    let filteredUsers: User[] = [];

    if (selectedContext === 'ADMIN') {
       filteredUsers = users.filter(u => u.role === Role.ADMIN);
    } else if (selectedContext === 'SCHOOL') {
      // Show Tutors
      filteredUsers = users.filter(u => u.role === Role.TUTOR);
    } else {
      // Show Family Members (Parents + Students)
      filteredUsers = users.filter(u => u.familyId === selectedGroupId);
    }

    return (
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-8 duration-300">
        <h2 className="text-3xl font-bold text-center text-white drop-shadow-md mb-8 mt-12">¿Quién eres?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setStep('PIN_ENTRY');
              }}
              className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center border border-white/20"
            >
              <div className="mb-3">
                 {user.role === Role.TUTOR || user.role === Role.PARENT || user.role === Role.ADMIN ? (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${user.role === Role.ADMIN ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {user.role === Role.TUTOR ? <GraduationCap size={40} /> : user.role === Role.ADMIN ? <Shield size={40} /> : <UserIcon size={40} />}
                    </div>
                 ) : (
                    <Avatar config={user.avatarConfig} size={80} />
                 )}
              </div>
              <span className="font-bold text-gray-800 text-center text-sm">{user.name}</span>
              <span className="text-xs text-gray-400 uppercase mt-1">
                 {user.role === Role.TUTOR ? 'Profesor' : user.role === Role.PARENT ? 'Admin Familia' : user.role === Role.ADMIN ? 'Administrador' : 'Alumno'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // STEP 4: Pin Entry
  const renderPinEntry = () => (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 mb-4">
             {selectedUser?.role === Role.STUDENT ? (
                <Avatar config={selectedUser.avatarConfig} size={80} />
             ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center ${selectedUser?.role === Role.ADMIN ? 'bg-gray-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                   {selectedUser?.role === Role.ADMIN ? <Shield size={40} /> : <UserIcon size={40} />}
                </div>
             )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">Hola, {selectedUser?.name}</h2>
          <p className="text-gray-500 text-sm">Introduce tu PIN</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${pin[i] ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-gray-50'}`}>
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-center mb-4 text-sm font-bold animate-pulse">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-bold text-xl text-gray-700 transition-colors"
            >
              {num}
            </button>
          ))}
          <div className="flex justify-center items-center"></div>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-bold text-xl text-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 flex items-center justify-center text-red-500 transition-colors"
          >
            <Delete size={24} />
          </button>
        </div>

        <button
          onClick={handleSubmitPin}
          disabled={pin.length !== 4}
          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          Entrar <ArrowRight size={20} />
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Decorative Background Circles */}
       <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
       <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

       {step !== 'MODE_SELECT' && (
         <button 
           onClick={goBack}
           className="absolute top-6 left-6 text-white hover:bg-white/20 flex items-center gap-2 font-bold bg-white/10 px-4 py-2 rounded-full transition-all backdrop-blur-md z-50"
         >
           <ArrowLeft size={20} /> Atrás
         </button>
       )}

       {/* Content Wrapper */}
       <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
          {step === 'MODE_SELECT' && renderModeSelect()}
          {step === 'GROUP_SELECT' && renderGroupSelect()}
          {step === 'USER_SELECT' && renderUserSelect()}
          {step === 'PIN_ENTRY' && renderPinEntry()}
       </div>

       {/* Footer / Credits */}
       <footer className="mt-8 text-center text-white/70 text-xs py-4 z-10">
          <p className="font-semibold tracking-wide">Cooperativa de Enseñanza La Hispanidad</p>
          <p className="mt-1 opacity-60">Creado por Javi Barrero</p>
          <div className="mt-2 opacity-40">
            PIN de Demo: Admin 1234, Profesor 9999, Padres 8888, Alumnos 00xx
          </div>
       </footer>
    </div>
  );
};

export default AuthView;