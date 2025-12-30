import { initDB, setData } from '../server/db.js';

const SURNAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina',
  'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias'
];

const generateSchoolData = async () => {
    console.log('Initializing School Data...');
    await initDB();

    const classes = [];
    const users = [];

    // --- 1. Define Hierarchy ---
    const hierarchy = [
        { stage: 'INFANTIL', cycle: 'CICLO ÚNICO', levels: ['3 Años', '4 Años', '5 Años'] },
        { stage: 'PRIMARIA', cycle: 'PRIMER CICLO', levels: ['1º Primaria', '2º Primaria'] },
        { stage: 'PRIMARIA', cycle: 'SEGUNDO CICLO', levels: ['3º Primaria', '4º Primaria'] },
        { stage: 'PRIMARIA', cycle: 'TERCER CICLO', levels: ['5º Primaria', '6º Primaria'] },
        { stage: 'ESO', cycle: 'PRIMER CICLO', levels: ['1º ESO', '2º ESO'] },
        { stage: 'ESO', cycle: 'SEGUNDO CICLO', levels: ['3º ESO', '4º ESO'] }
    ];

    // --- 2. Generate Classes (A and B for each level) ---
    let classIdCounter = 1;

    hierarchy.forEach(h => {
        h.levels.forEach(level => {
            ['A', 'B'].forEach(group => {
                const classId = `class_${classIdCounter}`;
                classes.push({
                    id: classId,
                    name: `${level} ${group}`,
                    stage: h.stage,
                    cycle: h.cycle,
                    level: level,
                    group: group
                });
                classIdCounter++;
            });
        });
    });

    console.log(`Generated ${classes.length} classes.`);

    // --- 3. Generate Users ---

    // SuperAdmin
    users.push({ id: 'admin', name: 'Administrador', role: 'ADMIN', points: 0, pin: '2222' });

    // Generate 1 Teacher per Class + Students + Parents
    // NOTE: This might be too much data for a small VPS if we generate 24 students * 30 classes = 720 students.
    // I will generate 1 Teacher per class, but only populate ONE class with students for demo/performance,
    // or just a few students per class.
    // The prompt implies "Generate the relational structure", and "Seeding script".
    // I will generate teachers for all classes, but students for only a subset to avoid bloating the KV store too much,
    // unless strictly required. However, "generar 24 Alumno/Parent pairs" was in the original code.
    // I'll stick to populating 2 classes fully (Infantil 3 Años A and 6º Primaria A) as examples,
    // and just teachers for the rest, to keep it sane.
    // actually, let's create teachers for all.

    classes.forEach((cls) => {
        const teacherId = `teacher_${cls.id}`;
        users.push({
            id: teacherId,
            name: `Tutor ${cls.name}`,
            role: 'TUTOR',
            classId: cls.id,
            points: 0,
            pin: '0000'
        });

        // Populate '1º Primaria A' (for demo) fully, others empty or minimal?
        // Let's populate '1º Primaria A' and '1º ESO A'
        if (cls.name === '1º Primaria A' || cls.name === '1º ESO A') {
            for (let i = 1; i <= 24; i++) {
                const studentId = `student_${cls.id}_${i}`;
                const familyId = `family_${cls.id}_${i}`;

                const surname1 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                let surname2 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                while (surname2 === surname1) {
                    surname2 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                }

                // Student
                users.push({
                    id: studentId,
                    name: `Alumno ${i} ${surname1}`, // Added surname for sorting checks
                    firstName: `Alumno ${i}`,
                    lastName: `${surname1} ${surname2}`,
                    role: 'STUDENT',
                    classId: cls.id,
                    familyId: familyId,
                    points: 100,
                    pin: '0000',
                    inventory: ['base_1', 'top_1', 'bot_1'],
                    avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1' }
                });

                // Parent
                users.push({
                    id: `parent_${cls.id}_${i}`,
                    name: `Familia ${surname1} ${surname2}`,
                    role: 'PARENT',
                    familyId: familyId,
                    points: 0,
                    pin: '0000'
                });
            }
        }
    });

    console.log(`Generated ${users.length} users.`);

    // --- 4. Persist Data ---
    await setData('classes', classes);
    await setData('users', users);

    // Clear other states
    await setData('tasks', []);
    await setData('rewards', []);
    await setData('completions', []);
    await setData('messages', []);
    await setData('redemptions', []);

    console.log('Database seeded successfully.');
};

generateSchoolData().catch(err => {
    console.error('Error seeding data:', err);
    process.exit(1);
});
