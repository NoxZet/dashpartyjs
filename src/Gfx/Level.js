import * as THREE from 'three';
//import RaycastPlane from 'Gfx/RaycastPlane';

const textureLoader = new THREE.TextureLoader();

/**
 * @property {THREE.Scene} scene
 * @property {THREE.PerspectiveCamera} camera
 * @property {THREE.WebGLRenderer} renderer
 */
export default class Level {
    constructor() {
        this.scene = new THREE.Scene();
        //this.scene.background = textureLoader.load('res/ocean.png');
        this.setupCamera();
        this.setupCanvas();

        const mapmat = new THREE.MeshBasicMaterial({
            map: textureLoader.load('res/map_test.png')
        });
        const mapplane = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), mapmat);
        mapplane.material.side = THREE.DoubleSide;
        this.scene.add(mapplane);

        const wallmat = new THREE.MeshBasicMaterial({
            color: "gray",
            side: THREE.DoubleSide,
        });
        const triangle = new THREE.BufferGeometry();
        triangle.setAttribute("position", new THREE.BufferAttribute(new Float32Array([7, 7, 0, 12, 7.5, 0, 7, 6.5, 2]), 3));
        this.scene.add(new THREE.Mesh(triangle, wallmat));
        //this.raycastPlane = new RaycastPlane(this.camera, this.scene);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(35, 1, 1, 1000);
    }

    setupCanvas() {
        this.renderer = new THREE.WebGLRenderer({
            'canvas': document.getElementById('three-canvas'),
        });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.autoClear = false;
    }

    updateCamera() {
        // Set camera behind kart
        const kart3d = this.trackObject.object3d;
        const cameraHeading = this.trackObject.cameraHeading;
        this.camera.position.copy(new THREE.Vector3(
            kart3d.position.x + cameraHeading.x * 6,
            kart3d.position.y + cameraHeading.y * 6,
            kart3d.position.z + 2)
        );
        this.camera.up.copy(new THREE.Vector3(0, 0, 1));
        this.camera.lookAt(new THREE.Vector3(kart3d.position.x, kart3d.position.y, kart3d.position.z + 1));
        this.camera.updateProjectionMatrix();
    }

    render() {
        document.getElementById('three-canvas').width = window.innerWidth;
        document.getElementById('three-canvas').height = window.innerHeight;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.updateCamera();

        this.renderer.render(this.scene, this.camera);
    }
}
