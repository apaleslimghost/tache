const logger = require('@quarterto/symbol-logger')
const chalk = require('chalk')

module.exports = logger({
	log:       {symbol: '│', indent: '        '},
	command:   {symbol: '│', indent: chalk.grey.italic(' start  '), format: 'cyan', formatLine: chalk.cyan.italic},
	done:      {symbol: '✓', indent: chalk.grey.italic(' done   '), format: 'green', formatLine: chalk.cyan.italic},
	failed:    {symbol: '✕', indent: chalk.grey.italic(' failed '), format: chalk.red.bold, formatLine: chalk.cyan.italic},
	error:     {symbol: '│', indent: '        ', format: 'red', formatLine: 'bold'},
	errorLine: {symbol: '│', indent: '        ', format: 'red', formatLine: 'grey'},
	stdout:    {symbol: '│', indent: '        ', format: 'grey'},
	stderr:    {symbol: '│', indent: '        ', format: 'red'},
})