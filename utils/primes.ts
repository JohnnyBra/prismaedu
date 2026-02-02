
/**
 * Checks if a number is prime.
 */
export const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

/**
 * Generates a random prime number between min and max (inclusive).
 */
export const generatePrime = (min: number, max: number): number => {
  // Simple rejection sampling
  while (true) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (isPrime(num)) {
      return num;
    }
  }
};

/**
 * Generates a unique prime PIN (4 digits string) that is not in the exclude list.
 * Range: 0000 - 9999
 */
export const generateUniquePrime = (exclude: string[]): string => {
  const min = 0;
  const max = 9999;
  const excludeSet = new Set(exclude);

  // Safety break to prevent infinite loops if space is full
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
