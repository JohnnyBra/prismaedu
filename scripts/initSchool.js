import { initDB, setData } from '../server/db.js';

const SURNAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina',
  'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias'
];

// --- Prime Utility Logic ---
const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

const generatePrime = (min, max) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (isPrime(num)) {
      return num;
    }
  }
};

const generateUniquePrime = (excludeSet) => {
  const min = 0;
  const max = 9999;

  let attempts = 0;
  const maxAttempts = 10000;

  while (attempts < maxAttempts) {
    const p = generatePrime(min, max);
    const pin = p.toString().padStart(4, '0');

    if (!excludeSet.has(pin)) {
      return pin;
    }
    attempts++;
  }

  throw new Error("Unable to generate unique prime PIN: Search space exhausted.");
};

const generateSchoolData = async () => {
    console.log('Initializing School Data...');
    await initDB();

    const classes = [];
    const users = [];
    const usedPins = new Set();

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
    users.push({
        id: 'admin',
        name: 'Administrador',
        role: 'ADMIN',
        points: 0,
        pin: '2222',
        email: 'admin@colegiolahispanidad.es',
        altPin: '2222'
    });
    usedPins.add('2222');

    // Generate 1 Teacher per Class + Students + Parents

    classes.forEach((cls) => {
        const teacherId = `teacher_${cls.id}`;
        // Create email based on class name to be somewhat realistic
        const emailSafeName = cls.name.toLowerCase().replace(/º| /g, '').replace(/ñ/g, 'n');

        users.push({
            id: teacherId,
            name: `Tutor ${cls.name}`,
            role: 'TUTOR',
            classId: cls.id,
            points: 0,
            pin: '0000',
            email: `tutor.${emailSafeName}@colegiolahispanidad.es`,
            altPin: '0000'
        });
        usedPins.add('0000');

        // Populate '1º Primaria A' and '1º ESO A' fully for demo
        if (cls.name === '1º Primaria A' || cls.name === '1º ESO A') {
            for (let i = 1; i <= 24; i++) {
                const studentId = `student_${cls.id}_${i}`;
                const familyId = `family_${cls.id}_${i}`;

                const surname1 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                let surname2 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                while (surname2 === surname1) {
                    surname2 = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
                }

                // Student Email (optional, but good for consistency)
                const studentEmail = `alumno${i}.${emailSafeName}@colegiolahispanidad.es`;

                // Student
                const studentPin = generateUniquePrime(usedPins);
                usedPins.add(studentPin);

                users.push({
                    id: studentId,
                    name: `Alumno ${i} ${surname1}`, // Added surname for sorting checks
                    firstName: `Alumno ${i}`,
                    lastName: `${surname1} ${surname2}`,
                    role: 'STUDENT',
                    classId: cls.id,
                    familyId: familyId,
                    points: 100,
                    pin: studentPin,
                    altPin: '0000',
                    email: studentEmail,
                    inventory: ['base_1', 'top_1', 'bot_1', 'shoes_1', 'hair_1'],
                    avatarConfig: { baseId: 'base_1', topId: 'top_1', bottomId: 'bot_1', shoesId: 'shoes_1', hairId: 'hair_1' }
                });

                // Parent
                users.push({
                    id: `parent_${cls.id}_${i}`,
                    name: `Familia ${surname1} ${surname2}`,
                    role: 'PARENT',
                    familyId: familyId,
                    points: 0,
                    pin: '0000',
                    altPin: '0000',
                    email: `familia${i}.${emailSafeName}@colegiolahispanidad.es`
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
