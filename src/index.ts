import uid from 'yield-uid';

type Key = string | symbol;
type PromiseMaybe = Promise<any> | undefined;
enum RejectionReason { DELETED = 'DELETED', CLEARED = 'CLEARED' };

const defaultNamespace: string = 'global';
const root: string = '@whenthough';
const defaultGlobalKey = Symbol.for(`${root}/${defaultNamespace}`);
const anySymbol = <any>Symbol;

class WhenThough {
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
		this.globalKey = Symbol.for(`${root}/${namespace}`);
		this.promisesKey = Symbol.for(`${root}/${namespace}/promises`);
		this.valuesKey = Symbol.for(`${root}/${namespace}/values`);
		this.resolvedKey = Symbol.for(`${root}/${namespace}/resolved`);
		this.rejectedKey = Symbol.for(`${root}/${namespace}/rejected`);
		this.resolveKey = Symbol.for(`${root}/${namespace}/resolve`);
		this.rejectKey = Symbol.for(`${root}/${namespace}/reject`);
		this.finishedKey = Symbol.for(`${root}/${namespace}/finished`);
		this.functionId = Symbol.for(`${root}/${namespace}/functionId`);

		this.promises = anySymbol[this.promisesKey] || new Map<Key, Promise<any>>();
		this.values = anySymbol[this.valuesKey] || new Map<Key, any>();
		this.events = new Map<Key, Map<Symbol, Function>>();
		this.idGenerator = uid.generator();
		this.key = this.globalKey;
	}

	public readonly key: symbol;

	get(key: Key): any {
		return this.values.get(key);
	}

	request<T>(key: Key): Promise<T> {
		return this.getPromise(key);
	}

	* pull<T>(key: Key): Iterator<Promise<T>> {
		while (true) {
			yield this.getPromise(key);
		}
	}

	set<T>(key: Key, value: T): T {
		if (this.values.has(key)) { return this.values.get(key); }

		return this.upsert(key, value);
	}

	upsert<T>(key: Key, value: T): T { 
		if (this.values.get(key) === value) { return value; }

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
		this.promises.forEach(promise => this.reject(promise, RejectionReason.CLEARED));
		this.promises.clear();
		this.values.clear();
	}

	on(eventName: Key, listener: Function): this {
		if (!this.events.has(eventName)) { this.events.set(eventName, new Map<Symbol, Function>()); }
		const event = this.getEvents(eventName);
		let fn = <any>listener;
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
		(<any>listener)[this.functionId] = (<any>proxy)[this.functionId];
		return this;
	}

	eventNames() {
		return [ ...this.events.keys() ];
	}

	emit(eventName: Key, ...data: any): this {
		if (!this.events.has(eventName)) { return this; }

		this.getEvents(eventName).forEach(fn => fn(...data))
		return this;
	}

	removeListener(eventName: Key, listener: Function): this {
		let fn = <any>listener;
		if (!fn[this.functionId] || !this.events.has(eventName)) { return this; }
		
		this.getEvents(eventName).delete(fn[this.functionId]);
		return this;
	}

	private getEvents(eventName: Key): Map<Symbol, Function> {
		return (<Map<Symbol, Function>>this.events.get(eventName));
	}
	private getPromise(key: Key): Promise<any> {
		this.ensurePromise(key);
		return (<Promise<any>>this.promises.get(key));
	}
	private createPromise(): Promise<any> {
		const proxy: any = { };
		const promise = new Promise<any>((res, rej) => {
			proxy.reject = rej;
			proxy.resolve = res;
		});
		(<any>promise)[this.resolveKey] = proxy.resolve;
		(<any>promise)[this.rejectKey] = proxy.reject;

		promise
			.then(() => {
				(<any>promise)[this.resolvedKey] = true;
				(<any>promise)[this.finishedKey] = true;
			})
			.catch(() => {
				(<any>promise)[this.rejectedKey] = true;
				(<any>promise)[this.finishedKey] = true;
			});
		return promise;
	}
	private ensurePromise(key: Key) {
		if (!this.promises.has(key)) { this.promises.set(key, this.createPromise()); }
	}
	private isFinished(promise: PromiseMaybe) {
		return (<any>promise)[this.finishedKey];
	}
	private resolve(promise: PromiseMaybe, value: any) {
		if (!promise) { return; }

		if (this.isFinished(promise)) { return; }

		(<any>promise)[this.resolveKey](value);
	}
	private reject(promise: PromiseMaybe, reason: RejectionReason) {
		if (!promise) { return; }

		if (this.isFinished(promise)) { return; }

		(<any>promise)[this.rejectKey](reason);
	}
}

const global: WhenThough = (anySymbol[defaultGlobalKey] = anySymbol[defaultGlobalKey] || new WhenThough());

export { Key };
export { PromiseMaybe };
export { RejectionReason };
export { WhenThough };
export { global as Global };

export default global;
