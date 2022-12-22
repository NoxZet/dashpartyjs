import * as THREE from 'three';
import RaycastPlane from 'Gfx/RaycastPlane';
import SurfaceParticles from 'Gfx/SurfaceParticles';

const CAMERA_OFFSET = new THREE.Vector3(0, 30, -50);
const textureLoader = new THREE.TextureLoader();

/**
 * @property {THREE.Scene} scene
 * @property {THREE.PerspectiveCamera} camera
 * @property {THREE.WebGLRenderer} renderer
 */
export default class Level {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = textureLoader.load('res/ocean.png');
        this.setupCamera();
        this.setupCanvas();
        this.raycastPlane = new RaycastPlane(this.camera, this.scene);
        this.surfaceParticles = new SurfaceParticles(this.scene, this.raycastPlane);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        this.camera.position.copy(CAMERA_OFFSET);
        this.camera.up.copy(new THREE.Vector3(0, CAMERA_OFFSET.z, -CAMERA_OFFSET.y).normalize());
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
    }

    setupCanvas() {
        this.renderer = new THREE.WebGLRenderer({
            'canvas': document.getElementById('three-canvas'),
        });
        this.renderer.autoClear = false;
    }

    render() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.render(this.scene, this.camera);
    }
}
