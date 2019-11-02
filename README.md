
## WhenThough (Window)

### What is it?

`whenthough` is meant to substitute and abstract the use of `window` or `global`. It offers multiple resolution paradigms, such as resolving through promises, yielded generator values, or by event emission. `whenthough` is built using ES6 technologies, includes no shims or polyfills, and is less than 1kb minified and gzipped. 

### Installation
```
npm install --save whenthough
``` 
### Key-Value Usage

```javascript
// ----------- Importing Module -------------
import global from 'whenthough';
const acme = await global.get('acme-module'); // returns a promise
// use acme module here

// ----------- Acme Module -------------
global.set('acme-module', module); // previous await is resolved
```
### Event Usage
```javascript
// ----------- Importing Module -------------
import global from 'whenthough';
global.on('acme-module', (acme) => {
	// use acme module here
});

// ----------- Acme Module -------------
global.set('acme-module', module); // previous event is triggered
```
**note:** if an event is defined after `set` has been called, then the event will not be triggered.

### Generator Usage
```javascript
// ----------- Importing Module -------------
import global from 'whenthough';
const generator = global.pull('acme-module');
const acme = await generator.next().value; // generates a promise
// use acme module here

// ----------- Acme Module -------------
global.set('acme-module', module); // acme is fullfilled

```
**note:** this pattern is useful when the value is changed more than once.
### Available Functionality
**note** `Key` type is `type Key = string | symbol` 
| Member | Description |
|--|--|
| get | `get(key:  Key):  Promise<any>`. Returns a promise. This promise will be resolved with the value of `set` when `set` is called. If the value was already resolved and `set` is called again with a new value, a new promise is created and emitted when `get` is called.|
|set| `set(key:  Key, value:  any):  any`. Sets a value. Calling this method will resolve any existing promises and will trigger any listeners added using the `on` method. Any new values retrieved by a generator created through `pull` will be altered by this method.|
| has | `has(key:  Key):  boolean`. Checks to see if a value has been set, this is not a promise. |
| delete | `delete(key:  Key)`. Deletes a value if it exists, and otherwise causes existing unresolved promises to be rejected.|
|clear| `clear()`. Deletes all values and promises, causing unfulfilled promises to be rejected. |
| pull | `*  pull(key:  Key):  Iterator<Promise<any>>`. Creates a generator method that yields promises which resolve when `set` is called. |
|on| `on(eventName:  Key, listener:  Function):  this`. Assigns a listener to be called when the the value of a key is changed. |
|once| `one(eventName:  Key, listener:  Function):  this`. Like `on`, but will only be called once. |
|removeListener| `removeListener(eventName:  Key, listener:  Function):  this`. Removes an existing listener set by `on` or `once`. |
|eventNames|`eventNames()`. Returns an array with the names of existing events. |
|emit|`emit(eventName:  Key, ...data:  any):  this`. Triggers any `on` or `once` for a `Key` with provided data.|