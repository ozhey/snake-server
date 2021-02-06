const express = require('express');
const cors = require('cors');
const socketIo = require("socket.io");
const { gameLoop, moveSnake, initGameState, initCanvas } = require('./snake')
const {
    INTERVAL
} = require('./constants');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cors());

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketIo(server, { cors: { origin: '*' } });

const state = {};
const intervals = {}

io.on("connection", (client) => {


    client.on("keyDown", handleMoveSnake);
    client.on("newGame", handleNewGame);
    client.on("joinRoom", handleJoinRoom);
    client.on("leaveRoom", handleLeaveRoom);
    client.on('disconnecting', () => { // leave rooms explicitly so the game will end if there are no players
        let rooms = Array.from(client.rooms);
        rooms.forEach((room) => {
            handleLeaveRoom(room)
        });
    });

    function handleNewGame(roomName, mode) {
        clearInterval(intervals[roomName]);
        let initState;
        if (mode === 'local2p') {
            initState = initGameState([roomName, 'player2local']);
        } else {
            let playersIds = io.sockets.adapter.rooms.get(roomName);
            if (playersIds) { // playerIds is a set
                playersIds = Array.from(playersIds);
            }
            initState = initGameState(playersIds);
        }
        state[roomName] = initState;
        io.to(roomName).emit('initGame', initState.canvas);
        startGameInterval(roomName);
    };

    function startGameInterval(roomName) {
        intervals[roomName] = setInterval(() => {
            if (state[roomName].time > 600 || state[roomName].time === 0) { //0.6s start delay
                const winner = gameLoop(state[roomName]);
                io.to(roomName).emit('gameState', state[roomName]);
                if (winner) {
                    endGame(roomName);
                }
            } else {
                state[roomName].time += INTERVAL;
            }
        }, INTERVAL);
    }

    function endGame(roomName) {
        clearInterval(intervals[roomName]);
        io.to(roomName).emit('gameEnd', state[roomName]);
        delete state[roomName];
    }

    function handleJoinRoom(roomName) {
        if (!roomName) { return }
        client.join(roomName);
        client.emit('joinedRoom', roomName);
        if (state[roomName]) { // if a game is already in progress, init the canvas
            client.emit('initGame', state[roomName].canvas);
        }
    }

    function handleLeaveRoom(roomName) {
        client.leave(roomName);
        let numClients = io.sockets.adapter.rooms.get(roomName);
        if (!numClients) { // end the game if the room is empty
            endGame(roomName);
        }
        client.emit('leftRoom');
    }

    function handleMoveSnake(key, roomName) {
        moveSnake(key, state[roomName], client.id);
    }

});

