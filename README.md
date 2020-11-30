

## Nexie

### What is it?

`nexie` is meant to substitute and abstract the use of `window` or `global`. It offers multiple resolution paradigms, such as resolving through promises, yielded generator values, or by event emission. `nexie` is built using es6, includes no shims or polyfills, and is less than 1kb minified and gzipped. 

### Installation
```
npm install --save nexie
``` 
### Key-Value Sync Usage
```javascript
// ----------- Acme Module -------------
global.set('acme-module', module); // must happen before importing module calls get

// ----------- Importing Module -------------
import global from 'nexie';
const acme = global.get('acme-module'); // returns what the value at this point in time
// use acme module here
```
**note:** if `set` is called after `get` then `get` will return `undefined`. 

### Key-Value Promise Usage
```javascript
// ----------- Importing Module -------------
import global from 'nexie';
const acme = await global.request('acme-module'); // returns a promise
// use acme module here

// ----------- Acme Module -------------
global.set('acme-module', module); // previous await is resolved
```
### Event Usage
```javascript
// ----------- Importing Module -------------
import global from 'nexie';
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
import global from 'nexie';
const generator = global.pull('acme-module');
const acme = await generator.next().value; // generates a promise
// use acme module here

// ----------- Acme Module -------------
global.set('acme-module', module); // acme is fullfilled

```
**note:** this pattern is useful when the value is changed more than once.


### Available Functionality
**note:** `Key` type is `type Key = string | symbol` 


| Member  | Description |
| :------------ | ------------ |
| get  |  `get(key:  Key):  any` Returns the value at this point in time. If `set` or `upsert` has not been called for the given key then this method returns `undefined`.  |
| request |  `request(key:  Key):  Promise<any>`. Returns a promise. This promise will be resolved with the value of `set` or `upsert` when either is called. If the value was already resolved and `upsert` is called with a new value, a new promise is created and emitted when `request` is called.  |
| set |  `set(key:  Key, value:  any):  any`. Sets a value. Calling this method will resolve any existing promises and will trigger any listeners added using the `on` or `one` method. Any new values retrieved by a generator created through `pull` will be resolved by this method. This method cannot change an already `set` value; it returns the current stored value, or the provided one if none were previously set before.  |
| upsert  |  `upsert(key:  Key, value:  any):  any`.  Is the same as `set` if no value exists, updates the value otherwise. If a value is changed, rather than set, promises dispensed before the change will still resolve to the previous value.  |
| has  |  `has(key:  Key):  boolean`. Checks to see if a value has been set, this is not a promise. If no value has been set or upserted for the given key then this method returns `undefined`. |
| delete | `delete(key:  Key)`. Deletes a value if it exists; this causes existing unresolved promises to be rejected.  |
| clear | `clear()`. Deletes all values and promises, causing unfulfilled promises to be rejected.  |
| pull |  `*  pull(key:  Key):  Iterator<Promise<any>>`. Creates a generator method that yields promises which resolve when `set` or `upsert` are called. |
| on | `on(eventName:  Key, listener:  Function):  this`. Assigns a listener to be called when the the value of a key is changed. If a listener is assigned after a change in value, the listener will not be called. |
| once | `once(eventName:  Key, listener:  Function):  this`. Like `on`, but will only be called once. |
| removeListener | `removeListener(eventName:  Key, listener:  Function):  this`. Removes an existing listener set by `on` or `once`.  |
| eventNames | `eventNames()`. Returns an array with the names of existing events. |
| emit | `emit(eventName:  Key, ...data:  any):  this`. Triggers any `on` or `once` for a `Key` with provided data.|