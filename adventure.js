var _U = require('underscore');
var net = require('net');

var counter = 0;

var server = net.Server(function(socket) {
  function socketWriteAll() {
    for (var i = 0; i < arguments.length; i++)
      socket.write(arguments[i]);
  }
  
  socket.setEncoding('utf8');
  
  var socketID = counter++;
  console.log('-- socket ['+socketID+'] opened');
  
  socket.write('Hello! You are on socket ['+socketID+']\n');
  
  var prompt = adventure('', socketWriteAll);
  
  socket.on('data', function(data){
    var fdata = data.substring(0, data.length-2);
    console.log('socket ['+socketID+']  >  \''+fdata+'\'');
    prompt = prompt(fdata, socketWriteAll);
    if (!prompt) socket.end();
  });
  
  socket.on('close', function() {
    console.log('-- socket ['+socketID+'] closed');
  })
}).listen(8000);

console.log('-- server created');

var adventure = function (response, talkback) {
  // function theLooper(response, talkback) {talkback('You\'re stuck in the looper.'); return theLooper;}
  // function theQuietLooper(response, talkback) {return theQuietLooper;}
  
  talkback('What is your name?\n-- ');
  
  return function name(response, talkback) {
    if (response.length <= 0) {
      talkback("That's not a name, that's an empty string. What is your name?\n-- ");
      return name;
    }
    
    talkback("Hello "+response+".\n");
    talkback('Would you like to enter into the maze?\n-- ');
    
    return function(response, talkback) {
      if (response.toUpperCase() === 'YES') {
        talkback('Oh. My hero.\nBye.\n');
        return false;
      } else {
        talkback('Fine.\n');
        return false;
      }
    };
  };
};

/*
var comAct = {
      moveto: ['enter', 'goto', 'move', 'go', 'toward', 'towards'],
      pickup: ['pickup', 'pick', 'grab', 'take', 'nab']
    };
*/

/*
var matchAction = function(response) {
  function lc(l) {return _U.map(l, function(e) {return e.toLowerCase();});};
  var required = [].slice.call(arguments, 1);
  
  if (required.length == 1) {
    var inwords = response.match(/\w+/g);
    return !!_U.intersection(lc(inwords), lc(_U.flatten(required))).length;
  } else {
    return _U.foldl(_U.map(required, function(e) {return matchAction(response, e)}), function(a, e) {return a && e}, true);
  }
}
*/

/*
var matchAction = function(response) {
  return _U.all([].slice.call(arguments, 1), function(synlist) {
    function lc(l) {return _U.map(l, function(e) {return e.toLowerCase()})};
    return !!_U.intersection(lc(response.match(/\w+/g)), lc(_U.flatten([synlist]))).length;
  });
};

matchAction.selftest = function() {
  return !!_U.all([
    !matchAction("hello world", 'hello', 'gorld'),
    matchAction("hello world", 'hello', 'world'),
    matchAction("hello world", 'hello', [[['world']]]),
    !matchAction("hello world", ['hello', 'world'], ['chickens']),
    matchAction("hello world", ['hello', 'world'], ['chickens', ['hello', 'world']]),
    !matchAction("hello world", 'hello', []),
    !matchAction("hello world", [], []),
    matchAction("hello world")
  ], _U.identity);
}


matchAction(response, comAct.moveto, ['north', 'cave', 'lair', 'dark']);
*/

/*
var words = response.match(/\w+/g);
return _.every(listOfLists, function(s) {arrayIntersection(words, s).length > 0});


var words = new Set(response.match(/w+/g));
return _.every(_.map(Set, listOfLists), function(s) {s.intersect(words).length > 0});
return _.all(_.map(Set, listOfLists), compose(Set.notEmpty, Set.intersection.bind(words)));
}
*/
