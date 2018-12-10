#!/usr/bin/env node

const hjson = require('hjson')
const proxyquire = require('proxyquire').noCallThru()
const { name: packageName } = require('./package.json')

const [,, entry, ...args] = process.argv

const tasks = proxyquire(
	entry,
	{ [packageName]: require('./index.js') }
)

const parsedArgs = args.map(
	arg => {
		const [task, ...rest] = arg.split(':')
		return { task, options: hjson.parse(rest.join(':')) }
	}
)

parsedArgs.reduce(
	(last, { task, options }) => last.then(() => {
		if(task in tasks) {
			return tasks[task](options)
		}

		throw new Error(`no task ${task}. available tasks: ${Object.keys(tasks).join()}`)
	}),
	Promise.resolve()
).catch(
	error => {
		console.error(error.message)
		process.exit(error.status || 1)
	}
)