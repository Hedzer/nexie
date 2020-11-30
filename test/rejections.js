import test from 'ava';
import global from '../dist/index';

test('deletion rejection after get', async t => {
	const key = Symbol('TEST');
	const promise = global.request(key);
	promise.then(value => t.fail()).catch(err => t.pass());
	global.delete(key);
});

test('get after deletion rejection', async t => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	global.delete(key);
	const promise = global.request(key);
	promise.then(value => t.fail()).catch(err => t.fail(err));
	await new Promise((res, rej) => {
		setTimeout(() => {
			t.pass();
			res();
		}, 100);
	});
});

test('clearing rejection after get', async t => {
	await new Promise((res, rej) => {
		setTimeout(() => {
			const key = Symbol('TEST');
			const promise = global.request(key);
			promise
				.then(value => {
					t.fail();
					res();
				})
				.catch(err => {
					t.pass();
					res();
				});
			global.clear();
		}, 2000);
	});
});

test('get after clearing rejection', async t => {
	await new Promise((res, rej) => {
		setTimeout(async () => {
			const key = Symbol('TEST');
			global.set(key, 'PASSED');
			global.clear();
			const promise = global.request(key);
			promise
				.then(value => {
					t.fail();
					res();
				})
				.catch(err => {
					t.fail();
					res();
				});
			await new Promise((resolve, rej) => {
				setTimeout(() => {
					t.pass();
					resolve();
					res();
				}, 100);
			});
		}, 2000);
	});
});
