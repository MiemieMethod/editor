import { v4 as uuid } from 'uuid'
import type { ArrayTree } from './ArrayTree'
import type { ObjectTree } from './ObjectTree'
export type TPrimitiveTree = string | number | boolean | null
export type TTree = TPrimitiveTree | Object | Array<unknown>

export const treeElementHeight = 19

export abstract class Tree<T> {
	public readonly uuid = uuid()
	public abstract readonly component: Vue.Component
	public isSelected: boolean = false
	public abstract type: TTree
	public abstract height: number
	protected abstract _value: T
	abstract toJSON(): T

	get styles() {
		return {
			contentVisibility: 'auto',
			containIntrinsicSize: `${this.height}px`,
		}
	}

	constructor(protected parent: ObjectTree | ArrayTree | null) {}

	get value() {
		return this._value
	}
	getParent() {
		return this.parent
	}

	get key(): string | number {
		if (!this.parent)
			throw new Error(`Trees without parent do not have a key`)

		if (Array.isArray(this.parent.children)) {
			const index = this.parent.children.findIndex(
				(currentTree) => currentTree === this
			)

			if (index === -1)
				throw new Error(
					`Invalid state: TreeChild with parent couldn't be found inside of parent's children`
				)

			return index
		} else {
			const children = Object.entries(this.parent.children)
			const index = children.findIndex(
				([_, currentTree]) => currentTree === this
			)

			if (index === -1)
				throw new Error(
					`Invalid state: TreeChild with parent couldn't be found inside of parent's children`
				)

			return children[index][0]
		}
	}
}