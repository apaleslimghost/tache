const sh = require('@tache/sh')
const pattern = require('@tache/pattern')
const isSourceNewer = require('@tache/is-source-newer')
const log = require('@tache/logger')
const npr = require('@quarterto/npr')

module.exports = { sh: sh.configure({ log }), pattern, log, isSourceNewer, lazyRequire: npr }