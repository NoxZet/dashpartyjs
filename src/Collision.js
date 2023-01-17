import { compareFloats, printHudConsole } from "utils";
import { absoluteValue, addVectors, angleBetween, crossProduct, invertMatrix3x3, mpMatrix3x3Vector, mpVector, rotateVector, subVector } from "vector_utils";

const BOUNCE_AMOUNT = 0.6;

const FLOOR_COLL_COUNT = 9;
const FLOOR_COLL_CENTER = 0;
const FLOOR_COLL_F = 1;
const FLOOR_COLL_FL = 2;
const FLOOR_COLL_L = 3;
const FLOOR_COLL_BL = 4;
const FLOOR_COLL_B = 5;
const FLOOR_COLL_BR = 6;
const FLOOR_COLL_R = 7;
const FLOOR_COLL_RF = 8;

const INNER_CENTER_RADIUS = 0.1;
const INNER_INNER2_RADIUS = INNER_CENTER_RADIUS * 2;
const OUTER_INNER_RADIUS = 1 - INNER_CENTER_RADIUS;
const OUTER_CENTER_RADIUS = 1;
const OUTER_INNER2_RADIUS = OUTER_CENTER_RADIUS + INNER_CENTER_RADIUS;
const OUTER_OUTER2_RADIUS = OUTER_CENTER_RADIUS * 2;

const TARGET_FRONT_OUTER = 1;
const TARGET_FRONT_INNER = 2;
const TARGET_CENTER = 0;
const TARGET_BACK_INNER = 3;
const TARGET_BACK_OUTER = 4;

const TARGET_LENGTH = {
	1: -OUTER_CENTER_RADIUS,
	2: -INNER_CENTER_RADIUS,
	0: 0,
	3: INNER_CENTER_RADIUS,
	4: OUTER_CENTER_RADIUS,
};

export default class Collision {
	constructor() {
		this.colliderWalls = [
			{0: [7, 7, 0], 1: [20, 7.5, 0], 2: [7, 7, 2]},
			{0: [20, 7.5, 0], 1: [7, 7, 2], 2: [20, 7.5, 2]},
			{0: [20, 7.5, 0], 1: [32, 12, 0], 2: [20, 7.5, 2]},
			{0: [32, 12, 0], 1: [20, 7.5, 2], 2: [32, 12, 2]},
		];
		let i = 0;
		let j = Math.PI / 15;
		while (i < Math.PI * 2) {
			this.colliderWalls.push({0: [40 + Math.sin(i) * 8, 40 + Math.cos(i) * 8, 0], 1: [40 + Math.sin(j) * 8, 40 + Math.cos(j) * 8, 0], 2: [40 + Math.sin(i) * 8, 40 + Math.cos(i) * 8, 1.5]});
			this.colliderWalls.push({0: [40 + Math.sin(j) * 8, 40 + Math.cos(j) * 8, 0], 1: [40 + Math.sin(i) * 8, 40 + Math.cos(i) * 8, 1.5], 2: [40 + Math.sin(j) * 8, 40 + Math.cos(j) * 8, 1.5]});
			i = j;
			j += Math.PI / 15;
		}
		this.colliderFloors = [
            {0: [7, 7, 0], 1: [20, 7.5, 0], 2: [15, 20, 0.8]},
            {0: [7, 7, 0], 1: [15, 20, 0.8], 2: [4, 15, 1.2]},
            //{0: [20, 7.5, 0], 1: [32, 12, 0.4], 2: [15, 20, 0.8]},
		];
	}

	collideWalls(kart) {
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

	getFloorZ(p0, v1, v2, kartPos) {
		const collideOffset = subVector(kartPos, p0);
		const divider = v1[0] * v2[1] - v1[1] * v2[0];
		const v1mp = -(collideOffset[1] * v2[0] - collideOffset[0] * v2[1]) / divider;
		const v2mp = (collideOffset[1] * v1[0] - collideOffset[0] * v1[1]) / divider;
		if (v1mp < 0 || v2mp < 0 || v1mp + v2mp > 1) {
			return null;
		} else {
			return p0[2] + v1mp * v1[2] + v2mp * v2[2];
		}
	}

	getFloorHeights(positions, hitboxHeight) {
		const hitboxHalfheight = hitboxHeight / 2;
		// Get floor/ceiling at each point of the kart
		const floorHighest = [];
		const ceilingLowest = [];
		const floored = [];
		const ceilinged = [];
		for (let i of positions) {
			floorHighest.push(null);
			ceilingLowest.push(null);
		}
		for (let wall of this.colliderFloors) {
			// Create a set of three vectors to represent the floor
			let v1 = subVector(wall[1], wall[0]); // forward y+ = v0 -> v1
			let v2 = subVector(wall[2], wall[0]); // up z+ = v0 -> v2

			for (let i = 0; i < FLOOR_COLL_COUNT; i++) {
				const z = this.getFloorZ(wall[0], v1, v2, positions[i]);
				if (z !== null) {
					if (z < positions[i][2] + hitboxHalfheight && (floorHighest[i] === null || z > floorHighest[i]))
						floorHighest[i] = z;
					if (z > positions[i][2] + hitboxHalfheight && (floorHighest[i] === null || z > floorHighest[i]))
						ceilingLowest[i] = z;
				}
			}
		}
		for (let i of positions) {
			floored.push(floorHighest[i] > positions[i]);
			floored.push(ceilingLowest[i] < positions[i] + hitboxHeight);
		}
		return [floorHighest, ceilingLowest, floored, ceilinged];
	}

	collideFloors(kart) {
		let wallContact = false;
		const throttleHeading = kart.throttleHeading;
		const momentumPosition = addVectors(kart.pos, kart.momentum);
		// Get offset with relation to kart rotation
		const positions = [momentumPosition];
		const modelNormal = crossProduct(kart.modelUp, kart.modelHeading);
		const cornerRatio = 1 / Math.sqrt(2);
		const hitboxHalfheight = kart.hitboxHeight / 2;
		for (let i = 0; i < 4; i++) {
			const angle = (i + 4) * Math.PI / 4;
			// Offset center position in the kart heading direction front*1, front/10, -front/10, -front*1
			positions.push(addVectors(momentumPosition, addVectors(mpVector(kart.modelHeading, Math.cos(angle)), mpVector(modelNormal, Math.sin(angle)))));
			positions.push(addVectors(momentumPosition, addVectors(mpVector(kart.modelHeading, Math.cos(angle) * CENTER_RADIUS), mpVector(modelNormal, Math.sin(angle) * CENTER_RADIUS))));
			positions.push(addVectors(momentumPosition, addVectors(mpVector(kart.modelHeading, - Math.cos(angle) * CENTER_RADIUS), mpVector(modelNormal, - Math.sin(angle) * CENTER_RADIUS))));
			positions.push(addVectors(momentumPosition, addVectors(mpVector(kart.modelHeading, - Math.cos(angle)), mpVector(modelNormal, - Math.sin(angle)))));
		}
		// Get floor/ceiling at each point of the kart
		let [floorHighest, ceilingLowest, floored, ceilinged] = this.getFloorHeights(positions, kart.hitboxHeight);
		for (let i = 0; i < 4; i++) {
			const FRONT_OUTER = i * 4 + 1;
			const FRONT_INNER = i * 4 + 2;
			const CENTER = 0;
			const BACK_INNER = i * 4 + 3;
			const BACK_OUTER = i * 4 + 4;
			// If the back and front are floored, we are floored in a stable way (if not, the kart should fall or tilt)
			const trueFloored = (floored[FRONT_OUTER] || floored[FRONT_INNER]) && (floored[BACK_INNER] || floored[BACK_OUTER]);
			if (trueFloored) {
				let target1, target2;
				// Front and back outer are floored and the center is below the plane (flat or valley)
				if (floored[FRONT_OUTER] && floored[BACK_OUTER] && !floored[CENTER] || compareFloats(
					(floorHighest[BACK_OUTER] - floorHighest[FRONT_OUTER]) / OUTER_OUTER2_RADIUS,
					(floorHighest[CENTER] - floorHighest[FRONT_OUTER]) / OUTER_CENTER_RADIUS
				) >= 0) {
					target1 = TARGET_FRONT_OUTER, target2 = TARGET_BACK_OUTER;
				}
				// Either front or back outer isn't floored, or the center is above the plane between them, (either way, a tip)
				// A valley between front outer and back inner (we're balancing on front outer and back inner)
				else if (floored[FRONT_OUTER] && floored[BACK_INNER] && compareFloats(
					(floorHighest[FRONT_INNER] - floorHighest[FRONT_OUTER]) / OUTER_INNER_RADIUS,
					(floorHighest[BACK_INNER] - floorHighest[FRONT_INNER]) / INNER_INNER2_RADIUS
				) <= 0) {
					target1 = TARGET_FRONT_OUTER, target2 = TARGET_BACK_INNER;
				}
				// A valley between back outer and front inner (we're balancing on front outer and back inner)
				else if (compareFloats(
					(floorHighest[BACK_INNER] - floorHighest[FRONT_INNER]) / INNER_INNER2_RADIUS,
					(floorHighest[BACK_OUTER] - floorHighest[BACK_INNER]) / OUTER_INNER_RADIUS
				) <= 0) {
					target1 = TARGET_FRONT_INNER, target2 = TARGET_BACK_OUTER;
				}
				// Neither of the inners makes a valley, therefore there is a plateau in the center
				else {
					target1 = TARGET_FRONT_INNER, target2 = TARGET_BACK_INNER;
				}
				const target1Index = target1 === 0 ? 0 : i * 4 + target1;
				const target2Index = target2 === 0 ? 0 : i * 4 + target2;
				let minZ = (floorHighest[target1Index] + floorHighest[target2Index]) / 2;
				let frontBackAngle = Math.atan((floorHighest[target2Index] - floorHighest[target1Index]) / (TARGET_LENGTH[target2] - TARGET_LENGTH[target1]));
			}
		}
	}
}