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

		// Reload once when a newly deployed service worker takes over, so the
		// open app switches to the new build instead of keeping the old one.
		const hadController = Boolean(navigator.serviceWorker.controller);
		let reloading = false;
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (!hadController || reloading) return;
			reloading = true;
			window.location.reload();
		});

		void navigator.serviceWorker
			.register('/service-worker.js', { updateViaCache: 'none' })
			.then((registration) => {
				// Installed PWAs can stay open for days; check for updates when
				// the app comes back to the foreground.
				document.addEventListener('visibilitychange', () => {
					if (document.visibilityState === 'visible') void registration.update();
				});
			});
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
