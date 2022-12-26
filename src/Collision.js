import { printHudConsole } from "utils";
import { absoluteValue, addVectors, crossProduct, invertMatrix3x3, mpMatrix3x3Vector, mpVector, subVector } from "vector_utils";

export default class Collision {
	constructor() {
		this.colliderWalls = [
			{0: [7, 7, 0], 1: [12, 7.5, 0], 2: [7, 6.5, 2]}
		];
	}

	collide(kart) {
		for (let wall of this.colliderWalls) {
			// Create a set of three vectors to represent the wall
			// TODO: make sure v2[2] > 0
			let v1 = subVector(wall[1], wall[0]); // forward y+ = v0 -> v1
			const v1mag = absoluteValue(v1);
			v1 = mpVector(v1, 1 / v1mag);
			let v2 = subVector(wall[2], wall[0]); // up z+ = v0 -> v2
			const v2mag = absoluteValue(v2);
			v2 = mpVector(v2, 1 / v2mag);
			let normal = crossProduct(v1, v2); // right x+
			normal = mpVector(normal, 1 / absoluteValue(normal));
			// Use the vector space to transform kart properties into wall space
			const invert = invertMatrix3x3([
				normal[0], v1[0], v2[0],
				normal[1], v1[1], v2[1],
				normal[2], v1[2], v2[2],
			]);
			const pos = mpMatrix3x3Vector(invert, subVector(kart.pos, wall[0]));
			const top = mpMatrix3x3Vector(invert, [0, 0, kart.hitboxHeight]);
			const momentum = mpMatrix3x3Vector(invert, kart.momentum);
			printHudConsole([pos, top, momentum]);
			// Normal but rotated around axis perpendicular (so changes z and magnitude)
			// so that it makes the closest point of the cylinder to the wall (assuming so clipping through)
			let cylinderBase = crossProduct([0, 0, 1], crossProduct(normal, [0, 0, 1]));
			cylinderBase = mpVector(cylinderBase, kart.hitboxRadius / absoluteValue(cylinderBase));
			cylinderBase = mpMatrix3x3Vector(invert, cylinderBase);

			// Cylinder is clearly out of bounds of the possible wall
			if (pos[2] - Math.abs(momentum[2]) - Math.abs(cylinderBase[2]) > v2mag
				|| pos[2] + top[2] + Math.abs(momentum[2]) + Math.abs(cylinderBase[2]) < 0) {
				continue;
			}

			inBounds: if ((pos[1] > 0 || pos[1] + top[1] > 0) && (pos[1] < v1mag || pos[1] + top[1] < v1mag)) {
				// Right of the wall (from wall perspective) and moving to the left
				if (momentum[0] < 0 && (pos[0] > 0 || pos[0] + top[0] > 0)) {
					// Find a point where pos (center) is on the correct side and pos+base+momentum on the other
					const base = subVector(pos, cylinderBase);
					let currEdge = base;
					let topRatio = 0;
					// Z is below wall, add top to be exactly at 0
					if (currEdge[2] < 0) {
						topRatio = -currEdge[2] / top[2];
						currEdge = addVectors(base, top, topRatio);
					}
					// Y is in front of wall, add top to be exactly at 0
					if (currEdge[1] < 0) {
						// Adding top cannot get us in bound
						if (top[1] < 0) {
							break inBounds;
						} else {
							topRatio += -currEdge[1] / top[1];
							currEdge = addVectors(base, top, topRatio);
						}
					}
					// Y is behind the wall, add top to be exactly at 0
					else if (currEdge[1] > v1mag) {
						// Adding top cannot get us in bound
						if (top[1] > 0) {
							break inBounds;
						} else {
							topRatio += (currEdge[1] - v1mag) / top[1];
							currEdge = addVectors(base, top, topRatio);
						}
					}
					// X with momentum is on the correct side of the wall, add top to be exactly at 0
					if (currEdge[0] + momentum[0] > 0) {
						// Adding top cannot get us to the other side
						if (top[0] > 0) {
							break inBounds;
						} else {
							topRatio += -(currEdge[0] + momentum[0]) / top[0];
							currEdge = addVectors(base, top, topRatio);
						}
					}
					// Try to adjust so center is on the correct side
					let currCenter = addVectors(pos, top, topRatio);
					if (currCenter[0] < 0) {
						// Adding top cannot get us to the correct side
						if (top[0] < 0) {
							break inBounds;
						} else {
							topRatio += -currCenter[0] / top[0];
							currCenter = addVectors(pos, top, topRatio);
							currEdge = addVectors(base, top, topRatio);
						}
					}
					// If we got to this point, there are several possibilities
					// 1) Z (curr[2]) is above the wall (curr[2] > v2mag * curr[1] / v1mag)
					// 2) We went through each coordinate and adjusted them all to be at their earliest point to be in bounds
					//    if some of them fell out of this range as a result, that means there is no point where all are in bounds at the same time
					// 3) Mometum got so far to the left the cylinder went through and we're no longer colliding from the correct side
					// 4) We are actually in bounds

					// Because the walls we deal with are triangles, the max z changes based on y
					if (currEdge[0] + momentum[0] > 0 || currEdge[1] < 0 || currEdge[1] > v1mag || currEdge[2] > v2mag * currEdge[1] / v1mag) {
						break inBounds;
					}
					// Collide here
				}
				// Left of the wall (from wall perspective) and moving to the right
				else if (momentum[0] > 0 || pos[0] < 0 || pos[0] + top[0] < 0) {

				}
			}
		}
	}
}