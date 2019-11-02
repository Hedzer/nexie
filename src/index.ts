import uid from 'yield-uid';

type Key = string | symbol;
type PromiseMaybe = Promise<any> | undefined;
enum RejectionReason { DELETED = 'DELETED', CLEARED = 'CLEARED' };

const globalKey = Symbol.for('@whenthough/global');
const promisesKey = Symbol.for('@whenthough/promises');
const valuesKey = Symbol.for('@whenthough/values');
const resolved = Symbol.for('@whenthough/resolved');
const rejected = Symbol.for('@whenthough/rejected');
const resolve = Symbol.for('@whenthough/resolve');
const reject = Symbol.for('@whenthough/reject');
const finished = Symbol.for('@whenthough/finished');
const functionId = Symbol.for('@whenthough/functionId');
const anySymbol = <any>Symbol;

const promises: Map<Key, Promise<any>> = anySymbol[promisesKey] || new Map<Key, Promise<any>>();
const values: Map<Key, any> = anySymbol[valuesKey] || new Map<Key, any>();
const events: Map<Key, Map<Symbol, Function>> = new Map<Key, Map<Symbol, Function>>();
const idGenerator = uid.generator();

class WhenThough {

	get(key: Key): any {
		return values.get(key);
	}

	request(key: Key): Promise<any> {
		return this.getPromise(key);
	}

	* pull(key: Key): Iterator<Promise<any>> {
		while (true) {
			yield this.getPromise(key);
		}
	}

	set(key: Key, value: any): any {
		if (values.has(key)) { return values.get(key); }

		return this.upsert(key, value);
	}

	upsert(key: Key, value: any): any { 
		if (values.get(key) === value) { return value; }

		values.set(key, value);
		let promise = this.getPromise(key);
		if (this.isFinished(promise)) {
			promises.delete(key);
			promise = this.getPromise(key);
		}
		this.resolve(promise, value);
		this.emit(key, value);
		return value;
	}

	has(key: Key): boolean {
		return values.has(key);
	}

	delete(key: Key) {
		const promise = promises.get(key);
		values.delete(key);
		promises.delete(key);
		this.reject(promise, RejectionReason.DELETED);
	}

	clear() {
		promises.forEach(promise => this.reject(promise, RejectionReason.CLEARED));
		promises.clear();
		values.clear();
	}

	on(eventName: Key, listener: Function): this {
		if (!events.has(eventName)) { events.set(eventName, new Map<Symbol, Function>()); }
		const event = this.getEvents(eventName);
		let fn = <any>listener;
		let id = fn[functionId] || idGenerator.next().value;
		fn[functionId] = id;
		event.set(id, listener);
		return this;
	}

	once(eventName: Key, listener: Function): this { 
		const proxy = (...data: any) => {
			listener(...data);
			this.removeListener(eventName, proxy);
		};
		
		this.on(eventName, proxy);
		(<any>listener)[functionId] = (<any>proxy)[functionId];
		return this;
	}

	eventNames() {
		return [ ...events.keys() ];
	}

	emit(eventName: Key, ...data: any): this {
		if (!events.has(eventName)) { return this; }

		this.getEvents(eventName).forEach(fn => fn(...data))
		return this;
	}

	removeListener(eventName: Key, listener: Function): this {
		let fn = <any>listener;
		if (!fn[functionId] || !events.has(eventName)) { return this; }
		
		this.getEvents(eventName).delete(fn[functionId]);
		return this;
	}

	private getEvents(eventName: Key): Map<Symbol, Function> {
		return (<Map<Symbol, Function>>events.get(eventName));
	}
	private getPromise(key: Key): Promise<any> {
		this.ensurePromise(key);
		return (<Promise<any>>promises.get(key));
	}
	private createPromise(): Promise<any> {
		const proxy: any = { };
		const promise = new Promise<any>((res, rej) => {
			proxy.reject = rej;
			proxy.resolve = res;
		});
		(<any>promise)[resolve] = proxy.resolve;
		(<any>promise)[reject] = proxy.reject;

		promise
			.then(() => {
				(<any>promise)[resolved] = true;
				(<any>promise)[finished] = true;
			})
			.catch(() => {
				(<any>promise)[rejected] = true;
				(<any>promise)[finished] = true;
			});
		return promise;
	}
	private ensurePromise(key: Key) {
		if (!promises.has(key)) { promises.set(key, this.createPromise()); }
	}
	private isFinished(promise: PromiseMaybe) {
		return (<any>promise)[finished];
	}
	private resolve(promise: PromiseMaybe, value: any) {
		if (!promise) { return; }

		if (this.isFinished(promise)) { return; }

		(<any>promise)[resolve](value);
	}
	private reject(promise: PromiseMaybe, reason: RejectionReason) {
		if (!promise) { return; }

		if (this.isFinished(promise)) { return; }

		(<any>promise)[reject](reason);
	}
}

const global = (anySymbol[globalKey] = anySymbol[globalKey] || new WhenThough());

export { Key };
export { PromiseMaybe };
export { RejectionReason };
export { WhenThough };

export default global;
