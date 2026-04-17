<script>
  import { onMount } from 'svelte';

  let deferredInstallEvent = null;
  let installSupported = false;
  let message = 'Install unavailable on this browser. You can still use FamilyToDo in the browser.';

  async function installApp() {
    if (!deferredInstallEvent) {
      message = 'Install unavailable on this browser. You can still use FamilyToDo in the browser.';
      return;
    }

    const installEvent = deferredInstallEvent;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === 'accepted') {
      message = 'Install prompt accepted. Launch FamilyToDo from your home screen or app launcher.';
    } else {
      message = 'Install dismissed. You can continue using FamilyToDo in the browser.';
    }

    deferredInstallEvent = null;
    installSupported = false;
  }

  onMount(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredInstallEvent = event;
      installSupported = true;
      message = 'Install FamilyToDo for quick access.';
    };

    const handleAppInstalled = () => {
      deferredInstallEvent = null;
      installSupported = false;
      message = 'FamilyToDo installed successfully.';
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      message = 'FamilyToDo is running as an installed app.';
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  });
</script>

<section class="install" aria-label="Install FamilyToDo">
  <p data-testid="pwa-install-status" role="status" aria-live="polite">{message}</p>
  {#if installSupported}
    <button type="button" on:click={installApp}>
      Install app
    </button>
  {/if}
</section>

<style>
  .install {
    border: 1px solid #d2d6dc;
    border-radius: 0.75rem;
    padding: 0.75rem;
    background: #f8faf9;
    display: grid;
    gap: 0.5rem;
  }

  button {
    width: fit-content;
    border: 1px solid #1f2937;
    border-radius: 0.4rem;
    padding: 0.35rem 0.65rem;
    background: #ffffff;
  }

  button:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 1px;
  }
</style>
