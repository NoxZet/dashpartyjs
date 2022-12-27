import { printHudConsole } from "utils";
import { absoluteValue, addVectors, angleBetween, crossProduct, invertMatrix3x3, mpMatrix3x3Vector, mpVector, rotateVector, subVector } from "vector_utils";

const BOUNCE_AMOUNT = 0.6;

export default class Collision {
	constructor() {
		this.colliderWalls = [
			{0: [7, 7, 0], 1: [20, 7.5, 0], 2: [7, 7, 2]},
			{0: [20, 7.5, 0], 1: [7, 7, 2], 2: [20, 7.5, 2]},
			{0: [20, 7.5, 0], 1: [32, 12, 0], 2: [20, 7.5, 2]},
			{0: [32, 12, 0], 1: [20, 7.5, 2], 2: [32, 12, 2]},
		];
	}

	collide(kart) {
		let wallContact = false;
		const throttleHeading = kart.throttleHeading;
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

			if ((pos[1] > 0 || pos[1] + top[1] > 0) && (pos[1] < v1mag || pos[1] + top[1] < v1mag)) {
				forInBounds: for (let dir of [1, -1]) {
					// Right of the wall (from wall perspective) and moving to the left
					if (momentum[0] * dir < 0 && (pos[0] * dir > 0 || (pos[0] + top[0]) * dir > 0)) {
						// Find a point where pos (center) is on the correct side and pos+base+momentum on the other
						const base = addVectors(pos, cylinderBase, -dir);
						let currEdge = base;
						let topRatio = 0;
						// Z is below wall, add top to be exactly at 0
						if (currEdge[2] < 0) {
							if (top[2] <= 0) {
								throw "Wall is oriented incorrectly";
							}
							topRatio = -currEdge[2] / top[2];
							currEdge = addVectors(base, top, topRatio);
						}
						// Y is in front of wall, add top to be exactly at 0
						if (currEdge[1] < 0) {
							// Adding top cannot get us in bound
							if (top[1] <= 0) {
								continue forInBounds;
							} else {
								topRatio += -currEdge[1] / top[1];
								currEdge = addVectors(base, top, topRatio);
							}
						}
						// Y is behind the wall, add top to be exactly at 0
						else if (currEdge[1] > v1mag) {
							// Adding top cannot get us in bound
							if (top[1] >= 0) {
								continue forInBounds;
							} else {
								topRatio += (currEdge[1] - v1mag) / top[1];
								currEdge = addVectors(base, top, topRatio);
							}
						}
						// X with momentum is on the correct side of the wall, add top to be exactly at 0
						if ((currEdge[0] + momentum[0]) * dir > 0) {
							// Adding top cannot get us to the other side
							if (top[0] * dir >= 0) {
								continue forInBounds;
							} else {
								topRatio += -dir * (currEdge[0] + momentum[0]) / top[0];
								currEdge = addVectors(base, top, topRatio);
							}
						}
						// Try to adjust so center is on the correct side
						let currCenter = addVectors(pos, top, topRatio);
						if (currCenter[0] * dir < 0) {
							// Adding top cannot get us to the correct side
							if (top[0] < 0) {
								continue forInBounds;
							} else {
								topRatio += -dir * currCenter[0] / top[0];
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
						if ((currEdge[0] + momentum[0]) * dir > 0 || currEdge[1] < 0 || currEdge[1] > v1mag || currEdge[2] > v2mag * currEdge[1] / v1mag) {
							continue forInBounds;
						}
						let bounceMomentum;
						// If we're in contact with a wall for more than one frame, that likely means we're
						// sliding on a wall so kart momentum is not representative of our direction anymore
						if (kart.wallContact < 1) {
							bounceMomentum = kart.momentum;
						} else {
							bounceMomentum = mpVector(throttleHeading, kart.currentSpeed);
						}
						// Rotate momentum 180° around normal
						const bounceVector = mpVector(rotateVector(bounceMomentum, normal, Math.PI), -BOUNCE_AMOUNT);
						// Vector if kart went fully straight along the wall after hitting - respecting the impact angle
						let straightVector = crossProduct(crossProduct(bounceVector, bounceMomentum), mpVector(normal, dir));
						straightVector = mpVector(straightVector, kart.currentSpeed / absoluteValue(straightVector));
						let angleness = angleBetween(bounceVector, straightVector)
						// Make angleness between 0 and 1, set angleness so that <=~0.01 becomes 0
						angleness = Math.max(0, Math.pow(angleness / (Math.PI / 2), 1.3) * 1.01 - 0.01);
						// Give angleness cosine shape (smooth out around 0 and 1)
						angleness = (1 - Math.cos(angleness * Math.PI)) / 2;
						// If we're in contact with a wall for more than one frame, that likely means we're
						// sliding on a wall so it doesn't make sense to bounce off it but we want to affect our speed
						if (kart.wallContact < 1) {
							kart.momentum = addVectors(mpVector(straightVector, 1 - angleness), mpVector(bounceVector, angleness));
						} else {
							// Instead of bounce vector, we actually use straightness but reduce it by bounce amount and add it identically to regular bounce
							kart.momentum = mpVector(straightVector, 1 + angleness * (BOUNCE_AMOUNT - 1));
						}
						wallContact = true;
					}
				}
			}
		}
		if (wallContact) {
			kart.wallContact++;
		} else {
			kart.wallContact = 0;
		}
	}
}