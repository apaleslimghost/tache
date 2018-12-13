const logger = require('@quarterto/symbol-logger')
const chalk = require('chalk')

module.exports = logger({
	command:   {symbol: '→', format: 'cyan', formatLine: chalk.cyan.italic},
	log:      '│',
	done:      {symbol: '✓', format: 'green', formatLine: 'grey'},
	failed:    {symbol: '✕', format: 'red', formatLine: 'grey'},
	error:     {symbol: '│', format: 'red', formatLine: 'bold'},
	errorLine: {symbol: '│', format: 'red', formatLine: 'grey'},
})