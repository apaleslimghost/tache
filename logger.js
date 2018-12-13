const logger = require('@quarterto/symbol-logger')

module.exports = logger({
	command: {symbol: '→', format: 'cyan', formatLine: 'grey'},
	log:    '│',
	done:    {symbol: '✓', format: 'green', formatLine: 'grey'},
	error:   {symbol: '✕', format: 'red', formatLine: 'bold'},
})