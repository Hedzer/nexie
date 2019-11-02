
import test from 'ava';
import global from '../dist/index';

test('set after get', async t => {
	const key = Symbol('TEST');
	const promise = global.get(key);
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
	global.set(key, 'PASSED');
});

test('get after set', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	const promise = global.get(key);
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
});