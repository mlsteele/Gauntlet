port = parseInt process.argv[2]
port = if (0 <= port <= 65535) then port else 8007
require('cluster-server') port, () -> require './gauntlet.js'
