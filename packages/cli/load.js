const npr = require('@quarterto/npr')
const log = require('@tache/logger')
const wrapTask = require('./wrap')

module.exports = mod => {
	let loaded
	const maybeLoad = async () => {
		if(!loaded) {
			log.install(mod)
			loaded = await npr(mod)
		}
	}

	return new Proxy(() => {}, {
		get(target, prop) {
			if(loaded) {
				return loaded[prop]
			}

			return wrapTask(prop, async (...args) => {
				await maybeLoad()
				return loaded[prop](...args)
			})
		},

		async apply(target, self, args) {
			await maybeLoad()
			return wrapTask(mod, () => loaded.apply(self, args))()
		}
	})
}
