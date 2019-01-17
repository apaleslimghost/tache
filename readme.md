<h1 align="center">
	<img alt="tâche" src="extra/logo.svg" width="240">
</h1>

<h2 align="center">javascript task runner & build tool</h2>

## what & why

_tâche_ is a tool for running functions in a javascript module from the command line. it's also a collection of libraries to let you write build scripts as `async` functions. it's meant as a modern, javascript-based alternative to tools like [`make`](https://www.gnu.org/software/make/).


## how

### basic task

here's how to write a module to use with _tâche_:

#### `hello-world.js`
```js
exports.helloWorld = function() {
	console.log('hello world')
}
```

and to run it from the command line, using [`npx`](https://www.npmjs.com/package/npx) (so you don't have to have _tâche_ installed globally to run tasks):

```sh
npx tache hello-world.js helloWorld
```

which outputs:

```
 start   │ helloWorld({})
hello world
 done    ✓ helloWorld
```

### shebang

in a UNIX-like shell, _tâche_ can be run using a [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) at the start of your file and marking your file as executable:

```js
#!/usr/bin/env npx tache

exports.helloWorld = function() {
	console.log('hello world')
}
```

```sh
chmod +x hello-world.js
```

which can then be run using:

```sh
./hello-world.js helloWorld
```

### logging

_tâche_ includes command-line logging to make it easier to debug which tasks are running, and what they're doing. you can also import this logger to output your own logs in the same style:


```js
const { log } = require('tache')

exports.helloWorld = function() {
	log.log('hello world')
}
```

the task now outputs:

```
 start   │ helloWorld({})
         │ hello world
 done    ✓ helloWorld
```

the logger includes a few different styles. see [@tache/logger](packages/logger) for what's available

### command line argument parsing

each whitespace-separated argument passed to _tâche_ on the command line is a separate task. the part before the first colon in the argument (or the whole argument if there's no colon) is the name of the task to run, then the rest of the argument after the first colon is parsed as  [HJSON](https://hjson.org) (a format similar to JSON but with a more lightweight syntax; in practice, this means you can omit most `{}` curly braces and `""` double quotes), and passed as the single argument to the task function. if the task argument needs whitespace, surround the whole thing with double quotes, which are parsed by your shell as a single argument.

adding an argument to the `helloWorld` task, with a default value, to show this (note that the task logging outputs the arguments the task was called with, to help debugging):

```js
const { log } = require('tache')

exports.helloWorld = function({ message = 'world' }) {
	log.log(`hello ${message}`)
}
```
```
⟩ ./tachefile.js helloWorld

 start   │ helloWorld({})
         │ hello world
 done    ✓ helloWorld

⟩ ./tachefile.js helloWorld:message:folks

 start   │ helloWorld({ message: 'folks' })
         │ hello folks
 done    ✓ helloWorld

⟩ ./tachefile.js "helloWorld:message:'stuff and things'" helloWorld:message:again

 start   │ helloWorld({ message: 'stuff and things' })
         │ hello stuff and things
 done    ✓ helloWorld

 start   │ helloWorld({ message: 'again' })
         │ hello again
 done    ✓ helloWorld
```

### `async` tasks

if your task function returns a `Promise`, e.g. if the function is an `async` function, _tâche_ will wait for the task to complete before running the next task, and log timing if it took more than 20 milliseconds:

```js
const { log } = require('tache')
const delay = require('delay') // https://www.npmjs.com/package/delay

exports.helloWorld = async function() {
	log.log('one')
	await delay(500)
	log.log('two')
}
```

running this task twice from the command line will give:

```
 start   │ helloWorld({})
         │ one
         │ two
 done    ✓ helloWorld (506ms)

 start   │ helloWorld({})
         │ one
         │ two
 done    ✓ helloWorld (504ms)
```

### error handling

when a task throws an error, or returns a promise that rejects, _tâche_ will output the stack trace, and the name of the task that originally threw the error. it will also exit to the command line with a non-zero exit code to indicate failure.

```js
exports.helloWorld = function() {
	throw new Error('something went wrong')
}
```
```
 start   │ helloWorld({})
 failed  ✕ helloWorld
         │ Error (from task helloWorld): something went wrong
         │     at exports.helloWorld (tache/packages/example/tachefile.js:15:8)
         │     at Object.helloWorld (tache/packages/cli/wrap.js:13:24)
         │     at <anonymous>
         │     at process._tickCallback (internal/process/next_tick.js:188:7)
         │     at Function.Module.runMain (module.js:695:11)
         │     at findNodeScript.then.existing (/usr/local/lib/node_modules/npm/node_modules/libnpx/index.js:268:14)
         │     at <anonymous>
```

### task dependencies

_tâche_ doesn't have any kind of abstraction or special handling for task dependencies. because tasks are functions, to run a dependency, call a function, using `await` if the dependency is `async`. to run dependencies in parallel, use `Promise.all`. all functions that are exported are treated as tasks and wrapped with logging and error handling.

```js
const { log } = require('tache')

exports.upperCase = string => string.toUpperCase()

exports.helloWorld = function() {
	const upper = exports.upperCase('hello world')
	log.log(upper)
}
```
```
 start   │ helloWorld({})
 start   │ upperCase('hello world')
         │ HELLO WORLD
 done    ✓ upperCase
 done    ✓ helloWorld
```

### bootstrapping & dependencies

some tasks may require dependencies, but also need to be able to run without the dependencies installed, such as if you have a task to actually do the install. _tâche_ provides a `load` function, which uses [`npx`](https://www.npmjs.com/package/npx) to install the package. when using `load`, the package must either export a function, or export an object containing functions. the package isn't installed until a function from it is called, allowing independent tasks to install only the dependencies they need. calling a function from `load` always returns a promise, even if the package's functions are synchronous, because the installation is asynchronous.

```js
const { load, log } = require('tache')
const upperCase = load('upper-case')

exports.helloWorld = async function() {
	const upper = await upperCase('hello world')
	log.log(upper)
}
```
```
 start   │ helloWorld({})
         │ HELLO WORLD
 done    ✓ helloWorld
```

### loading libraries of tasks

loading tasks from `npm` using `load` works, but doesn't include the same wrapping for logging and error handling. for tasks, you should use `load.tasks` instead (since all functions can be run as tasks, here we can wrap `upper-case` as a task):

```js
const { load, log } = require('tache')
const upperCase = load.tasks('upper-case')

exports.helloWorld = async function() {
	const upper = await upperCase('hello world')
	log.log(upper)
}
```
```
 start   │ helloWorld({})
 start   │ upperCase('hello world')
         │ HELLO WORLD
 done    ✓ upperCase
 done    ✓ helloWorld
```
