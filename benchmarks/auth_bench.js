import { initDB, getData, setData } from '../server/db.js';
import { performance } from 'perf_hooks';

async function runSafeBenchmark() {
    await initDB();

    // Backup
    const originalUsers = await getData('users', []);
    console.log(`Original users count: ${originalUsers.length}`);

    try {
        // Setup Benchmark Data
        const users = [];
        const USER_COUNT = 2000;
        for(let i=0; i<USER_COUNT; i++) {
            users.push({ id: `user_${i}`, name: `User ${i}`, role: 'STUDENT', pin: '1234' });
        }
        await setData('users', users);

        const iterations = 100; // 100 iterations of full read
        const targetId = `user_${Math.floor(USER_COUNT / 2)}`;

        console.log(`Starting benchmark with ${iterations} iterations and ${USER_COUNT} users...`);
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            const users = await getData('users', []);
            const user = users.find(u => u.id === targetId);
        }

        const end = performance.now();
        const totalTime = end - start;
        console.log(`Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`Average time per op: ${(totalTime / iterations).toFixed(4)}ms`);

    } finally {
        // Restore
        if (originalUsers.length > 0) {
            console.log('Restoring original users...');
            await setData('users', originalUsers);
        }
    }
}

runSafeBenchmark().catch(console.error);
