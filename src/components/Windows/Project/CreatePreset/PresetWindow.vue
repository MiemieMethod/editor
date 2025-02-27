<template>
	<SidebarWindow
		v-if="shouldRender"
		windowTitle="windows.createPreset.title"
		:isVisible="isVisible"
		:hasMaximizeButton="false"
		:isFullscreen="false"
		:percentageWidth="80"
		:percentageHeight="80"
		@closeWindow="onClose"
		:sidebarItems="sidebar.elements"
		v-model="sidebar.selected"
	>
		<template #sidebar>
			<v-text-field
				class="pt-2"
				prepend-inner-icon="mdi-magnify"
				:label="t('windows.createPreset.searchPresets')"
				v-model="sidebar._filter"
				autocomplete="off"
				autofocus
				outlined
				dense
			/>
		</template>
		<template #default>
			<h1
				class="mt-2 d-flex align-center"
				:class="{ 'mb-6': !content.description }"
			>
				<v-icon class="mr-1" large>{{ content.icon }}</v-icon>
				{{ content.name }}
			</h1>
			<p v-if="content.description" class="mt-2 mb-6">
				{{ content.description }}
			</p>

			<PresetPath
				v-if="typeof content.models.PRESET_PATH === 'string'"
				v-model="content.models.PRESET_PATH"
			/>

			<template v-for="([name, id, opts = {}], i) in content.fields">
				<v-text-field
					v-if="!opts.type || opts.type === 'textInput'"
					class="mb-1"
					:key="i"
					v-model="content.models[id]"
					:label="name"
					:rules="
						opts.validate
							? opts.validate.map(
									(rule) => $data.validationRules[rule]
							  )
							: []
					"
					autocomplete="off"
					outlined
					dense
					@keypress.enter="onCreatePreset"
				/>
				<span
					v-else-if="opts.type === 'fileInput'"
					v-cloak
					:key="i"
					@drop.prevent.stop="onDropFile(id, opts, $event)"
					@dragover.prevent.stop
				>
					<v-file-input
						class="mb-1"
						v-model="content.models[id]"
						:accept="opts.accept"
						:prepend-icon="null"
						:prepend-inner-icon="opts.icon || 'mdi-paperclip'"
						:label="name"
						:multiple="opts.multiple || false"
						autocomplete="off"
						outlined
						dense
					/>
				</span>

				<component
					v-else-if="opts.type === 'selectInput'"
					:is="
						opts.options.length > 4 ? 'v-autocomplete' : 'v-select'
					"
					class="mb-1"
					:key="i"
					:loading="opts.isLoading"
					:disabled="opts.isLoading"
					v-model="content.models[id]"
					:items="opts.options"
					:menu-props="{ maxHeight: 220 }"
					:label="name"
					autocomplete="off"
					outlined
					dense
				/>

				<v-switch
					v-else-if="opts.type === 'switch'"
					class="mb-1"
					:key="i"
					v-model="content.models[id]"
					:label="name"
				/>

				<v-slider
					v-else-if="opts.type === 'numberInput'"
					class="mb-1"
					:key="i"
					v-model="content.models[id]"
					:min="opts.min || 0"
					:max="opts.max || 10"
					discrete
					:step="opts.step || 1"
					thumb-label="always"
					:label="name"
				/>
			</template>
		</template>

		<template #actions>
			<v-spacer />
			<v-btn
				@click="onCreatePreset"
				color="primary"
				:disabled="!fieldsReady"
			>
				<v-icon class="mr-1">mdi-plus</v-icon>
				Create
			</v-btn>
		</template>
	</SidebarWindow>
</template>

<script>
import SidebarWindow from '/@/components/Windows/Layout/SidebarWindow.vue'
import PresetPath from './PresetPath.vue'
import { isFileAccepted } from '/@/utils/file/isAccepted.ts'
import { TranslationMixin } from '/@/components/Mixins/TranslationMixin.ts'

export default {
	name: 'CreatePresetWindow',
	mixins: [TranslationMixin],
	components: {
		SidebarWindow,
		PresetPath,
	},
	props: ['currentWindow'],
	data() {
		return this.currentWindow
	},
	computed: {
		content() {
			return this.sidebar.currentState
		},
		fieldsReady() {
			return Object.values(this.content.fields || {}).every(
				([_, id, opts = {}]) => {
					if (
						opts.validate &&
						opts.validate.some(
							(rule) =>
								this.$data.validationRules[rule](
									this.content.models[id]
								) !== true
						)
					)
						return false

					return !!this.content.models[id] || opts.optional
				}
			)
		},
	},
	methods: {
		onClose() {
			this.currentWindow.close()
		},
		onCreatePreset() {
			if (this.fieldsReady) this.currentWindow.createPreset(this.content)
		},
		onDropFile(id, opts, event) {
			const { accept, multiple } = opts
			const acceptedFiles = [...event.dataTransfer.files].filter((file) =>
				isFileAccepted(file, accept)
			)
			if (acceptedFiles.length === 0) return

			if (multiple) {
				if (!this.content.models[id])
					this.content.models[id] = [...acceptedFiles]
				else this.content.models[id].push(...acceptedFiles)
			} else {
				this.content.models[id] =
					acceptedFiles[acceptedFiles.length - 1]
			}
		},
	},
}
</script>
