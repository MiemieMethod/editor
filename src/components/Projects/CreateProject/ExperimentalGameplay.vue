<template>
	<ToggleSheet
		:value="value"
		@input="$emit('input', $event)"
		:dark="true"
		:isToggleable="isToggleable"
	>
		<template #default="{ value }">
			<div class="d-flex align-center">
				<v-icon color="primary" class="mr-1">
					{{ experiment.icon }}
				</v-icon>
				<h1 class="header">
					{{ t(`experimentalGameplay.${experiment.id}.name`) }}
				</h1>
			</div>
			<SelectedStatus :selected="value" />

			<p v-if="!dense">
				{{ t(`experimentalGameplay.${experiment.id}.description`) }}
			</p>
		</template>
	</ToggleSheet>
</template>

<script>
import ToggleSheet from '/@/components/UIElements/ToggleSheet.vue'
import SelectedStatus from '/@/components/UIElements/SelectedStatus.vue'
import { TranslationMixin } from '/@/components/Mixins/TranslationMixin'

export default {
	name: 'ExperimentalGameplay',
	mixins: [TranslationMixin],
	components: {
		ToggleSheet,
		SelectedStatus,
	},
	props: {
		experiment: {
			type: Object,
			required: true,
		},
		isToggleable: {
			type: Boolean,
			default: true,
		},
		value: Boolean,
		dense: Boolean,
	},
}
</script>

<style scoped>
.header {
	font-size: 1.25rem !important;
	font-weight: 500;
	letter-spacing: 0.0125em !important;
}
</style>
