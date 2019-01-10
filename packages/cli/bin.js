#!/usr/bin/env node

const hjson = require('hjson')
const proxyquire = require('proxyquire').noCallThru()
const log = require('@tache/logger')
const chalk = require('chalk')
const util = require('util')
const path = require('path')
const {default: ErrorSubclass} = require('error-subclass')

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
	{ '@tache/runtime': require('@tache/runtime') }
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

// wrap all exported task with logging and error handling
const wrapTask = (name, task) => async (...args) => {
	try {
		const start = Date.now()
		log.command(`${formatTask(name)}${chalk.grey(util.inspect(args).replace(/^\[ ?/, '(').replace(/ ?\]$/, ')'))}`)

		// actually run the task. if the task itself is a promise, wait for it, because it's a lazy boi
		const taskFunction = await task
		const result = await taskFunction(...args)

		const took = Date.now() - start
		log.done(`${formatTask(name)}${took > 20 ? ` (${chalk.italic[took > 500 ? 'red' : 'yellow'](`${took}ms`)})` : ''}`)

		return result
	} catch(error) {
		log.failed(formatTask(name))

		// save the task this was originally thrown from for logging/debugging purposes
		if(!error.task) error.task = name
		throw error
	}
}

// wrap exported tasks in logging helpers
Object.keys(tasks).forEach(name => {
	tasks[name] = wrapTask(name, tasks[name])
})

const start = Date.now()

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
).catch(
	error => {
		if(error instanceof TacheError) {
			log.failed(error.message)
			if(error.info) log.errorLine(error.info)
		} else {
			log.error(
				error.toString()
					.replace(':', chalk.grey(` (from task ${formatTask(error.task)})`) + ':')
			)

			if(error.stack && error.stack !== error.toString()) {
				log.errorLine(
					error.stack.replace(error.toString() + '\n', '')
				)
			}
		}

		process.exitCode = error.status || 1;
	}
)