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

        let color = 0xe6b400;
        for (let wall of [
            [7, 7, 0, 20, 7.5, 0, 7, 7, 2],
            [20, 7.5, 0, 7, 7, 2, 20, 7.5, 2],
            [20, 7.5, 0, 32, 12, 0, 20, 7.5, 2],
            [32, 12, 0, 20, 7.5, 2, 32, 12, 2],
        ]) {
            const wallmat = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
            });
            color -= 0x2000;
            color += 0x30;
            const triangle = new THREE.BufferGeometry();
            triangle.setAttribute("position", new THREE.BufferAttribute(new Float32Array(wall), 3));
            this.scene.add(new THREE.Mesh(triangle, wallmat));
        }
        //this.raycastPlane = new RaycastPlane(this.camera, this.scene);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(35, 1, 1, 1000);
        this.cameraHeadings = [];
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
        this.cameraHeadings.push(Math.atan2(this.trackObject.cameraHeading.y, this.trackObject.cameraHeading.x));
        // Make the actual camera heading average of the last 7
        if (this.cameraHeadings.length > 7) {
            this.cameraHeadings.shift();
        }
        let sum = this.cameraHeadings[0];
        let last = this.cameraHeadings[0];
        for (let i = 1; i < this.cameraHeadings.length; i++) {
            let heading = this.cameraHeadings[i];
            // Handle wrap around above 360deg and below 0deg
            if (heading > last + Math.PI) {
                heading -= Math.PI * 2;
            } else if (heading < last - Math.PI) {
                heading += Math.PI * 2;
            }
            sum += heading;
            last = heading;
        }
        const averageHeading = sum / this.cameraHeadings.length;
        this.camera.position.copy(new THREE.Vector3(
            kart3d.position.x + Math.cos(averageHeading) * 6,
            kart3d.position.y + Math.sin(averageHeading) * 6,
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
