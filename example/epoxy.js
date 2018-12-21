#!/usr/bin/env node ../bin.js

const { sh, lazyRequire } = require('@quarterto/epoxy')

exports.npmInstall = sh`
npm install
`

exports.bowerInstall = sh`
bower install
`

exports.clean = async () => {
	const del = await lazyRequire('del')
	await del('../node_modules')
}

exports.install = async () => {
	await exports.clean()
	await exports.npmInstall()
	await exports.bowerInstall()
}
