const isSourceNewer = require('./')
const {fs, vol} = require('memfs')

jest.mock('fs', () => require('memfs').fs)

beforeEach(async () => {
	vol.fromJSON({
		'./older': '',
		'./newer': '',
		'./other': ''
	}, '/tmp/fixture')

	await Promise.all([
		fs.promises.utimes('/tmp/fixture/older', 1520000000000, 1500000000000),
		fs.promises.utimes('/tmp/fixture/newer', 1520000000000, 1510000000000),
		fs.promises.utimes('/tmp/fixture/other', 1520000000000, 1520000000000),
	])
})

afterEach(() => vol.reset())

test('newer is newer than older', async () => {
	const isNewer = await isSourceNewer({
		source: '/tmp/fixture/newer',
		target: '/tmp/fixture/older',
	})

	expect(isNewer).toBe(true)
})

test('older is not newer than newer', async () => {
	const isNewer = await isSourceNewer({
		source: '/tmp/fixture/older',
		target: '/tmp/fixture/newer',
	})

	expect(isNewer).toBe(false)
})

test('missing target is always older', async () => {
	const isNewer = await isSourceNewer({
		source: '/tmp/fixture/older',
		target: '/tmp/fixture/nonexistent',
	})

	expect(isNewer).toBe(true)
})

test('missing source throws an error', async () => {
	await expect(
		isSourceNewer({
			source: '/tmp/fixture/nonexistent',
			target: '/tmp/fixture/older',
		})
	).rejects.toThrow(`file /tmp/fixture/nonexistent doesn't exist`)
})

describe('with multiple sources', () => {
	test('returns true if any source is newer', async () => {
		const isNewer = await isSourceNewer({
			source: ['/tmp/fixture/older', '/tmp/fixture/other'],
			target: '/tmp/fixture/newer',
		})
	
		expect(isNewer).toBe(true)
	})

	test('returns true if all sources are older', async () => {
		const isNewer = await isSourceNewer({
			source: ['/tmp/fixture/older', '/tmp/fixture/newer'],
			target: '/tmp/fixture/other',
		})
	
		expect(isNewer).toBe(false)
	})

	test('returns true if allSourcesNewer is true and all sources are newer', async () => {
		const isNewer = await isSourceNewer({
			source: ['/tmp/fixture/newer', '/tmp/fixture/other'],
			target: '/tmp/fixture/older',
			allSourcesNewer: true,
		})
	
		expect(isNewer).toBe(true)
	})

	test('returns false if allSourcesNewer is true and any source is older', async () => {
		const isNewer = await isSourceNewer({
			source: ['/tmp/fixture/older', '/tmp/fixture/other'],
			target: '/tmp/fixture/newer',
			allSourcesNewer: true,
		})
	
		expect(isNewer).toBe(false)
	})
})