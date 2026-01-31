import { io } from 'socket.io-client';

const socket = io('http://localhost:3020');

let users = [];

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('init_state', (data) => {
    console.log('Received init_state');
    users = data.users;

    if (users.length === 0) {
        console.error('No users found in init_state. Cannot benchmark.');
        process.exit(1);
    }

    // Measure Baseline: Update one user using the old method (sending full list)
    const targetUser = users[0];
    const modifiedUser = { ...targetUser, points: (targetUser.points || 0) + 10 };
    const newUsers = users.map(u => u.id === targetUser.id ? modifiedUser : u);

    console.log(`Sending update_users with ${newUsers.length} users...`);

    const payload = JSON.stringify(newUsers);
    console.log(`Payload size sent (approx): ${payload.length} bytes`);

    socket.emit('update_users', newUsers);
});

socket.on('sync_users', (data) => {
    const payload = JSON.stringify(data);
    console.log(`Received sync_users payload size: ${payload.length} bytes`);

    // We are done with baseline.
    console.log('Baseline measurement complete.');
    process.exit(0);
});

// Timeout
setTimeout(() => {
    console.log('Timeout waiting for events');
    process.exit(1);
}, 5000);
