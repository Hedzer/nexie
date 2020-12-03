import global from '../src/index';

it('trigger events if set occurs after a listener is added', async () => {
	let result = 'FAILED';
	const key = Symbol('TEST');
	global.on(key, (value: string) => (result = value));
	global.set(key, 'PASSED');
	const finished = new Promise((res, rej) => {
		setTimeout(async () => {
			try {
				expect(global.request(key)).resolves.toBe('PASSED');
				expect(result).toBe('PASSED');
				res();
			} catch (error) {
				rej(error);
			}
		}, 100);
	});
	await finished;
});

it('should not trigger events listened to after set', async () => {
	const key = Symbol('TEST');
	global.set(key, 'PASSED');
	global.on(key, (value: string) => expect(value).toBe('FAILED'));
	const finished = new Promise((res, rej) => {
		setTimeout(async () => {
			try {
				expect(await global.request(key)).toBe('PASSED');
			} catch (error) {
				rej(error);
			}
			res();
		}, 100);
	});
	await finished;
});

test('trigger the event if upsert happens after a listener is set', async () => {
	const key = Symbol('TEST');
	let handle: any;
	global.set(key, 'FAILED');
	global.on(key, (value: string) => {
		clearTimeout(handle);
		expect(value).toBe('PASSED');
	});
	const finished = new Promise((res, rej) => {
		handle = setTimeout(async () => {
			rej(fail());
		}, 100);
		setTimeout(res, 150);
	});
	global.upsert(key, 'PASSED');
	await finished;
});
