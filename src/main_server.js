import fs from "fs";
import http from "http";
import { getMime } from "utils";
import Networker from "Network/Server/Networker";

console.log('Server start');

// Static server http server
const httpServer = http.createServer((req, res) => {
    let questPos = req.url.indexOf('?');
    let path = req.url.substring(1, questPos === -1 ? undefined : questPos);
    let match;
	if (path === '') {
		path = 'index.html';
    } else if (path === 'favicon.ico') {
        path = 'res/favicon.ico';
	} else if (path === 'index.html' || path === 'dist/main_client.js' || path === 'dist/main_client.js.map') {
        path = path;
    }
    // Either doesn't start with data or includes more than one .
    else if (path.search(/res\//) !== 0 || ((match = path.match(/\./g)) && match.length > 1)) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.end('Bad Request');
        return;
    }
    res.writeHead(200, {'Content-Type': getMime(path)});
    let stream = fs.createReadStream(path);
    stream.on('finish', function(){
        res.end();
    });
    stream.pipe(res);
}).listen(3000);

new Networker(httpServer);