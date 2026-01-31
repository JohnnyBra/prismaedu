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

    // Measure Granular Update
    const targetUser = users[0];
    const updates = { points: (targetUser.points || 0) + 10 };

    console.log(`Sending user_update for ${targetUser.id}...`);

    const payloadSent = JSON.stringify({ id: targetUser.id, updates });
    console.log(`Payload size sent (approx): ${payloadSent.length} bytes`);

    socket.emit('user_update', { id: targetUser.id, updates });
});

socket.on('sync_user_updated', (data) => {
    const payload = JSON.stringify(data);
    console.log(`Received sync_user_updated payload size: ${payload.length} bytes`);

    // We are done.
    console.log('Granular measurement complete.');
    process.exit(0);
});

// Timeout
setTimeout(() => {
    console.log('Timeout waiting for events');
    process.exit(1);
}, 5000);
