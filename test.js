// test-socket.js
const { io } = require("socket.io-client");

// Replace with your socket server URL
const SOCKET_URL = "https://socket.hodgman.net";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // try websocket first, fallback to polling
  rejectUnauthorized: false, // allow self-signed certs
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  withCredentials: false
});

// Log connection status
socket.on("connect", () => {
  console.log("✅ Connected! Socket ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`🔄 Reconnection attempt #${attempt}`);
});

// Generic listener for all server events
socket.onAny((event, ...args) => {
  console.log("📩 Event received:", event, args);
});

// Keep process alive
console.log("🟢 Listening for socket events. Press Ctrl+C to exit.");
setInterval(() => {}, 1000);