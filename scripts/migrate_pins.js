import { initDB, getData, setData } from '../server/db.js';

// --- Prime Utility Logic (Embedded) ---

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

// --- Migration Logic ---

const migrate = async () => {
  console.log('Starting PIN Migration...');
  await initDB();

  const users = await getData('users', []);
  const students = users.filter(u => u.role === 'STUDENT');

  if (students.length === 0) {
    console.log('No students found to migrate.');
    process.exit(0);
  }

  console.log(`Found ${students.length} students.`);

  // Collect existing PINs from ALL users to ensure global uniqueness (if desired)
  // or at least prioritize not colliding.
  // The prompt says "Ninguna familia ni alumno debe tener el pin repetido".
  const usedPins = new Set();

  // Pre-fill with non-student PINs (Admins, Tutors, Parents) if we want global uniqueness
  users.forEach(u => {
      if (u.pin) usedPins.add(u.pin);
  });

  let updatedCount = 0;

  // We must re-assign Student PINs even if they have one,
  // because existing ones might be '0000' or non-prime.
  // We will iterate students and assign new prime PINs.
  // Note: If a student already has a Prime PIN and it's unique, we could keep it?
  // But easier to just regenerate to be sure they follow the rule.

  // First, remove student PINs from usedPins so we can re-assign them properly
  // (In case we are re-running). Actually, safer to just start fresh for students.
  // Let's rebuild usedPins excluding students.
  usedPins.clear();
  users.forEach(u => {
      if (u.role !== 'STUDENT' && u.pin) usedPins.add(u.pin);
  });

  for (const user of users) {
    if (user.role === 'STUDENT') {
      const newPin = generateUniquePrime(usedPins);
      user.pin = newPin;
      usedPins.add(newPin);
      updatedCount++;
    }
  }

  await setData('users', users);
  console.log(`Successfully updated ${updatedCount} students with unique prime PINs.`);
};

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
