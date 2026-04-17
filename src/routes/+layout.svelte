<script>
	import { onMount } from 'svelte';
	import PwaInstallPrompt from '$lib/components/PwaInstallPrompt.svelte';

	onMount(() => {
		if ('serviceWorker' in navigator) {
			void navigator.serviceWorker.register('/service-worker.js');
		}
	});
</script>

<div class="shell">
	<PwaInstallPrompt />
	<slot />
</div>

<style>
	.shell {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		max-width: 72rem;
		margin: 0 auto;
	}
</style>
