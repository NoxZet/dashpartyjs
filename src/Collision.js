import { subVector } from "utils";

export default class Collision {
	constructor() {
		this.colliderWalls = [
			{0: [7, 7, 0], 1: [12, 7.5, 0], 2: [7, 6.5, 2]}
		];
	}

	loop() {
		for (let wall of this.colliderWalls) {
			const v1 = subVector(wall[1], wall[0]);
			const v2 = subVector(wall[2], wall[0]);
		}
	}
}