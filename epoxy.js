#!/usr/bin/env node bin.js

const {pattern} = require('epoxy')

exports.foo = hmm => console.log('foo', hmm)

exports.typescript = pattern `src/%.ts` `lib/%.js` ((from, to) => {
	console.log({from, to})
})