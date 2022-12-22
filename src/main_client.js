import * as THREE from 'three';
import PlayerKart from 'LevelObject/PlayerKart';
import GamepadManager from 'Controls/GamepadManager';
import PlayerManager from 'PlayerManager';
import { clearHudConsole } from 'utils';

const gamepadManager = new GamepadManager();
const playerManager = new PlayerManager(gamepadManager);
const kart = new PlayerKart();
playerManager.bindPlayerKart(0, kart);

const canvas = document.getElementById('three-canvas');
const ctx = canvas.getContext("2d");

function drawRect(x, y, w, h, angle) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.rect(-w/2, -h/2, w, h);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.restore();
}

let frame = 0;
let timer = 0;
let timerActive = 0;
let skipHz = [true, false, true, false, false];
function request() {
    frame++;
    if (!skipHz[frame % skipHz.length]) {
        requestAnimationFrame(request);
        return;
    }
    timer++;
    if (kart.throttle && timerActive === 0) {
        timer = 0;
        timerActive = 1;
    }
    if (kart.pos[0] > 1000 && timerActive === 1) {
        console.log(timer);
        timerActive = 2;
    }
    clearHudConsole();
    playerManager.refresh();
    kart.update();
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);
    drawRect(kart.pos[0], kart.pos[1], 40, 20, Math.atan2(kart.modelHeading[1], kart.modelHeading[0]));
    requestAnimationFrame(request);
}
request();
