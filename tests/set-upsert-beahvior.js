
import test from 'ava';
import global from '../dist/index';

test('set twice', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	global.set(key, 'FAILED');
	t.is(global.get(key), 'PASSED');
});

test('set twice, returns original', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	t.is(global.set(key, 'FAILED'), 'PASSED');
});

test('set, then upsert', async t => {
	const key = Symbol('TEST');
	global.set(key, 'FAILED');
	global.upsert(key, 'PASSED');
	t.is(global.get(key), 'PASSED');
});

test('set, then return upsert', async t => {
	const key = Symbol('TEST');
	global.set(key, 'FAILED');
	t.is(global.upsert(key, 'PASSED'), 'PASSED');
	t.is(global.get(key), 'PASSED');
});