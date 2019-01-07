const pattern = (first, second) => {
	const patternRegex = new RegExp(first.replace(/%/g, '(.+)'))
	
	const secondParts = second.split('%')
	secondParts.raw = secondParts
	
	return path => {
	  const [matched, ...stems] = path.match(patternRegex) || [false]
 
	  if(!matched) {
		 throw new Error(`${path} did not match ${first}`)
	  }
	  
	  return String.raw(secondParts, ...stems)
	}
 }
 
 module.exports = pattern
 