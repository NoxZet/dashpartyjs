export function isNumber(check) {
    return typeof check === 'number';
}

export function isArray(check) {
    return typeof check === 'object' && Array.isArray(check);
}

export function absoluteValue(a, b = 0, c = 0) {
    if (Array.isArray(a)) {
        b = a[1] || 0;
        c = a[2] || 0;
        a = a[0];
    }
    return Math.sqrt(a * a + b * b + c * c);
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

export function getMime(file) {
    if (file.lastIndexOf('.') === -1) {
        return 'text/plain';
    }
    let ext = file.substring(file.lastIndexOf('.'));
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg': case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.ico':
            return 'image/x-icon';
        case '.svg':
            return 'image/svg+xml';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
		case '.html': case '.htm':
			return 'text/html';
        default:
            return 'text/plain';
    }
}

export function clearHudConsole() {
    document.getElementById('hud-container').innerHTML = '';
}

export function printHudConsole(text) {
    document.getElementById('hud-container').innerHTML = (
        (document.getElementById('hud-container').innerHTML === '' ? '' : '<br>')
        + JSON.stringify(text, null, 2).replaceAll('\n', '<br>')
    );
}