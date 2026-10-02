import React, { useState } from 'react';
import { X, Repeat, AlertTriangle } from 'lucide-react';
import { ClassGroup, Role, User } from '../types';

interface MoveClassModalProps {
  student: User;
  classes: ClassGroup[];
  users: User[];
  onConfirm: (newClassId: string) => void;
  onClose: () => void;
}

const MoveClassModal: React.FC<MoveClassModalProps> = ({ student, classes, users, onConfirm, onClose }) => {
  const [targetClassId, setTargetClassId] = useState(student.classId || '');

  const currentClass = classes.find(c => c.id === student.classId);
  const parents = users.filter(u => u.role === Role.PARENT && u.familyId === student.familyId);
  const siblings = users.filter(u => u.role === Role.STUDENT && u.familyId === student.familyId && u.id !== student.id);

  const handleConfirm = () => {
    if (!targetClassId || targetClassId === student.classId) return;
    onConfirm(targetClassId);
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glass-lg modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-display font-bold text-white/90 flex items-center gap-2">
            <Repeat size={20} /> Cambiar de Clase
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-3 glass rounded-xl">
            <p className="font-bold text-white/90 font-body">{student.name}</p>
            <p className="text-xs text-white/40 font-body">Clase actual: {currentClass?.name || 'Sin clase'}</p>
          </div>

          <div className="p-3 glass rounded-xl text-xs text-white/50 font-body space-y-1">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
              Familia vinculada (no se verá afectada)
            </p>
            {parents.length === 0 && <p className="italic text-red-400/60">Sin padres asignados</p>}
            {parents.map(p => <p key={p.id}>{p.name}</p>)}
            {siblings.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-2">Hermanos/as</p>
                {siblings.map(s => (
                  <p key={s.id}>{s.name} ({classes.find(c => c.id === s.classId)?.name || 'Sin clase'})</p>
                ))}
              </>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Nueva Clase</label>
            <select
              value={targetClassId}
              onChange={e => setTargetClassId(e.target.value)}
              className="input-glass w-full"
            >
              <option value="">-- Selecciona --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {targetClassId && targetClassId !== student.classId && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 font-body flex gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
              <p>
                <span className="font-bold">Atención:</span> este cambio es inmediato y queda reflejado para toda la clase al confirmar. Revisa que la clase destino es la correcta antes de continuar.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={!targetClassId || targetClassId === student.classId}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveClassModal;
