// client.js
// Simulates 1 host + 2 players connecting to your local server,
// runs a Mode A round and a Mode B round, then exits.

const { io } = require('socket.io-client');

// ====== Config ======
const SERVER = process.env.SOCKET_SERVER_URL || 'http://localhost:3000';
const PARTY_ID = 'party-1';
const HOST_ID = 'host-1';
const PLAYER_1 = 'p1';
const PLAYER_2 = 'p2';

// Helpers
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function log(title, obj) {
  console.log(title, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
}

async function run() {
  // Create host + players
  const host = io(SERVER, { transports: ['websocket'] });
  const p1 = io(SERVER, { transports: ['websocket'] });
  const p2 = io(SERVER, { transports: ['websocket'] });

  // Register listeners
  const registerCommon = (name, socket) => {
    socket.on('connect', () => console.log(`[${name}] connected as ${socket.id}`));
    socket.on('connected', (msg) => log(`[${name}] connected ack`, msg));
    socket.on('server:round_started', (msg) => log(`[${name}] round started`, msg));
    socket.on('server:round_results', (msg) => {
      console.log(`\n[${name}] ROUND RESULTS`);
      console.table(msg.counts);
      console.table(msg.leaderboard);
    });
    socket.on('server:answer_ack', (msg) => log(`[${name}] answer ack`, msg));
    socket.on('disconnect', () => console.log(`[${name}] disconnected`));
  };

  registerCommon('HOST', host);
  registerCommon('P1', p1);
  registerCommon('P2', p2);

  // Connect to party
  host.emit('connect_player', { playerId: HOST_ID, partyId: PARTY_ID, isHost: true });
  p1.emit('connect_player', { playerId: PLAYER_1, partyId: PARTY_ID });
  p2.emit('connect_player', { playerId: PLAYER_2, partyId: PARTY_ID });

  await sleep(200);

  // ====== ROUND 1 (Mode A): guess the professor ======
  // Options are simple IDs; correct is 'profA'
  console.log('\n=== START ROUND 1 (Mode A) ===');
  host.emit('host:start_round', {
    roundId: 'round-1',
    mode: 'A',
    correctAnswer: 'profA',
    options: ['profA', 'profB', 'profC', 'profD'],
    partyId: PARTY_ID
  });

  await sleep(250);
  // P1 correct, P2 wrong
  p1.emit('player:submit_answer', { roundId: 'round-1', choice: 'profA' });
  p2.emit('player:submit_answer', { roundId: 'round-1', choice: 'profB' });

  // End early (server also has auto-timer)
  await sleep(600);
  host.emit('host:end_round', { roundId: 'round-1' });

  await sleep(500);

  // ====== ROUND 2 (Mode B): real vs ai ======
  // correctAnswer = true means "AI" review; false would mean "real"
  console.log('\n=== START ROUND 2 (Mode B) ===');
  host.emit('host:start_round', {
    roundId: 'round-2',
    mode: 'B',
    correctAnswer: true, // means the truth is AI
    partyId: PARTY_ID
  });

  await sleep(250);
  // P1 guesses AI (correct), P2 guesses real (wrong)
  p1.emit('player:submit_answer', { roundId: 'round-2', choice: { isAI: true } });
  p2.emit('player:submit_answer', { roundId: 'round-2', choice: { isAI: false } });

  await sleep(600);
  host.emit('host:end_round', { roundId: 'round-2' });

  // Allow final results to print, then exit
  await sleep(800);
  host.disconnect(); p1.disconnect(); p2.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test client error:', err);
  process.exit(1);
});