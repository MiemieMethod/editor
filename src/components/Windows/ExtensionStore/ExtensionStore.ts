import { Sidebar, SidebarItem } from '/@/components/Windows/Layout/Sidebar'
import ExtensionStoreComponent from './ExtensionStore.vue'
import { BaseWindow } from '/@/components/Windows/BaseWindow'
import { App } from '/@/App'
import { compare } from 'compare-versions'
import { getFileSystem } from '/@/utils/fs'
import { ExtensionTag } from './ExtensionTag'
import { ExtensionViewer } from './ExtensionViewer'
import { IExtensionManifest } from '/@/components/Extensions/ExtensionLoader'
import { Notification } from '/@/components/Notifications/Notification'
import { InformationWindow } from '/@/components/Windows/Common/Information/InformationWindow'

let updateNotification: Notification | undefined = undefined
export class ExtensionStoreWindow extends BaseWindow {
	protected baseUrl =
		'https://raw.githubusercontent.com/bridge-core/plugins/master'
	protected sidebar = new Sidebar([])
	protected extensions: ExtensionViewer[] = []
	protected extensionTags!: Record<string, { icon: string; color?: string }>
	protected installedExtensions: ExtensionViewer[] = []
	public readonly tags: Record<string, ExtensionTag> = {}
	protected updates = new Set<ExtensionViewer>()

	constructor() {
		super(ExtensionStoreComponent)

		App.eventSystem.on('projectChanged', () => {
			updateNotification?.dispose()
			updateNotification = undefined
		})

		this.defineWindow()
	}

	async open() {
		App.audioManager.playAudio('click5.ogg', 1)
		const app = await App.getApp()
		app.windows.loadingWindow.open()
		this.sidebar.removeElements()
		this.installedExtensions = []

		await app.dataLoader.fired
		this.extensionTags = await app.dataLoader.readJSON(
			'data/packages/common/extensionTags.json'
		)

		const installedExtensions = await app.extensionLoader.getInstalledExtensions()

		let extensions: IExtensionManifest[]
		try {
			extensions = await fetch(
				`${this.baseUrl}/extensions.json`
			).then((resp) => resp.json())
		} catch {
			this.close()
			app.windows.loadingWindow.close()
			new InformationWindow({
				description: 'windows.extensionStore.offlineError',
			})
			return
		}

		this.extensions = extensions.map(
			(plugin) => new ExtensionViewer(this, plugin)
		)

		this.updates.clear()

		installedExtensions.forEach((installedExtension, id) => {
			const extension = this.extensions.find((ext) => ext.id === id)

			if (extension) {
				extension.setInstalled()
				extension.setConnected(installedExtension)

				// Update for extension is available
				if (
					compare(installedExtension.version, extension.version, '<')
				) {
					extension.setIsUpdateAvailable()
					this.updates.add(extension)
				}
			} else {
				this.extensions.push(installedExtension.forStore(this))
			}
		})

		updateNotification?.dispose()

		this.setupSidebar()

		app.windows.loadingWindow.close()
		super.open()
	}

	close() {
		App.audioManager.playAudio('click5.ogg', 1)
		super.close()

		if (this.updates.size > 0) {
			updateNotification = new Notification({
				icon: 'mdi-sync',
				color: 'primary',
				message: 'sidebar.notifications.updateExtensions',
				onClick: () => {
					this.updates.forEach((extension) => extension.update(false))
					updateNotification?.dispose()
				},
			})
		}
	}

	updateInstalled(extension: ExtensionViewer) {
		this.updates.delete(extension)
	}
	delete(extension: ExtensionViewer) {
		const index = this.installedExtensions.findIndex(
			(e) => e.id === extension.id
		)
		if (index === -1) return

		this.installedExtensions.splice(index, 1)

		if (extension.isLocalOnly)
			this.extensions = this.extensions.filter(
				(e) => e.id !== extension.id
			)
	}

	setupSidebar() {
		this.sidebar.addElement(
			new SidebarItem({
				id: 'all',
				text: 'All',
				icon: 'mdi-format-list-bulleted-square',
				color: 'primary',
			}),
			this.getExtensions()
		)
		this.sidebar.addElement(
			new SidebarItem({
				id: 'installed',
				text: 'Installed',
				icon: 'mdi-download-circle-outline',
				color: 'primary',
			}),
			this.installedExtensions
		)
		Object.values(this.tags).forEach((tag) =>
			this.sidebar.addElement(
				tag.asSidebarElement(),
				this.getExtensionsByTag(tag)
			)
		)
		this.sidebar.setDefaultSelected()
	}

	protected getExtensions(findTag?: ExtensionTag) {
		return [...new Set([...this.extensions, ...this.installedExtensions])]
			.filter(
				(ext) => !ext.isLocalOnly && (!findTag || ext.hasTag(findTag))
			)
			.sort(
				({ releaseTimestamp: tA }, { releaseTimestamp: tB }) => tB - tA
			)
	}
	protected getExtensionsByTag(findTag: ExtensionTag) {
		return this.getExtensions(findTag)
	}
	getTagIcon(tagName: string) {
		return this.extensionTags[tagName]?.icon
	}
	getTagColor(tagName: string) {
		return this.extensionTags[tagName]?.color
	}
	getExtensionById(id: string) {
		return this.getExtensions().find((extension) => extension.id === id)
	}

	get selectedSidebar() {
		return this.sidebar.selected
	}
	set selectedSidebar(val) {
		this.sidebar.clearFilter()
		this.sidebar.selected = val
	}

	getBaseUrl() {
		return this.baseUrl
	}
	addInstalledExtension(extension: ExtensionViewer) {
		this.installedExtensions.push(extension)
	}
}
