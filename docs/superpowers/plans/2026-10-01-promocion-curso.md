# Promoción de Curso, Archivado y Movimiento de Alumnos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only "Promoción de Curso" tool that advances students to their next class (direct A→A/B→B or manual reagrupación at 4 specific cycle boundaries), archives graduating 4º ESO students and any family left with no active children, and formalizes a safe "Cambiar de clase" action for moving a single student without ever breaking their family link.

**Architecture:** All promotion math (level sequence, transition type, class-target resolution, orphan-family detection, surname sorting) lives in a new pure-function module `utils/promotion.ts` with no React/DOM dependency, so it can be reasoned about and exercised in isolation. `context/DataContext.tsx` gets three new thin actions (`moveStudentClass`, `setClassNextTarget`, `applyPromotion`) that each perform exactly one atomic `users`/`classes` array replace — `applyPromotion` in particular takes a single merged `PromotionPlan` (never multiple sequential calls) so that promoting "one group" and promoting "all groups" both reduce to one atomic update. Two new presentational components (`components/MoveClassModal.tsx`, `components/PromotionPanel.tsx`) hold all the new UI and are wired into the existing `views/AdminDashboard.tsx` tab system, following its established patterns (glass/modal/input-glass classes, `useData()` destructuring, per-tab render functions).

**Tech Stack:** React 19 + TypeScript (frontend), Express + Socket.IO + SQLite (backend), no test framework configured in this repo.

**Testing approach for this plan:** This project has no Jest/Vitest/etc. (`CLAUDE.md`: "No test framework is configured"). Per that explicit project instruction, every task's "verify" step uses `npx tsc --noEmit` for type-safety (the logic in `utils/promotion.ts` is pure and simple enough that correct types plus the final manual walkthrough in Task 12 are sufficient evidence of correctness) and, for UI tasks, manual exercise of the running app in the browser — consistent with this repo's own convention ("For UI or frontend changes, start the dev server and use the feature... before reporting the task as complete").

---

### Task 1: Data model — add `archived` to `User` and `nextClassId` to `ClassGroup`

**Files:**
- Modify: `types.ts:14-20` (ClassGroup), `types.ts:41-57` (User)

- [ ] **Step 1: Add `nextClassId` to `ClassGroup`**

In `types.ts`, replace:

```ts
export interface ClassGroup {
  id: string;
  name: string;
  stage?: string;
  cycle?: string;
  level?: string;
}
```

with:

```ts
export interface ClassGroup {
  id: string;
  name: string;
  stage?: string;
  cycle?: string;
  level?: string;
  nextClassId?: string; // Target class for direct (A→A, B→B) end-of-year promotion
}
```

- [ ] **Step 2: Add archiving fields to `User`**

In `types.ts`, replace:

```ts
  email?: string;       // For Google Auth
  altPin?: string;      // Alternative PIN
}
```

with:

```ts
  email?: string;       // For Google Auth
  altPin?: string;      // Alternative PIN

  // Archiving (end-of-year graduation / orphaned family)
  archived?: boolean;
  archivedAt?: number;
  archivedReason?: 'GRADUATED' | 'ORPHAN_FAMILY';
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive optional fields).

- [ ] **Step 4: Commit**

```bash
git add types.ts
git commit -m "feat(types): add archived fields to User and nextClassId to ClassGroup"
```

---

### Task 2: Promotion engine — pure logic in `utils/promotion.ts`

**Files:**
- Create: `utils/promotion.ts`

- [ ] **Step 1: Write the module**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually sanity-check the transition table**

Run a disposable check — this project has no test runner, so verify by temporarily pasting the following into a scratch `.mjs` file alongside a hand-rolled copy of just `LEVEL_SEQUENCE`/`MANUAL_TRANSITIONS`/`getNextLevel`/`getTransitionType` (plain JS, no imports needed since the logic has no external deps), run it with `node`, confirm the output, then delete the scratch file:

```js
// scratch-check.mjs (temporary, delete after running)
const LEVEL_SEQUENCE = ['3 Años','4 Años','5 Años','1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria','1º ESO','2º ESO','3º ESO','4º ESO'];
const MANUAL_TRANSITIONS = new Set(['5 Años->1º Primaria','2º Primaria->3º Primaria','4º Primaria->5º Primaria','6º Primaria->1º ESO']);
const getNextLevel = (level) => { const i = LEVEL_SEQUENCE.indexOf(level); return i === -1 || i === LEVEL_SEQUENCE.length - 1 ? null : LEVEL_SEQUENCE[i + 1]; };
const getTransitionType = (level) => { const next = getNextLevel(level); if (!next) return 'TERMINAL'; return MANUAL_TRANSITIONS.has(`${level}->${next}`) ? 'MANUAL' : 'DIRECT'; };

for (const level of LEVEL_SEQUENCE) {
  console.log(level, '->', getNextLevel(level), ':', getTransitionType(level));
}
```

Run: `node scratch-check.mjs`
Expected output (13 lines): every level shows `DIRECT` except `5 Años`, `2º Primaria`, `4º Primaria`, `6º Primaria` which show `MANUAL`, and `4º ESO` which shows `TERMINAL` with `next = null`.

Then: `rm scratch-check.mjs`

- [ ] **Step 4: Commit**

```bash
git add utils/promotion.ts
git commit -m "feat(promotion): add pure promotion-engine logic (level sequence, transition resolution, orphan-family detection)"
```

---

### Task 3: `DataContext` — new actions and archived-login gate

**Files:**
- Modify: `context/DataContext.tsx:3` (imports), `:7-49` (`DataContextType`), `:181-196` (`login`), `:421-424` (after `setAllUsers`), `:446-488` (provider value)

- [ ] **Step 1: Import the promotion module**

Replace:

```ts
import { User, Task, Reward, Role, TaskCompletion, ClassGroup, Message, Redemption } from '../types';
```

with:

```ts
import { User, Task, Reward, Role, TaskCompletion, ClassGroup, Message, Redemption } from '../types';
import { PromotionPlan, computeOrphanParentIds } from '../utils/promotion';
```

- [ ] **Step 2: Declare the new actions on `DataContextType`**

Replace:

```ts
  deleteFamily: (familyId: string) => void;
  updateFamilyId: (oldId: string, newId: string) => void;
  setAllUsers: (users: User[]) => void;
  migratePins: () => Promise<{ success: boolean, count: number }>;
}
```

with:

```ts
  deleteFamily: (familyId: string) => void;
  updateFamilyId: (oldId: string, newId: string) => void;
  setAllUsers: (users: User[]) => void;
  migratePins: () => Promise<{ success: boolean, count: number }>;
  moveStudentClass: (studentId: string, newClassId: string) => void;
  setClassNextTarget: (classId: string, nextClassId: string) => void;
  applyPromotion: (plan: PromotionPlan) => void;
}
```

- [ ] **Step 3: Block archived users at login**

Replace:

```ts
  const login = (userId: string, pin: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.pin === pin) {
```

with:

```ts
  const login = (userId: string, pin: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.pin === pin && !user.archived) {
```

- [ ] **Step 4: Add the three new action implementations**

After `setAllUsers` (currently `context/DataContext.tsx:421-423`):

```ts
  const setAllUsers = (newUsersList: User[]) => {
    emitUsers(newUsersList);
  };
```

insert:

```ts
  const moveStudentClass = (studentId: string, newClassId: string) => {
    emitUserUpdate(studentId, { classId: newClassId });
  };

  const setClassNextTarget = (classId: string, nextClassId: string) => {
    emitClasses(classes.map(c => c.id === classId ? { ...c, nextClassId } : c));
  };

  // Single atomic update: reassigns promoted/moved students, archives graduates and any
  // family they leave with no active children, and unassigns tutors of every source class
  // touched this run. Deliberately ONE emit — never call archiving/assignment logic in a
  // loop across multiple rows, or each call would overwrite the previous one's changes
  // (React state updates are not synchronous between calls).
  const applyPromotion = (plan: PromotionPlan) => {
    const graduatingClassIdSet = new Set(plan.graduatingClassIds);
    const tutorUnassignSet = new Set(plan.classIdsToUnassignTutor);

    const graduateIds = new Set(
      users
        .filter(u => u.role === Role.STUDENT && !u.archived && u.classId && graduatingClassIdSet.has(u.classId))
        .map(u => u.id)
    );
    const orphanParentIds = new Set(computeOrphanParentIds(users, graduateIds));
    const archivedAt = Date.now();

    const newUsers = users.map(u => {
      if (u.role === Role.STUDENT && plan.studentAssignments[u.id]) {
        return { ...u, classId: plan.studentAssignments[u.id] };
      }
      if (graduateIds.has(u.id)) {
        return { ...u, archived: true, archivedAt, archivedReason: 'GRADUATED' as const };
      }
      if (orphanParentIds.has(u.id)) {
        return { ...u, archived: true, archivedAt, archivedReason: 'ORPHAN_FAMILY' as const };
      }
      if (u.role === Role.TUTOR && u.classId && tutorUnassignSet.has(u.classId)) {
        return { ...u, classId: undefined };
      }
      return u;
    });

    emitUsers(newUsers);
  };
```

- [ ] **Step 5: Expose the new actions on the provider**

Replace:

```ts
      deleteFamily,
      updateFamilyId,
      setAllUsers,
      migratePins
    }}>
```

with:

```ts
      deleteFamily,
      updateFamilyId,
      setAllUsers,
      migratePins,
      moveStudentClass,
      setClassNextTarget,
      applyPromotion
    }}>
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add context/DataContext.tsx
git commit -m "feat(data): add moveStudentClass, setClassNextTarget and applyPromotion actions; block archived users at login"
```

---

### Task 4: Server-side archived gate (Google OAuth + external SSO check)

**Files:**
- Modify: `server/index.js:112-123`, `server/index.js:211-214`

- [ ] **Step 1: Reject archived users in the Google OAuth strategy**

Replace:

```js
      const user = users.find(u => u.email === email);

      if (!user) {
        // Fallback for demo purposes if no user matches email strictly:
        // If we are testing and have no real emails in DB, this will block everyone.
        // But I must follow instructions.
        return cb(null, false, { message: 'Usuario no encontrado en el sistema local' });
      }

      if (user.role !== 'TUTOR' && user.role !== 'ADMIN') {
        return cb(null, false, { message: 'Acceso restringido a docentes' });
      }
```

with:

```js
      const user = users.find(u => u.email === email);

      if (!user) {
        // Fallback for demo purposes if no user matches email strictly:
        // If we are testing and have no real emails in DB, this will block everyone.
        // But I must follow instructions.
        return cb(null, false, { message: 'Usuario no encontrado en el sistema local' });
      }

      if (user.archived) {
        return cb(null, false, { message: 'Usuario archivado' });
      }

      if (user.role !== 'TUTOR' && user.role !== 'ADMIN') {
        return cb(null, false, { message: 'Acceso restringido a docentes' });
      }
```

- [ ] **Step 2: Exclude archived users from the external SSO check**

Replace:

```js
    const user = users.find(u =>
      (u.id === username || u.name === username || u.email === username) &&
      u.pin === password
    );
```

with:

```js
    const user = users.find(u =>
      (u.id === username || u.name === username || u.email === username) &&
      u.pin === password &&
      !u.archived
    );
```

- [ ] **Step 3: Start the backend and smoke-check it boots**

Run: `npm start` (in a dedicated terminal, leave running)
Expected: server logs show it listening on port 3020 with no syntax errors. Stop it with Ctrl+C once confirmed (it will be needed again, running, for Task 12).

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "fix(auth): reject archived users in Google OAuth and external SSO check"
```

---

### Task 5: `AuthView` — exclude archived users from login selection

**Files:**
- Modify: `views/AuthView.tsx:40-52`, `:299`, `:343-347`

- [ ] **Step 1: Exclude archived users from the class-wide quick-PIN flow**

Replace:

```ts
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
```

with:

```ts
    } else if (selectedClassId && step === 'PIN_ENTRY') {
      const familyIdsInClass = new Set(
        users
          .filter(u => u.classId === selectedClassId && u.familyId && !u.archived)
          .map(u => u.familyId)
      );

      const user = users.find(u => {
        if (u.archived) return false;
        if (u.pin !== pin) return false;
        if (u.classId === selectedClassId) return true;
        if (u.role === Role.PARENT && u.familyId && familyIdsInClass.has(u.familyId)) return true;
        return false;
      });
```

- [ ] **Step 2: Exclude archived students from the family-group picker**

Replace:

```ts
    const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedClassId);
```

with:

```ts
    const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedClassId && !u.archived);
```

- [ ] **Step 3: Exclude archived users from the final user picker**

Replace:

```ts
    if (selectedContext === 'ADMIN') {
      filteredUsers = users.filter(u => u.role === Role.ADMIN || u.role === Role.DIRECCION || u.role === Role.TESORERIA);
    } else if (selectedContext === 'SCHOOL') {
      filteredUsers = users.filter(u => u.role === Role.TUTOR);
    } else {
      filteredUsers = users.filter(u => u.familyId === selectedGroupId);
    }
```

with:

```ts
    if (selectedContext === 'ADMIN') {
      filteredUsers = users.filter(u => (u.role === Role.ADMIN || u.role === Role.DIRECCION || u.role === Role.TESORERIA) && !u.archived);
    } else if (selectedContext === 'SCHOOL') {
      filteredUsers = users.filter(u => u.role === Role.TUTOR && !u.archived);
    } else {
      filteredUsers = users.filter(u => u.familyId === selectedGroupId && !u.archived);
    }
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add views/AuthView.tsx
git commit -m "fix(auth): hide archived users from the login selection screens"
```

---

### Task 6: `AdminDashboard` — hide archived users from active lists, add "Ver archivados" toggle

**Files:**
- Modify: `views/AdminDashboard.tsx:84-89` (state), `:823-825` (class roster), `:1319-1326` (family grouping), `:1346-1353` (toggle button), `:1432-1439` (member lists)

- [ ] **Step 1: Add `showArchivedFamilies` state**

Replace:

```ts
  // Move User State
  const [userToMove, setUserToMove] = useState<User | null>(null);
  const [destinationFamilyId, setDestinationFamilyId] = useState<string>('');
```

with:

```ts
  // Move User State
  const [userToMove, setUserToMove] = useState<User | null>(null);
  const [destinationFamilyId, setDestinationFamilyId] = useState<string>('');

  // Archived families visibility toggle (FAMILIES tab)
  const [showArchivedFamilies, setShowArchivedFamilies] = useState(false);
```

- [ ] **Step 2: Hide archived students from the active class roster**

Replace:

```ts
    const classTutor = users.find(u => u.role === Role.TUTOR && u.classId === selectedClassForDetail.id);
    const classStudents = users
      .filter(u => u.role === Role.STUDENT && u.classId === selectedClassForDetail.id)
      .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
```

with:

```ts
    const classTutor = users.find(u => u.role === Role.TUTOR && u.classId === selectedClassForDetail.id);
    const classStudents = users
      .filter(u => u.role === Role.STUDENT && u.classId === selectedClassForDetail.id && !u.archived)
      .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
```

- [ ] **Step 3: Let the family grouping include archived members when the toggle is on**

Replace:

```ts
    if (selectedFamilyClass.id === 'unassigned') {
         familyIds = unassignedFamilyIds;
    } else {
         const studentsInClass = users.filter(u => u.role === Role.STUDENT && u.classId === selectedFamilyClass.id);
         familyIds = Array.from(new Set(studentsInClass.map(s => s.familyId).filter(Boolean))) as string[];
    }
```

with:

```ts
    if (selectedFamilyClass.id === 'unassigned') {
         familyIds = unassignedFamilyIds;
    } else {
         const studentsInClass = users.filter(u =>
           u.role === Role.STUDENT && u.classId === selectedFamilyClass.id && (showArchivedFamilies || !u.archived)
         );
         familyIds = Array.from(new Set(studentsInClass.map(s => s.familyId).filter(Boolean))) as string[];
    }
```

- [ ] **Step 4: Add the toggle button next to "Imprimir Claves"**

Replace:

```ts
         <div className="flex justify-end">
             <button
                onClick={handlePrintClassPins}
                className="btn-ghost flex items-center gap-2 text-sm"
             >
                <Printer size={18} /> Imprimir Claves (PDF)
             </button>
         </div>
```

with:

```ts
         <div className="flex justify-end gap-2">
             <button
                onClick={() => setShowArchivedFamilies(v => !v)}
                className={`btn-ghost flex items-center gap-2 text-sm ${showArchivedFamilies ? '!bg-primary-500/20 !text-primary-300' : ''}`}
             >
                <Archive size={18} /> {showArchivedFamilies ? 'Ocultar Archivados' : 'Ver Archivados'}
             </button>
             <button
                onClick={handlePrintClassPins}
                className="btn-ghost flex items-center gap-2 text-sm"
             >
                <Printer size={18} /> Imprimir Claves (PDF)
             </button>
         </div>
```

- [ ] **Step 5: Import the `Archive` icon**

Replace:

```ts
import { Users, School, BookOpen, LogOut, Plus, Trash2, Edit2, Save, X, ChevronRight, UserPlus, GraduationCap, Home, CheckSquare, ArrowRightLeft, Key, Upload, Briefcase, ArrowLeft, User as UserIcon, Printer } from 'lucide-react';
```

with:

```ts
import { Users, School, BookOpen, LogOut, Plus, Trash2, Edit2, Save, X, ChevronRight, UserPlus, GraduationCap, Home, CheckSquare, ArrowRightLeft, Key, Upload, Briefcase, ArrowLeft, User as UserIcon, Printer, Archive, Repeat, ArrowUpCircle } from 'lucide-react';
```

(`Repeat` and `ArrowUpCircle` are used by Tasks 8 and 10.)

- [ ] **Step 6: Filter members shown per family by the toggle, and badge archived ones**

Replace:

```ts
             const parents = members
                .filter(u => u.role === Role.PARENT)
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
             const students = members
                .filter(u => u.role === Role.STUDENT)
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
```

with:

```ts
             const parents = members
                .filter(u => u.role === Role.PARENT && (showArchivedFamilies || !u.archived))
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
             const students = members
                .filter(u => u.role === Role.STUDENT && (showArchivedFamilies || !u.archived))
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
```

- [ ] **Step 7: Badge archived parents**

Replace:

```ts
                             <span className="text-sm font-medium text-white/80 font-body">{p.name} <span className="text-white/30 text-xs font-mono ml-1">PIN: {p.pin}</span></span>
```

with:

```ts
                             <span className="text-sm font-medium text-white/80 font-body">
                               {p.name} <span className="text-white/30 text-xs font-mono ml-1">PIN: {p.pin}</span>
                               {p.archived && <span className="text-[9px] text-amber-400/70 ml-1 uppercase font-bold">Archivado</span>}
                             </span>
```

- [ ] **Step 8: Badge archived students**

Replace:

```ts
                                 <span className="text-sm font-medium text-white/90 leading-none font-body">{s.name}</span>
```

with:

```ts
                                 <span className="text-sm font-medium text-white/90 leading-none font-body">
                                   {s.name}
                                   {s.archived && <span className="text-[9px] text-amber-400/70 ml-1 uppercase font-bold">Archivado</span>}
                                 </span>
```

- [ ] **Step 9: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add views/AdminDashboard.tsx
git commit -m "feat(admin): hide archived users from active rosters, add Ver Archivados toggle in FAMILIES tab"
```

---

### Task 7: `MoveClassModal` component

**Files:**
- Create: `components/MoveClassModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import React, { useState } from 'react';
import { X, Repeat } from 'lucide-react';
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/MoveClassModal.tsx
git commit -m "feat(admin): add MoveClassModal component for single-student class changes"
```

---

### Task 8: Wire `MoveClassModal` into `AdminDashboard`

**Files:**
- Modify: `views/AdminDashboard.tsx:1-7` (imports), `:22` (context destructure), `:87-90` (state), `:922-939` (class roster row), `:1569-1576` (family tab student row), main return block (modal render)

- [ ] **Step 1: Import the modal and `moveStudentClass`**

Replace:

```ts
import ThemeToggle from '../components/ThemeToggle';
import Avatar from '../components/Avatar';
```

with:

```ts
import ThemeToggle from '../components/ThemeToggle';
import Avatar from '../components/Avatar';
import MoveClassModal from '../components/MoveClassModal';
```

Replace:

```ts
  const { logout, users, classes, tasks, addClass, updateClass, deleteClass, addUser, addUsers, updateUser, deleteUser, updateTask, deleteTask, deleteFamily, updateFamilyId, updatePin, setAllUsers, migratePins } = useData();
```

with:

```ts
  const { logout, users, classes, tasks, addClass, updateClass, deleteClass, addUser, addUsers, updateUser, deleteUser, updateTask, deleteTask, deleteFamily, updateFamilyId, updatePin, setAllUsers, migratePins, moveStudentClass, setClassNextTarget, applyPromotion } = useData();
```

- [ ] **Step 2: Add `movingStudent` state**

Replace:

```ts
  // Archived families visibility toggle (FAMILIES tab)
  const [showArchivedFamilies, setShowArchivedFamilies] = useState(false);
```

with:

```ts
  // Archived families visibility toggle (FAMILIES tab)
  const [showArchivedFamilies, setShowArchivedFamilies] = useState(false);

  // Move-class modal state (shared by CLASSES detail roster and FAMILIES tab)
  const [movingStudent, setMovingStudent] = useState<User | null>(null);
```

- [ ] **Step 3: Add a "Cambiar de clase" button to each class-roster row**

Replace:

```ts
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-bold text-primary-400 bg-primary-500/15 px-2 py-1 rounded-lg">EDITAR</span>
                     <ChevronRight size={16} className="text-primary-400/60" />
                  </div>
```

with:

```ts
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button
                        onClick={(e) => { e.stopPropagation(); setMovingStudent(student); }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-secondary-400 transition-colors"
                        title="Cambiar de clase"
                     >
                        <Repeat size={16} />
                     </button>
                     <span className="text-[10px] font-bold text-primary-400 bg-primary-500/15 px-2 py-1 rounded-lg">EDITAR</span>
                     <ChevronRight size={16} className="text-primary-400/60" />
                  </div>
```

- [ ] **Step 4: Replace the raw classId `<select>` in the FAMILIES tab with a button that opens the modal**

Replace:

```ts
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
```

with:

```ts
                             <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => setMovingStudent(s)}
                                  className="text-white/20 hover:text-secondary-400 transition-colors"
                                  title="Cambiar de clase"
                                >
                                  <Repeat size={14} />
                                </button>
                                <button
                                  onClick={() => handleEditGenericUser(s)}
```

- [ ] **Step 5: Render the modal once, at the top level, so it works from any tab**

Replace:

```ts
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
```

with:

```ts
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

         {movingStudent && (
           <MoveClassModal
             student={movingStudent}
             classes={classes}
             users={users}
             onClose={() => setMovingStudent(null)}
             onConfirm={(newClassId) => { moveStudentClass(movingStudent.id, newClassId); setMovingStudent(null); }}
           />
         )}
      </main>
    </div>
  );
};
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification in the browser**

Run (two terminals): `npm start` and `npm run dev`. Log in as Admin (seeded PIN, see `scripts/initSchool.js`). Go to Gestión Clases → open any class with students → click the new change-class icon on a student row → confirm the modal shows the student's current class, linked parent(s)/siblings, and a destination `<select>`. Pick a different class, confirm, and verify the student now appears in the new class's roster and their family (FAMILIAS tab) still lists the same parent.

- [ ] **Step 8: Commit**

```bash
git add views/AdminDashboard.tsx
git commit -m "feat(admin): wire MoveClassModal into class roster and families tab"
```

---

### Task 9: `PromotionPanel` component — row model, direct transitions, snapshot & confirm

**Files:**
- Create: `components/PromotionPanel.tsx`

- [ ] **Step 1: Write the row-building and plan-building helpers plus the DIRECT-row UI**

```tsx
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
            {row.targetOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      ))}
    </div>
  </div>
);

export default PromotionPanel;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PromotionPanel.tsx
git commit -m "feat(admin): add PromotionPanel with direct, manual-regroup and graduation rows"
```

---

### Task 10: Wire `PromotionPanel` into `AdminDashboard`

**Files:**
- Modify: `views/AdminDashboard.tsx:9` (`AdminTab` type), content switch and tab nav (desktop + mobile)

- [ ] **Step 1: Add the `PROMOTION` tab and import**

Replace:

```ts
type AdminTab = 'CLASSES' | 'TUTORS' | 'FAMILIES' | 'TASKS' | 'STAFF';
```

with:

```ts
type AdminTab = 'CLASSES' | 'TUTORS' | 'FAMILIES' | 'TASKS' | 'STAFF' | 'PROMOTION';
```

Replace:

```ts
import MoveClassModal from '../components/MoveClassModal';
```

with:

```ts
import MoveClassModal from '../components/MoveClassModal';
import PromotionPanel from '../components/PromotionPanel';
```

- [ ] **Step 2: Add the desktop tab button**

Replace:

```ts
          <TabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={18}/>} label="Personal" />
        </div>
      </div>
```

with:

```ts
          <TabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={18}/>} label="Personal" />
          <TabButton active={activeTab === 'PROMOTION'} onClick={() => setActiveTab('PROMOTION')} icon={<ArrowUpCircle size={18}/>} label="Promoción de Curso" />
        </div>
      </div>
```

- [ ] **Step 3: Add the mobile tab button**

Replace:

```ts
          <MobileTabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={20}/>} label="Staff" />
        </div>
      </div>
```

with:

```ts
          <MobileTabButton active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={<Briefcase size={20}/>} label="Staff" />
          <MobileTabButton active={activeTab === 'PROMOTION'} onClick={() => setActiveTab('PROMOTION')} icon={<ArrowUpCircle size={20}/>} label="Curso" />
        </div>
      </div>
```

- [ ] **Step 4: Render the panel in the content switch**

Replace:

```ts
         {activeTab === 'CLASSES' && renderClassesTab()}
         {activeTab === 'TUTORS' && renderTutorsTab()}
         {activeTab === 'FAMILIES' && renderFamiliesTab()}
         {activeTab === 'TASKS' && renderTasksTab()}
         {activeTab === 'STAFF' && renderStaffTab()}
```

with:

```ts
         {activeTab === 'CLASSES' && renderClassesTab()}
         {activeTab === 'TUTORS' && renderTutorsTab()}
         {activeTab === 'FAMILIES' && renderFamiliesTab()}
         {activeTab === 'TASKS' && renderTasksTab()}
         {activeTab === 'STAFF' && renderStaffTab()}
         {activeTab === 'PROMOTION' && (
           <PromotionPanel
             users={users}
             classes={classes}
             setClassNextTarget={setClassNextTarget}
             applyPromotion={applyPromotion}
           />
         )}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add views/AdminDashboard.tsx
git commit -m "feat(admin): add Promoción de Curso tab to the admin dashboard"
```

---

### Task 11: Build check

**Files:** none (verification only)

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: completes with no TypeScript or Vite errors, producing `/dist`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors introduced by this feature's files (`types.ts`, `utils/promotion.ts`, `context/DataContext.tsx`, `server/index.js`, `views/AuthView.tsx`, `views/AdminDashboard.tsx`, `components/MoveClassModal.tsx`, `components/PromotionPanel.tsx`).

If either command fails, fix the reported errors in the relevant file from the task above and re-run before moving on — do not proceed to Task 12 with a broken build.

---

### Task 12: End-to-end manual verification in the browser

**Files:** none (verification only)

This project has no automated test suite, so this task is the real correctness check — exercise every transition type against the seeded demo data, which (per `scripts/initSchool.js`) spans Infantil through 4º ESO with A/B groups, giving coverage of all three transition types.

- [ ] **Step 1: Reset to a clean demo dataset**

Run: `npm run reset`
Expected: recreates `database.sqlite` with the full 24-class demo seed.

- [ ] **Step 2: Start both servers**

Terminal 1: `npm start` (backend, port 3020)
Terminal 2: `npm run dev` (frontend, port 3000)

- [ ] **Step 3: Verify a DIRECT transition**

Log in as Admin → Promoción de Curso. Find a row for a non-boundary class (e.g. a "1º Primaria" class). Confirm it shows an auto-suggested target class with the matching letter. Click "Promocionar grupo". Confirm the summary modal lists the right student count and "tutor(es) quedarán sin clase". Confirm, and verify:
  - In Gestión Clases, the source class is now empty and the target class contains the moved students.
  - In Gestión Profesores, the tutor who had the source class now shows "-- Ninguna --".

- [ ] **Step 4: Verify a MANUAL transition**

Find the row for "2º Primaria" (or another of the 4 manual boundary levels). Confirm it's labeled "Reagrupación manual" and lists every active student from both A/B source classes pooled together, each with their own destination `<select>` limited to "3º Primaria" classes. Leave one student unassigned and click "Promocionar grupo" — confirm it's rejected with an alert naming the unresolved level. Assign all students, click "Promocionar grupo" again, confirm the summary, and verify every student now shows the class they were individually assigned to.

- [ ] **Step 5: Verify the TERMINAL/graduation transition**

Find the "4º ESO" row, confirm it's labeled "Graduación". Click "Graduar", confirm the summary mentions archived students and (if applicable to the seed data) archived families. Confirm. In Gestión Familias, open that class, turn on "Ver Archivados", and confirm the graduated students (and any now-childless parent) show the "Archivado" badge. Turn the toggle off and confirm they disappear from the default view. Confirm those PINs can no longer log in via the login screen.

- [ ] **Step 6: Verify "Promocionar Todo"**

Run `npm run reset` again for a clean slate, go back to Promoción de Curso, and click "Promocionar Todo" without resolving the MANUAL rows' assignments first — confirm it alerts listing exactly the unresolved manual levels and performs no change. Fill in all manual assignments across every manual row, click "Promocionar Todo" again, confirm the summary totals look right (sum of all rows), confirm, and verify a JSON file was downloaded and that students/tutors across the whole school moved correctly in one step.

- [ ] **Step 7: Verify the individual "Cambiar de clase" flow doesn't touch family links**

After a reset, in Gestión Clases open any class with students, click the new change-class icon on one student, confirm the modal shows their current class and linked parent/siblings, pick a different class, confirm. Check Gestión Familias: the student now appears under the new class but is still grouped with the same parent (same family card, same `familyId`).

- [ ] **Step 8: Stop both dev servers (Ctrl+C in each terminal) once satisfied.**

---

## Spec coverage check

- Promotion engine (level sequence, 4 manual boundary points, direct A/B mapping, graduation terminal) → Tasks 2, 9.
- Tutors unassigned on promotion → Task 3 (`applyPromotion`), verified Task 12 Step 3.
- Orphaned-family auto-archive on graduation → Task 2 (`computeOrphanParentIds`), Task 3, verified Task 12 Step 5.
- Archived users excluded from active lists/login → Tasks 3, 4, 5, 6.
- Global "promote all" + per-group promotion in the same screen → Task 9, verified Task 12 Steps 3–6.
- Snapshot download before applying → Task 9 (`downloadSnapshot`), verified Task 12 Step 6.
- "Ver archivados" view → Task 6, verified Task 12 Step 5.
- Individual "Cambiar de clase" without breaking `familyId` → Tasks 7, 8, verified Task 12 Step 7.
- Student lists sorted by first surname → Task 2 (`sortBySurname`, reusing the existing `(a.lastName || a.name).localeCompare(...)` convention), used throughout Task 9.

## Post-implementation amendment (found during Task 12 manual QA)

Manual QA against the real app surfaced a gap in Task 9's manual-regroup rows: the destination `<select>` only offered classes at the *next* level, with no way to hold a student back a year. Fixed in `components/PromotionPanel.tsx`'s `ManualRowView`: the select now groups the existing next-level options under an "Promociona a {nivel}" `<optgroup>`, and adds a second "No promociona (repite)" `<optgroup>` listing the row's own `sourceClasses` (the current level's A/B classes, already available on `ManualRow`) so a repeating student can be placed into either group of the level they're already in. No change was needed to `rowToPlan`, `applyPromotion`, or `utils/promotion.ts` — assigning a same-level `classId` goes through the exact same mechanism as a normal promotion assignment.
