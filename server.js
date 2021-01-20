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


    function handleNewGame(roomName, mode) {
        clearInterval(intervals[roomName]);
        let initState;
        if (mode === 'local2p') {
            initState = initGameState([roomName, 'player2local']);
        } else {
            let playersIds = io.sockets.adapter.rooms.get(roomName);
            if (playersIds) { // take all the players in the room and make an array of ids
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
            if (state[roomName].time > 600 || state[roomName].time === 0) {
                const winner = gameLoop(state[roomName]);
                io.to(roomName).emit('gameState', state[roomName]);
                if (winner) {
                    clearInterval(intervals[roomName]);
                    io.to(roomName).emit('gameEnd', state[roomName]);
                    delete state[roomName];
                }
            } else {
                state[roomName].time += INTERVAL;
            }
        }, INTERVAL);
    }

    function handleJoinRoom(roomName) {
        if (!roomName) {
            return;
        }
        client.join(roomName);
        client.emit('joinedRoom', roomName);
        if (state[roomName]) { // if a game is already in progress, init the canvas
            client.emit('initGame', state[roomName].canvas);
        }
    }

    function handleLeaveRoom(roomName) {
        client.leave(roomName);
        let numClients = io.sockets.adapter.rooms.get(roomName);
        if (numClients) { // make sure the room is not empty before accessing .size
            numClients = numClients.size;
        }
        client.emit('leftRoom');
    }

    function handleMoveSnake(key, roomName) {
        moveSnake(key, state[roomName], client.id);
    }

});

