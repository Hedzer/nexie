
import test from 'ava';
import global from '../dist/index';

test('event before set', async t => {
	let result = 'FAILED';
	const key = Symbol('TEST');
	global.on(key, value => result = value);
	global.set(key, 'PASSED');
	const finished = new Promise((res, rej) => {
		setTimeout(async () => {
			t.is(await global.get(key), 'PASSED');
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
			t.is(await global.get(key), 'PASSED');
			res();
		}, 100);
	})
	await finished;
});