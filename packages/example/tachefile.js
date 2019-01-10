#!/usr/bin/env npx tache

const { load, log } = require('tache')

// exports.npmInstall = sh`
// npm install
// `

// exports.bowerInstall = sh`
// bower install
// `

exports.clean = async () => {
	const del = await load('del')
	await del('../node_modules')
}

exports.install = async () => {
	await exports.clean()
	await exports.npmInstall()
	await exports.bowerInstall()
}

exports.foo = () => {
	log.log('foo')
}