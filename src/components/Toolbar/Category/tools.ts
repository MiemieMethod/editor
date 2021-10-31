import { App } from '/@/App'
import { ToolbarCategory } from '../ToolbarCategory'
import { Divider } from '../Divider'
import { platform } from '/@/utils/os'
import { clearAllNotifications } from '/@/components/Notifications/create'

export function setupToolsCategory(app: App) {
	const tools = new ToolbarCategory(
		'mdi-wrench-outline',
		'toolbar.tools.name'
	)

	tools.addItem(
		app.actionManager.create({
			icon: 'mdi-book-open-page-variant',
			name: 'actions.docs.name',
			description: 'actions.docs.description',
			onTrigger: () => App.openUrl('https://bedrock.dev', 'DocWindow'),
		})
	)

	tools.addItem(new Divider())

	tools.addItem(
		app.actionManager.create({
			id: 'bridge.action.refreshProject',
			icon: 'mdi-folder-refresh-outline',
			name: 'windows.packExplorer.refresh.name',
			description: 'windows.packExplorer.refresh.description',
			keyBinding:
				platform() === 'win32' ? 'Ctrl + Alt + R' : 'Ctrl + Meta + R',
			onTrigger: async () => {
				await app.projectManager.projectReady.fired

				await app.project.refresh()
			},
		})
	)
	tools.addItem(
		app.actionManager.create({
			icon: 'mdi-reload',
			name: 'actions.reloadAutoCompletions.name',
			description: 'actions.reloadAutoCompletions.description',
			keyBinding: 'Ctrl + Shift + R',
			onTrigger: async () => {
				await app.projectManager.projectReady.fired

				app.project.jsonDefaults.reload()
			},
		})
	)
	tools.addItem(
		app.actionManager.create({
			icon: 'mdi-puzzle-outline',
			name: 'actions.reloadExtensions.name',
			description: 'actions.reloadExtensions.description',
			onTrigger: async () => {
				// Global extensions
				app.extensionLoader.deactiveAll(true)
				app.extensionLoader.loadExtensions()

				await app.projectManager.projectReady.fired

				// Local extensions
				app.project.extensionLoader.deactiveAll(true)
				app.project.extensionLoader.loadExtensions()
			},
		})
	)

	tools.addItem(new Divider())

	tools.addItem(
		app.actionManager.create({
			icon: 'mdi-cancel',
			name: 'actions.clearAllNotifications.name',
			description: 'actions.clearAllNotifications.description',
			onTrigger: () => clearAllNotifications(),
		})
	)

	App.toolbar.addCategory(tools)
}
