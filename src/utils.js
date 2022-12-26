export function isNumber(check) {
    return typeof check === 'number';
}

export function isArray(check) {
    return typeof check === 'object' && Array.isArray(check);
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
    document.getElementById('hud-container').innerHTML += (
        (document.getElementById('hud-container').innerHTML === '' ? '' : '<br>')
        + JSON.stringify(text, null, 2).replaceAll('\n', '<br>')
    );
}