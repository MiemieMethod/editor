import { v4 as uuid } from 'uuid'
import { TabSystem } from './TabSystem'
import { App } from '/@/App'
import { FileType } from '/@/components/Data/FileType'
import { PackType } from '/@/components/Data/PackType'
import { showContextMenu } from '/@/components/ContextMenu/showContextMenu'
import { Signal } from '/@/components/Common/Event/Signal'
import { SimpleAction } from '/@/components/Actions/SimpleAction'
import { EventDispatcher } from '../Common/Event/EventDispatcher'
import { AnyFileHandle } from '../FileSystem/Types'

export abstract class Tab<TRestoreData = any> extends Signal<Tab> {
	abstract component: Vue.Component
	public uuid = uuid()
	public hasRemoteChange = false
	protected _isUnsaved = false
	public isForeignFile = true
	public connectedTabs: Tab[] = []
	public isTemporary = true
	public readonly onClose = new EventDispatcher<void>()

	protected projectPath?: string
	protected folderName: string | null = null
	protected actions: SimpleAction[] = []
	protected isActive = false
	protected isLoading = true

	static is(fileHandle: AnyFileHandle) {
		return false
	}

	constructor(protected parent: TabSystem) {
		super()
		window.setTimeout(() => this.setup())
	}

	async setup() {
		this.dispatch(this)
		this.isLoading = false
	}

	setIsUnsaved(val: boolean) {
		this._isUnsaved = val
		this.isTemporary = false
	}
	get isUnsaved() {
		return this._isUnsaved
	}

	updateParent(parent: TabSystem) {
		this.parent = parent
	}
	get tabSystem() {
		return this.parent
	}
	get isSharingScreen() {
		return this.parent.isSharingScreen
	}

	abstract get name(): string
	setFolderName(folderName: string | null) {
		this.folderName = folderName
	}

	/**
	 * @returns Undefined if the file that belongs to this tab is not inside of a bridge. project
	 */
	getPath() {
		if (!this.projectPath)
			throw new Error(
				`Trying to access projectPath before tab finished loading`
			)
		return `projects/${this.parent.projectName}/${this.projectPath}`
	}
	/**
	 * @returns Undefined if the file that belongs to this tab is not inside of the current project
	 */
	getProjectPath() {
		if (!this.projectPath)
			throw new Error(
				`Trying to access projectPath before tab finished loading`
			)
		return this.projectPath
	}
	get icon() {
		return FileType.get(this.getProjectPath())?.icon ?? 'mdi-file-outline'
	}
	get iconColor() {
		return PackType.get(this.getPath())?.color
	}

	get isSelected(): boolean {
		return this.parent.selectedTab === this
	}
	select() {
		this.parent.select(this)
		return this
	}
	/**
	 *
	 * @returns Whether the tab was closed
	 */
	async close(): Promise<boolean> {
		this.parent.setActive(true)

		const didClose = await this.parent.close(this)
		if (didClose) {
			this.connectedTabs.forEach((tab) => tab.close())
			this.onClose.dispatch()
		}
		return didClose
	}
	async is(tab: Tab): Promise<boolean> {
		return false
	}
	// abstract restore(data: TRestoreData): Promise<Tab | undefined>
	// abstract serialize(): Promise<TRestoreData>

	focus() {}
	async onActivate() {
		this.isActive = true
	}
	onDeactivate() {
		this.isActive = false
	}
	onDestroy() {}
	protected async toOtherTabSystem(updateParentTabs = true) {
		const app = await App.getApp()
		const tabSystems = app.projectManager.currentProject?.tabSystems!
		const wasSelected = this.isSelected

		const from =
			tabSystems[0] === this.parent ? tabSystems[0] : tabSystems[1]
		const to = tabSystems[0] === this.parent ? tabSystems[1] : tabSystems[0]

		this.parent = to

		if (updateParentTabs) {
			from.remove(this, false)
			await to.add(this, true)
		} else {
			if (!this.isForeignFile) {
				await to.openedFiles.add(this.getPath())
				await from.openedFiles.remove(this.getPath())
			}

			if (wasSelected) await from.select(from.tabs[0])

			await to.select(this)
		}
	}

	addAction(...actions: SimpleAction[]) {
		this.actions.push(...actions)
	}
	clearActions() {
		this.actions = []
	}

	async onContextMenu(event: MouseEvent) {
		const additionalItems = []
		// It makes no sense to move a file to the split-screen if the tab system only has one entry
		if (this.isTemporary) {
			additionalItems.push({
				name: 'actions.keepInTabSystem.name',
				description: 'actions.keepInTabSystem.description',
				icon: 'mdi-pin-outline',
				onTrigger: () => {
					this.isTemporary = false
				},
			})
		}
		if (this.parent.tabs.length > 1) {
			additionalItems.push({
				name: 'actions.moveToSplitScreen.name',
				description: 'actions.moveToSplitScreen.description',
				icon: 'mdi-arrow-split-vertical',
				onTrigger: async () => {
					this.toOtherTabSystem()
				},
			})
		}

		if (additionalItems.length > 0)
			additionalItems.push(<const>{ type: 'divider' })

		await showContextMenu(event, [
			...additionalItems,
			{
				name: 'actions.closeTab.name',
				description: 'actions.closeTab.description',
				icon: 'mdi-close',
				onTrigger: () => {
					this.close()
				},
			},
			{
				name: 'actions.closeAll.name',
				description: 'actions.closeAll.description',
				icon: 'mdi-table-row',
				onTrigger: () => {
					this.parent.closeTabs(() => true)
				},
			},
			{
				name: 'actions.closeTabsToRight.name',
				description: 'actions.closeTabsToRight.description',
				icon: 'mdi-chevron-right',
				onTrigger: () => {
					let closeTabs = true
					this.parent.closeTabs((tab) => {
						if (tab === this) closeTabs = false
						return closeTabs
					})
				},
			},
			{
				name: 'actions.closeAllSaved.name',
				description: 'actions.closeAllSaved.description',
				icon: 'mdi-content-save-outline',
				onTrigger: () => {
					this.parent.closeTabs((tab) => !tab.isUnsaved)
				},
			},
			{
				name: 'actions.closeOtherTabs.name',
				description: 'actions.closeOtherTabs.description',
				icon: 'mdi-unfold-more-vertical',
				onTrigger: () => {
					this.parent.closeTabs((tab) => tab !== this)
				},
			},
		])
	}

	copy() {
		document.execCommand('copy')
	}
	cut() {
		document.execCommand('cut')
	}
	paste() {}
}
