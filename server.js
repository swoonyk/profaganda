
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// In-memory state
const rounds = new Map(); // roundId -> { mode, correctAnswer, counts, answered, partyId, optionsSet, timeout }
const leaderboards = new Map(); // partyId -> Map<playerId, score>

function lbFor(partyId) {
  if (!leaderboards.has(partyId)) leaderboards.set(partyId, new Map());
  return leaderboards.get(partyId);
}

function endRound(roundId, pId) {
  const round = rounds.get(roundId);
  if (!round) return;
  const lb = lbFor(pId);
  const results = {
    roundId,
    mode: round.mode,
    correctAnswer: round.correctAnswer,
    counts: round.counts,
    leaderboard: Array.from(lb.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score)
  };
  io.to(`party:${pId}`).emit('server:round_results', results);
  if (round.timeout) clearTimeout(round.timeout);
  rounds.delete(roundId);
  console.log(`Round ${roundId} ended for party ${pId}`);
}

app.get('/', (_req, res) => {
  res.send('Profaganda Socket Server is up.');
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('connect_player', ({ playerId, partyId, isHost }) => {
    if (!playerId || !partyId) return;
    socket.data.playerId = playerId;
    socket.data.partyId = partyId;
    socket.data.isHost = !!isHost;
    socket.join(`party:${partyId}`);
    socket.emit('connected', { playerId, partyId });
    console.log(`Player ${playerId} joined party ${partyId}`);
  });

  socket.on('host:start_round', ({ roundId, mode, correctAnswer, options = [], partyId }) => {
    if (!socket.data.isHost) return;
    const pId = partyId || socket.data.partyId;
    if (!roundId || !mode || (mode !== 'A' && mode !== 'B') || !pId) return;

    const optionsSet = new Set(options);
    const DURATION_MS = 20000; // auto-end after 20s
    const timeout = setTimeout(() => endRound(roundId, pId), DURATION_MS);

    rounds.set(roundId, {
      mode,
      correctAnswer,
      counts: {},
      answered: new Set(),
      partyId: pId,
      optionsSet,
      timeout
    });

    io.to(`party:${pId}`).emit('server:round_started', {
      roundId,
      mode,
      options
    });
    console.log(`Round ${roundId} started in party ${pId} (mode ${mode})`);
  });

  socket.on('player:submit_answer', ({ roundId, choice }) => {
    const playerId = socket.data.playerId;
    const partyId = socket.data.partyId;
    if (!playerId || !partyId) return;

    const round = rounds.get(roundId);
    if (!round || round.answered.has(playerId)) return;

    let normalizedChoice;
    if (round.mode === 'A') {
      normalizedChoice = String(choice);
      if (!round.optionsSet.has(normalizedChoice)) {
        return socket.emit('server:answer_ack', { roundId, accepted: false });
      }
    } else {
      if (typeof choice === 'object' && choice && 'isAI' in choice) {
        normalizedChoice = choice.isAI ? 'ai' : 'real';
      } else if (choice === true || choice === false) {
        normalizedChoice = choice ? 'ai' : 'real';
      } else if (choice === 'ai' || choice === 'real') {
        normalizedChoice = choice;
      } else {
        return socket.emit('server:answer_ack', { roundId, accepted: false });
      }
    }

    const correct = (round.mode === 'A')
      ? normalizedChoice === String(round.correctAnswer)
      : normalizedChoice === (round.correctAnswer ? 'ai' : 'real');

    const points = correct ? 100 : 0;
    round.answered.add(playerId);
    round.counts[normalizedChoice] = (round.counts[normalizedChoice] || 0) + 1;
    const lb = lbFor(partyId);
    lb.set(playerId, (lb.get(playerId) || 0) + points);

    console.log(`[MVP] Vote recorded: player=${playerId}, round=${roundId}, choice=${normalizedChoice}, correct=${correct}, points=${points}, totalScore=${lb.get(playerId)}`);
    socket.emit('server:answer_ack', { roundId, accepted: true });
  });

  socket.on('host:end_round', ({ roundId }) => {
    if (!socket.data.isHost) return;
    const round = rounds.get(roundId);
    if (!round) return;
    const pId = round.partyId || socket.data.partyId;
    endRound(roundId, pId);
  });

  socket.on('disconnect', () => {
    // Optional: handle disconnects
  });
});

server.listen(PORT, () => {
  console.log(`Profaganda socket server listening on :${PORT}`);
});
