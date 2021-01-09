const CANVAS = {
    baseWidth: 300,
    baseHeight: 300,
    color: "oldlace",
    scale: 20
}
const INTERVAL = 30;
const BASE_SPEED = 180;
const MAX_SPEED = 90;
const DIRECTIONS = {
    one: {
        'ArrowUp': { x: 0, y: -1 }, //up
        'ArrowDown': { x: 0, y: 1 }, //down
        'ArrowLeft': { x: -1, y: 0 }, //left
        'ArrowRight': { x: 1, y: 0 }, //right
    },
    two: {
        'w': { x: 0, y: -1 }, //up
        's': { x: 0, y: 1 }, //down
        'a': { x: -1, y: 0 }, //left
        'd': { x: 1, y: 0 }, //right
    }

};
const COLORS = ['Green', 'Brown', 'Aquamarine', 'Pink', 'Gold', 'Orange', 'Red', 'Blue', 'Purple', 'Cyan']

module.exports = {
    CANVAS,
    INTERVAL,
    BASE_SPEED,
    MAX_SPEED,
    DIRECTIONS,
    COLORS
}