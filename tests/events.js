
import test from 'ava';
import global from '../dist/index';

test('event before set', async t => {
	let result = 'FAILED';
	const key = Symbol('TEST');
	global.on(key, value => result = value);
	global.set(key, 'PASSED');
	const finished = new Promise((res, rej) => {
		setTimeout(async () => {
			t.is(await global.request(key), 'PASSED');
			res();
		}, 100);
	});
	await finished;
});

test('event after set', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	global.on(key, value => t.is(value, 'FAILED'));
	const finished = new Promise((res, rej) => {
		setTimeout(async () => {
			t.is(await global.request(key), 'PASSED');
			res();
		}, 100);
	})
	await finished;
});

test('set, event, then upsert', async t => {
	const key = Symbol('TEST');
	let handle;
	global.set(key, 'FAILED');
	global.on(key, value => {
		clearTimeout(handle);
		t.is(value, 'PASSED');
	});
	const finished = new Promise((res, rej) => {
		handle = setTimeout(async () => {
			t.fail();
			res();
		}, 100);
		setTimeout(res, 150);
	});
	global.upsert(key, 'PASSED');
	await finished;
});