"use strict";

var net = require('net');
var logger = console;
var clc = require('cli-color');
var _U = require('underscore');

clc.sck = clc.blue;
clc.scko = clc.green;
clc.sckc = clc.red;
clc.ioi = clc.green;
clc.ioo = clc.yellow;
clc.txt = clc.gray;

var counter = 0;
var openSockets = [];

var gameserver = module.exports = net.Server(function(socket) {
  function socketWriteAll() {return _U.all(arguments, function(msg){
    logger.log(clc.sck('socket ['+socketID+']') +
                clc.ioo(' > ') + clc.txt('"'+msg.replace(/(\r\n|\n|\r)/gm,'\\n')+'"'));
    return socket.write(msg);
  });}
  socketWriteAll.alive = true;
  
  openSockets.push(socket);
  socket.setEncoding('utf8');
  var socketID = counter++;
  logger.log(clc.sck('-- socket ['+socketID+']') + clc.scko(' opened'));
  
  socket.write('\nHello. You are on socket ['+socketID+']\n');
  
//   var player = {tell: socketWriteAll, isAlive: true,
//                 kill: function(){this.isAlive = false; socket.end()}}
  var prompt = gauntlet(socketWriteAll);
  
  socket.on('data', function(data){
    var fdata = data.substring(0, data.length-2);
    logger.log(clc.sck('socket ['+socketID+']') + clc.ioi(' < ') + clc.txt('"'+fdata+'"'));
    
    if (prompt)
      prompt = prompt(fdata);
    else
      socket.end();
  });
  
  socket.on('close', function(had_error) {
    socketWriteAll.alive = false;
    openSockets = _U.without(openSockets, socket);
    logger.log(clc.sck('-- socket ['+socketID+']')+clc.sckc(' closed')
                + (had_error ? ' with error!' : ''));
  })
});

if (require.main === module) {
  var port = parseInt(process.argv[2]);
  var port = (0 <= port && port <= 65535) ? port : 8007;
  gameserver.listen(port);
  console.log('server started on port '+port);
}

// ----- Game -----

function gauntlet(talkback) {
  talkback('\nWill you enter the gauntlet?\n\n-- ');
  
  return function gateway(response) {
    if (matchAction(response, ['enter', gwords.yes, 'go', 'run'])) {
      var hallmsg = 'You are running through a grey stone hallway. '+
                    'Sharp pieces of metal poke out at strange angles '+
                    'from the walls.\nThe opening in front of you is '+
                    'filled with eerie mist.\nBehind you come growling '+
                    'and hissing sounds but you are too terrified to look.\n';
      talkback('\n'+hallmsg+'\n-- ');
      
      var loopback = function(response) {
        if (onInput === loopback) {
          if (matchAction(response, ['help', 'what?'])) {
            talkback('\nThere is no help in sight.\n');
            talkback('Just keep running.\n\n-- ');
          } else if (matchAction(response, ['look', 'hall', 'hallway'])) {
            talkback('\n'+hallmsg+'\n');
            talkback('Just keep running.\n\n-- ');
          } else if (matchAction(response, ['stop', 'quit'])) {
            talkback('\nI don\'t think so.\n\n-- ');
          } else if (matchAction(response, 'run')) {
            talkback('\nYou are already running.\n\n-- ');
          } else if (matchAction(response, gwords.jump)) {
            talkback('\nYou look like a fool jumping up and down.\n\n-- ');
          } else if (matchAction(response, ['ok', 'sure'])) {
            talkback('\nOk what?\n\n-- ');
          } else {
            if (response.length > 0)
              talkback('\nThat isn\'t really relevant given your predicament.');
            talkback('\nJust keep running.\n\n-- ');
          }
          return onInput;
        } else {
          return onInput && onInput(response);
        }
      };
      var onInput = loopback;
      
      var obstacles = {
            wall: {
              name: 'wall',
              warn: 'A stone wall approaches from ahead.\nQuickly, jump!\n',
              pass: 'The wall whooses beneath your feet. You land and continue running.\n',
              fail: 'You ran kersplat into a wall. The wall is red and you are dead.\n',
              predicate: function(response) {
                if (matchAction(response, gwords.jump))
                  return {pass: true, msg: this.pass}
                else
                  return {pass: false, msg: this.fail}
              }
            },
            hole: {
              name: 'hole',
              warn: 'Is that a hole in the ground?\n',
              pass: 'You look down as you bound over the hole.\nThere are bodies.\nCreepy.\n',
              fail: 'No, that\'s just a black spot on the gr-\nAaaaaaaah...\n',
              yeah: 'Yes it is. You\'re dead.\n',
              predicate: function(response) {
                if (matchAction(response, gwords.jump))
                  return {pass: true, msg: this.pass}
                else if (matchAction(response, gwords.no))
                  return {pass: false, msg: this.yeah}
                else
                  return {pass: false, msg: this.fail}
              }
            },
            beam: {
              name: 'beam',
              warn: 'A beam stretches across in front of you at head level.\n',
              pass: 'You slip under the beam just in time.\n',
              fail: ['Smack!\nYou dropped something.\n',
                    'You try to jump above head level but that\'s impossible. '+
                    'You fall on the beam and become dog food.\n'],
              predicate: function(response) {
                if (matchAction(response, gwords.under))
                  return {pass: true, msg: this.pass}
                else if (matchAction(response, gwords.jump))
                  return {pass: false, msg: this.fail[1]}
                else
                  return {pass: false, msg: this.fail[0]}
              }
            },
            bat: {
              name: 'bat',
              warn: 'A horrifying vampirous bat is flitting around your head.\n',
              pass: 'You pummel the thing until it hisses green smoke and disintegrates.\n',
              fail: 'The bat leaches onto your ankle which turns purple, then yellow, '+
                    'and then explodes. You are eaten.\n',
              flail: ['You clutch at the air randomly committing violence at everything but '+
                     'the offending bat. Specificity is the word of the day.\n',
                     'Attack what, the wall?\nSpecificity is the word of the day.\n'],
              jump: 'Jump... over a bat?\n'+
                    'The bat leaches onto your ankle which turns purple, then yellow, '+
                    'and then explodes. You are eaten.\n',
              predicate: function(response) {
                var batnames = ['him', 'her', 'it', 'bat', 'creature', 'vampire'];
                if (matchAction(response, gwords.attack, batnames))
                  return {pass: true, msg: this.pass}
                else if (matchAction(response, gwords.attack))
                  return {pass: false, msg: this.flail[Math.floor(Math.random()*2)]}
                else if (matchAction(response, gwords.jump))
                  return {pass: false, msg: this.jump}
                else
                  return {pass: false, msg: this.fail}
              }
            }
          };
      var randObstacle = function() {
        var l = _U.values(obstacles);
        return l[Math.floor(Math.random() * l.length)];
      }
      
      var placeObstacle = function(obstacle, timeuntil, responsewindow, onPass) {
        setTimeout(function(){
          if (!talkback.alive) return;
          
          talkback('\n\n'+obstacle.warn+'\n-- ');
          
          var consequence = '\n\n'+obstacle.predicate('').msg+'\n';
          var timeout = setTimeout(function(){
            if (!talkback.alive)
              return talkback.alive
            talkback(consequence);
            talkback.alive = false;
            onInput = false;
          }, responsewindow);
          
          onInput = function(response) {
            var state = obstacle.predicate(response);
            if (state.pass) {
              talkback('\n'+state.msg+'\n-- ');
              clearTimeout(timeout);
              onPass && onPass();
              return (onInput = loopback);
            } else {
              talkback('\n'+state.msg+'\n');
              talkback.alive = false;
              return (onInput = false);
            }
          };
        }, timeuntil);
      };
      
      setTimeout(function placeLoop(){
        if (talkback.alive)
          placeObstacle(randObstacle(), Math.random() * 5000 + 2500, 5000, placeLoop);
      }, 4000);
      
      return onInput;
    } else {
      talkback('\nHa. Goodbye.\n\n');
      return false;
    }
  }
}

var gwords = {
  jump: ['jump', 'hop', 'skip', 'leap', 'bound', 'vault', 'sail'],
  yes: ['yes', 'yeah', 'y', 'ye', 'ues', 'sure'],
  no: ['no', 'negative', 'not'],
  attack: ['hit', 'smack', 'kill', 'mame', 'destroy', 'punch', 'kick', 'chop', 'attack'],
  under: ['slide', 'roll', 'duck', 'under', 'crouch', 'dive']
}

var matchAction = function(response) {
  return _U.all([].slice.call(arguments, 1), function(synlist) {
    function lc(l) {return _U.map(l, function(e) {return e.toLowerCase()})};
    return !!_U.intersection(lc(response.match(/\w+/g)), lc(_U.flatten([synlist]))).length;
  });
};
