#!/usr/bin/env node bin.js

const { pattern, sh, log, runIfNew } = require('@quarterto/epoxy')
const util = require('util')

exports.foo = hmm => log.log(`foo ${util.inspect(hmm)}`)

exports.typescript = pattern `src/%.ts` `lib/%.js` (runIfNew(async (from, to) => {
	log.log(util.inspect({from, to}))
	return to
}))

exports.deploy = sh`
echo deploy
`

exports.error = () => {
	throw new Error('lol')
}

exports.dep = async () => {
	log.log(await exports.typescript('src/%.ts'))
	await exports.error()
}

exports.default = async () => {
	await exports.deploy()
	await exports.foo('lol')
}

exports.slow = delay => new Promise(r => setTimeout(r, delay))
