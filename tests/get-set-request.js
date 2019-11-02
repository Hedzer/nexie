
import test from 'ava';
import global from '../dist/index';

test('undefined get', async t => {
	const key = Symbol('TEST');
	t.is(global.get(key), undefined);
});

test('get after set', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	t.is(global.get(key), 'PASSED');
});

test('get after upsert', async t => {
	const key = Symbol('TEST');
	global.upsert(key, 'PASSED');
	t.is(global.get(key), 'PASSED');
});

test('set, upsert then get', async t => {
	const key = Symbol('TEST');
	global.set(key, 'FAILED');
	global.upsert(key, 'PASSED');
	t.is(global.get(key), 'PASSED');
});

test('set after request', async t => {
	const key = Symbol('TEST');
	const promise = global.request(key);
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
	global.set(key, 'PASSED');
});

test('request after set', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	const promise = global.request(key);
	promise
		.then(value => t.is(value, 'PASSED'))
		.catch(err => t.fail());
});