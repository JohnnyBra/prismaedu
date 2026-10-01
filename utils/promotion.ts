import { ClassGroup, Role, User } from '../types';

// Specific to this school's curriculum (see scripts/initSchool.js seed data).
export const LEVEL_SEQUENCE: string[] = [
  '3 Años', '4 Años', '5 Años',
  '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO'
];

// The exact 4 points where groups are mixed and must be reassigned by hand.
// Every other adjacent pair in LEVEL_SEQUENCE (including 2º ESO -> 3º ESO) is a direct A->A, B->B promotion.
const MANUAL_TRANSITIONS = new Set<string>([
  '5 Años->1º Primaria',
  '2º Primaria->3º Primaria',
  '4º Primaria->5º Primaria',
  '6º Primaria->1º ESO'
]);

export type TransitionType = 'DIRECT' | 'MANUAL' | 'TERMINAL';

export interface PromotionPlan {
  studentAssignments: Record<string, string>; // studentId -> new classId
  graduatingClassIds: string[];                // classIds whose active students graduate (archive)
  classIdsToUnassignTutor: string[];           // every source classId being promoted/graduated this run
}

export const getNextLevel = (level: string): string | null => {
  const idx = LEVEL_SEQUENCE.indexOf(level);
  if (idx === -1 || idx === LEVEL_SEQUENCE.length - 1) return null;
  return LEVEL_SEQUENCE[idx + 1];
};

export const getTransitionType = (level: string): TransitionType => {
  const next = getNextLevel(level);
  if (!next) return 'TERMINAL';
  return MANUAL_TRANSITIONS.has(`${level}->${next}`) ? 'MANUAL' : 'DIRECT';
};

// Derives the group suffix of a class name by stripping its level prefix,
// e.g. name "1º Primaria A" + level "1º Primaria" -> "A".
export const getClassSuffix = (cls: ClassGroup): string => {
  if (!cls.level) return '';
  return cls.name.replace(cls.level, '').trim();
};

// Best-effort suggestion for a direct-promotion target: same suffix, next level.
export const suggestNextClassId = (sourceClass: ClassGroup, allClasses: ClassGroup[]): string | null => {
  if (!sourceClass.level) return null;
  const nextLevel = getNextLevel(sourceClass.level);
  if (!nextLevel) return null;
  const suffix = getClassSuffix(sourceClass);
  const candidate = allClasses.find(c => c.level === nextLevel && getClassSuffix(c) === suffix);
  return candidate ? candidate.id : null;
};

// Resolves the target class for a direct transition: an explicit nextClassId wins, else the best-effort suggestion.
export const resolveNextClassId = (sourceClass: ClassGroup, allClasses: ClassGroup[]): string | null => {
  if (sourceClass.nextClassId) return sourceClass.nextClassId;
  return suggestNextClassId(sourceClass, allClasses);
};

// Classes a manual-transition pool can land in: every class at the next level, any suffix.
export const getManualTargetClasses = (sourceLevel: string, allClasses: ClassGroup[]): ClassGroup[] => {
  const nextLevel = getNextLevel(sourceLevel);
  if (!nextLevel) return [];
  return allClasses.filter(c => c.level === nextLevel);
};

// Parent ids that, after the given student ids get archived, have no remaining active child.
export const computeOrphanParentIds = (users: User[], justArchivedStudentIds: Set<string>): string[] => {
  const affectedFamilyIds = new Set(
    users.filter(u => justArchivedStudentIds.has(u.id) && u.familyId).map(u => u.familyId!)
  );
  const orphanParentIds: string[] = [];
  affectedFamilyIds.forEach(familyId => {
    const hasActiveChild = users.some(u =>
      u.role === Role.STUDENT && u.familyId === familyId && !u.archived && !justArchivedStudentIds.has(u.id)
    );
    if (!hasActiveChild) {
      users
        .filter(u => u.role === Role.PARENT && u.familyId === familyId && !u.archived)
        .forEach(p => orphanParentIds.push(p.id));
    }
  });
  return orphanParentIds;
};

// Same ordering convention used throughout AdminDashboard.tsx: by surname (falls back to full name).
export const sortBySurname = <T extends { lastName?: string; name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
