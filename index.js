const sh = require('@quarterto/sh')
const pattern = require('@quarterto/pattern')
const isSourceNewer = require('@quarterto/is-source-newer')
const log = require('./logger')

module.exports = { sh: sh.configure({ log }), pattern, log, isSourceNewer }