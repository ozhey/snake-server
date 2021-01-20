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
    if (newDirTwo && state && 'snakes' in state && state.snakes['player2local']) {
        state.snakes['player2local'].dir = newDirTwo;
    }
};

const checkCollision = (piece, snakes, canvas) => {
    if (
        piece.x * canvas.scale >= canvas.width ||
        piece.x < 0 ||
        piece.y * canvas.scale >= canvas.height ||
        piece.y < 0
    ) {
        return true;
    }
    for (const snk in snakes) {
        for (const segment of snakes[snk].body) {
            if (piece.x === segment.x && piece.y === segment.y) {
                return true;
            }
        }
    }
    return false;
}

// checks if there's a collision between new heads
const checkNewHeadsCollision = (newSnakes) => {
    for (const [i, snk] of Object.entries(newSnakes)) {
        for (const [j, snk2] of Object.entries(newSnakes)) {
            if (snk.body[0].x === snk2.body[0].x && snk.body[0].y === snk2.body[0].y && i !== j) {
                return [i, j];
            }
        }
    }
    return false;
}

const lastSurvivor = (state) => {
    let aliveCounter = 0, survivor;
    for (const snake in state.snakes) {
        if (state.snakes[snake].speed !== 0) {
            aliveCounter += 1;
            survivor = state.snakes[snake].color;
        }
    }
    if (aliveCounter === 1) {
        state['lastSurvivor'] = survivor;
    }
}

const allDead = (snakes) => {
    let dead = true;
    for (const snake in snakes) {
        if (snakes[snake].speed !== 0) {
            dead = false;
        }
    }
    return dead;
}


const gameLoop = (state) => {
    const newSnakes = {};
    let shouldCreateApple = false;
    for (const snake in state.snakes) {
        const snakeCopy = JSON.parse(JSON.stringify(state.snakes[snake]));
        if (state.time % snakeCopy.speed === 0) {
            let newSnakeHead = {
                x: snakeCopy.body[0].x + snakeCopy.dir.x,
                y: snakeCopy.body[0].y + snakeCopy.dir.y
            }
            // prevents reverse situation
            if (newSnakeHead.x === snakeCopy.body[1].x && newSnakeHead.y === snakeCopy.body[1].y) {
                newSnakeHead = {
                    x: snakeCopy.body[0].x - snakeCopy.dir.x,
                    y: snakeCopy.body[0].y - snakeCopy.dir.y
                }
            }
            if (checkCollision(newSnakeHead, state.snakes, state.canvas)) {
                snakeCopy.speed = 0;
                newSnakes[snake] = snakeCopy;
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
    state.snakes = newSnakes;
    if (shouldCreateApple) {
        state.apple = createApple(state.snakes, state.canvas);
    }
    const headCollisionResult = checkNewHeadsCollision(newSnakes);
    if (headCollisionResult) {
        state.snakes[headCollisionResult[0]].speed = 0;
        state.snakes[headCollisionResult[1]].speed = 0;
    }
    state.time += INTERVAL;
    lastSurvivor(state);
    if (allDead(state.snakes)) {
        return 1;
    }
}


module.exports = {
    gameLoop,
    createApple,
    moveSnake,
    initGameState,
    initCanvas
}