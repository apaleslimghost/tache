const pty = require('node-pty')
const log = require('@tache/logger')

const exec = (cmd, { log, shell, shellArgs, env }) => new Promise((resolve, reject) => {
	log.command(cmd)

	const proc = pty.spawn(
		shell,
		shellArgs(cmd),
		{env}
	)

	let output = ''

	proc.on('error', error => {
		log.error(error.message)
		reject(error)
	})

	proc.on('data', data => {
		output += data
		log.stdout(data)
	})

	proc.on('exit', (code, signal) => {
		if(signal) {
			const msg = `${cmd} received ${signal}`
			log.error(msg)
			reject(new Error(msg))
		} else if(code) {
			const msg = `${cmd} exited with code ${code}`
			log.error(msg)
			reject(new Error(msg))
		} else {
			log.done(cmd)
			resolve(output)
		}
	})
})

const expandVar = (interpoland, args) => (
	  typeof interpoland === 'function'?  expandVar(interpoland(...args), args)
	: typeof interpoland === 'undefined'? ''
	: Array.isArray(interpoland)?         interpoland.join(' ')
	: /* otherwise *********************/ interpoland
)

const stringToCommands = (strings, vars, args) => strings.reduce(
	async (commandsPromise, part, i) => {
		let commands = await commandsPromise
		let lastCommand = commands.pop() || ''

		if(part.includes('\n')) {
			const [first, ...rest] = part.split('\n').map(
				(line, index) => index > 0 ? line.trimLeft() : line
			)

			commands = commands.concat(lastCommand + first).concat(rest)
			lastCommand = commands.pop()
		} else {
			lastCommand += part
		}

		lastCommand += await expandVar(await vars[i], args)
		
		return [...commands, lastCommand]
	},
	Promise.resolve([])
).then(commands => commands.filter(a => a))

const defaultOptions = {
	log,
	shell: '/bin/sh',
	shellArgs: cmd => ['-c', cmd],
	env: process.env
}

const configure = options => (strings, ...vars) => async(...args) => (
	(
		await stringToCommands(strings, vars, args)
	).reduce(
		(last, command) => last.then(
			output => exec(command, options).then(
				stdout => output.concat(stdout)
			)
		),
		Promise.resolve([])
	)
)

module.exports = configure(defaultOptions)
module.exports.configure = options => configure(Object.assign({}, defaultOptions, options))
module.exports.env = env => module.exports.configure({env: Object.assign({}, process.env, env)})