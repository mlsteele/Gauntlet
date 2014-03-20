# Gauntlet Server

gauntlet = require './gauntlet-game'
net = require 'net'
clc = require 'cli-color'
_U = require 'underscore'

clc.sck  = clc.blue
clc.scko = clc.green
clc.sckc = clc.red
clc.ioi  = clc.green
clc.ioo  = clc.yellow
clc.txt  = clc.white


counter = 0
openSockets = []

module.exports = gameserver = net.Server (socket) ->
  socketWriteAll = (msgs...) ->
    _U.all (_U.flatten msgs), (msg) ->
      console.log (clc.sck('socket ['+socketID+']') + clc.ioo(' > ') +
                   clc.txt('"'+msg?.replace?(/(\r\n|\n|\r)/gm,'\\n')+'"'))
      socket.write msg

  openSockets.push socket
  socket.setEncoding 'utf8'
  socketID = counter++
  console.log (clc.sck('-- socket ['+socketID+']') + clc.scko(' opened'))

  socket.write '\nHello. You are on socket ['+socketID+']\n'

  player = {
    tell: (msgs...) -> if this.isAlive then socketWriteAll msgs else throw 'cannot tell dead player'
    isAlive: yes
    kill: -> this.isAlive = false; socket.end()
  }

  prompt = gauntlet player

  socket.on 'data', (data) ->
    fdata = data.substring 0, data.length-2
    console.log (clc.sck('socket ['+socketID+']') + clc.ioi(' < ') + clc.txt('"'+fdata+'"'))

    if prompt?
      prompt = prompt(fdata);
    else
      #console.log 'dead prompt (calling socket.end())'
      socket.end()

  socket.on 'close', (had_error) ->
    #console.log 'socket.on(\'close\') (calling player.kill)'
    player.kill()
    openSockets = _U.without openSockets, socket
    console.log (clc.sck('-- socket ['+socketID+']')+clc.sckc(' closed') + (if had_error then ' with error!' else ''))


if module is require.main
  port = parseInt process.argv[2]
  port = if (0 <= port <= 65535) then port else 8007
  gameserver.listen(port);
  console.log 'server started on port '+port
