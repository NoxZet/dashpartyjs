import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import LevelKart from 'Gfx/Level/Kart';
import { Mesh } from 'three';
import { MeshBasicMaterial } from 'three';
import { TextureLoader } from 'three';

export class LoadError extends Error {}
export class KartDataError extends Error {}

export default class Kart {
    constructor() {
        this.gltfLoader = new GLTFLoader;
        this.textureLoader = new TextureLoader;
    }

    createLevel(kart, sparkFactory) {
        return new LevelKart(kart, this.model, this.sparkSources, sparkFactory);
    }

    load(dataFile) {
        return this.createRequest(dataFile)
            .then(data => this.loadFromJson(data));
    }
    
    createRequest(dataFile) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onload = e => {
                resolve(request.responseText);
            };
            request.onerror = e => {
                reject(new LoadError('Couldn\'t load data file "' + dataFile + '"'));
            };
            request.open('GET', dataFile);
            request.send();
        });
    }

    loadFromJson(json) {
        return new Promise((resolve, reject) => {
            try {
                // Parse and verify
                const parsed = JSON.parse(json);
                this.sparkSources = parsed.sparkSources;
                if (typeof parsed.model !== 'string' || !parsed.model.match(/^[a-zA-Z][a-zA-Z0-9_-]+\.glb$/)) {
                    throw new KartDataError('Kart model must be a string matching "/^[a-zA-Z][a-zA-Z0-9_-]+\.glb$/"');
                }
                if (!Array.isArray(parsed.textures)) {
                    throw new KartDataError('Kart textures required');
                }
                for (let texture of parsed.textures) {
                    if (typeof texture !== 'string' || !texture.match(/^[a-zA-Z][a-zA-Z0-9_-]+\.(?:png|jpg|jpeg)$/)) {
                        throw new KartDataError('Kart textures must be strings matching "/^[a-zA-Z][a-zA-Z0-9_-]\.(?:png|jpg|jpeg)$/"');
                    }
                }
                // We might need to load more models (wheels etc)
                let loads = 1;
                const loadingDone = () => {
                    loads--;
                    if (loads === 0) {
                        resolve(this);
                    }
                };
                this.loadModel('res/' + parsed.model, parsed.textures).then(model => {
                    this.model = model;
                    loadingDone();
                });
            } catch (error) {
                if (error instanceof SyntaxError) {
                    reject(new SyntaxError('Couldn\'t parse data file "' + dataFile + '"'));
                } else {
                    reject(error)
                }
            }
        });
    }

    loadModel(modelFile, textures) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(modelFile, gltf => {
                // Reject if doesn't have exactly one mesh
                if (gltf.scene && gltf.scene.children.length === 1 && gltf.scene.children[0] instanceof Mesh) {
                    // Todo load multiple textures
                    this.textureLoader.load('res/' + textures[0], tex => {
                        tex.flipY = false;
                        gltf.scene.children[0].material = new MeshBasicMaterial({
                            map: tex,
                        });
                        resolve(gltf.scene);
                    }, undefined, e => reject(e));
                } else {
                    reject('Loaded glf must have exactly one mesh and no other objects');
                }
            }, undefined, e => reject(e));
        });
    }
}