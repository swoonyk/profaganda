// server.js
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');

// Default socket server port - Render provides PORT environment variable
const PORT = process.env.PORT || 443;
// Auto-end timer per round (ms). Set to 0 to disable.
const ROUND_DURATION_MS = Number(process.env.ROUND_DURATION_MS || 20000);

const app = express();

// Create server based on environment
let server;
if (process.env.NODE_ENV === 'production') {
  // For cloud deployment (Render, etc.), use HTTP - SSL is handled by the platform
  server = http.createServer(app);
} else {
  // For local development, try to use HTTPS if certificates exist
  try {
    if (fs.existsSync('/etc/letsencrypt/live/profaganda.hodgman.net/privkey.pem')) {
      server = https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/socket.hodgman.net/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/socket.hodgman.net/fullchain.pem')
      }, app);
    } else {
      console.log('SSL certificates not found, falling back to HTTP');
      server = http.createServer(app);
    }
  } catch (error) {
    console.log('Error loading SSL certificates, falling back to HTTP:', error.message);
    server = http.createServer(app);
  }
}
const io = new Server(server, {
  cors: { origin: '*' }
});

// In-memory state
// roundId -> { mode, correctAnswer, counts, answered:Set, partyId, optionsSet:Set, timeout:NodeJS.Timeout }
const rounds = new Map();
// partyId -> Map<playerId, score>
const leaderboards = new Map();
// partyId -> Map<playerId, { name, isHost }>
const parties = new Map();

function lbFor(partyId) {
  if (!leaderboards.has(partyId)) leaderboards.set(partyId, new Map());
  return leaderboards.get(partyId);
}

function partyFor(partyId) {
  if (!parties.has(partyId)) parties.set(partyId, new Map());
  return parties.get(partyId);
}

function broadcastPlayersUpdate(partyId) {
  const party = partyFor(partyId);
  const lb = lbFor(partyId);
  
  const players = Array.from(party.entries()).map(([playerId, playerData]) => ({
    name: playerData.name || playerId,
    points: lb.get(playerId) || 0,
    yourself: false, // This will be set client-side
    isHost: playerData.isHost || false
  }));
  
  io.to(`party:${partyId}`).emit('server:players_update', { players });
}

function endRound(roundId, partyId) {
  const round = rounds.get(roundId);
  if (!round) return;

  const lb = lbFor(partyId);
  const party = partyFor(partyId);
  const players = Array.from(lb.entries())
    .map(([playerId, score]) => ({
      name: party.get(playerId)?.name || playerId,
      points: score,
      yourself: false, // This will be set client-side
      isHost: party.get(playerId)?.isHost || false
    }))
    .sort((a, b) => b.points - a.points);

  const results = {
    roundId,
    mode: round.mode,
    correctAnswer: round.correctAnswer,
    counts: round.counts,
    players,
    roundNumber: 1 // TODO: Track actual round number
  };

  // Change phase to leaderboard
  io.to(`party:${partyId}`).emit('server:phase_change', { phase: 'leaderboard' });
  
  io.to(`party:${partyId}`).emit('server:round_results', results);

  if (round.timeout) clearTimeout(round.timeout);
  rounds.delete(roundId);
  console.log(`Round ${roundId} ended for party ${partyId}`);
}

app.get('/', (_req, res) => {
  res.send('Profaganda Socket Server is up.');
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Player joins a party
  socket.on('connect_player', ({ playerId, partyId, isHost, name }) => {
    if (!playerId || !partyId) return;
    socket.data.playerId = playerId;
    socket.data.partyId = partyId;
    socket.data.isHost = !!isHost;
    socket.join(`party:${partyId}`);
    
    // Add player to party tracking
    const party = partyFor(partyId);
    party.set(playerId, { 
      name: name || playerId, 
      isHost: !!isHost 
    });
    
    socket.emit('connected', { playerId, partyId });
    
    // Broadcast updated players list
    broadcastPlayersUpdate(partyId);
    
    // If this is the first player (host), change phase to lobby
    if (isHost) {
      io.to(`party:${partyId}`).emit('server:phase_change', { phase: 'lobby' });
    }
    
    console.log(`Player ${playerId} joined party ${partyId}`);
  });

  // Host starts a round
  // Payload: { roundId, mode: 'A'|'B', loading?: boolean, partyId? }
  socket.on('host:start_round', ({ roundId, mode, loading = false, partyId }) => {
    try {
      if (!socket.data.isHost) return;
      const pId = partyId || socket.data.partyId;
      if (!roundId || !mode || (mode !== 'A' && mode !== 'B') || !pId) return;

      // Start timer immediately for fast UX
      let timeout = null;
      if (ROUND_DURATION_MS > 0) {
        timeout = setTimeout(() => endRound(roundId, pId), ROUND_DURATION_MS);
      }

      // Initialize round with loading state
      rounds.set(roundId, {
        mode,
        correctAnswer: null,  // Will be set when frontend provides data
        counts: {},
        answered: new Set(),
        partyId: pId,
        optionsSet: new Set(),
        timeout,
        loading
      });

      // Change phase to round immediately
      io.to(`party:${pId}`).emit('server:phase_change', { phase: 'round' });
      
      // Broadcast round start with loading state
      io.to(`party:${pId}`).emit('server:round_started', {
        roundId,
        mode,
        options: [],
        gameData: null,
        loading
      });

      console.log(`Round ${roundId} started in party ${pId} (mode ${mode})`);
    } catch (err) {
      console.error('host:start_round error', err);
    }
  });

  // Host updates round with data (called after API fetch completes)
  socket.on('host:update_round', ({ roundId, correctAnswer, options = [], gameData }) => {
    try {
      if (!socket.data.isHost) return;
      
      const round = rounds.get(roundId);
      if (!round) return;

      // Update round with real data
      round.correctAnswer = correctAnswer;
      round.optionsSet = new Set(options);
      round.loading = false;

      // Broadcast updated data to all players
      io.to(`party:${round.partyId}`).emit('server:round_data_ready', {
        roundId,
        options,
        gameData
      });

      console.log(`Round ${roundId} updated with real data`);
    } catch (err) {
      console.error('host:update_round error', err);
    }
  });

  // Player submits an answer
  // Mode A: { roundId, choice: 'professorId' }
  // Mode B: { roundId, choice: { isAI: boolean } } OR choice: 'ai'|'real' OR true/false
  socket.on('player:submit_answer', ({ roundId, choice }) => {
    const playerId = socket.data.playerId;
    const partyId  = socket.data.partyId;
    if (!playerId || !partyId) return;

    const round = rounds.get(roundId);
    if (!round) return;

    if (round.answered.has(playerId)) {
      // One answer per player per round
      return socket.emit('server:answer_ack', { roundId, accepted: false });
    }

    // Normalize choice
    let normalizedChoice;
    if (round.mode === 'A') {
      // Expecting a professorId string; validate against provided options
      normalizedChoice = String(choice);
      if (!round.optionsSet.has(normalizedChoice)) {
        return socket.emit('server:answer_ack', { roundId, accepted: false });
      }
    } else {
      // Mode B: accept {isAI}, boolean, or 'ai'/'real'
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

    // Evaluate correctness
    const correct = (round.mode === 'A')
      ? normalizedChoice === String(round.correctAnswer)
      : normalizedChoice === (round.correctAnswer ? 'ai' : 'real');

    const points = correct ? 100 : 0;

    // In-memory updates
    round.answered.add(playerId);
    round.counts[normalizedChoice] = (round.counts[normalizedChoice] || 0) + 1;

    const lb = lbFor(partyId);
    lb.set(playerId, (lb.get(playerId) || 0) + points);

    console.log(
      `[MVP] Vote recorded: player=${playerId}, round=${roundId}, choice=${normalizedChoice}, ` +
      `correct=${correct}, points=${points}, totalScore=${lb.get(playerId)}`
    );

    socket.emit('server:answer_ack', { roundId, accepted: true, correct, points });
    
    // Broadcast updated players list with new scores
    broadcastPlayersUpdate(partyId);
  });

  // Host ends the round manually (optional if auto-timer is on)
  socket.on('host:end_round', ({ roundId }) => {
    if (!socket.data.isHost) return;
    const round = rounds.get(roundId);
    if (!round) return;
    const pId = round.partyId || socket.data.partyId;
    endRound(roundId, pId);
  });

  socket.on('disconnect', () => {
    const playerId = socket.data.playerId;
    const partyId = socket.data.partyId;
    
    if (playerId && partyId) {
      const party = partyFor(partyId);
      party.delete(playerId);
      
      // Broadcast updated players list
      broadcastPlayersUpdate(partyId);
      
      console.log(`Player ${playerId} disconnected from party ${partyId}`);
    }
  });
});

server.listen(PORT, () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'HTTP' : (server instanceof https.Server ? 'HTTPS' : 'HTTP');
  console.log(`Profaganda socket server listening on ${protocol} port ${PORT}`);
});
