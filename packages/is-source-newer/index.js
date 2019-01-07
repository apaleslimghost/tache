const fs = require('fs')

const mtime = (file = '', { allowMissing } = {}) => new Promise((resolve, reject) => {
  fs.stat(file, (error, stat) => {
    if(error) {
      if(error.code === 'ENOENT') {
        if(allowMissing) {
          resolve(-Infinity)
        } else {
          reject(new Error(`file ${file} doesn't exist`))
        }
      } else {
        reject(error)
      }
    } else {
      resolve(stat.mtimeMs)
    }
  })
})

const isSourceNewer = ({ source, target, allSourcesNewer = false }) => (
  Promise.all([
    Promise.all(
      [].concat(source)
        .map(sourceFile => mtime(sourceFile))
    ),
    mtime(target, { allowMissing: true }),
  ]).then(
    ([sourceTimes, targetTime]) => (
      sourceTimes[allSourcesNewer ? 'every' : 'some'](
        sourceTime => sourceTime > targetTime
      )
    )
  )
)

module.exports = isSourceNewer