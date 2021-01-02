const express = require('express');
const cors = require('cors');
const socketIo = require("socket.io");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(cors());

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
      }
}); 

let interval;

io.on("connection", (socket) => {
    console.log("New client connected");
    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket), 1000);
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});

const getApiAndEmit = socket => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);
};
