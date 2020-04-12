const classMap = new WeakMap()

export default function makeSingleton(Class) {
	return class extends Class {
		constructor(...args) {
			if (classMap.has(Class))
				return classMap.get(Class)

			const instance = super(...args)
			classMap.set(Class, instance)
			return instance
		}
	}
}