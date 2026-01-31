const { performance } = require('perf_hooks');

// Helper from AdminDashboard.tsx
const getSortKey = (u) => {
    if (u.lastName) return u.lastName.toLowerCase();
    const parts = u.name.trim().split(' ');
    // Assume "First Last" or "First Middle Last" -> Sort by "Last..." + "First"
    if (parts.length > 1) {
       return parts.slice(1).join(' ').toLowerCase() + " " + parts[0].toLowerCase();
    }
    return u.name.toLowerCase();
};

const Role = {
    TUTOR: 'TUTOR',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
    ADMIN: 'ADMIN'
};

// Generate Mock Data
const users = [];
const NUM_USERS = 5000;
const PERCENT_TUTORS = 0.05; // 5% tutors

const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Lucia'];
const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'];

for (let i = 0; i < NUM_USERS; i++) {
    const isTutor = Math.random() < PERCENT_TUTORS;
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];

    users.push({
        id: `user_${i}`,
        name: `${fn} ${ln}`,
        // Simulate some users having firstName/lastName set, others not (to exercise both paths in getSortKey)
        firstName: Math.random() > 0.5 ? fn : undefined,
        lastName: Math.random() > 0.5 ? ln : undefined,
        role: isTutor ? Role.TUTOR : Role.STUDENT
    });
}

console.log(`Generated ${users.length} users.`);

// Measurement Loop
const ITERATIONS = 1000;

console.log('Starting benchmark...');

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
    // This represents the code inside renderTutorsTab
    const tutors = users
       .filter(u => u.role === Role.TUTOR)
       .sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));

    // Access result to prevent JIT elimination
    if (tutors.length === 0 && users.length > 0) throw new Error("No tutors found");
}

const end = performance.now();
const totalTime = end - start;
const avgTime = totalTime / ITERATIONS;

console.log(`Total time for ${ITERATIONS} iterations: ${totalTime.toFixed(2)} ms`);
console.log(`Average time per render: ${avgTime.toFixed(4)} ms`);
