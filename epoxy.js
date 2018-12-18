#!/usr/bin/env node bin.js

const { pattern, sh, log, runIfNew } = require('@quarterto/epoxy')
const util = require('util')

exports.foo = hmm => log.log(`foo ${util.inspect(hmm)}`)

const typescriptPattern = pattern(`src/%.ts`, `lib/%.js`)

exports.typescript = (srcFile) => {
	const libFile = typescriptPattern(srcFile)
	log.log(util.inspect({libFile, srcFile}))
	return libFile
}

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
