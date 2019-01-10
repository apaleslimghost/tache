#!/usr/bin/env npx tache

const { load, log } = require('tache')
const del = load('del')

// exports.npmInstall = sh.then(sh => sh`
// npm install
// `)

// exports.bowerInstall = sh.then(sh => sh`
// bower install
// `)

exports.clean = async () => {
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