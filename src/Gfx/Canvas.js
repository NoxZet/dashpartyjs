import HUD from 'Gfx/HUD';
import Level from './Level';

/**
 * @property {HUD} hud
 * @property {Level} level 
 */
export default class Canvas {
    constructor(params) {
        this.hud = new HUD();
        this.level = new Level();
    }

    render() {
        this.level.render();
    }
}
