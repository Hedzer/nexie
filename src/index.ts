import yuid from 'yuid';

type Key = string | symbol;
type PromiseMaybe = Promise<any> | undefined;
enum RejectionReason {
	DELETED = 'DELETED',
	CLEARED = 'CLEARED',
}

const defaultNamespace: string = 'global';
const root: string = '@Nexie';
const defaultGlobalKey = Symbol.for(`${root}/${defaultNamespace}`);
const anySymbol = Symbol as any;

class Nexie {
	private globalKey: symbol;
	private promisesKey: symbol;
	private valuesKey: symbol;
	private resolvedKey: symbol;
	private rejectedKey: symbol;
	private resolveKey: symbol;
	private rejectKey: symbol;
	private finishedKey: symbol;
	private functionId: symbol;
	private promises: Map<Key, Promise<any>>;
	private values: Map<Key, any>;
	private events: Map<Key, Map<Symbol, Function>>;
	private idGenerator: IterableIterator<string>;

	constructor(namespace: string = defaultNamespace) {
		const ns = `${root}/${namespace}`;
		this.globalKey = Symbol.for(`${ns}`);
		this.promisesKey = Symbol.for(`${ns}/promises`);
		this.valuesKey = Symbol.for(`${ns}/values`);
		this.resolvedKey = Symbol.for(`${ns}/resolved`);
		this.rejectedKey = Symbol.for(`${ns}/rejected`);
		this.resolveKey = Symbol.for(`${ns}/resolve`);
		this.rejectKey = Symbol.for(`${ns}/reject`);
		this.finishedKey = Symbol.for(`${ns}/finished`);
		this.functionId = Symbol.for(`${ns}/functionId`);

		this.promises = anySymbol[this.promisesKey] || new Map<Key, Promise<any>>();
		this.values = anySymbol[this.valuesKey] || new Map<Key, any>();
		this.events = new Map<Key, Map<Symbol, Function>>();
		this.idGenerator = yuid.generator();
		this.key = this.globalKey;
	}

	public readonly key: symbol;

	get(key: Key): any {
		return this.values.get(key);
	}

	request<T>(key: Key): Promise<T> {
		return this.getPromise(key);
	}

	*pull<T>(key: Key): Iterator<Promise<T>> {
		while (true) {
			yield this.getPromise(key);
		}
	}

	set<T>(key: Key, value: T): T {
		if (this.values.has(key)) {
			return this.values.get(key);
		}

		return this.upsert(key, value);
	}

	upsert<T>(key: Key, value: T): T {
		if (this.values.get(key) === value) {
			return value;
		}

		this.values.set(key, value);
		let promise = this.getPromise(key);
		if (this.isFinished(promise)) {
			this.promises.delete(key);
			promise = this.getPromise(key);
		}
		this.resolve(promise, value);
		this.emit(key, value);
		return value;
	}

	has(key: Key): boolean {
		return this.values.has(key);
	}

	delete(key: Key) {
		const promise = this.promises.get(key);
		this.values.delete(key);
		this.promises.delete(key);
		this.reject(promise, RejectionReason.DELETED);
	}

	clear() {
		this.promises.forEach(promise =>
			this.reject(promise, RejectionReason.CLEARED)
		);
		this.promises.clear();
		this.values.clear();
	}

	on(eventName: Key, listener: Function): this {
		if (!this.events.has(eventName)) {
			this.events.set(eventName, new Map<Symbol, Function>());
		}
		const event = this.getEvents(eventName);
		let fn = listener as any;
		let id = fn[this.functionId] || this.idGenerator.next().value;
		fn[this.functionId] = id;
		event.set(id, listener);
		return this;
	}

	once(eventName: Key, listener: Function): this {
		const proxy = (...data: any) => {
			listener(...data);
			this.removeListener(eventName, proxy);
		};

		this.on(eventName, proxy);
		(listener as any)[this.functionId] = (proxy as any)[this.functionId];
		return this;
	}

	eventNames() {
		return [...this.events.keys()];
	}

	emit(eventName: Key, ...data: any): this {
		if (!this.events.has(eventName)) {
			return this;
		}

		this.getEvents(eventName).forEach(fn => fn(...data));
		return this;
	}

	removeListener(eventName: Key, listener: Function): this {
		let fn = listener as any;
		if (!fn[this.functionId] || !this.events.has(eventName)) {
			return this;
		}

		this.getEvents(eventName).delete(fn[this.functionId]);
		return this;
	}

	private getEvents(eventName: Key): Map<Symbol, Function> {
		return this.events.get(eventName) as Map<Symbol, Function>;
	}
	private getPromise(key: Key): Promise<any> {
		this.ensurePromise(key);
		return this.promises.get(key) as Promise<any>;
	}
	private createPromise(): Promise<any> {
		const proxy: any = {};
		const promise = new Promise<any>((res, rej) => {
			proxy.reject = rej;
			proxy.resolve = res;
		});
		(promise as any)[this.resolveKey] = proxy.resolve;
		(promise as any)[this.rejectKey] = proxy.reject;

		promise
			.then(() => {
				(promise as any)[this.resolvedKey] = true;
				(promise as any)[this.finishedKey] = true;
			})
			.catch(() => {
				(promise as any)[this.rejectedKey] = true;
				(promise as any)[this.finishedKey] = true;
			});
		return promise;
	}
	private ensurePromise(key: Key) {
		if (!this.promises.has(key)) {
			this.promises.set(key, this.createPromise());
		}
	}
	private isFinished(promise: PromiseMaybe) {
		return (promise as any)[this.finishedKey];
	}
	private resolve(promise: PromiseMaybe, value: any) {
		if (!promise) {
			return;
		}

		if (this.isFinished(promise)) {
			return;
		}

		(promise as any)[this.resolveKey](value);
	}
	private reject(promise: PromiseMaybe, reason: RejectionReason) {
		if (!promise) {
			return;
		}

		if (this.isFinished(promise)) {
			return;
		}

		(promise as any)[this.rejectKey](reason);
	}
}

const global: Nexie = (anySymbol[defaultGlobalKey] =
	anySymbol[defaultGlobalKey] || new Nexie());

export { Key };
export { PromiseMaybe };
export { RejectionReason };
export { Nexie };
export { global as Global };

export default global;
