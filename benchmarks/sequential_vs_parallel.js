import { initDB, getData } from '../server/db.js';
import { performance } from 'perf_hooks';

async function clearCache() {
    // getData uses a cache with size 50.
    // We call it 51 times with unique keys to force clear.
    for (let i = 0; i < 55; i++) {
        await getData(`dummy_cache_clear_${i}`, null);
    }
}

async function runBenchmark() {
    console.log('Initializing DB...');
    await initDB();

    const keys = ['users', 'classes', 'tasks', 'rewards', 'completions', 'messages', 'redemptions'];

    // Warmup / Ensure DB exists
    await getData('users', []);

    console.log('\n--- Running Sequential Benchmark ---');
    await clearCache();
    const startSeq = performance.now();
    for (const key of keys) {
        await getData(key, []);
    }
    const endSeq = performance.now();
    const timeSeq = endSeq - startSeq;
    console.log(`Sequential time: ${timeSeq.toFixed(2)}ms`);

    console.log('\n--- Running Parallel Benchmark ---');
    await clearCache();
    const startPar = performance.now();
    await Promise.all(keys.map(key => getData(key, [])));
    const endPar = performance.now();
    const timePar = endPar - startPar;
    console.log(`Parallel time: ${timePar.toFixed(2)}ms`);

    const improvement = timeSeq - timePar;
    const pct = (improvement / timeSeq) * 100;
    console.log(`\nImprovement: ${improvement.toFixed(2)}ms (${pct.toFixed(1)}%)`);
}

runBenchmark().catch(console.error);
