#!/usr/bin/env node

const hjson = require('hjson')
const proxyquire = require('proxyquire').noCallThru()
const log = require('@tache/logger')
const chalk = require('chalk')
const path = require('path')
const {default: ErrorSubclass} = require('error-subclass')
const wrapTask = require('./wrap')

// error class for internal, informational exceptions that don't log stack trace
class TacheError extends ErrorSubclass {
	constructor(message, {status = 1, info} = {}) {
		super(message)
		this.status = status
		this.info = info
	}
}

const [entry, ...args] = process.argv.slice(2)

// resolve requires to the runtime to the same installation as this bin
const tasks = proxyquire(
	path.resolve(entry),
	{ 'tache': require('./') }
)

let parsedArgs = args.map(
	arg => {
		const [task, ...rest] = arg.split(':')
		return { task, options: hjson.parse(rest.join(':')) }
	}
)

if(parsedArgs.length === 0) {
	parsedArgs = [{task: 'default', options: ''}]
}

const formatTask = t => chalk.cyan.italic(t)

// wrap all exported tasks with logging and error handling
Object.keys(tasks).forEach(name => {
	tasks[name] = wrapTask(name, tasks[name])
})

const logError = error => {
	if(error instanceof TacheError) {
		log.failed(error.message)
		if(error.info) log.errorLine(error.info)
	} else {
		log.error(
			error.toString()
				.replace(':', (error.task ? chalk.grey(` (from task ${formatTask(error.task)})`) : '') + ':')
		)

		if(error.stack && error.stack !== error.toString()) {
			log.errorLine(
				error.stack.replace(error.toString() + '\n', '')
			)
		}
	}

	process.exitCode = error.status || process.exitCode || 1
}

const unhandledRejections = new Map();

process.on('unhandledRejection', (reason, promise) => {
	unhandledRejections.set(promise, reason)
})

process.on('rejectionHandled', promise => {
	unhandledRejections.delete(promise)
})

process.on('beforeExit', () => {
	unhandledRejections.forEach(logError)
})

parsedArgs.reduce(
	async (last, { task, options }) => {
		// wait for the previous task to run them in sequence
		await last

		if(!(task in tasks)) {
			const info = [
				'',
				chalk.bold.white('available tasks:'),
			].concat(
				Object.keys(tasks).map(formatTask).map(t => `  ${t}`)
			).join('\n')
	
			throw new TacheError(`no task ${formatTask(task)}`, {
				status: 2,
				info
			})
		}

		// clear a line for visual separation
		console.log()
		return tasks[task](options)
	},
	Promise.resolve()
).catch(logError)