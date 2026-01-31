import { io } from "socket.io-client";
import { performance } from 'perf_hooks';

const start = performance.now();
// Ensure we connect to the right port.
// The server typically runs on 3020.
const socket = io("http://localhost:3020", {
    transports: ['websocket'], // Force websocket to avoid polling delay
    forceNew: true
});

socket.on("connect", () => {
  // console.log("Connected");
});

socket.on("init_state", (data) => {
  const end = performance.now();
  console.log(`INIT_TIME: ${(end - start).toFixed(2)}`);
  socket.close();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});

// Timeout
setTimeout(() => {
    console.error("Timeout waiting for init_state");
    process.exit(1);
}, 5000);
