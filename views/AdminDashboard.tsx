import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Role, User, Task } from '../types';
import { Users, School, BookOpen, LogOut, Plus, Trash2, Edit2, Save, X, ChevronRight, UserPlus, GraduationCap, Home, CheckSquare, ArrowRightLeft, Key, Upload, Shield } from 'lucide-react';
import Avatar from '../components/Avatar';

type AdminTab = 'CLASSES' | 'TUTORS' | 'FAMILIES' | 'TASKS';

const AdminDashboard: React.FC = () => {
  const { logout, users, classes, tasks, addClass, updateClass, deleteClass, addUser, addUsers, updateUser, deleteUser, updateTask, deleteTask, deleteFamily, updateFamilyId, updatePin } = useData();
  const [activeTab, setActiveTab] = useState<AdminTab>('CLASSES');

  // Local state for edits/creation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importingClassId, setImportingClassId] = useState<string | null>(null);

  // Creation States
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [showAddTutor, setShowAddTutor] = useState(false);
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorClass, setNewTutorClass] = useState('');
  const [newTutorPin, setNewTutorPin] = useState('9999');

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState(''); // Just used to generate a family ID logic
  const [newParentName, setNewParentName] = useState('');
  const [newParentPin, setNewParentPin] = useState('8888');

  const [addingMemberToFamily, setAddingMemberToFamily] = useState<string | null>(null); // Family ID
  const [newMemberRole, setNewMemberRole] = useState<Role>(Role.STUDENT);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('0000');
  const [newMemberClass, setNewMemberClass] = useState('');

  // Family Edit State
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [newFamilyIdString, setNewFamilyIdString] = useState('');

  // Move User State
  const [userToMove, setUserToMove] = useState<User | null>(null);
  const [destinationFamilyId, setDestinationFamilyId] = useState<string>('');

  // Task Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPoints, setEditTaskPoints] = useState(0);
  const [editTaskPriority, setEditTaskPriority] = useState(false);

  // Admin PIN Change State
  const [showChangePin, setShowChangePin] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');

  // --- HELPERS ---

  const handleImportCSV = (classId: string) => {
    setImportingClassId(classId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importingClassId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length < 2) {
        alert('El archivo CSV está vacío o no tiene cabecera.');
        return;
      }

      // Check for "Alumno" header (case insensitive, removing quotes)
      const headerLine = lines[0].toLowerCase();
      if (!headerLine.includes('alumno')) {
         alert('El archivo CSV debe tener una cabecera "Alumno".');
         return;
      }

      const newUsers: Omit<User, 'id'>[] = [];
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parse "Surnames, Name" format
        // We assume the whole line is one column or the first column is the relevant one
        // Remove surrounding quotes if present
        let cleanLine = line.trim();
        if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
            cleanLine = cleanLine.substring(1, cleanLine.length - 1);
        }

        // Split by the first comma only
        const separatorIndex = cleanLine.indexOf(',');
        if (separatorIndex === -1) continue;

        const rawSurname = cleanLine.substring(0, separatorIndex).trim().replace(/"/g, '');
        const rawName = cleanLine.substring(separatorIndex + 1).trim().replace(/"/g, '');

        if (!rawSurname || !rawName) continue;

        const familyId = `family_${Date.now()}_${i}`;
        const fullName = `${rawName} ${rawSurname}`;

        // Create Student
        newUsers.push({
          name: fullName,
          firstName: rawName,
          lastName: rawSurname,
          role: Role.STUDENT,
          classId: importingClassId,
          familyId: familyId,
          pin: '0000',
          points: 0
        });

        // Create Parent
        newUsers.push({
          name: `Familia ${rawSurname}`,
          role: Role.PARENT,
          familyId: familyId,
          pin: '0000',
          points: 0
        });

        count++;
      }

      if (newUsers.length > 0) {
        addUsers(newUsers);
        alert(`Se han importado ${count} alumnos y creado ${count} familias correctamente.`);
      } else {
        alert('No se encontraron datos válidos para importar.');
      }
      setImportingClassId(null);
    };

    // Read as Windows-1252 (ANSI)
    reader.readAsText(file, 'windows-1252');
  };

  const handleChangePin = () => {
      if (newAdminPin && newAdminPin.length === 4) {
          updatePin(newAdminPin);
          setShowChangePin(false);
          setNewAdminPin('');
          alert('PIN actualizado correctamente');
      } else {
          alert('El PIN debe tener 4 dígitos');
      }
  };

  const handleCreateClass = () => {
    if (newClassName) {
      addClass(newClassName);
      setNewClassName('');
      setShowAddClass(false);
    }
  };

  const handleCreateTutor = () => {
    if (newTutorName && newTutorPin) {
      addUser({
        name: newTutorName,
        role: Role.TUTOR,
        pin: newTutorPin,
        classId: newTutorClass || undefined,
        points: 0
      });
      setNewTutorName('');
      setNewTutorClass('');
      setNewTutorPin('9999');
      setShowAddTutor(false);
    }
  };

  const handleCreateFamily = () => {
    // Creating a family basically means creating the first Parent with a new unique familyId
    if (newParentName && newParentPin) {
      const famId = `family_${Date.now()}`;
      addUser({
        name: newParentName,
        role: Role.PARENT,
        pin: newParentPin,
        familyId: famId,
        points: 0
      });
      setNewParentName('');
      setNewParentPin('8888');
      setShowAddFamily(false);
    }
  };

  const handleAddMember = () => {
    if (addingMemberToFamily && newMemberName && newMemberPin) {
       addUser({
         name: newMemberName,
         role: newMemberRole,
         pin: newMemberPin,
         familyId: addingMemberToFamily,
         classId: newMemberRole === Role.STUDENT ? newMemberClass : undefined,
         points: 0
       });
       setAddingMemberToFamily(null);
       setNewMemberName('');
       setNewMemberPin('0000');
       setNewMemberClass('');
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskPoints(task.points);
    setEditTaskPriority(task.isPriority || false);
  };

  const saveTask = () => {
    if (editingTaskId && editTaskTitle) {
      updateTask(editingTaskId, {
        title: editTaskTitle,
        points: Number(editTaskPoints),
        isPriority: editTaskPriority
      });
      setEditingTaskId(null);
    }
  };

  const handleEditFamily = (famId: string) => {
    setEditingFamilyId(famId);
    setNewFamilyIdString(famId);
  };

  const handleSaveFamily = (oldId: string) => {
    if (newFamilyIdString && newFamilyIdString !== oldId) {
      updateFamilyId(oldId, newFamilyIdString);
    }
    setEditingFamilyId(null);
  };

  const handleDeleteFamily = (famId: string) => {
    if (confirm('¿Estás seguro? Esto eliminará a TODOS los miembros de la familia (Padres y Alumnos). Esta acción no se puede deshacer.')) {
      deleteFamily(famId);
    }
  };

  const initiateMoveUser = (user: User) => {
    setUserToMove(user);
    setDestinationFamilyId(user.familyId || '');
  };

  const confirmMoveUser = () => {
    if (!userToMove || !destinationFamilyId) return;
    if (destinationFamilyId === userToMove.familyId) {
      setUserToMove(null);
      return;
    }

    if (confirm(`¿Estás seguro de que quieres mover a ${userToMove.name} a otra familia?`)) {
      updateUser(userToMove.id, { familyId: destinationFamilyId });
      setUserToMove(null);
      setDestinationFamilyId('');
    }
  };


  // --- RENDERERS ---

  const renderClassesTab = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Clases del Colegio</h2>
        <button onClick={() => setShowAddClass(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 shadow-glass">
          <Plus size={18} /> Añadir Clase
        </button>
      </div>

      {showAddClass && (
        <div className="glass-panel p-4 rounded-xl flex items-center gap-2">
          <input 
            value={newClassName} 
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Nombre de la clase (ej. 3º A)" 
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200/50 bg-white/50"
          />
          <button onClick={handleCreateClass} className="bg-green-600 text-white p-2 rounded-lg"><Save size={20}/></button>
          <button onClick={() => setShowAddClass(false)} className="bg-gray-300 text-gray-700 p-2 rounded-lg"><X size={20}/></button>
        </div>
      )}

      <div className="glass-panel rounded-xl divide-y divide-gray-100">
        {classes.length === 0 && <p className="p-8 text-center text-gray-400">No hay clases registradas.</p>}
        {classes.map(cls => (
          <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors">
            {editingId === cls.id ? (
              <div className="flex items-center gap-2 flex-1">
                 <input 
                   value={editName} 
                   onChange={e => setEditName(e.target.value)} 
                   className="flex-1 px-2 py-1 border rounded bg-white/50"
                 />
                 <button onClick={() => { updateClass(cls.id, editName); setEditingId(null); }} className="text-green-600"><Save size={18} /></button>
                 <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold">
                    {cls.name.charAt(0)}
                 </div>
                 <span className="font-bold text-gray-700">{cls.name}</span>
                 <span className="text-xs text-gray-400">({users.filter(u => u.classId === cls.id).length} miembros)</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleImportCSV(cls.id)}
                className="p-2 text-gray-400 hover:text-green-600 flex items-center gap-1 text-xs font-bold bg-white/50 rounded border border-transparent hover:border-green-200 hover:bg-green-50 transition-all"
                title="Importar alumnos desde CSV"
              >
                <Upload size={16} /> <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={() => { setEditingId(cls.id); setEditName(cls.name); }} className="p-2 text-gray-400 hover:text-brand-600"><Edit2 size={18} /></button>
              <button onClick={() => { if(confirm('¿Borrar clase?')) deleteClass(cls.id) }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
    </div>
  );

  const renderTutorsTab = () => {
    const tutors = users
       .filter(u => u.role === Role.TUTOR)
       .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Profesores / Tutores</h2>
          <button onClick={() => setShowAddTutor(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 shadow-glass">
            <Plus size={18} /> Añadir Profesor
          </button>
        </div>

        {showAddTutor && (
          <div className="glass-panel p-4 rounded-xl grid gap-3">
            <h4 className="font-bold text-brand-800 text-sm">Nuevo Profesor</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={newTutorName} onChange={e => setNewTutorName(e.target.value)} placeholder="Nombre" className="px-3 py-2 rounded border bg-white/50" />
              <select value={newTutorClass} onChange={e => setNewTutorClass(e.target.value)} className="px-3 py-2 rounded border bg-white/50">
                <option value="">Sin Clase Asignada</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={newTutorPin} onChange={e => setNewTutorPin(e.target.value)} placeholder="PIN (4 dígitos)" maxLength={4} className="px-3 py-2 rounded border bg-white/50" />
            </div>
            <div className="flex gap-2 justify-end">
               <button onClick={() => setShowAddTutor(false)} className="px-4 py-2 text-gray-600 text-sm font-bold">Cancelar</button>
               <button onClick={handleCreateTutor} className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">Guardar</button>
            </div>
          </div>
        )}

        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/50 border-b border-gray-100">
               <tr>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Clase Asignada</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">PIN</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {tutors.map(tutor => (
                 <tr key={tutor.id} className="hover:bg-white/40 transition-colors">
                   <td className="p-4 font-bold text-gray-700">{tutor.name}</td>
                   <td className="p-4">
                      <select 
                        value={tutor.classId || ''} 
                        onChange={(e) => updateUser(tutor.id, { classId: e.target.value })}
                        className="bg-white/50 border border-gray-200 rounded px-2 py-1 text-sm focus:border-brand-500 outline-none"
                      >
                         <option value="">-- Ninguna --</option>
                         {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </td>
                   <td className="p-4 font-mono text-gray-500">{tutor.pin}</td>
                   <td className="p-4 text-right">
                     <button onClick={() => { if(confirm('¿Eliminar profesor?')) deleteUser(tutor.id) }} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFamiliesTab = () => {
    // Group users by Family ID
    const familyIds = Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId!))) as string[];
    
    // Helper to get family name from ID
    const getFamilyName = (id: string) => {
      const parent = users.find(u => u.familyId === id && u.role === Role.PARENT);
      return parent ? `Familia de ${parent.name.split(' ')[0]}` : `Familia ${id}`;
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Familias Registradas</h2>
          <button onClick={() => setShowAddFamily(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 shadow-glass">
            <Plus size={18} /> Nueva Familia
          </button>
        </div>

        {/* Move User Modal */}
        {userToMove && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="glass-panel rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center">
                   <h3 className="font-bold text-orange-800">Mover Usuario de Familia</h3>
                   <button onClick={() => setUserToMove(null)}><X size={20} className="text-orange-400" /></button>
                </div>
                <div className="p-6">
                   <p className="text-sm text-gray-600 mb-4">
                     Selecciona la nueva familia para <span className="font-bold">{userToMove.name}</span>:
                   </p>
                   <select 
                      value={destinationFamilyId}
                      onChange={(e) => setDestinationFamilyId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg mb-6 bg-white/50"
                   >
                     <option value="" disabled>Selecciona familia...</option>
                     {familyIds.map(fid => (
                       <option key={fid} value={fid}>{getFamilyName(fid)}</option>
                     ))}
                   </select>
                   
                   <div className="flex gap-3">
                      <button onClick={() => setUserToMove(null)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-white/50 rounded-lg transition-colors">Cancelar</button>
                      <button onClick={confirmMoveUser} className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-glass">
                        Confirmar
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {showAddFamily && (
           <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-3 items-end">
             <div className="flex-1 w-full">
               <label className="text-xs font-bold text-orange-800 uppercase">Nombre Primer Progenitor</label>
               <input value={newParentName} onChange={e => setNewParentName(e.target.value)} className="w-full px-3 py-2 rounded border mt-1 bg-white/50" placeholder="Ej. Juan Pérez" />
             </div>
             <div className="w-24">
               <label className="text-xs font-bold text-orange-800 uppercase">PIN</label>
               <input value={newParentPin} onChange={e => setNewParentPin(e.target.value)} className="w-full px-3 py-2 rounded border mt-1 bg-white/50" maxLength={4} />
             </div>
             <div className="flex gap-2">
               <button onClick={() => setShowAddFamily(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
               <button onClick={handleCreateFamily} className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">Crear</button>
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 gap-4">
           {familyIds.map(famId => {
             const members = users.filter(u => u.familyId === famId);
             const parents = members
                .filter(u => u.role === Role.PARENT)
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
             const students = members
                .filter(u => u.role === Role.STUDENT)
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
             const familyName = getFamilyName(famId);
             const isEditing = editingFamilyId === famId;

             return (
               <div key={famId} className="glass-panel rounded-xl overflow-hidden">
                 <div className="bg-white/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-1">
                       <Home size={18} className="text-orange-500" />
                       <span className="font-bold text-gray-700">{familyName}</span>
                       
                       {isEditing ? (
                         <div className="flex items-center gap-2">
                            <input 
                              value={newFamilyIdString}
                              onChange={e => setNewFamilyIdString(e.target.value)}
                              className="px-2 py-0.5 text-xs border border-brand-300 rounded focus:ring-2 focus:ring-brand-500 bg-white/50"
                            />
                            <button onClick={() => handleSaveFamily(famId)} className="text-green-600 hover:text-green-800"><Save size={16} /></button>
                            <button onClick={() => setEditingFamilyId(null)} className="text-gray-500 hover:text-gray-700"><X size={16} /></button>
                         </div>
                       ) : (
                         <span className="text-xs text-gray-400 bg-white/50 px-2 py-0.5 rounded border border-gray-200">{famId}</span>
                       )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!isEditing && (
                        <>
                          <button 
                            onClick={() => handleEditFamily(famId)}
                            className="text-gray-400 hover:text-brand-500 p-1 rounded hover:bg-brand-50"
                            title="Editar ID Familia"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFamily(famId)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                            title="Eliminar Familia Completa"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        </>
                      )}
                      
                      <button 
                        onClick={() => setAddingMemberToFamily(famId)}
                        className="text-xs bg-white/80 border border-gray-300 px-3 py-1 rounded hover:bg-white flex items-center gap-1 font-bold text-gray-600 transition-colors"
                      >
                        <UserPlus size={14} /> Añadir Miembro
                      </button>
                    </div>
                 </div>
                 
                 {/* Adding Member Form */}
                 {addingMemberToFamily === famId && (
                   <div className="bg-brand-50/50 p-4 border-b border-brand-100 animate-in slide-in-from-top-2">
                      <h5 className="text-xs font-bold text-brand-800 uppercase mb-2">Nuevo Miembro para {familyName}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                        <select 
                          value={newMemberRole} 
                          onChange={e => setNewMemberRole(e.target.value as Role)}
                          className="px-2 py-2 rounded border border-gray-300 text-sm bg-white/50"
                        >
                          <option value={Role.PARENT}>Padre/Madre</option>
                          <option value={Role.STUDENT}>Alumno/Hijo</option>
                        </select>
                        <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nombre" className="px-2 py-2 rounded border border-gray-300 text-sm bg-white/50" />
                        <input value={newMemberPin} onChange={e => setNewMemberPin(e.target.value)} placeholder="PIN" maxLength={4} className="px-2 py-2 rounded border border-gray-300 text-sm bg-white/50" />
                        
                        {newMemberRole === Role.STUDENT && (
                          <select value={newMemberClass} onChange={e => setNewMemberClass(e.target.value)} className="px-2 py-2 rounded border border-gray-300 text-sm bg-white/50">
                             <option value="">Clase...</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setAddingMemberToFamily(null)} className="text-xs text-gray-500 font-bold px-3 py-1">Cancelar</button>
                         <button onClick={handleAddMember} className="text-xs bg-brand-600 text-white font-bold px-3 py-1 rounded hover:bg-brand-700">Guardar Miembro</button>
                      </div>
                   </div>
                 )}

                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Padres / Tutores</h5>
                       <ul className="space-y-2">
                         {parents.map(p => (
                           <li key={p.id} className="flex items-center justify-between bg-white/40 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors">
                             <span className="text-sm font-medium">{p.name} <span className="text-gray-400 text-xs font-mono ml-1">PIN: {p.pin}</span></span>
                             <div className="flex items-center gap-1">
                               <button 
                                  onClick={() => initiateMoveUser(p)}
                                  className="text-gray-400 hover:text-orange-500 p-1"
                                  title="Mover a otra familia"
                               >
                                  <ArrowRightLeft size={14} />
                               </button>
                               <button onClick={() => { if(confirm('¿Eliminar usuario?')) deleteUser(p.id) }} className="text-gray-400 hover:text-red-500 p-1"><X size={14} /></button>
                             </div>
                           </li>
                         ))}
                         {parents.length === 0 && <li className="text-xs text-red-300 italic">Sin padres asignados</li>}
                       </ul>
                    </div>
                    <div>
                       <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Hijos / Alumnos</h5>
                       <ul className="space-y-2">
                         {students.map(s => (
                           <li key={s.id} className="flex items-center justify-between bg-brand-50/50 px-3 py-2 rounded-lg border border-brand-50 hover:bg-brand-50 transition-colors">
                             <div className="flex items-center gap-2">
                               <Avatar config={s.avatarConfig} size={24} />
                               <div className="flex flex-col">
                                 <span className="text-sm font-medium leading-none">{s.name}</span>
                                 <span className="text-[10px] text-gray-500">
                                   PIN: {s.pin} | {classes.find(c => c.id === s.classId)?.name || 'Sin Clase'}
                                 </span>
                               </div>
                             </div>
                             <div className="flex gap-2 items-center">
                                <select 
                                  value={s.classId || ''}
                                  onChange={(e) => updateUser(s.id, { classId: e.target.value })}
                                  className="text-xs border-none bg-transparent text-gray-500 focus:ring-0 cursor-pointer w-20"
                                >
                                   <option value="">Clase?</option>
                                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button 
                                  onClick={() => initiateMoveUser(s)}
                                  className="text-gray-400 hover:text-orange-500"
                                  title="Mover a otra familia"
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                                <button onClick={() => { if(confirm('¿Eliminar alumno?')) deleteUser(s.id) }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                             </div>
                           </li>
                         ))}
                         {students.length === 0 && <li className="text-xs text-gray-300 italic">Sin alumnos asignados</li>}
                       </ul>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-400 text-xs py-4">
           <p className="font-semibold text-gray-500">Cooperativa de Enseñanza La Hispanidad</p>
           <p className="mt-1">Creado por Javi Barrero</p>
        </footer>
      </div>
    );
  };

  const renderTasksTab = () => {
    // Show only school tasks
    const schoolTasks = tasks.filter(t => t.context === 'SCHOOL');
    
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Tareas Escolares</h2>
          {/* Note: Tasks are usually created by Tutors, but we could add an Admin Create button if needed. 
              For now, we focus on editing existing ones as requested. */}
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/50 border-b border-gray-100">
               <tr>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Título de la Tarea</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Creada Por</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Puntos</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {schoolTasks.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-gray-400">No hay tareas escolares activas.</td>
                 </tr>
               )}
               {schoolTasks.map(task => {
                 const creator = users.find(u => u.id === task.createdBy);
                 const isEditing = editingTaskId === task.id;

                 if (isEditing) {
                   return (
                     <tr key={task.id} className="bg-brand-50/50">
                       <td className="p-4">
                         <input 
                           value={editTaskTitle}
                           onChange={e => setEditTaskTitle(e.target.value)}
                           className="w-full px-2 py-1 border rounded bg-white/50"
                           placeholder="Título"
                         />
                       </td>
                       <td className="p-4 text-xs text-gray-500">{creator?.name || task.createdBy}</td>
                       <td className="p-4">
                         <input 
                           type="number"
                           value={editTaskPoints}
                           onChange={e => setEditTaskPoints(Number(e.target.value))}
                           className="w-20 px-2 py-1 border rounded bg-white/50"
                         />
                       </td>
                       <td className="p-4">
                         <button 
                           onClick={() => setEditTaskPriority(!editTaskPriority)}
                           className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${editTaskPriority ? 'bg-red-100 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                         >
                           {editTaskPriority ? 'PRIORIDAD' : 'Normal'}
                         </button>
                       </td>
                       <td className="p-4 text-right flex gap-2 justify-end">
                         <button onClick={saveTask} className="text-green-600 p-1 hover:bg-green-100 rounded"><Save size={18} /></button>
                         <button onClick={() => setEditingTaskId(null)} className="text-gray-500 p-1 hover:bg-gray-200 rounded"><X size={18} /></button>
                       </td>
                     </tr>
                   )
                 }

                 return (
                   <tr key={task.id} className="hover:bg-white/40 transition-colors">
                     <td className="p-4 font-bold text-gray-700">{task.title}</td>
                     <td className="p-4 text-sm text-gray-500">{creator?.name || 'Desconocido'}</td>
                     <td className="p-4 font-mono text-brand-600 font-bold">+{task.points}</td>
                     <td className="p-4">
                       {task.isPriority ? (
                         <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200">PRIORIDAD</span>
                       ) : (
                         <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">NORMAL</span>
                       )}
                     </td>
                     <td className="p-4 text-right">
                       <button onClick={() => startEditingTask(task)} className="text-brand-500 hover:text-brand-700 mr-2"><Edit2 size={18} /></button>
                       <button onClick={() => { if(confirm('¿Eliminar esta tarea para todos los alumnos?')) deleteTask(task.id) }} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                     </td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header - Glass Dark */}
      <header className="glass-dark text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-glass">
         <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain bg-white/10 rounded p-1 backdrop-blur-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                 <Shield size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg">Panel de Administración</h1>
                <p className="text-xs text-white/60">Prisma System</p>
              </div>
           </div>
         </div>
         <div className="flex items-center gap-4">
             <button onClick={() => setShowChangePin(true)} className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
                <Key size={18} /> Cambiar PIN
             </button>
             <button onClick={logout} className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
                <LogOut size={18} /> Salir
             </button>
         </div>
      </header>

      {/* Change PIN Modal */}
      {showChangePin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="glass-panel rounded-xl shadow-glass p-6 w-full max-w-sm animate-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Cambiar PIN de Administrador</h3>
                <input
                  type="text"
                  value={newAdminPin}
                  onChange={e => setNewAdminPin(e.target.value)}
                  maxLength={4}
                  placeholder="Nuevo PIN (4 dígitos)"
                  className="w-full px-4 py-2 border rounded-lg mb-4 text-center font-mono text-xl tracking-widest bg-white/50"
                />
                <div className="flex gap-2">
                   <button onClick={() => setShowChangePin(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-white/50 rounded-lg transition-colors">Cancelar</button>
                   <button onClick={handleChangePin} className="flex-1 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 shadow-glass">Guardar</button>
                </div>
             </div>
          </div>
      )}
      
      {/* Tabs */}
      <div className="glass-header px-6 sticky top-[72px] z-10">
        <div className="flex gap-6 overflow-x-auto">
          <TabButton active={activeTab === 'CLASSES'} onClick={() => setActiveTab('CLASSES')} icon={<School size={18}/>} label="Gestión Clases" />
          <TabButton active={activeTab === 'TUTORS'} onClick={() => setActiveTab('TUTORS')} icon={<GraduationCap size={18}/>} label="Gestión Profesores" />
          <TabButton active={activeTab === 'FAMILIES'} onClick={() => setActiveTab('FAMILIES')} icon={<Users size={18}/>} label="Gestión Familias" />
          <TabButton active={activeTab === 'TASKS'} onClick={() => setActiveTab('TASKS')} icon={<BookOpen size={18}/>} label="Gestión Tareas" />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full flex flex-col">
         {activeTab === 'CLASSES' && renderClassesTab()}
         {activeTab === 'TUTORS' && renderTutorsTab()}
         {activeTab === 'FAMILIES' && renderFamiliesTab()}
         {activeTab === 'TASKS' && renderTasksTab()}
      </main>
    </div>
  );
};

// Subcomponents
const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 py-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
  >
    {icon} {label}
  </button>
);

export default AdminDashboard;