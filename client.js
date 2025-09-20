// client.js (event-driven, deterministic two-round demo)
const { io } = require('socket.io-client');

const SERVER = process.env.SOCKET_SERVER_URL || 'http://localhost:3000';
const PARTY_ID = 'party-1';
const HOST_ID = 'host-1';
const PLAYER_1 = 'p1';
const PLAYER_2 = 'p2';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(title, obj) {
  console.log(title, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
}

async function run() {
  const host = io(SERVER, { transports: ['websocket'] });
  const p1   = io(SERVER, { transports: ['websocket'] });
  const p2   = io(SERVER, { transports: ['websocket'] });

  // Connection acks
  host.on('connect', () => console.log(`[HOST] connected as ${host.id}`));
  p1.on('connect',   () => console.log(`[P1] connected as ${p1.id}`));
  p2.on('connect',   () => console.log(`[P2] connected as ${p2.id}`));

  // Standard listeners
  const onRoundStarted = (name) => (msg) => log(`[${name}] round started`, msg);
  host.on('server:round_started', onRoundStarted('HOST'));
  p1.on('server:round_started',   onRoundStarted('P1'));
  p2.on('server:round_started',   onRoundStarted('P2'));

  const onAnswerAck = (name) => (msg) => log(`[${name}] answer ack`, msg);
  p1.on('server:answer_ack', onAnswerAck('P1'));
  p2.on('server:answer_ack', onAnswerAck('P2'));

  const showResults = (name) => (msg) => {
    console.log(`\n[${name}] ROUND RESULTS`);
    console.table(msg.counts);
    console.table(msg.leaderboard);
  };
  host.on('server:round_results', showResults('HOST'));
  p1.on('server:round_results',   showResults('P1'));
  p2.on('server:round_results',   showResults('P2'));

  const allConnected = new Promise((resolve) => {
    let count = 0;
    const mark = () => (++count === 3 && resolve());
    host.on('connected', mark);
    p1.on('connected', mark);
    p2.on('connected', mark);
  });

  // Connect players
  host.emit('connect_player', { playerId: HOST_ID, partyId: PARTY_ID, isHost: true });
  p1.emit('connect_player',   { playerId: PLAYER_1, partyId: PARTY_ID });
  p2.emit('connect_player',   { playerId: PLAYER_2, partyId: PARTY_ID });

  await allConnected;

  // ===== Round 1: Mode A =====
  console.log('\n=== START ROUND 1 (Mode A) ===');
  host.emit('host:start_round', {
    roundId: 'round-1',
    mode: 'A',
    correctAnswer: 'profA',
    options: ['profA', 'profB', 'profC', 'profD'],
    partyId: PARTY_ID
  });

  await sleep(200);
  p1.emit('player:submit_answer', { roundId: 'round-1', choice: 'profA' }); // correct
  p2.emit('player:submit_answer', { roundId: 'round-1', choice: 'profB' });

  const round1Done = new Promise((resolve) => {
    const handler = (msg) => {
      if (msg.roundId === 'round-1') {
        host.off('server:round_results', handler);
        resolve();
      }
    };
    host.on('server:round_results', handler);
  });

  await sleep(250);
  host.emit('host:end_round', { roundId: 'round-1' });
  await round1Done;

  // ===== Round 2: Mode B =====
  console.log('\n=== START ROUND 2 (Mode B) ===');
  host.emit('host:start_round', {
    roundId: 'round-2',
    mode: 'B',
    correctAnswer: true, // AI
    partyId: PARTY_ID
  });

  await sleep(200);
  p1.emit('player:submit_answer', { roundId: 'round-2', choice: { isAI: true } });  // correct
  p2.emit('player:submit_answer', { roundId: 'round-2', choice: { isAI: false } }); // wrong

  const round2Done = new Promise((resolve) => {
    const handler = (msg) => {
      if (msg.roundId === 'round-2') {
        host.off('server:round_results', handler);
        resolve();
      }
    };
    host.on('server:round_results', handler);
  });

  await sleep(250);
  host.emit('host:end_round', { roundId: 'round-2' });
  await round2Done;

  await sleep(200);
  host.disconnect(); p1.disconnect(); p2.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test client error:', err);
  process.exit(1);
});
