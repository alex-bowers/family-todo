<script>
  import { onMount } from 'svelte';

  let deferredInstallEvent = null;
  let installSupported = false;

  /** Trigger the browser's native install dialog */
  async function installApp() {
    if (!deferredInstallEvent) return;
    await deferredInstallEvent.prompt();
    deferredInstallEvent = null;
    installSupported = false;
  }

  onMount(() => {
    const handleBeforeInstallPrompt = (event) => {
      // Defer so we can trigger it on user gesture, but don't
      // preventDefault — the browser may still show its own prompt.
      deferredInstallEvent = event;
      installSupported = true;
    };

    const handleAppInstalled = () => {
      deferredInstallEvent = null;
      installSupported = false;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  });
</script>

{#if installSupported}
  <button type="button" on:click={installApp} class="install-btn">
    Install app
  </button>
{/if}

<style>
  .install-btn {
    width: fit-content;
    border: 1px solid #1f2937;
    border-radius: 0.4rem;
    padding: 0.35rem 0.65rem;
    background: #ffffff;
  }

  .install-btn:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 1px;
  }
</style>
