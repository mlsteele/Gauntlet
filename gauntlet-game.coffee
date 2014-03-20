# Gauntlet Game

_U = require 'underscore'
plantTimeout = (ms, cb) -> setTimeout cb, ms


gwords =
  jump: ['jump', 'hop', 'skip', 'leap', 'bound', 'vault', 'sail']
  yes: ['yes', 'yeah', 'y', 'ye', 'ues', 'sure']
  no: ['no', 'negative', 'not']
  attack: ['hit', 'smack', 'kill', 'mame', 'destroy', 'punch', 'kick', 'chop', 'attack']
  under: ['slide', 'roll', 'duck', 'under', 'crouch', 'dive']

# Returns whether words from the response can match every list of synonyms
matchAction = (response, synlists...) ->
  if response?.match? then _U.all synlists, (synlist) ->
    lc = (l) -> (e.toLowerCase() for e in l)
    reswords = (response.match /\w+/g) ? ''
    (_U.intersection (lc reswords), lc _U.flatten [synlist]).length

###
matchActionTest = () ->
  _U.all [
    !matchAction "hello world", 'hello', 'gorld'
    matchAction "hello world", 'hello', 'world'
    matchAction "hello world", 'hello', [[['world']]]
    !matchAction "hello world", ['hello', 'world'], ['chickens']
    matchAction "hello world", ['hello', 'world'], ['chickens', ['hello', 'world']]
    !matchAction "hello world", 'hello', []
    !matchAction "hello world", [], []
    matchAction "hello world"
    !matchAction()
    !matchAction `null`
    !matchAction `undefined`
    !matchAction null, undefined
    !matchAction '', ['', '', '']
    !matchAction 'four titude', ['four', 'five'], ''
    !matchAction '???', ''
    matchAction 'yes', ['enter', ['yes'], 'go', 'run']
  ], _U.identity

console.log 'matchActionTest ->', matchActionTest()
###

obstacles =
  wall:
    name: 'wall'
    warn: 'A stone wall approaches from ahead.\nQuickly, jump!\n'
    pass: 'The wall whooses beneath your feet. You land and continue running.\n'
    fail: 'You ran kersplat into a wall. The wall is red and you are dead.\n'
    predicate: (response) ->
      if matchAction response, gwords.jump
        {pass: true, msg: this.pass}
      else
        {pass: false, msg: this.fail}
  hole:
    name: 'hole'
    warn: 'Is that a hole in the ground?\n'
    pass: 'You look down as you bound over the hole.\nThere are bodies.\nCreepy.\n'
    fail: 'No, that\'s just a black spot on the gr-\nAaaaaaaah...\n'
    yeah: 'Yes it is. You\'re dead.\n'
    predicate: (response) ->
      if matchAction response, gwords.jump
        {pass: true, msg: this.pass}
      else if matchAction response, gwords.no
        {pass: false, msg: this.yeah}
      else
        {pass: false, msg: this.fail}
  beam:
    name: 'beam'
    warn: 'A beam stretches across in front of you at head level.\n'
    pass: 'You slip under the beam just in time.\n'
    fail: ['Smack!\nYou dropped something.\n'
          'You try to jump above head level but that\'s impossible. '+
          'You fall on the beam and become dog food.\n']
    predicate: (response) ->
      if matchAction response, gwords.under
        {pass: true, msg: this.pass}
      else if matchAction response, gwords.jump
        {pass: false, msg: this.fail[1]}
      else
        {pass: false, msg: this.fail[0]}
  bat:
    name: 'bat'
    warn: 'A horrifying vampirous bat is flitting around your head.\n'
    pass: 'You pummel the thing until it hisses green smoke and disintegrates.\n'
    fail: 'The bat leaches onto your ankle which turns purple, then yellow, '+
          'and then explodes. You are eaten.\n'
    flail: ['You clutch at the air randomly committing violence at everything but '+
           'the offending bat. Specificity is the word of the day.\n'
           'Attack what, the wall?\nSpecificity is the word of the day.\n']
    jump: 'Jump... over a bat?\n'+
          'The bat leaches onto your ankle which turns purple, then yellow, '+
          'and then explodes. You are eaten.\n'
    predicate: (response) ->
      batnames = ['him', 'her', 'it', 'bat', 'creature', 'vampire'];
      if matchAction response, gwords.attack, batnames
        {pass: true, msg: this.pass}
      else if matchAction response, gwords.attack
        {pass: false, msg: this.flail[Math.floor(Math.random()*2)]}
      else if matchAction response, gwords.jump
        {pass: false, msg: this.jump}
      else
        {pass: false, msg: this.fail}

randObstacle = ->
  l = (obstacles[key] for key of obstacles)
  l[Math.floor(Math.random() * l.length)]


module.exports = gauntlet = (player) ->
  player.tell '\nWill you enter the gauntlet?\n\n-- '

  (response) ->
    if matchAction response, ['enter', gwords.yes, 'go', 'run']
      hallmsg = 'You are running through a grey stone hallway. '+
                'Sharp pieces of metal poke out at strange angles '+
                'from the walls.\nThe opening in front of you is '+
                'filled with eerie mist.\nBehind you come growling '+
                'and hissing sounds but you are too terrified to look.\n';
      player.tell '\n'+hallmsg+'\n-- '

      loopback = (response) ->
        if onInput is loopback
          if matchAction response, ['help', 'what?']
            player.tell '\nThere is no help in sight.\n'
            player.tell 'Just keep running.\n\n-- '
          else if matchAction response, ['look', 'hall', 'hallway']
            player.tell '\n'+hallmsg+'\n'
            player.tell 'Just keep running.\n\n-- '
          else if matchAction response, ['stop', 'quit']
            player.tell '\nI don\'t think so.\n\n-- '
          else if matchAction response, 'run'
            player.tell '\nYou are already running.\n\n-- '
          else if matchAction response, gwords.jump
            player.tell '\nYou look like a fool jumping up and down.\n\n-- '
          else if matchAction response, ['ok', 'sure']
            player.tell '\nOk what?\n\n-- '
          else
            if response.length > 0
              player.tell '\nThat isn\'t really relevant given your predicament.'
            player.tell '\nJust keep running.\n\n-- '
          onInput
        else
          onInput && onInput(response)

      onInput = loopback

      placeObstacle = (obstacle, timeuntil, responsewindow, onPass) ->
        plantTimeout timeuntil, ->
          if !player.isAlive then return

          player.tell '\n\n'+obstacle.warn+'\n-- '

          consequence = '\n\n'+obstacle.predicate('').msg+'\n'
          timeout = plantTimeout responsewindow, ->
            if !player.isAlive then return
            player.tell consequence
            player.kill()
            onInput = false

          onInput = (response) ->
            state = obstacle.predicate response
            if state.pass
              player.tell '\n'+state.msg+'\n-- '
              clearTimeout timeout
              onPass && onPass()
              return onInput = loopback
            else
              player.tell '\n'+state.msg+'\n'
              player.kill()
              return (onInput = false)

      plantTimeout 4000, placeLoop = ->
        if player.isAlive
          placeObstacle randObstacle(), Math.random() * 5000 + 2500, 5000, placeLoop

      onInput;
    else
      player.tell '\nHa. Goodbye.\n\n'
      player.kill()
