const sh = require('@quarterto/sh')
const pattern = require('@quarterto/pattern')
const isSourceNewer = require('@quarterto/is-source-newer')
const log = require('./logger')
const npr = require('@quarterto/npr')

module.exports = { sh: sh.configure({ log }), pattern, log, isSourceNewer, lazyRequire: npr }