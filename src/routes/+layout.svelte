<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import PwaInstallPrompt from '$lib/components/PwaInstallPrompt.svelte';

	onMount(() => {
		if (!('serviceWorker' in navigator)) {
			return;
		}

		if (dev) {
			void (async () => {
				const registrations = await navigator.serviceWorker.getRegistrations();
				await Promise.all(registrations.map((registration) => registration.unregister()));

				if ('caches' in window) {
					const cacheKeys = await caches.keys();
					await Promise.all(
						cacheKeys
							.filter((key) => key.startsWith('familytodo-app-'))
							.map((key) => caches.delete(key))
					);
				}
			})();
			return;
		}

		void navigator.serviceWorker.register('/service-worker.js');
	});
</script>

<div class="shell">
	<PwaInstallPrompt />
	<slot />
</div>

<style>
	.shell {
		display: grid;
		max-width: 56rem;
		margin: 0 auto;
		min-height: 100vh;
		align-content: start;
	}
</style>
