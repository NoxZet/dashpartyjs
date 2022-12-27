export function absoluteValue(a, b = 0, c = 0) {
    if (Array.isArray(a)) {
        b = a[1] || 0;
        c = a[2] || 0;
        a = a[0];
    }
    return Math.sqrt(a * a + b * b + c * c);
}

export function angleBetween(v1, v2) {
    return Math.acos(dotProduct(v1, v2) / (absoluteValue(v1) * absoluteValue(v2)));
}

export function mpVector(a, scalar) {
    return [ a[0] * scalar, a[1] * scalar, a[2] * scalar ];
}

export function addVectors(a, b, scalar = 1) {
    return [ a[0] + b[0] * scalar, a[1] + b[1] * scalar, a[2] + b[2] * scalar ];
}

export function addVectors3(a, b, c) {
    return [ a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2] ];
}

export function subVector(a, b) {
    return [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
}

export function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossProduct(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
}

export function rotateVector(vector, axis, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return addVectors3(
        mpVector(vector, cos),
        mpVector(crossProduct(vector, axis), sin),
        mpVector(axis, dotProduct(vector, axis) * (1 - cos))
    );
}

/**
 * Calculates inverse matrix for any matrix
 * @param {number[]} mat matrix
 * @returns {number[]}
 */
export function invertMatrix3x3(mat) {
    const det = mat[0] * (mat[4] * mat[8] - mat[7] * mat[5]) -
                mat[3] * (mat[1] * mat[8] - mat[7] * mat[2]) +
                mat[6] * (mat[1] * mat[5] - mat[4] * mat[2]);
    return [
        (mat[4] * mat[8] - mat[7] * mat[5]) / det,
        (mat[7] * mat[2] - mat[1] * mat[8]) / det,
        (mat[1] * mat[5] - mat[4] * mat[2]) / det,
        (mat[6] * mat[5] - mat[3] * mat[8]) / det,
        (mat[0] * mat[8] - mat[6] * mat[2]) / det,
        (mat[3] * mat[2] - mat[0] * mat[5]) / det,
        (mat[3] * mat[7] - mat[6] * mat[4]) / det,
        (mat[6] * mat[1] - mat[0] * mat[7]) / det,
        (mat[0] * mat[4] - mat[3] * mat[1]) / det,
    ];
}

/**
 * Calculates inverse matrix for a matrix with determinant equal to 1
 * @param {number[]} mat matrix
 * @returns {number[]}
 */
export function invertMatrix3x3Rot(mat) {
    return [
        (mat[4] * mat[8] - mat[7] * mat[5]),
        (mat[7] * mat[2] - mat[1] * mat[8]),
        (mat[1] * mat[5] - mat[4] * mat[2]),
        (mat[6] * mat[5] - mat[3] * mat[8]),
        (mat[0] * mat[8] - mat[6] * mat[2]),
        (mat[3] * mat[2] - mat[0] * mat[5]),
        (mat[3] * mat[7] - mat[6] * mat[4]),
        (mat[6] * mat[1] - mat[0] * mat[7]),
        (mat[0] * mat[4] - mat[3] * mat[1]),
    ];
}

export function mpMatrix3x3Vector(mat, vec) {
    return [
        mat[0] * vec[0] + mat[1] * vec[1] + mat[2] * vec[2],
        mat[3] * vec[0] + mat[4] * vec[1] + mat[5] * vec[2],
        mat[6] * vec[0] + mat[7] * vec[1] + mat[8] * vec[2],
    ];
}