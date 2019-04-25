var chokidar = require('chokidar');
var shell = require("shelljs");

var watcher = chokidar.watch('./src');

watcher.on('ready', function() {
    console.log("Watching files...");
    watcher.on('all', function() {
        shell.exec("node config/r.js -o config/build.js && npm run build:less");
        console.log("Watching files...");
    });
});
