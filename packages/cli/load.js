const npr = require('@quarterto/npr')
const log = require('@tache/logger')
const wrapTask = require('./wrap')

const loadAndWrap = wrap => mod => {
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

			return wrap(prop, async (...args) => {
				await maybeLoad()
				return loaded[prop](...args)
			})
		},

		async apply(target, self, args) {
			await maybeLoad()
			return wrap(mod, () => loaded.apply(self, args))()
		}
	})
}


module.exports = loadAndWrap(task => task)
module.exports.tasks = loadAndWrap(wrapTask)
module.exports.wrapped = loadAndWrap