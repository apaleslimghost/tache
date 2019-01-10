const log = require('@tache/logger')
const util = require('util')
const chalk = require('chalk')
const formatTask = t => chalk.cyan.italic(t)

module.exports = (name, task) => async (...args) => {
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