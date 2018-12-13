#!/usr/bin/env node bin.js

const { pattern, sh, log } = require('@quarterto/epoxy')
const util = require('util')

exports.foo = hmm => console.log('foo', hmm)

exports.typescript =  ((from, to) => {
	log.log(util.inspect({ from, to }))
})

exports.deploy = pattern `src/%.ts` `lib/%.js` (sh`
echo from ${from => from}
echo to ${(_, to) => to}
`)

exports.error = () => {
	throw new Error('lol')
}