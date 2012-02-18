var _U = require('underscore');
var net = require('net');

var counter = 0;
var openSockets = [];
// openSockets.remove = function() {openSockets = _U.without(openSockets, [].slice.call(arguments))};

var server = net.Server(function(socket) {
  function socketWriteAll() {return _U.all(arguments, function(msg){
    console.log('socket ['+socketID+'] < "'+msg.replace(/(\r\n|\n|\r)/gm,'\\n')+'"');
    return socket.write(msg);
  });}
  
  openSockets.push(socket);
  socket.setEncoding('utf8');
  var socketID = counter++;
  console.log('-- socket ['+socketID+'] opened');
  
  socket.write('\nHello. You are on socket ['+socketID+']\n');
  
  var prompt = gauntlet('', socketWriteAll);
  
  socket.on('data', function(data){
    var fdata = data.substring(0, data.length-2);
    console.log('socket ['+socketID+'] > "'+fdata+'"');
    
    prompt = prompt(fdata, socketWriteAll);
    if (!prompt) socket.end();
  });
  
  socket.on('close', function(had_error) {
    openSockets = _U.without(openSockets, socket);
    console.log('-- socket ['+socketID+'] closed' + (had_error ? ' with error!' : ''));
  })
}).listen(8000);

console.log('-- server created');


var gwords = {
  jump: ['jump', 'hop', 'skip', 'leap', 'bound', 'vault', 'sail'],
  yes: ['yes', 'yeah', 'y', 'ye', 'ues'],
  attack: ['hit', 'smack', 'kill', 'mame', 'destroy', 'punch', 'kick', 'chop', 'attack']
}

function gauntlet(response, talkback) {
  talkback('\nWill you enter the guantlet?\n\n-- ');
  
  return function gateway(response, talkback) {
    if (matchAction(response, ['enter', gwords.yes, 'go', 'run'])) {
      var hallmsg = 'You are running through a grey stone hallway. '+
                    'Sharp pieces of metal poke out at strange angles '+
                    'from the walls.\nThe opening in front of you is '+
                    'filled with eerie mist.\nBehind you come growling '+
                    'and hissing sounds but you are too terrified to look.\n';
      talkback('\n'+hallmsg+'\n-- ');
      
      var loopback = function(response, talkback) {
        if (callback === loopback) {
          if (matchAction(response, ['help', 'what?'])) {
            talkback('\nThere is no help in sight.\n');
            talkback('Just keep running.\n\n-- ');
          } else if (matchAction(response, ['look', 'hall', 'hallway'])) {
            talkback('\n'+hallmsg+'\n');
            talkback('Just keep running.\n\n-- ');
          } else {
            talkback('\nThat isn\'t really relevant given your predicament.\n');
            talkback('\nJust keep running.\n\n-- ');
          }
          return callback;
        } else {
          return callback(response, talkback);
        }
      };
      var callback = loopback;
      
      setTimeout(function(){
        // WARN: talkback may be stale.
        talkback('\n\nA wall approaches from ahead.\nQuickly, jump!\n\n-- ');
        
        var consequence = '\n\n\You ran kersplat into a wall. '+
                          'The wall is red and you are dead.\n\n';
        var timeout = function(){
          talkback(consequence);
          callback = function(){return false};
        };
        setTimeout(function(){return timeout()}, 3000);
        
        callback = function(response, talkback) {
          if (matchAction(response, gwords.jump)) {
            talkback('\nThe wall whooses beneath your feet. You land '+
                     'and continue running.\nWell done.\n\n-- ');
            timeout = function(){};
            callback = loopback;
            return callback;
          } else {
            talkback(consequence);
            return false;
          }
        };
      }, 5000);
      
      return callback;
    } else {
      talkback('\nOk. Goodbye.\n\n');
      return false;
    }
  }
}


var matchAction = function(response) {
  return _U.all([].slice.call(arguments, 1), function(synlist) {
    function lc(l) {return _U.map(l, function(e) {return e.toLowerCase()})};
    return !!_U.intersection(lc(response.match(/\w+/g)), lc(_U.flatten([synlist]))).length;
  });
};

/*
Hello. You are on socket [0].
*/
