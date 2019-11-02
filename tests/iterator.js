
import test from 'ava';
import global from '../dist/index';

test('iterator set after pull', async t => {
	const key = Symbol('TEST');
	const stream = global.pull(key);
	const promise = stream.next().value;
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
	global.set(key, 'PASSED');
});

test('iterator pull after set', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	const stream = global.pull(key);
	const promise = stream.next().value;
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
});