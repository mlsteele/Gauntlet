(function() {
  var port;
  port = parseInt(process.argv[2]);
  port = (0 <= port && port <= 65535) ? port : 8007;
  require('cluster-server')(port, function() {
    return require('./gauntlet.js');
  });
}).call(this);
