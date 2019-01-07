const pty = require('node-pty')

const exec = (cmd, { log, shell, shellArgs, env }) => new Promise((resolve, reject) => {
  log.command(cmd)

  const proc = pty.spawn(
    shell,
    shellArgs(cmd),
    {env}
  )

  let output = ''

  proc.on('error', error => {
    log.error(error.message)
    reject(error)
  })

  proc.on('data', data => {
    output += data
    log.stdout(data)
  })

  proc.on('exit', (code, signal) => {
    if(signal) {
      const msg = `${cmd} received ${signal}`
      log.error(msg)
      reject(new Error(msg))
    } else if(code) {
      const msg = `${cmd} exited with code ${code}`
      log.error(msg)
      reject(new Error(msg))
    } else {
      log.done(cmd)
      resolve(output)
    }
  })
})

const stringToCommands = (strings, vars, args) => strings.reduce(
  (commands, part, i) => {
    let lastCommand = commands.pop() || ''

    if(part.includes('\n')) {
      const [first, ...rest] = part.split('\n').map(line => line.trimLeft())
      commands = commands.concat(lastCommand + first).concat(rest)
      lastCommand = commands.pop()
    } else {
      lastCommand += part
    }

    const interpoland = vars[i]

    const interpolated =
      typeof interpoland === 'function'?  interpoland(...args)
    : typeof interpoland === 'undefined'? ''
    : /* otherwise *********************/ interpoland

    lastCommand += interpolated
    
    return [...commands, lastCommand]
  },
  []
).filter(a => a)

const defaultOptions = {
  log: {
    command: () => {},
    done:    () => {},
    stdout:  console.log,
    stderr:  console.error,
    error:   console.error
  },
  
  shell: '/bin/sh',
  shellArgs: cmd => ['-c', cmd],
  env: process.env
}

const configure = options => (strings, ...vars) => (...args) => (
  stringToCommands(strings, vars, args).reduce(
    (last, command) => last.then(
      output => exec(command, options).then(
        stdout => output.concat(stdout)
      )
    ),
    Promise.resolve([])
  )
)

module.exports = configure(defaultOptions)
module.exports.configure = options => configure(Object.assign({}, defaultOptions, options))