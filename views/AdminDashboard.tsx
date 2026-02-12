import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { isPrime, generateUniquePrime } from '../utils/primes';
import { Role, User, Task } from '../types';
import { Users, School, BookOpen, LogOut, Plus, Trash2, Edit2, Save, X, ChevronRight, UserPlus, GraduationCap, Home, CheckSquare, ArrowRightLeft, Key, Upload, Briefcase, ArrowLeft, User as UserIcon, Printer } from 'lucide-react';
import Avatar from '../components/Avatar';

type AdminTab = 'CLASSES' | 'TUTORS' | 'FAMILIES' | 'TASKS' | 'STAFF';

const getSortKey = (u: User) => {
  if (u.lastName) return u.lastName.toLowerCase();
  const parts = u.name.trim().split(' ');
  // Assume "First Last" or "First Middle Last" -> Sort by "Last..." + "First"
  if (parts.length > 1) {
     return parts.slice(1).join(' ').toLowerCase() + " " + parts[0].toLowerCase();
  }
  return u.name.toLowerCase();
};

const AdminDashboard: React.FC = () => {
  const { logout, users, classes, tasks, addClass, updateClass, deleteClass, addUser, addUsers, updateUser, deleteUser, updateTask, deleteTask, deleteFamily, updateFamilyId, updatePin, setAllUsers, migratePins } = useData();
  const [activeTab, setActiveTab] = useState<AdminTab>('CLASSES');

  // Local state for edits/creation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Class Detail State
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<any | null>(null);
  const [selectedFamilyClass, setSelectedFamilyClass] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPin, setEditStudentPin] = useState('');

  // Generic User Edit State (for Families Tab)
  const [editingUserGeneric, setEditingUserGeneric] = useState<User | null>(null);
  const [editUserGenericName, setEditUserGenericName] = useState('');
  const [editUserGenericPin, setEditUserGenericPin] = useState('');

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTutorsFileRef = useRef<HTMLInputElement>(null);
  const [importingClassId, setImportingClassId] = useState<string | null>(null);

  // Single Student Creation State
  const [addingStudentClassId, setAddingStudentClassId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSurnames, setNewStudentSurnames] = useState('');

  // Creation States
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Tutor & Staff Creation/Editing States
  const [showAddTutor, setShowAddTutor] = useState(false);
  const [editingTutorId, setEditingTutorId] = useState<string | null>(null);
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorClass, setNewTutorClass] = useState('');
  const [newTutorPin, setNewTutorPin] = useState('9999');
  const [newTutorEmail, setNewTutorEmail] = useState('');
  const [newTutorAltPin, setNewTutorAltPin] = useState('');

  // Staff Creation State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<Role>(Role.ADMIN);
  const [newStaffPin, setNewStaffPin] = useState('2222');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffAltPin, setNewStaffAltPin] = useState('');

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

  // Calculated unassigned families (Memoized for performance)
  const unassignedFamilyIds = useMemo(() => {
     const allFamilyIds = Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId!)));
     const validClassIds = new Set(classes.map(c => c.id));
     const assignedFamilies = new Set<string>();

     users.forEach(u => {
         if (u.role === Role.STUDENT && u.classId && validClassIds.has(u.classId) && u.familyId) {
             assignedFamilies.add(u.familyId);
         }
     });

     return allFamilyIds.filter(fid => !assignedFamilies.has(fid));
  }, [users, classes]);

  // Optimized tutors list
  const tutors = useMemo(() => {
    return users
       .filter(u => u.role === Role.TUTOR)
       .sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
  }, [users]);

  // --- HELPERS ---

  const handleAddStudentToClass = () => {
    if (addingStudentClassId && newStudentName && newStudentSurnames) {
      const familyId = `family_${Date.now()}`;
      const fullName = `${newStudentName} ${newStudentSurnames}`;

      const newUsers: Omit<User, 'id'>[] = [
        {
          name: fullName,
          firstName: newStudentName,
          lastName: newStudentSurnames,
          role: Role.STUDENT,
          classId: addingStudentClassId,
          familyId: familyId,
          pin: generateUniquePrime(users.map(u => u.pin)),
          points: 0
        },
        {
          name: `Familia ${newStudentSurnames}`,
          role: Role.PARENT,
          familyId: familyId,
          pin: '0000',
          points: 0
        }
      ];

      addUsers(newUsers);

      setAddingStudentClassId(null);
      setNewStudentName('');
      setNewStudentSurnames('');
      alert('Alumno y familia creados correctamente.');
    }
  };

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
      const usedPins = new Set(users.map(u => u.pin));

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
        const studentPin = generateUniquePrime(Array.from(usedPins));
        usedPins.add(studentPin);

        newUsers.push({
          name: fullName,
          firstName: rawName,
          lastName: rawSurname,
          role: Role.STUDENT,
          classId: importingClassId,
          familyId: familyId,
          pin: studentPin,
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

  const handleImportTutorsCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 1) {
          alert('Archivo vacío.');
          return;
      }

      const newTutors: User[] = [];
      const classesToUpdate = new Set<string>();

      // Check header row to skip it
      let startIndex = 0;
      const header = lines[0].toLowerCase();
      if (header.includes('nombre') || header.includes('apellidos') || header.includes('email')) {
          startIndex = 1;
      }

      let count = 0;

      for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          let nameStr = '';
          let classStr = '';
          let emailStr = '';

          // Check for semicolon delimiter (Excel default in some regions)
          if (line.includes(';')) {
              const parts = line.split(';');
              nameStr = parts[0]?.trim();
              classStr = parts[1]?.trim();
              emailStr = parts[2]?.trim();
          } else {
              // Comma separated. We expect "Surname, Name", Class, Email
              // Regex to split by comma but ignore commas inside quotes
              const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
              const parts = line.split(regex).map(p => p.trim());

              if (parts.length >= 1) {
                  nameStr = parts[0].replace(/^"|"$/g, '').trim();
                  classStr = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : '';
                  emailStr = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : '';
              }
          }

          if (!nameStr) continue;

          // Parse Name: Expected "Apellidos, Nombre"
          let displayName = nameStr;
          let firstName = '';
          let lastName = '';

          if (nameStr.includes(',')) {
              const parts = nameStr.split(',');
              // "Apellidos, Nombre" -> Surname=parts[0], Name=parts[1]
              const rawSurname = parts[0].trim();
              const rawName = parts[1] ? parts[1].trim() : '';
              displayName = `${rawName} ${rawSurname}`.trim();
              firstName = rawName;
              lastName = rawSurname;
          } else {
              displayName = nameStr;
              lastName = nameStr;
          }

          // Find Class ID
          let assignedClassId: string | undefined = undefined;
          if (classStr) {
              const cls = classes.find(c => c.name.toLowerCase() === classStr.toLowerCase());
              if (cls) {
                  assignedClassId = cls.id;
                  classesToUpdate.add(cls.id);
              }
          }

          // Check if user already exists by Email
          const existingUser = users.find(u => u.email === emailStr && u.role === Role.TUTOR);

          if (existingUser) {
              // Update existing user
              newTutors.push({
                  ...existingUser,
                  name: displayName,
                  firstName,
                  lastName,
                  classId: assignedClassId,
                  // Keep existing ID, PIN, etc unless we want to reset them?
                  // Prompt says "El pin para todos, por defecto, es 9999." -> Should we reset PIN?
                  // Usually bulk import might want to reset or keep.
                  // "El pin para todos... es 9999" implies setting it.
                  pin: '9999'
              });
          } else {
              // Create User
              newTutors.push({
                  id: `user_${Date.now()}_imp_${i}_${Math.floor(Math.random() * 1000)}`,
                  name: displayName,
                  firstName,
                  lastName,
                  role: Role.TUTOR,
                  classId: assignedClassId,
                  email: emailStr,
                  pin: '9999',
                  points: 0,
                  avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' },
                  inventory: ['base_1', 'top_1', 'bot_1']
              });
          }
          count++;
      }

      if (count > 0) {
          const finalUsers: User[] = [];

          // 1. Keep non-tutors
          finalUsers.push(...users.filter(u => u.role !== Role.TUTOR));

          // 2. Process existing tutors who were NOT in the import list
          // We need to know which IDs were updated to avoid duplication
          const updatedUserIds = new Set(newTutors.map(u => u.id));

          const existingTutors = users.filter(u => u.role === Role.TUTOR);
          existingTutors.forEach(t => {
              if (updatedUserIds.has(t.id)) {
                  // This user is in the new list (updated), skip adding the old version
                  return;
              }

              // If this tutor's class is being taken over by a newcomer/updated user, unassign them
              if (t.classId && classesToUpdate.has(t.classId)) {
                  finalUsers.push({ ...t, classId: undefined });
              } else {
                  finalUsers.push(t);
              }
          });

          // 3. Add new/updated tutors
          finalUsers.push(...newTutors);

          setAllUsers(finalUsers);
          alert(`Se han importado ${count} profesores correctamente.`);
      } else {
          alert('No se encontraron datos válidos o el formato es incorrecto.');
      }

      if (importTutorsFileRef.current) importTutorsFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCreateTutor = () => {
    if (newTutorName && newTutorPin) {
      if (editingTutorId) {
        updateUser(editingTutorId, {
          name: newTutorName,
          pin: newTutorPin,
          email: newTutorEmail,
          altPin: newTutorAltPin,
          classId: newTutorClass || undefined
        });
        setEditingTutorId(null);
      } else {
        addUser({
          name: newTutorName,
          role: Role.TUTOR,
          pin: newTutorPin,
          email: newTutorEmail,
          altPin: newTutorAltPin,
          classId: newTutorClass || undefined,
          points: 0
        });
      }
      setNewTutorName('');
      setNewTutorClass('');
      setNewTutorPin('9999');
      setNewTutorEmail('');
      setNewTutorAltPin('');
      setShowAddTutor(false);
    }
  };

  const handleEditTutor = (tutor: User) => {
    setEditingTutorId(tutor.id);
    setNewTutorName(tutor.name);
    setNewTutorClass(tutor.classId || '');
    setNewTutorPin(tutor.pin);
    setNewTutorEmail(tutor.email || '');
    setNewTutorAltPin(tutor.altPin || '');
    setShowAddTutor(true);
  };

  const handleCreateStaff = () => {
    if (newStaffName && newStaffPin) {
      addUser({
        name: newStaffName,
        role: newStaffRole,
        pin: newStaffPin,
        email: newStaffEmail,
        altPin: newStaffAltPin,
        points: 0
      });
      setNewStaffName('');
      setNewStaffRole(Role.ADMIN);
      setNewStaffPin('2222');
      setNewStaffEmail('');
      setNewStaffAltPin('');
      setShowAddStaff(false);
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

  const handleEditStudent = (student: User) => {
    setEditingStudent(student);
    setEditStudentName(student.name);
    setEditStudentPin(student.pin);
  };

  const handleSaveStudent = () => {
    if (editingStudent && editStudentName) {
      if (!isPrime(parseInt(editStudentPin))) {
          alert('El PIN debe ser un número primo.');
          return;
      }
      const isDuplicate = users.some(u => u.id !== editingStudent.id && u.pin === editStudentPin);
      if (isDuplicate) {
          alert('Este PIN ya está en uso por otro usuario.');
          return;
      }

      updateUser(editingStudent.id, {
        name: editStudentName,
        pin: editStudentPin
      });
      setEditingStudent(null);
    }
  };

  const handleDeleteStudent = () => {
    if (!editingStudent) return;

    if (confirm('¿Eliminar alumno? Se borrará también su progreso.')) {
      let deleteFamilyToo = false;
      if (editingStudent.familyId) {
        deleteFamilyToo = confirm('¿Quieres borrar también a la familia asociada (Padres y hermanos)?');
      }

      if (deleteFamilyToo && editingStudent.familyId) {
        deleteFamily(editingStudent.familyId);
      } else {
        deleteUser(editingStudent.id);
      }
      setEditingStudent(null);
    }
  };

  const handleDeleteAllStudents = () => {
    if (!selectedClassForDetail) return;
    const classId = selectedClassForDetail.id;
    const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === classId);

    if (studentsInClass.length === 0) {
      alert("No hay alumnos en esta clase.");
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar a los ${studentsInClass.length} alumnos de esta clase? Esta acción no se puede deshacer.`)) {
      const deleteFamilies = confirm('¿Quieres eliminar también a las familias de estos alumnos?');

      let newUsers = [...users];

      // Identify users to remove
      const usersToDelete = new Set<string>();

      studentsInClass.forEach(s => {
        usersToDelete.add(s.id);
        if (deleteFamilies && s.familyId) {
          // Find all family members (parents, siblings, etc.)
          const familyMembers = users.filter(u => u.familyId === s.familyId);
          familyMembers.forEach(m => usersToDelete.add(m.id));
        }
      });

      newUsers = newUsers.filter(u => !usersToDelete.has(u.id));
      setAllUsers(newUsers);
      alert('Alumnos eliminados correctamente.');
    }
  };

  const handleMigratePins = async () => {
    if (confirm('ATENCIÓN: Esto cambiará los PINs de TODAS las familias y alumnos a números primos aleatorios únicos. ¿Estás seguro de continuar?')) {
      try {
        const result = await migratePins();
        alert(`Migración completada. Se han actualizado ${result.count} usuarios.`);
      } catch (e: any) {
        alert('Error durante la migración: ' + e);
      }
    }
  };

  const handleEditGenericUser = (user: User) => {
    setEditingUserGeneric(user);
    setEditUserGenericName(user.name);
    setEditUserGenericPin(user.pin);
  };

  const handleSaveGenericUser = () => {
    if (editingUserGeneric && editUserGenericName) {
      if ((editingUserGeneric.role === Role.STUDENT || editingUserGeneric.role === Role.PARENT) && !isPrime(parseInt(editUserGenericPin))) {
          if (!confirm('El PIN introducido NO es un número primo. El sistema recomienda números primos para evitar colisiones en la generación automática. ¿Deseas guardarlo de todas formas?')) {
             return;
          }
      }

      // Check Uniqueness in Class (Essential for Family Login)
      if (editingUserGeneric.role === Role.STUDENT && editingUserGeneric.classId) {
          const classPeers = users.filter(u => u.classId === editingUserGeneric.classId && u.id !== editingUserGeneric.id);
          const collision = classPeers.find(u => u.pin === editUserGenericPin);
          if (collision) {
              alert(`Error: El PIN ya está siendo usado por ${collision.name} en esta misma clase. Los PINs deben ser únicos por clase.`);
              return;
          }
      }

      updateUser(editingUserGeneric.id, {
        name: editUserGenericName,
        pin: editUserGenericPin
      });
      setEditingUserGeneric(null);
    }
  };

  const handlePrintClassPins = () => {
    if (!selectedFamilyClass) return;

    let studentsInClass: User[] = [];
    if (selectedFamilyClass.id === 'unassigned') {
        studentsInClass = users.filter(u => u.role === Role.STUDENT && !u.classId);
    } else {
        studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedFamilyClass.id);
    }

    // Sort
    studentsInClass.sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permite ventanas emergentes para imprimir.');
        return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Fichas de Acceso - ${selectedFamilyClass.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .card { border: 2px dashed #ccc; padding: 20px; border-radius: 10px; page-break-inside: avoid; }
            .header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .logo { height: 50px; }
            .school-name { font-size: 14px; color: #666; font-weight: bold; }
            .role-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
            .role-student { background: #e0e7ff; color: #4338ca; }
            .role-parent { background: #ffedd5; color: #c2410c; }
            .name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .pin-box { background: #f3f4f6; padding: 10px; text-align: center; border-radius: 8px; margin-top: 10px; }
            .pin-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .pin-code { font-size: 24px; font-family: monospace; font-weight: bold; color: #111; letter-spacing: 5px; }
            .footer { margin-top: 15px; font-size: 10px; color: #999; text-align: center; }
            @media print {
               .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: center;">
             <button onclick="window.print()" style="font-size: 16px; padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir Fichas</button>
             <p>Utiliza la configuración de impresión de tu navegador para ajustar márgenes y escala.</p>
          </div>
          <h1 style="text-align: center; margin-bottom: 30px;">Claves de Acceso - ${selectedFamilyClass.name}</h1>
          <div class="grid">
            ${studentsInClass.map(student => {
                // Find Parent
                const parent = users.find(u => u.familyId === student.familyId && u.role === Role.PARENT);

                const studentCard = `
                  <div class="card">
                     <div class="header">
                        <img src="/logo.png" class="logo" onerror="this.style.display='none'"/>
                        <div>
                           <div class="school-name">CE La Hispanidad</div>
                           <div class="school-name" style="font-weight: normal; font-size: 12px;">Prisma System</div>
                        </div>
                     </div>
                     <span class="role-badge role-student">Alumno / Estudiante</span>
                     <div class="name">${student.name}</div>
                     <div style="font-size: 12px; color: #666;">Clase: ${selectedFamilyClass.name}</div>

                     <div class="pin-box">
                        <div class="pin-label">PIN DE ACCESO</div>
                        <div class="pin-code">${student.pin}</div>
                     </div>
                     <div class="footer">Este PIN es personal e intransferible.</div>
                  </div>
                `;

                let parentCard = '';
                if (parent) {
                    parentCard = `
                      <div class="card">
                         <div class="header">
                            <img src="/logo.png" class="logo" onerror="this.style.display='none'"/>
                            <div>
                               <div class="school-name">CE La Hispanidad</div>
                               <div class="school-name" style="font-weight: normal; font-size: 12px;">Prisma System</div>
                            </div>
                         </div>
                         <span class="role-badge role-parent">Familia / Tutor Legal</span>
                         <div class="name">${parent.name}</div>
                         <div style="font-size: 12px; color: #666;">Familia de: ${student.name}</div>

                         <div class="pin-box">
                            <div class="pin-label">PIN DE ACCESO</div>
                            <div class="pin-code">${parent.pin}</div>
                         </div>
                         <div class="footer">Accede seleccionando tu clase y familia.</div>
                      </div>
                    `;
                } else {
                    parentCard = `<div class="card" style="border-style: dotted; opacity: 0.5; display: flex; align-items: center; justify-content: center;">Sin Familia Asignada</div>`;
                }

                return studentCard + parentCard;
            }).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- RENDERERS ---

  const renderClassDetail = () => {
    if (!selectedClassForDetail) return null;

    const classTutor = users.find(u => u.role === Role.TUTOR && u.classId === selectedClassForDetail.id);
    const classStudents = users
      .filter(u => u.role === Role.STUDENT && u.classId === selectedClassForDetail.id)
      .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button
               onClick={() => setSelectedClassForDetail(null)}
               className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
             >
               <ArrowLeft size={24} className="text-white/60"/>
             </button>
             <div>
               <h2 className="text-2xl font-display font-bold text-white/90">{selectedClassForDetail.name}</h2>
               <p className="text-white/40 text-sm font-body">{classStudents.length} alumnos matriculados</p>
             </div>
           </div>

           <div className="flex gap-2">
             <button
                onClick={() => { setAddingStudentClassId(selectedClassForDetail.id); setNewStudentName(''); setNewStudentSurnames(''); }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <UserPlus size={18} /> Añadir Alumno
              </button>
              <button
                onClick={() => handleImportCSV(selectedClassForDetail.id)}
                className="btn-ghost flex items-center gap-2 text-sm !bg-emerald-500/15 !border-emerald-500/25 !text-emerald-300 hover:!bg-emerald-500/25"
              >
                <Upload size={18} /> Importar CSV
              </button>
              <button
                onClick={handleDeleteAllStudents}
                className="btn-ghost flex items-center gap-2 text-sm !bg-red-500/15 !border-red-500/25 !text-red-400 hover:!bg-red-500/25"
                title="Eliminar todos los alumnos"
              >
                <Trash2 size={18} />
              </button>
           </div>
        </div>

        {/* Tutor Section */}
        <div className="glass rounded-2xl glow-border-blue p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-white/90 text-lg">Tutor/a del Grupo</h3>
                {classTutor ? (
                  <p className="text-white/60 font-body">{classTutor.name} <span className="text-white/30 text-sm">({classTutor.email})</span></p>
                ) : (
                  <p className="text-red-400/70 italic font-body">Sin tutor asignado</p>
                )}
              </div>
           </div>
           {classTutor ? (
             <button onClick={() => { setActiveTab('TUTORS'); handleEditTutor(classTutor); }} className="text-primary-400 font-bold hover:text-primary-300 text-sm transition-colors">
               Gestionar Tutor
             </button>
           ) : (
             <button onClick={() => setActiveTab('TUTORS')} className="text-primary-400 font-bold hover:text-primary-300 text-sm transition-colors">
               Asignar Tutor
             </button>
           )}
        </div>

        {/* Adding Student Form (Contextual) */}
        {addingStudentClassId === selectedClassForDetail.id && (
             <div className="glass-light rounded-2xl glow-border-blue p-6 flex items-center gap-3 animate-slide-up">
               <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider mr-2">Nuevo Alumno:</span>
               <input
                 value={newStudentName}
                 onChange={e => setNewStudentName(e.target.value)}
                 placeholder="Nombre"
                 className="input-glass flex-1"
               />
               <input
                 value={newStudentSurnames}
                 onChange={e => setNewStudentSurnames(e.target.value)}
                 placeholder="Apellidos"
                 className="input-glass flex-1"
               />
               <button onClick={handleAddStudentToClass} className="btn-primary !p-2.5"><CheckSquare size={20}/></button>
               <button onClick={() => setAddingStudentClassId(null)} className="text-white/30 hover:text-white/60 p-2 transition-colors"><X size={20}/></button>
             </div>
        )}

        {/* Students List */}
        <div className="glass rounded-2xl shadow-glass overflow-hidden">
           <div className="px-4 py-3 border-b border-white/10 glass-light flex justify-between items-center">
              <h3 className="font-display font-bold text-white/80">Listado de Alumnos</h3>
              <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Pinchar para editar</span>
           </div>

           <div className="divide-y divide-white/5">
             {classStudents.length === 0 && <p className="p-8 text-center text-white/30 font-body">No hay alumnos en esta clase.</p>}
             {classStudents.map(student => (
               <div
                 key={student.id}
                 onClick={() => handleEditStudent(student)}
                 className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group"
               >
                  <div className="flex items-center gap-4">
                     <Avatar config={student.avatarConfig} size={40} />
                     <div>
                       <p className="font-bold text-white/90 font-body">{student.name}</p>
                       <p className="text-xs text-white/30 font-mono">PIN: {student.pin} | Puntos: {student.points}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-bold text-primary-400 bg-primary-500/15 px-2 py-1 rounded-lg">EDITAR</span>
                     <ChevronRight size={16} className="text-primary-400/60" />
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Edit Student Modal */}
        {editingStudent && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
             <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glass-lg modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-display font-bold text-white/90">Editar Alumno</h3>
                   <button onClick={() => setEditingStudent(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={24}/></button>
                </div>

                <div className="space-y-4 mb-6">
                   <div>
                     <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Nombre Completo</label>
                     <input
                       value={editStudentName}
                       onChange={e => setEditStudentName(e.target.value)}
                       className="input-glass w-full"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">PIN de Acceso</label>
                     <input
                       value={editStudentPin}
                       onChange={e => setEditStudentPin(e.target.value)}
                       maxLength={4}
                       className="input-glass w-full font-mono"
                     />
                   </div>
                   <div className="p-3 glass rounded-xl text-xs text-white/40 font-body">
                     <p>Familia vinculada: <span className="font-bold text-white/70">{users.find(u => u.familyId === editingStudent.familyId && u.role === Role.PARENT)?.name || 'Desconocida'}</span></p>
                     <p>ID Familia: {editingStudent.familyId}</p>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button
                     onClick={handleDeleteStudent}
                     className="btn-ghost !text-red-400 !border-red-500/20 hover:!bg-red-500/15"
                   >
                     Eliminar
                   </button>
                   <div className="flex-1"></div>
                   <button onClick={() => setEditingStudent(null)} className="btn-ghost">Cancelar</button>
                   <button onClick={handleSaveStudent} className="btn-primary">Guardar</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderClassesTab = () => {
    if (selectedClassForDetail) {
      return renderClassDetail();
    }

    return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-white/90">Clases del Colegio</h2>
        <button onClick={() => setShowAddClass(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Añadir Clase
        </button>
      </div>

      {showAddClass && (
        <div className="glass-light rounded-2xl glow-border-blue p-4 flex items-center gap-2 animate-slide-up">
          <input
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Nombre de la clase (ej. 3º A)"
            className="input-glass flex-1"
          />
          <button onClick={handleCreateClass} className="btn-primary !p-2.5"><Save size={20}/></button>
          <button onClick={() => setShowAddClass(false)} className="btn-ghost !p-2.5"><X size={20}/></button>
        </div>
      )}

      <div className="glass rounded-2xl shadow-glass overflow-hidden divide-y divide-white/5">
        {classes.length === 0 && <p className="p-8 text-center text-white/30 font-body">No hay clases registradas.</p>}
        {classes.map(cls => (
          <React.Fragment key={cls.id}>
          <div
             className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
             onClick={() => setSelectedClassForDetail(cls)}
          >
            {editingId === cls.id ? (
              <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                 <input
                   value={editName}
                   onChange={e => setEditName(e.target.value)}
                   className="input-glass flex-1"
                 />
                 <button onClick={() => { updateClass(cls.id, editName); setEditingId(null); }} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Save size={18} /></button>
                 <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-display font-bold">
                    {cls.name.charAt(0)}
                 </div>
                 <div>
                    <span className="font-bold text-white/90 block font-body">{cls.name}</span>
                    <span className="text-xs text-white/30">{users.filter(u => u.classId === cls.id && u.role === Role.STUDENT).length} alumnos</span>
                 </div>
              </div>
            )}

            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setEditingId(cls.id); setEditName(cls.name); }} className="p-2 text-white/20 hover:text-primary-400 transition-colors"><Edit2 size={18} /></button>
              <button onClick={() => { if(confirm('¿Borrar clase?')) deleteClass(cls.id) }} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
              <ChevronRight size={20} className="text-white/15 ml-2" />
            </div>
          </div>
          </React.Fragment>
        ))}
      </div>
    </div>
    );
  };

  const renderTutorsTab = () => {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-white/90">Profesores / Tutores</h2>
          <div className="flex gap-2">
            <button onClick={() => importTutorsFileRef.current?.click()} className="btn-ghost flex items-center gap-2 !bg-emerald-500/15 !border-emerald-500/25 !text-emerald-300 hover:!bg-emerald-500/25">
                <Upload size={18} /> Importar CSV
            </button>
            <button onClick={() => { setEditingTutorId(null); setNewTutorName(''); setNewTutorClass(''); setNewTutorPin('9999'); setNewTutorEmail(''); setNewTutorAltPin(''); setShowAddTutor(true); }} className="btn-primary flex items-center gap-2">
                <Plus size={18} /> Añadir Profesor
            </button>
          </div>
        </div>

        {showAddTutor && (
          <div className="glass-light rounded-2xl glow-border-blue p-4 grid gap-3 animate-slide-up">
            <h4 className="font-display font-bold text-primary-300 text-sm">{editingTutorId ? 'Editar Profesor' : 'Nuevo Profesor'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={newTutorName} onChange={e => setNewTutorName(e.target.value)} placeholder="Nombre" className="input-glass" />
              <input value={newTutorEmail} onChange={e => setNewTutorEmail(e.target.value)} placeholder="Email (Google Auth)" className="input-glass" />
              <select value={newTutorClass} onChange={e => setNewTutorClass(e.target.value)} className="input-glass">
                <option value="">Sin Clase Asignada</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={newTutorPin} onChange={e => setNewTutorPin(e.target.value)} placeholder="PIN (4 dígitos)" maxLength={4} className="input-glass" />
              <input value={newTutorAltPin} onChange={e => setNewTutorAltPin(e.target.value)} placeholder="PIN Alternativo" maxLength={4} className="input-glass" />
            </div>
            <div className="flex gap-2 justify-end">
               <button onClick={() => setShowAddTutor(false)} className="btn-ghost text-sm">Cancelar</button>
               <button onClick={handleCreateTutor} className="btn-primary text-sm">Guardar</button>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl shadow-glass overflow-hidden">
          <table className="w-full text-left">
            <thead className="glass-light border-b border-white/10">
               <tr>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Nombre</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Clase Asignada</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">PIN</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {tutors.map(tutor => (
                 <tr key={tutor.id} className="hover:bg-white/5 transition-colors">
                   <td className="p-4 font-bold text-white/90 font-body">{tutor.name}</td>
                   <td className="p-4">
                      <select
                        value={tutor.classId || ''}
                        onChange={(e) => updateUser(tutor.id, { classId: e.target.value })}
                        className="input-glass text-sm !py-1 !px-2 !rounded-lg"
                      >
                         <option value="">-- Ninguna --</option>
                         {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </td>
                   <td className="p-4 font-mono text-white/40">{tutor.pin}</td>
                   <td className="p-4 text-right flex items-center justify-end gap-2">
                     <button onClick={() => handleEditTutor(tutor)} className="text-white/20 hover:text-primary-400 transition-colors"><Edit2 size={18} /></button>
                     <button onClick={() => { if(confirm('¿Eliminar profesor?')) deleteUser(tutor.id) }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
        <input
            type="file"
            ref={importTutorsFileRef}
            onChange={handleImportTutorsCSV}
            accept=".csv"
            className="hidden"
        />
      </div>
    );
  };

  const renderStaffTab = () => {
    const staff = users
       .filter(u => u.role === Role.ADMIN || u.role === Role.DIRECCION || u.role === Role.TESORERIA)
       .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-white/90">Personal del Centro</h2>
          <button onClick={() => setShowAddStaff(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Añadir Personal
          </button>
        </div>

        {showAddStaff && (
          <div className="glass-light rounded-2xl glow-border-purple p-4 grid gap-3 animate-slide-up">
            <h4 className="font-display font-bold text-accent-300 text-sm">Nuevo Usuario Personal</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Nombre" className="input-glass" />
              <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as Role)} className="input-glass">
                <option value={Role.ADMIN}>Administrador</option>
                <option value={Role.DIRECCION}>Dirección</option>
                <option value={Role.TESORERIA}>Tesorería</option>
              </select>
              <input value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} placeholder="Email (Opcional)" className="input-glass" />
              <input value={newStaffPin} onChange={e => setNewStaffPin(e.target.value)} placeholder="PIN (4 dígitos)" maxLength={4} className="input-glass" />
              <input value={newStaffAltPin} onChange={e => setNewStaffAltPin(e.target.value)} placeholder="PIN Alternativo" maxLength={4} className="input-glass" />
            </div>
            <div className="flex gap-2 justify-end">
               <button onClick={() => setShowAddStaff(false)} className="btn-ghost text-sm">Cancelar</button>
               <button onClick={handleCreateStaff} className="btn-primary text-sm">Guardar</button>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl shadow-glass overflow-hidden">
          <table className="w-full text-left">
            <thead className="glass-light border-b border-white/10">
               <tr>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Nombre</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Rol</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Email</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">PIN</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {staff.map(user => (
                 <tr key={user.id} className="hover:bg-white/5 transition-colors">
                   <td className="p-4 font-bold text-white/90 font-body">{user.name}</td>
                   <td className="p-4">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                       user.role === Role.ADMIN ? 'bg-white/10 text-white/60' :
                       user.role === Role.DIRECCION ? 'bg-accent-500/15 text-accent-300' :
                       'bg-emerald-500/15 text-emerald-300'
                     }`}>
                       {user.role}
                     </span>
                   </td>
                   <td className="p-4 text-sm text-white/40 font-body">{user.email || '-'}</td>
                   <td className="p-4 font-mono text-white/40">{user.pin}</td>
                   <td className="p-4 text-right">
                     {user.id !== 'admin' && (
                       <button onClick={() => { if(confirm('¿Eliminar usuario?')) deleteUser(user.id) }} className="text-white/15 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                     )}
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
    // Helper to get family name from ID
    const getFamilyName = (id: string) => {
      // Find students in this family
      const students = users.filter(u => u.familyId === id && u.role === Role.STUDENT);

      if (students.length > 0) {
        // Use the first student's name
        const student = students[0];
        // If firstName and lastName are available, use them to construct "Familia de [ChildName] [ChildSurname]"
        if (student.firstName && student.lastName) {
           const firstSurname = student.lastName.split(' ')[0];
           return `Familia de ${student.firstName} ${firstSurname}`;
        } else {
           // Fallback if structured names are missing
           return `Familia de ${student.name}`;
        }
      }

      const parent = users.find(u => u.familyId === id && u.role === Role.PARENT);
      return parent ? `Familia de ${parent.name.split(' ')[0]}` : `Familia ${id}`;
    };

    if (!selectedFamilyClass) {
        // Calculate unassigned families
        const unassignedFamiliesCount = unassignedFamilyIds.length;

        return (
            <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-display font-bold text-white/90">Familias por Clase</h2>
                    <div className="flex gap-2">
                        <button onClick={handleMigratePins} className="btn-ghost flex items-center gap-2 text-sm !bg-red-500/15 !border-red-500/25 !text-red-400 hover:!bg-red-500/25" title="Actualizar PINs a Primos Aleatorios">
                            <Key size={18} /> Reasignar PINs (Migración)
                        </button>
                        <button onClick={() => setShowAddFamily(true)} className="btn-primary flex items-center gap-2 text-sm !bg-gradient-to-r !from-secondary-500 !to-orange-500 shadow-neon-orange">
                            <Plus size={18} /> Nueva Familia
                        </button>
                    </div>
                </div>

                {showAddFamily && (
                   <div className="glass-light rounded-2xl glow-border-orange p-4 flex flex-col md:flex-row gap-3 items-end mb-4 animate-slide-up">
                     <div className="flex-1 w-full">
                       <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Nombre Primer Progenitor</label>
                       <input value={newParentName} onChange={e => setNewParentName(e.target.value)} className="input-glass w-full mt-1" placeholder="Ej. Juan Pérez" />
                     </div>
                     <div className="w-24">
                       <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider">PIN</label>
                       <input value={newParentPin} onChange={e => setNewParentPin(e.target.value)} className="input-glass w-full mt-1" maxLength={4} />
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => setShowAddFamily(false)} className="btn-ghost text-sm">Cancelar</button>
                       <button onClick={handleCreateFamily} className="btn-primary text-sm !bg-gradient-to-r !from-secondary-500 !to-orange-500">Crear</button>
                     </div>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls, idx) => {
                        const studentsCount = users.filter(u => u.classId === cls.id && u.role === Role.STUDENT).length;
                        return (
                            <div
                                key={cls.id}
                                onClick={() => setSelectedFamilyClass(cls)}
                                className={`glass rounded-2xl glow-border-orange p-6 cursor-pointer hover:bg-white/10 transition-all group animate-scale-in stagger-${Math.min(idx + 1, 8)}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center text-secondary-400 group-hover:bg-secondary-500/30 transition-colors">
                                        <Users size={24} />
                                    </div>
                                    <ChevronRight size={24} className="text-white/15 group-hover:text-secondary-400 transition-colors" />
                                </div>
                                <h3 className="font-display font-bold text-xl text-white/90">{cls.name}</h3>
                                <p className="text-white/40 text-sm font-body">{studentsCount} alumnos</p>
                            </div>
                        );
                    })}

                    {/* Unassigned Families Card */}
                    <div
                        onClick={() => setSelectedFamilyClass({ id: 'unassigned', name: 'Sin Asignar / Otros' })}
                        className="glass rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all group animate-scale-in"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover:bg-white/15 transition-colors">
                                <Users size={24} />
                            </div>
                            <ChevronRight size={24} className="text-white/15 group-hover:text-white/40 transition-colors" />
                        </div>
                        <h3 className="font-display font-bold text-xl text-white/70">Sin Asignar</h3>
                        <p className="text-white/30 text-sm font-body">{unassignedFamiliesCount} familias</p>
                    </div>
                </div>
            </div>
        );
    }

    // Detail View
    let familyIds: string[] = [];

    if (selectedFamilyClass.id === 'unassigned') {
         familyIds = unassignedFamilyIds;
    } else {
         const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedFamilyClass.id);
         familyIds = Array.from(new Set(studentsInClass.map(s => s.familyId).filter(Boolean))) as string[];
    }

    // Sort families
    familyIds.sort((a, b) => getFamilyName(a).localeCompare(getFamilyName(b)));

    return (
      <div className="space-y-6 animate-fade-in">
         <div className="flex items-center gap-4">
             <button
               onClick={() => setSelectedFamilyClass(null)}
               className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
             >
               <ArrowLeft size={24} className="text-white/60"/>
             </button>
             <div>
               <h2 className="text-2xl font-display font-bold text-white/90">Familias - {selectedFamilyClass.name}</h2>
               <p className="text-white/40 text-sm font-body">{familyIds.length} familias asociadas</p>
             </div>
         </div>

         <div className="flex justify-end">
             <button
                onClick={handlePrintClassPins}
                className="btn-ghost flex items-center gap-2 text-sm"
             >
                <Printer size={18} /> Imprimir Claves (PDF)
             </button>
         </div>

        {/* Move User Modal */}
        {userToMove && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
             <div className="glass-strong rounded-3xl shadow-glass-lg w-full max-w-sm overflow-hidden modal-content">
                <div className="p-4 glass-light border-b border-white/10 flex justify-between items-center">
                   <h3 className="font-display font-bold text-secondary-300">Mover Usuario de Familia</h3>
                   <button onClick={() => setUserToMove(null)}><X size={20} className="text-white/30 hover:text-white/60 transition-colors" /></button>
                </div>
                <div className="p-6">
                   <p className="text-sm text-white/60 mb-4 font-body">
                     Selecciona la nueva familia para <span className="font-bold text-white/90">{userToMove.name}</span>:
                   </p>
                   <select
                      value={destinationFamilyId}
                      onChange={(e) => setDestinationFamilyId(e.target.value)}
                      className="input-glass w-full mb-6"
                   >
                     <option value="" disabled>Selecciona familia...</option>
                     {/* Show all families here for moving, not just class families */}
                     {Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId!))).map(fid => (
                       <option key={fid} value={fid}>{getFamilyName(fid)}</option>
                     ))}
                   </select>

                   <div className="flex gap-3">
                      <button onClick={() => setUserToMove(null)} className="btn-ghost flex-1">Cancelar</button>
                      <button onClick={confirmMoveUser} className="btn-primary flex-1 !bg-gradient-to-r !from-secondary-500 !to-orange-500">
                        Confirmar
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Generic User Edit Modal */}
        {editingUserGeneric && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
             <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glass-lg modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-display font-bold text-white/90">Editar Usuario</h3>
                   <button onClick={() => setEditingUserGeneric(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={24}/></button>
                </div>

                <div className="space-y-4 mb-6">
                   <div>
                     <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Nombre</label>
                     <input
                       value={editUserGenericName}
                       onChange={e => setEditUserGenericName(e.target.value)}
                       className="input-glass w-full"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">PIN de Acceso</label>
                     <input
                       value={editUserGenericPin}
                       onChange={e => setEditUserGenericPin(e.target.value)}
                       maxLength={4}
                       className="input-glass w-full font-mono"
                     />
                   </div>
                   <p className="text-xs text-white/30 italic font-body">
                       * Nota: Se recomienda usar números primos para evitar colisiones, pero puedes asignar cualquier PIN manualmente si lo deseas.
                   </p>
                </div>

                <div className="flex justify-end gap-3">
                   <button onClick={() => setEditingUserGeneric(null)} className="btn-ghost">Cancelar</button>
                   <button onClick={handleSaveGenericUser} className="btn-primary">Guardar</button>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
           {familyIds.length === 0 && <p className="text-center text-white/30 p-8 font-body">No hay familias vinculadas a esta clase.</p>}
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
               <div key={famId} className="glass rounded-2xl shadow-glass overflow-hidden">
                 <div className="glass-light px-4 py-3 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-1">
                       <Home size={18} className="text-secondary-400" />
                       <span className="font-bold text-white/80 font-body">{familyName}</span>

                       {isEditing ? (
                         <div className="flex items-center gap-2">
                            <input
                              value={newFamilyIdString}
                              onChange={e => setNewFamilyIdString(e.target.value)}
                              className="input-glass !py-0.5 !px-2 text-xs"
                            />
                            <button onClick={() => handleSaveFamily(famId)} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Save size={16} /></button>
                            <button onClick={() => setEditingFamilyId(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={16} /></button>
                         </div>
                       ) : (
                         <span className="text-[10px] text-white/20 glass px-2 py-0.5 rounded-lg font-mono">{famId}</span>
                       )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleEditFamily(famId)}
                            className="text-white/20 hover:text-primary-400 p-1 rounded transition-colors"
                            title="Editar ID Familia"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFamily(famId)}
                            className="text-white/20 hover:text-red-400 p-1 rounded transition-colors"
                            title="Eliminar Familia Completa"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="w-px h-4 bg-white/10 mx-1"></div>
                        </>
                      )}

                      <button
                        onClick={() => setAddingMemberToFamily(famId)}
                        className="btn-ghost text-xs !px-3 !py-1 flex items-center gap-1"
                      >
                        <UserPlus size={14} /> Añadir Miembro
                      </button>
                    </div>
                 </div>

                 {/* Adding Member Form */}
                 {addingMemberToFamily === famId && (
                   <div className="glass-light p-4 border-b border-white/10 animate-slide-up">
                      <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Nuevo Miembro para {familyName}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                        <select
                          value={newMemberRole}
                          onChange={e => setNewMemberRole(e.target.value as Role)}
                          className="input-glass text-sm"
                        >
                          <option value={Role.PARENT}>Padre/Madre</option>
                          <option value={Role.STUDENT}>Alumno/Hijo</option>
                        </select>
                        <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nombre" className="input-glass text-sm" />
                        <input value={newMemberPin} onChange={e => setNewMemberPin(e.target.value)} placeholder="PIN" maxLength={4} className="input-glass text-sm" />

                        {newMemberRole === Role.STUDENT && (
                          <select value={newMemberClass} onChange={e => setNewMemberClass(e.target.value)} className="input-glass text-sm">
                             <option value="">Clase...</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setAddingMemberToFamily(null)} className="btn-ghost text-xs !px-3 !py-1">Cancelar</button>
                         <button onClick={handleAddMember} className="btn-primary text-xs !px-3 !py-1">Guardar Miembro</button>
                      </div>
                   </div>
                 )}

                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Padres / Tutores</h5>
                       <ul className="space-y-2">
                         {parents.map(p => (
                           <li key={p.id} className="flex items-center justify-between glass rounded-xl px-3 py-2">
                             <span className="text-sm font-medium text-white/80 font-body">{p.name} <span className="text-white/30 text-xs font-mono ml-1">PIN: {p.pin}</span></span>
                             <div className="flex items-center gap-1">
                               <button
                                  onClick={() => handleEditGenericUser(p)}
                                  className="text-white/20 hover:text-primary-400 p-1 transition-colors"
                                  title="Editar PIN/Nombre"
                               >
                                  <Edit2 size={14} />
                               </button>
                               <button
                                  onClick={() => initiateMoveUser(p)}
                                  className="text-white/20 hover:text-secondary-400 p-1 transition-colors"
                                  title="Mover a otra familia"
                               >
                                  <ArrowRightLeft size={14} />
                               </button>
                               <button onClick={() => { if(confirm('¿Eliminar usuario?')) deleteUser(p.id) }} className="text-white/15 hover:text-red-400 p-1 transition-colors"><X size={14} /></button>
                             </div>
                           </li>
                         ))}
                         {parents.length === 0 && <li className="text-xs text-red-400/50 italic font-body">Sin padres asignados</li>}
                       </ul>
                    </div>
                    <div>
                       <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Hijos / Alumnos</h5>
                       <ul className="space-y-2">
                         {students.map(s => (
                           <li key={s.id} className="flex items-center justify-between glass rounded-xl px-3 py-2 glow-border-blue">
                             <div className="flex items-center gap-2">
                               <Avatar config={s.avatarConfig} size={24} />
                               <div className="flex flex-col">
                                 <span className="text-sm font-medium text-white/90 leading-none font-body">{s.name}</span>
                                 <span className="text-[10px] text-white/30 font-mono">
                                   PIN: {s.pin} | {classes.find(c => c.id === s.classId)?.name || 'Sin Clase'}
                                 </span>
                               </div>
                             </div>
                             <div className="flex gap-2 items-center">
                                <select
                                  value={s.classId || ''}
                                  onChange={(e) => updateUser(s.id, { classId: e.target.value })}
                                  className="input-glass text-xs !py-0 !px-1 !rounded-lg !border-transparent !bg-transparent text-white/40 w-20"
                                >
                                   <option value="">Clase?</option>
                                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button
                                  onClick={() => handleEditGenericUser(s)}
                                  className="text-white/20 hover:text-primary-400 transition-colors"
                                  title="Editar PIN/Nombre"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => initiateMoveUser(s)}
                                  className="text-white/20 hover:text-secondary-400 transition-colors"
                                  title="Mover a otra familia"
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                                <button onClick={() => { if(confirm('¿Eliminar alumno?')) deleteUser(s.id) }} className="text-white/15 hover:text-red-400 transition-colors"><X size={14} /></button>
                             </div>
                           </li>
                         ))}
                         {students.length === 0 && <li className="text-xs text-white/20 italic font-body">Sin alumnos asignados</li>}
                       </ul>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/20 text-xs py-4">
           <p className="font-semibold text-white/30">Cooperativa de Enseñanza La Hispanidad</p>
           <p className="mt-1">Creado por Javi Barrero</p>
        </footer>
      </div>
    );
  };

  const renderTasksTab = () => {
    // Show only school tasks
    const schoolTasks = tasks.filter(t => t.context === 'SCHOOL');

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-white/90">Tareas Escolares</h2>
          {/* Note: Tasks are usually created by Tutors, but we could add an Admin Create button if needed.
              For now, we focus on editing existing ones as requested. */}
        </div>

        <div className="glass rounded-2xl shadow-glass overflow-hidden">
          <table className="w-full text-left">
            <thead className="glass-light border-b border-white/10">
               <tr>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Título de la Tarea</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Creada Por</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Puntos</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">Estado</th>
                 <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-wider text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {schoolTasks.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-white/30 font-body">No hay tareas escolares activas.</td>
                 </tr>
               )}
               {schoolTasks.map(task => {
                 const creator = users.find(u => u.id === task.createdBy);
                 const isEditing = editingTaskId === task.id;

                 if (isEditing) {
                   return (
                     <tr key={task.id} className="bg-primary-500/10">
                       <td className="p-4">
                         <input
                           value={editTaskTitle}
                           onChange={e => setEditTaskTitle(e.target.value)}
                           className="input-glass w-full"
                           placeholder="Título"
                         />
                       </td>
                       <td className="p-4 text-xs text-white/40 font-body">{creator?.name || task.createdBy}</td>
                       <td className="p-4">
                         <input
                           type="number"
                           value={editTaskPoints}
                           onChange={e => setEditTaskPoints(Number(e.target.value))}
                           className="input-glass w-20"
                         />
                       </td>
                       <td className="p-4">
                         <button
                           onClick={() => setEditTaskPriority(!editTaskPriority)}
                           className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${editTaskPriority ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}
                         >
                           {editTaskPriority ? 'PRIORIDAD' : 'Normal'}
                         </button>
                       </td>
                       <td className="p-4 text-right flex gap-2 justify-end">
                         <button onClick={saveTask} className="text-emerald-400 p-1 hover:bg-emerald-500/15 rounded-lg transition-colors"><Save size={18} /></button>
                         <button onClick={() => setEditingTaskId(null)} className="text-white/30 p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
                       </td>
                     </tr>
                   )
                 }

                 return (
                   <tr key={task.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 font-bold text-white/90 font-body">{task.title}</td>
                     <td className="p-4 text-sm text-white/40 font-body">{creator?.name || 'Desconocido'}</td>
                     <td className="p-4 font-mono text-primary-400 font-bold">+{task.points}</td>
                     <td className="p-4">
                       {task.isPriority ? (
                         <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg">PRIORIDAD</span>
                       ) : (
                         <span className="bg-white/10 text-white/40 text-[10px] font-bold px-2 py-1 rounded-lg">NORMAL</span>
                       )}
                     </td>
                     <td className="p-4 text-right">
                       <button onClick={() => startEditingTask(task)} className="text-white/20 hover:text-primary-400 mr-2 transition-colors"><Edit2 size={18} /></button>
                       <button onClick={() => { if(confirm('¿Eliminar esta tarea para todos los alumnos?')) deleteTask(task.id) }} className="text-white/15 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
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
    <div className="min-h-screen min-h-[100dvh] mesh-admin flex flex-col font-body relative">
      {/* Admin Header */}
      <header className="glass-medium sticky top-0 z-50 px-4 py-3 flex justify-between items-center" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
         <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain rounded-lg opacity-90" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                 <ShieldIcon />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-white/90">Panel de Administración</h1>
                <p className="text-xs text-white/30">Prisma System</p>
              </div>
           </div>
         </div>
         <div className="flex items-center gap-4">
             <button onClick={() => setShowChangePin(true)} className="text-white/30 hover:text-white/70 flex items-center gap-2 text-sm font-bold transition-colors">
                <Key size={18} /> Cambiar PIN
             </button>
             <button onClick={logout} className="text-white/30 hover:text-white/70 flex items-center gap-2 text-sm font-bold transition-colors">
                <LogOut size={18} /> Salir
             </button>
         </div>
      </header>

      {/* Change PIN Modal */}
      {showChangePin && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
             <div className="glass-strong rounded-3xl shadow-glass-lg p-6 w-full max-w-sm modal-content">
                <h3 className="text-lg font-display font-bold text-white/90 mb-4">Cambiar PIN de Administrador</h3>
                <input
                  type="text"
                  value={newAdminPin}
                  onChange={e => setNewAdminPin(e.target.value)}
                  maxLength={4}
                  placeholder="Nuevo PIN (4 dígitos)"
                  className="input-glass w-full mb-4 text-center font-mono text-xl tracking-widest"
                />
                <div className="flex gap-2">
                   <button onClick={() => setShowChangePin(false)} className="btn-ghost flex-1">Cancelar</button>
                   <button onClick={handleChangePin} className="btn-primary flex-1">Guardar</button>
                </div>
             </div>
          </div>
      )}

      {/* Desktop Tabs */}
      <div className="hidden md:flex glass sticky top-[64px] z-40 px-6 border-b border-white/10">
        <div className="flex gap-6 overflow-x-auto">
          <TabButton active={activeTab === 'CLASSES'} onClick={() => setActiveTab('CLASSES')} icon={<School size={18}/>} label="Gestión Clases" />
          <TabButton active={activeTab === 'TUTORS'} onClick={() => setActiveTab('TUTORS')} icon={<GraduationCap size={18}/>} label="Gestión Profesores" />
          <TabButton active={activeTab === 'FAMILIES'} onClick={() => setActiveTab('FAMILIES')} icon={<Users size={18}/>} label="Gestión Familias" />
          <TabButton active={activeTab === 'TASKS'} onClick={() => setActiveTab('TASKS')} icon={<BookOpen size={18}/>} label="Gestión Tareas" />
          <TabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={18}/>} label="Personal" />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-medium z-40 bottom-nav-safe" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex justify-around px-2 pt-2">
          <MobileTabButton active={activeTab === 'CLASSES'} onClick={() => setActiveTab('CLASSES')} icon={<School size={20}/>} label="Clases" />
          <MobileTabButton active={activeTab === 'TUTORS'} onClick={() => setActiveTab('TUTORS')} icon={<GraduationCap size={20}/>} label="Profes" />
          <MobileTabButton active={activeTab === 'FAMILIES'} onClick={() => setActiveTab('FAMILIES')} icon={<Users size={20}/>} label="Familias" />
          <MobileTabButton active={activeTab === 'TASKS'} onClick={() => setActiveTab('TASKS')} icon={<BookOpen size={20}/>} label="Tareas" />
          <MobileTabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={20}/>} label="Staff" />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col relative z-10 pb-safe md:pb-6">
         {activeTab === 'CLASSES' && renderClassesTab()}
         {activeTab === 'TUTORS' && renderTutorsTab()}
         {activeTab === 'FAMILIES' && renderFamiliesTab()}
         {activeTab === 'TASKS' && renderTasksTab()}
         {activeTab === 'STAFF' && renderStaffTab()}

         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
      </main>
    </div>
  );
};

// Subcomponents
const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-4 border-b-2 font-bold text-sm transition-colors whitespace-nowrap font-body ${active ? 'border-primary-400 text-white/90' : 'border-transparent text-white/30 hover:text-white/60'}`}
  >
    {icon} {label}
  </button>
);

const MobileTabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${active ? 'text-primary-400' : 'text-white/30'}`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export default AdminDashboard;
