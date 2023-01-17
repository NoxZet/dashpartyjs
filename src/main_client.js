import * as THREE from 'three';
import PlayerKart from 'ObjectLogic/PlayerKart';
import GamepadManager from 'Controls/GamepadManager';
import PlayerManager from 'PlayerManager';
import { clearHudConsole } from 'utils';
import Kart from 'Gfx/Model/Kart';
import Level from 'Gfx/Level';
import Collision from 'Collision';

const modelKart = new Kart();
modelKart.load('res/shuttle.json').then(_ => {


const gamepadManager = new GamepadManager();
const playerManager = new PlayerManager(gamepadManager);
const playerKart = new PlayerKart();
playerManager.bindPlayerKart(0, playerKart);

const levelKart = modelKart.createLevel(playerKart, null);


const level = new Level();
level.trackObject = levelKart;
levelKart.addToScene(level.scene);
const collision = new Collision();

let frame = 0;
let timer = 0;
let timerActive = 0;
let skipHz = [true];
//let skipHz = [true, false, true, false, false];
function request() {
    frame++;
    if (!skipHz[frame % skipHz.length]) {
        requestAnimationFrame(request);
        return;
    }
    timer++;
    if (playerKart.throttle && timerActive === 0) {
        timer = 0;
        timerActive = 1;
    }
    if (playerKart.pos[0] > 1000 && timerActive === 1) {
        console.log(timer);
        timerActive = 2;
    }
    clearHudConsole();
    playerManager.refresh();

    playerKart.updateControls();
    collision.collideWalls(playerKart);
    collision.collideFloors(playerKart);
    playerKart.updatePosition();
    levelKart.update();

    level.render();

    requestAnimationFrame(request);
}
request();

}).catch(e => console.log(e));
