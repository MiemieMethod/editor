import { App } from '@/App'
import { ExtensionStoreWindow } from './ExtensionStore/ExtensionStore'
import { LoadingWindow } from './LoadingWindow/LoadingWindow'
import { CreatePresetWindow } from './Project/CreatePreset/CreatePreset'
import { CreateProjectWindow } from './Project/CreateProject/CreateProject'
import { FilePickerWindow } from './Project/FilePicker/FilePicker'
import { PackExplorerWindow } from './Project/PackExplorer/PackExplorer'
import { ProjectChooserWindow } from './Project/ProjectChooser/ProjectChooser'
import { SettingsWindow } from './Settings/SettingsWindow'

export class Windows {
	settings: SettingsWindow
	projectChooser = new ProjectChooserWindow()
	packExplorer = new PackExplorerWindow()
	createProject = new CreateProjectWindow()
	loadingWindow = new LoadingWindow()
	filePicker = new FilePickerWindow()
	createPreset = new CreatePresetWindow()
	extensionStore = new ExtensionStoreWindow()

	constructor(protected app: App) {
		this.settings = new SettingsWindow(app)
	}
}
