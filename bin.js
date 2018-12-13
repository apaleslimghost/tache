#!/usr/bin/env node

const hjson = require('hjson')
const proxyquire = require('proxyquire').noCallThru()
const { name: packageName, main: packageMain } = require('./package.json')
const log = require('./logger')

const [entry, ...args] = process.argv.slice(2)

const tasks = proxyquire(
	entry,
	{ [packageName]: require(packageMain) }
)

const parsedArgs = args.map(
	arg => {
		const [task, ...rest] = arg.split(':')
		return { task, options: hjson.parse(rest.join(':')) }
	}
)

const wrapTask = (name, task) => async (...args) => {
	try {
		log.command(name)
		return await task(...args)
	} catch(e) {
		log.error(e.message)
	} finally {
		log.done(name)
	}
}

Object.keys(tasks).forEach(name => {
	tasks[name] = wrapTask(name, tasks[name])
})

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