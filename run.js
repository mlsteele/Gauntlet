(function() {
  require('cluster-server')(8007, function() {
    return require('./gauntlet.js');
  });
}).call(this);
