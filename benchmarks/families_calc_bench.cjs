const { performance } = require('perf_hooks');

const NUM_USERS = 10000;
const NUM_CLASSES = 100;

console.log(`Generating ${NUM_USERS} users and ${NUM_CLASSES} classes...`);

const classes = [];
for (let i = 0; i < NUM_CLASSES; i++) {
    classes.push({ id: `class_${i}`, name: `Class ${i}` });
}

const users = [];
for (let i = 0; i < NUM_USERS; i++) {
    const role = Math.random() > 0.5 ? 'STUDENT' : 'PARENT';
    const classId = Math.random() > 0.1 ? `class_${Math.floor(Math.random() * NUM_CLASSES)}` : null; // 10% no class
    const familyId = `family_${Math.floor(i / 3)}`; // Groups of 3 roughly share a family
    users.push({
        id: `user_${i}`,
        name: `User ${i}`,
        role: role,
        classId: classId,
        familyId: familyId
    });
}

console.log(`Generated ${users.length} users and ${classes.length} classes.`);

function originalMethod() {
     const allFamilyIds = Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId)));
     const familiesInClasses = new Set();
     classes.forEach(c => {
         const students = users.filter(u => u.classId === c.id && u.role === 'STUDENT');
         students.forEach(s => {
             if (s.familyId) familiesInClasses.add(s.familyId);
         });
     });

     const unassignedFamiliesCount = allFamilyIds.filter(fid => !familiesInClasses.has(fid)).length;
     return unassignedFamiliesCount;
}

function optimizedMethod() {
     const allFamilyIds = Array.from(new Set(users.filter(u => u.familyId).map(u => u.familyId)));

     const validClassIds = new Set(classes.map(c => c.id));
     const familiesInClasses = new Set();

     users.forEach(u => {
         if (u.role === 'STUDENT' && u.classId && validClassIds.has(u.classId) && u.familyId) {
             familiesInClasses.add(u.familyId);
         }
     });

     const unassignedFamiliesCount = allFamilyIds.filter(fid => !familiesInClasses.has(fid)).length;
     return unassignedFamiliesCount;
}

// Warmup
originalMethod();
optimizedMethod();

console.log('Running benchmarks...');

const start1 = performance.now();
for(let i=0; i<100; i++) originalMethod();
const end1 = performance.now();
const avg1 = (end1 - start1) / 100;
console.log(`Original Method: ${avg1.toFixed(4)} ms (avg over 100 runs)`);

const start2 = performance.now();
for(let i=0; i<100; i++) optimizedMethod();
const end2 = performance.now();
const avg2 = (end2 - start2) / 100;
console.log(`Optimized Method: ${avg2.toFixed(4)} ms (avg over 100 runs)`);

const res1 = originalMethod();
const res2 = optimizedMethod();
if (res1 !== res2) {
    console.error(`Results mismatch! Original: ${res1}, Optimized: ${res2}`);
} else {
    console.log(`Results match: ${res1}`);
}

console.log(`Speedup: ${(avg1 / avg2).toFixed(2)}x`);
