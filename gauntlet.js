var _U = require('underscore');
var net = require('net');

var counter = 0;
var openSockets = [];
// openSockets.remove = function() {openSockets = _U.without(openSockets, [].slice.call(arguments))};

var gameserver = net.Server(function(socket) {
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


var controlserver = net.Server(function(socket) {
  function socketWriteAll() {return _U.all(arguments, function(msg){
    console.log('socket *control < "'+msg.replace(/(\r\n|\n|\r)/gm,'\\n')+'"');
    return socket.write(msg);
  });}
  
  socket.setEncoding('utf8');
  console.log('-- control socket* opened');
  
  var prompt = gcontrol(socketWriteAll);
  
  socket.on('data', function(data){
    var fdata = data.substring(0, data.length-2);
    console.log('socket *control > "'+fdata+'"');
    
    prompt = prompt(fdata);
    if (!prompt) socket.end();
  });
  
  socket.on('close', function(had_error) {
    openSockets = _U.without(openSockets, socket);
    console.log('-- socket *control closed' + (had_error ? ' with error!' : ''));
  })
}).listen(8001);

console.log('-- servers created');

// ----- Game -----

function gcontrol(talkback) {
  talkback('\nYawn.\nYes?\n\n-- ');
  
  return function(response) {
    function parseWords(s){return _U.map(s.match(/\w+/g), function(e){return e.toLowerCase()});};
    
    if (_U.any(parseWords(response), function(e){return e === 'pumpkin'})) {
      var instr = '\nYou are a controller.\n\nOptions:\n'+
                  '  > say *message (to all players)\n'+
                  '  > who (returns number of connected players)\n'+
                  '  > help (with the control center)\n'+
                  '  > exit\n\n';
      talkback(instr+'-- ');
      return function recvCmd(response){
        var words = parseWords(response);
        if (words[0] === 'say') {
          talkback('\nsay not implemented yet.\n\n-- ');
          return recvCmd;
        } else if (words[0] === 'who') {
          talkback('there are ['+openSockets.length+'] connected players');
          talkback('\n\n-- ')
          return recvCmd;
        } else if (words[0] === 'help') {
          talkback(instr+'-- ');
          return recvCmd;
        } else if (words[0] === 'exit') {
          return false
        } else{
          talkback('\ncommand not found.\n\n-- ');
          return recvCmd;
        }
      }
    } else {
      return false;
    }
  }
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

var gwords = {
  jump: ['jump', 'hop', 'skip', 'leap', 'bound', 'vault', 'sail'],
  yes: ['yes', 'yeah', 'y', 'ye', 'ues'],
  attack: ['hit', 'smack', 'kill', 'mame', 'destroy', 'punch', 'kick', 'chop', 'attack']
}

var matchAction = function(response) {
  return _U.all([].slice.call(arguments, 1), function(synlist) {
    function lc(l) {return _U.map(l, function(e) {return e.toLowerCase()})};
    return !!_U.intersection(lc(response.match(/\w+/g)), lc(_U.flatten([synlist]))).length;
  });
};
