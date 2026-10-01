# Promoción de curso, archivado y movimiento de alumnos — Diseño

**Fecha:** 2026-10-01
**Estado:** Aprobado para planificación

## Contexto y objetivo

PrismaEdu no tiene hoy ningún concepto de "curso escolar", promoción o archivado. Las clases (`ClassGroup`) son slots fijos por nivel+letra (p.ej. "1º Primaria A"); los alumnos y tutores se vinculan a su clase reutilizando el mismo campo `User.classId`; las familias no son una entidad propia — `familyId` es un string compartido entre `PARENT` y `STUDENT` sin relación con la clase.

Se necesita:
1. Una herramienta de **promoción de fin de curso** que mueva a los alumnos de su clase actual a la siguiente, deje a los tutores sin tutoría hasta reasignación manual, y archive a quienes terminan 4º ESO.
2. Un **modo de mover un alumno individualmente** de clase, fuera de la promoción general, sin romper nunca el vínculo familiar.
3. Garantía explícita, en ambos flujos, de que ninguna familia queda "atrás" (padres sin hijos activos vinculados tras una promoción).

## Modelo de datos

### `types.ts`

```ts
// User
archived?: boolean;
archivedAt?: number;
archivedReason?: 'GRADUATED' | 'ORPHAN_FAMILY';

// ClassGroup
nextClassId?: string; // puntero a la clase destino para promoción directa (A→A, B→B)
```

- Un usuario `archived` no puede iniciar sesión (PIN ni Google OAuth) y queda excluido de listados activos (dashboards, selects de asignación de tareas/recompensas, conteos de clase). Sus datos históricos (tareas, completions, mensajes, redemptions, puntos) se conservan sin modificar.
- `nextClassId` se autosugiere la primera vez que se usa la pantalla de promoción (ver más abajo) y el admin lo confirma o corrige; queda guardado para cursos futuros sin tener que remapear cada año.

## Motor de promoción

### Secuencia de niveles (constante nueva en `constants.tsx`)

```
3 Años → 4 Años → 5 Años → 1º Primaria → 2º Primaria → 3º Primaria → 4º Primaria
→ 5º Primaria → 6º Primaria → 1º ESO → 2º ESO → 3º ESO → 4º ESO → (graduación)
```

Específica de este colegio (no configurable genéricamente) — coherente con YAGNI, dado que es una app de un solo centro.

### Tipos de transición

- **Directa** (se mantiene la letra, A→A, B→B): todas las transiciones adyacentes de la secuencia **excepto** las 4 siguientes.
- **Manual** (reagrupación, los grupos se mezclan): exactamente estos 4 puntos, hardcodeados:
  - `5 Años → 1º Primaria`
  - `2º Primaria → 3º Primaria`
  - `4º Primaria → 5º Primaria`
  - `6º Primaria → 1º ESO`
- **Terminal**: `4º ESO` no tiene destino — el alumno se archiva con `archivedReason: 'GRADUATED'`.

Nota: `2º ESO → 3º ESO` es **directa** pese a cruzar de "PRIMER CICLO" a "SEGUNDO CICLO" en el campo `cycle` — la regla no se generaliza por `cycle`, se hardcodean exactamente los 4 puntos anteriores.

### Resolución de clase destino (transición directa)

1. Si `ClassGroup.nextClassId` ya está definido, se usa directamente.
2. Si no, se autosugiere buscando una clase cuyo `level` sea el siguiente en la secuencia y cuyo sufijo de `name` (tras quitar el `level`) coincida con el de la clase origen (p.ej. "1º Primaria A" → sufijo "A" → busca una clase de nivel "2º Primaria" con sufijo "A").
3. El admin confirma o corrige la sugerencia en la pantalla de promoción; al confirmar, se persiste en `nextClassId` para no repetir el mapeo el año siguiente.

### Resolución de clase destino (transición manual)

Se agrupan (pool) todos los alumnos activos de las clases origen de ese nivel. El admin asigna, alumno por alumno, una clase destino entre las disponibles del nivel siguiente, mediante un `<select>` — mismo patrón que el selector de cambio de clase ya existente en la pestaña FAMILIAS. No se puede confirmar la fila hasta que todos los alumnos del pool tengan destino asignado.

**Orden del listado de alumnos en el pool:** por primer apellido, reutilizando el criterio ya existente en la base de código (`(a.lastName || a.name).localeCompare(b.lastName || b.name)`, visto en `AdminDashboard.tsx:12,716,825,1436,1439` y `TutorDashboard.tsx:48-49`) — no se introduce lógica de ordenación nueva.

### Efectos secundarios de toda promoción (directa, manual o terminal)

- **Tutores:** se limpia `classId` de cualquier `TUTOR` cuyo `classId` apuntara a la clase origen promocionada. Queda "sin tutoría" hasta que se le reasigne manualmente desde la pestaña TUTORS existente (sin cambios en esa pestaña).
- **Huérfanos de familia:** tras archivar alumnos graduados, se recalcula para cada `PARENT` si le queda algún hijo activo (`!archived`) con su mismo `familyId`. Si no le queda ninguno, se archiva también ese `PARENT` (`archivedReason: 'ORPHAN_FAMILY'`). Así ninguna familia queda con un padre activo sin hijos vinculados tras una promoción.

## UI de promoción (nueva vista en Admin)

Nueva vista **"Promoción de curso"** en `AdminDashboard.tsx` (acceso desde el menú de Admin, junto a las pestañas existentes):

- **Filas por clase origen** con alumnos activos, mostrando: clase origen → clase destino sugerida/confirmada (directa) o badge "Reagrupación manual" (para los 4 puntos especiales) o badge "Graduación" (4º ESO).
- Botón **"Promocionar este grupo"** por fila (acción individual) y botón global **"Promocionar todo"** que ejecuta todas las filas pendientes de una vez — ambos modos conviven en la misma pantalla.
- Las filas de reagrupación manual despliegan el pool de alumnos (ordenado por primer apellido) con su selector de clase destino.
- Antes de ejecutar (fila individual o global), se descarga automáticamente un **snapshot JSON** (usuarios + clases, estado completo) como red de seguridad — generado en cliente, sin tocar el servidor, análogo al export CSV ya existente. Restauración, si hiciera falta, es manual (reimportar ese fichero); no se construye un botón de "deshacer" en la app.
- Se muestra un resumen de confirmación antes de aplicar ("23 alumnos pasan de 1ºA a 2ºA, 3 tutores quedarán sin clase, 1 familia quedará archivada...").
- Una clase ya promocionada en la sesión actual se marca como "hecha" (comprobando que ningún alumno activo sigue apuntando a ella como `classId`), para evitar relanzar la promoción sin querer.

**Vista de archivados:** filtro "Ver archivados" añadido a las pestañas FAMILIAS y TUTORS existentes (no se crea una pestaña nueva) — permite consultar el histórico sin interferir con el flujo normal.

## Mover un alumno de clase (individual, fuera de la promoción)

- Se formaliza la acción ya existente (hoy un `<select>` suelto en FAMILIAS, `AdminDashboard.tsx:1569-1576`) como acción explícita **"Cambiar de clase"**, con un modal de confirmación accesible tanto desde FAMILIAS como desde el detalle de clase en CLASSES.
- El modal muestra el contexto familiar del alumno (padres y hermanos vinculados por `familyId`) antes de confirmar, como garantía visual para el admin.
- La implementación solo cambia `classId` del alumno — `familyId` nunca se toca, así el vínculo con padres y hermanos permanece intacto siempre. No se mueve automáticamente a los hermanos; cada alumno se mueve de forma independiente.
- El selector de alumno (cuando aplica, p.ej. listados en el modal o en la clase origen) sigue el mismo criterio de ordenación por primer apellido ya existente.

## Backend / funciones nuevas

En `context/DataContext.tsx`:

- `promoteClass(sourceClassId: string, assignments: Record<string, string>)`: aplica la promoción de una clase origen. `assignments` mapea `studentId → targetClassId`; para transición directa es trivial (todos al mismo destino), para manual viene del pool resuelto en la UI. También limpia `classId` del tutor de la clase origen y recalcula huérfanos de familia entre los alumnos tocados.
- `archiveUsers(userIds: string[], reason: 'GRADUATED' | 'ORPHAN_FAMILY')`: marca usuarios como archivados.
- `setClassNextTarget(classId: string, nextClassId: string)`: persiste `nextClassId` en una clase.
- `moveStudentClass(studentId: string, newClassId: string)`: wrapper fino sobre `updateUser` para el modal de "Cambiar de clase".

Todas estas funciones reutilizan `setAllUsers` / `update_classes` (reemplazo completo del array, igual que hace `handleDeleteAllStudents` hoy) para aplicar los cambios en bloque — no se añaden eventos Socket.IO nuevos.

Login (PIN y Google OAuth, `server/index.js`): añadir comprobación de `archived` para rechazar el acceso de usuarios archivados.

## Fuera de alcance

- Reingreso de alumnos archivados (reactivación) — no se pide; si hace falta, es una edición manual de `archived: false` vía backend/soporte.
- Restauración automática desde el snapshot (botón "deshacer") — explícitamente descartado por el usuario a favor de un snapshot descargable.
- Generalizar la regla de transición manual por el campo `cycle` — se hardcodean los 4 puntos exactos pedidos.
- Multi-tutor por clase, o cualquier cambio al supuesto actual de "1 tutor por clase" — no se toca.
