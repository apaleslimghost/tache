#!/usr/bin/env node

const hjson = require('hjson')
const proxyquire = require('proxyquire').noCallThru()
const { name: packageName, main: packageMain } = require('./package.json')
const log = require('./logger')
const chalk = require('chalk')
const util = require('util')
const {default: ErrorSubclass} = require('error-subclass')

class EpoxyError extends ErrorSubclass {
	constructor(message, {status = 1, info} = {}) {
		super(message)
		this.status = status
		this.info = info
	}
}

const [entry, ...args] = process.argv.slice(2)

const tasks = proxyquire(
	entry,
	{ [packageName]: require(packageMain) }
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

const wrapTask = (name, task) => async (...args) => {
	try {
		const start = Date.now()
		log.command(`${formatTask(name)}${chalk.grey(util.inspect(args).replace(/^\[ ?/, '(').replace(/ ?\]$/, ')'))}`)
		const result = await task(...args)
		const took = Date.now() - start
		log.done(`${formatTask(name)}${took > 20 ? ` (${chalk.italic[took > 500 ? 'red' : 'yellow'](`${took}ms`)})` : ''}`)
		return result
	} catch(error) {
		log.failed(formatTask(name))
		if(!error.task) error.task = name
		throw error
	}
}

Object.keys(tasks).forEach(name => {
	tasks[name] = wrapTask(name, tasks[name])
})

parsedArgs.reduce(
	(last, { task, options }) => last.then(() => {
		if(task in tasks) {
			console.log()
			return tasks[task](options)
		}

		const info = [
			'',
			chalk.bold.white('available tasks:'),
		].concat(
			Object.keys(tasks).map(formatTask).map(t => `  ${t}`)
		).join('\n')

		throw new EpoxyError(`no task ${formatTask(task)}`, {
			status: 2,
			info
		})
	}),
	Promise.resolve()
).catch(
	error => {
		if(error instanceof EpoxyError) {
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