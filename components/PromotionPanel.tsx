import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Download, GraduationCap, Users as UsersIcon } from 'lucide-react';
import { ClassGroup, Role, User } from '../types';
import {
  LEVEL_SEQUENCE,
  PromotionPlan,
  computeOrphanParentIds,
  getManualTargetClasses,
  getTransitionType,
  resolveNextClassId,
  sortBySurname
} from '../utils/promotion';

interface PromotionPanelProps {
  users: User[];
  classes: ClassGroup[];
  setClassNextTarget: (classId: string, nextClassId: string) => void;
  applyPromotion: (plan: PromotionPlan) => void;
}

interface DirectRow {
  type: 'DIRECT';
  key: string;
  level: string;
  sourceClass: ClassGroup;
  targetClassId: string | null;
  students: User[];
}

interface ManualRow {
  type: 'MANUAL';
  key: string;
  level: string;
  nextLevel: string;
  sourceClasses: ClassGroup[];
  students: User[];
  targetOptions: ClassGroup[];
}

interface TerminalRow {
  type: 'TERMINAL';
  key: string;
  level: string;
  sourceClasses: ClassGroup[];
  students: User[];
}

type PromotionRow = DirectRow | ManualRow | TerminalRow;

const getActiveStudents = (users: User[], classIds: Set<string>): User[] =>
  sortBySurname(users.filter(u => u.role === Role.STUDENT && !u.archived && u.classId && classIds.has(u.classId)));

export const buildRows = (users: User[], classes: ClassGroup[]): PromotionRow[] => {
  const rows: PromotionRow[] = [];

  LEVEL_SEQUENCE.forEach(level => {
    const classesAtLevel = classes.filter(c => c.level === level);
    if (classesAtLevel.length === 0) return;

    const classIdsAtLevel = new Set(classesAtLevel.map(c => c.id));
    const allStudentsAtLevel = getActiveStudents(users, classIdsAtLevel);
    if (allStudentsAtLevel.length === 0) return;

    const transitionType = getTransitionType(level);

    if (transitionType === 'DIRECT') {
      classesAtLevel.forEach(cls => {
        const students = getActiveStudents(users, new Set([cls.id]));
        if (students.length === 0) return;
        rows.push({
          type: 'DIRECT',
          key: cls.id,
          level,
          sourceClass: cls,
          targetClassId: resolveNextClassId(cls, classes),
          students
        });
      });
    } else if (transitionType === 'MANUAL') {
      const nextLevel = LEVEL_SEQUENCE[LEVEL_SEQUENCE.indexOf(level) + 1];
      rows.push({
        type: 'MANUAL',
        key: `manual_${level}`,
        level,
        nextLevel,
        sourceClasses: classesAtLevel,
        students: allStudentsAtLevel,
        targetOptions: getManualTargetClasses(level, classes)
      });
    } else {
      rows.push({
        type: 'TERMINAL',
        key: `terminal_${level}`,
        level,
        sourceClasses: classesAtLevel,
        students: allStudentsAtLevel
      });
    }
  });

  return rows;
};

export const downloadSnapshot = (users: User[], classes: ClassGroup[]) => {
  const snapshot = { generatedAt: new Date().toISOString(), users, classes };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prisma-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const rowToPlan = (row: PromotionRow, manualAssignments: Record<string, string>): PromotionPlan | null => {
  if (row.type === 'DIRECT') {
    if (!row.targetClassId) return null;
    const studentAssignments: Record<string, string> = {};
    row.students.forEach(s => { studentAssignments[s.id] = row.targetClassId!; });
    return { studentAssignments, graduatingClassIds: [], classIdsToUnassignTutor: [row.sourceClass.id] };
  }
  if (row.type === 'MANUAL') {
    const studentAssignments: Record<string, string> = {};
    for (const s of row.students) {
      const target = manualAssignments[s.id];
      if (!target) return null;
      studentAssignments[s.id] = target;
    }
    return {
      studentAssignments,
      graduatingClassIds: [],
      classIdsToUnassignTutor: row.sourceClasses.map(c => c.id)
    };
  }
  return {
    studentAssignments: {},
    graduatingClassIds: row.sourceClasses.map(c => c.id),
    classIdsToUnassignTutor: row.sourceClasses.map(c => c.id)
  };
};

export const mergePlans = (plans: PromotionPlan[]): PromotionPlan => ({
  studentAssignments: Object.assign({}, ...plans.map(p => p.studentAssignments)),
  graduatingClassIds: plans.flatMap(p => p.graduatingClassIds),
  classIdsToUnassignTutor: plans.flatMap(p => p.classIdsToUnassignTutor)
});

export const describePlan = (plan: PromotionPlan, users: User[]): string[] => {
  const lines: string[] = [];
  const movedCount = Object.keys(plan.studentAssignments).length;
  if (movedCount > 0) lines.push(`${movedCount} alumno(s) cambiarán de clase.`);
  if (plan.graduatingClassIds.length > 0) {
    const graduates = users.filter(u => u.role === Role.STUDENT && !u.archived && u.classId && plan.graduatingClassIds.includes(u.classId));
    const orphanParents = computeOrphanParentIds(users, new Set(graduates.map(g => g.id)));
    lines.push(`${graduates.length} alumno(s) se graduarán y quedarán archivados.`);
    if (orphanParents.length > 0) lines.push(`${orphanParents.length} familia(s) quedarán archivadas (sin hijos activos).`);
  }
  const tutorCount = users.filter(u => u.role === Role.TUTOR && u.classId && plan.classIdsToUnassignTutor.includes(u.classId)).length;
  if (tutorCount > 0) lines.push(`${tutorCount} tutor(es) quedarán sin clase asignada.`);
  return lines;
};

const PromotionPanel: React.FC<PromotionPanelProps> = ({ users, classes, setClassNextTarget, applyPromotion }) => {
  const rows = useMemo(() => buildRows(users, classes), [users, classes]);
  const [manualAssignments, setManualAssignments] = useState<Record<string, Record<string, string>>>({});
  const [directOverrides, setDirectOverrides] = useState<Record<string, string>>({});
  const [pendingPlan, setPendingPlan] = useState<{ plan: PromotionPlan; summary: string[] } | null>(null);

  const rowsWithResolvedTargets: PromotionRow[] = rows.map(row =>
    row.type === 'DIRECT' ? { ...row, targetClassId: directOverrides[row.key] ?? row.targetClassId } : row
  );

  const effectiveTargetClassId = (row: DirectRow) => directOverrides[row.key] ?? row.targetClassId ?? '';

  const handleDirectTargetChange = (row: DirectRow, newTargetId: string) => {
    setDirectOverrides(prev => ({ ...prev, [row.key]: newTargetId }));
    if (newTargetId) setClassNextTarget(row.sourceClass.id, newTargetId);
  };

  const handleManualAssignmentChange = (rowKey: string, studentId: string, classId: string) => {
    setManualAssignments(prev => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] || {}), [studentId]: classId }
    }));
  };

  const requestPromotion = (rowsToRun: PromotionRow[]) => {
    const plans: PromotionPlan[] = [];
    const unresolved: string[] = [];

    rowsToRun.forEach(row => {
      const assignments = row.type === 'MANUAL' ? (manualAssignments[row.key] || {}) : {};
      const plan = rowToPlan(row, assignments);
      if (!plan) {
        unresolved.push(row.type === 'DIRECT' ? row.sourceClass.name : row.level);
      } else {
        plans.push(plan);
      }
    });

    if (unresolved.length > 0) {
      alert(`Faltan destinos por asignar en: ${unresolved.join(', ')}. Resuélvelos antes de promocionar.`);
      return;
    }
    if (plans.length === 0) return;

    const mergedPlan = mergePlans(plans);
    setPendingPlan({ plan: mergedPlan, summary: describePlan(mergedPlan, users) });
  };

  const confirmPromotion = () => {
    if (!pendingPlan) return;
    downloadSnapshot(users, classes);
    applyPromotion(pendingPlan.plan);
    setPendingPlan(null);
    setManualAssignments({});
    setDirectOverrides({});
  };

  if (rows.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-white/40 font-body">
        No hay alumnos activos pendientes de promoción.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-white/90">Promoción de Curso</h2>
        <button onClick={() => requestPromotion(rowsWithResolvedTargets)} className="btn-primary flex items-center gap-2">
          <CheckCircle2 size={18} /> Promocionar Todo
        </button>
      </div>

      <div className="space-y-3">
        {rowsWithResolvedTargets.map(row => (
          <div key={row.key} className="glass rounded-2xl shadow-glass p-4">
            {row.type === 'DIRECT' && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-white/90 font-body">{row.sourceClass.name}</p>
                  <p className="text-xs text-white/40">{row.students.length} alumnos activos</p>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={18} className="text-white/30" />
                  <select
                    value={effectiveTargetClassId(row)}
                    onChange={e => handleDirectTargetChange(row, e.target.value)}
                    className="input-glass text-sm"
                  >
                    <option value="">-- Sin destino --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    onClick={() => requestPromotion([row])}
                    disabled={!effectiveTargetClassId(row)}
                    className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Promocionar grupo
                  </button>
                </div>
              </div>
            )}

            {row.type === 'MANUAL' && (
              <ManualRowView
                row={row}
                assignments={manualAssignments[row.key] || {}}
                onAssignmentChange={(studentId, classId) => handleManualAssignmentChange(row.key, studentId, classId)}
                onPromote={() => requestPromotion([row])}
              />
            )}

            {row.type === 'TERMINAL' && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-white/90 font-body flex items-center gap-2">
                    <GraduationCap size={16} className="text-amber-400" /> {row.level}
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg uppercase">Graduación</span>
                  </p>
                  <p className="text-xs text-white/40">
                    {row.students.length} alumnos de {row.sourceClasses.map(c => c.name).join(', ')} quedarán archivados
                  </p>
                </div>
                <button onClick={() => requestPromotion([row])} className="btn-ghost text-sm !bg-amber-500/15 !border-amber-500/25 !text-amber-300">
                  Graduar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {pendingPlan && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={() => setPendingPlan(null)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-glass-lg modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-white/90 mb-4">Confirmar Promoción</h3>
            <ul className="space-y-1 mb-6 text-sm text-white/70 font-body list-disc list-inside">
              {pendingPlan.summary.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
            <p className="text-xs text-white/40 mb-6 font-body flex items-center gap-2">
              <Download size={14} /> Se descargará una copia de seguridad (JSON) antes de aplicar los cambios.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingPlan(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={confirmPromotion} className="btn-primary flex-1">Confirmar y Promocionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ManualRowViewProps {
  row: ManualRow;
  assignments: Record<string, string>;
  onAssignmentChange: (studentId: string, classId: string) => void;
  onPromote: () => void;
}

const ManualRowView: React.FC<ManualRowViewProps> = ({ row, assignments, onAssignmentChange, onPromote }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p className="font-bold text-white/90 font-body flex items-center gap-2">
          <UsersIcon size={16} className="text-secondary-400" /> {row.level} → {row.nextLevel}
          <span className="text-[10px] font-bold text-secondary-300 bg-secondary-500/15 px-2 py-0.5 rounded-lg uppercase">Reagrupación manual</span>
        </p>
        <p className="text-xs text-white/40">{row.students.length} alumnos de {row.sourceClasses.map(c => c.name).join(', ')}</p>
      </div>
      <button onClick={onPromote} className="btn-ghost text-sm">Promocionar grupo</button>
    </div>
    <div className="divide-y divide-white/5">
      {row.students.map(s => (
        <div key={s.id} className="flex items-center justify-between py-2">
          <span className="text-sm text-white/80 font-body">{s.name}</span>
          <select
            value={assignments[s.id] || ''}
            onChange={e => onAssignmentChange(s.id, e.target.value)}
            className="input-glass text-xs !py-1"
          >
            <option value="">-- Clase destino --</option>
            <optgroup label={`Promociona a ${row.nextLevel}`}>
              {row.targetOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
            <optgroup label="No promociona (repite)">
              {row.sourceClasses.map(c => <option key={c.id} value={c.id}>{c.name} (repite)</option>)}
            </optgroup>
          </select>
        </div>
      ))}
    </div>
  </div>
);

export default PromotionPanel;
