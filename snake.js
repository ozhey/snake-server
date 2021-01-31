const {
    CANVAS,
    INTERVAL,
    BASE_SPEED,
    MAX_SPEED,
    DIRECTIONS,
    COLORS
} = require('./constants');

const createApple = (snakes, canvas) => {
    let newApple = {
        x: Math.floor(Math.random() * (canvas.width / canvas.scale)),
        y: Math.floor(Math.random() * (canvas.height / canvas.scale))
    };
    if (checkCollision(newApple, snakes, canvas)) {
        return createApple(snakes, canvas);
    }
    return newApple;
}

const initCanvas = (numOfPlayers = 1) => {
    return {
        width: CANVAS.baseWidth + numOfPlayers * 60,
        height: CANVAS.baseHeight + numOfPlayers * 60,
        color: CANVAS.color,
        scale: CANVAS.scale
    }
}

const initSnake = (numOfPlayers, i, canvas) => {
    return {
        body: [
            {
                x: Math.floor(canvas.width / canvas.scale * (i + 1) / (numOfPlayers + 1)),
                y: Math.floor(canvas.height / canvas.scale * 1 / 2)
            },
            {
                x: Math.floor(canvas.width / canvas.scale * (i + 1) / (numOfPlayers + 1)),
                y: Math.floor(canvas.height / canvas.scale * 1 / 2) + 1
            }
        ],
        speed: BASE_SPEED,
        color: COLORS[i],
        score: 0,
        dir: { x: 0, y: -1 } //up
    }
}

const initGameState = (playersIds = []) => {
    const numOfPlayers = playersIds.length;
    const canvas = initCanvas(numOfPlayers);
    const snakes = {};
    playersIds.forEach((id, index) => snakes[id] = initSnake(numOfPlayers, index, canvas));
    return {
        snakes,
        apple: createApple(snakes, canvas),
        time: 0,
        canvas
    }
}

const moveSnake = (key, state, snakeId) => {
    const newDirOne = DIRECTIONS.one[key];
    if (newDirOne && state && 'snakes' in state && snakeId in state.snakes) {
        state.snakes[snakeId].dir = newDirOne;
    }
    const newDirTwo = DIRECTIONS.two[key];
    if (newDirTwo && state && 'snakes' in state && 'player2local' in state.snakes) {
        state.snakes['player2local'].dir = newDirTwo;
    }
};

const checkCollision = (piece, snakes) => {
    for (const snk in snakes) {
        for (const segment of snakes[snk].body) {
            if (piece.x === segment.x && piece.y === segment.y) {
                return true;
            }
        }
    }
    return false;
}

const createNewSnakeHead = (currentHead, dir, canvas) => {
    let newHead = {
        x: currentHead.x + dir.x,
        y: currentHead.y + dir.y
    }
    // handle wall collision
    if (newHead.x * canvas.scale >= canvas.width) {
        return { x: 0, y: newHead.y }
    } else if (newHead.x < 0) {
        return { x: (canvas.width / canvas.scale) - 1, y: newHead.y }
    } else if (newHead.y * canvas.scale >= canvas.height) {
        return { x: newHead.x, y: 0 }
    } else if (newHead.y < 0) {
        return { x: newHead.x, y: (canvas.height / canvas.scale) - 1 }
    } else {
        return newHead;
    }
}

// checks if there's a collision between new heads
const checkNewHeadsCollision = (newSnakes) => {
    let headCollisions = [];
    for (const [i, snk] of Object.entries(newSnakes)) {
        for (const [j, snk2] of Object.entries(newSnakes)) {
            if (snk.body[0].x === snk2.body[0].x && snk.body[0].y === snk2.body[0].y && i !== j) {
                headCollisions.push([i, j]);
            }
        }
    }
    return headCollisions;
}

const lastSurvivor = (snakes) => {
    let aliveCounter = 0, survivor;
    for (const snake in snakes) {
        if (snakes[snake].speed !== 0) {
            aliveCounter += 1;
            survivor = snakes[snake].color;
        }
    }
    if (aliveCounter === 1) {
        return survivor;
    } else {
        return null;
    }
}

const allDead = (snakes) => {
    let isDead = true;
    for (const snake in snakes) {
        if (snakes[snake].speed !== 0) {
            isDead = false;
        }
    }
    return isDead;
}


const gameLoop = (state) => {
    const newSnakes = {};
    let shouldCreateApple = false, didSnakeDie = false;
    for (const snake in state.snakes) {
        const snakeCopy = JSON.parse(JSON.stringify(state.snakes[snake]));
        if (state.time % snakeCopy.speed === 0) {
            let newSnakeHead = createNewSnakeHead(snakeCopy.body[0], snakeCopy.dir, state.canvas)
            if (newSnakeHead.x === snakeCopy.body[1].x && newSnakeHead.y === snakeCopy.body[1].y) { // prevent reverse
                let oppositeDir = { x: snakeCopy.dir.x * -1, y: snakeCopy.dir.y * -1 }
                snakeCopy.dir = oppositeDir;
                newSnakeHead = createNewSnakeHead(snakeCopy.body[0], snakeCopy.dir, state.canvas)
            }
            if (checkCollision(newSnakeHead, state.snakes)) {
                snakeCopy.speed = 0;
                newSnakes[snake] = snakeCopy;
                didSnakeDie = true;
                continue;
            }
            snakeCopy.body.unshift(newSnakeHead);
            if (snakeCopy.body[0].x === state.apple.x && snakeCopy.body[0].y === state.apple.y) { // snake ate an apple
                shouldCreateApple = true;
                snakeCopy.score += 1;
                snakeCopy.speed = Math.max(
                    (snakeCopy.score % 5 === 0) ? BASE_SPEED - snakeCopy.score * 6 : snakeCopy.speed,
                    MAX_SPEED
                )
            } else {
                snakeCopy.body.pop();
            }
        }
        newSnakes[snake] = snakeCopy;
    }
    const headCollisions = checkNewHeadsCollision(newSnakes);
    headCollisions.forEach(collision => {
        newSnakes[collision[0]].speed = 0;
        newSnakes[collision[1]].speed = 0;
        didSnakeDie = true;
    })
    state.snakes = newSnakes;
    if (shouldCreateApple) {
        state.apple = createApple(state.snakes, state.canvas);
    }
    state.time += INTERVAL;
    if (didSnakeDie) {
        let survivor = lastSurvivor(state.snakes);
        if (survivor) {
            state.lastSurvivor = survivor;
        }
        if (allDead(state.snakes)) {
            return 1;
        }
    }
}


module.exports = {
    gameLoop,
    createApple,
    moveSnake,
    initGameState,
    initCanvas
}