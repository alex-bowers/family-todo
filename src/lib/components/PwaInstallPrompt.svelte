<script>
  import { onMount } from 'svelte';

  let deferredInstallEvent = null;
  let installSupported = false;

  async function installApp() {
    const installEvent = deferredInstallEvent;

    await installEvent.prompt();

    deferredInstallEvent = null;
    installSupported = false;
  }

  onMount(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
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

{#if !installSupported}
  <section class="install" aria-label="Install FamilyToDo">
    <span>For a better experience,</span>
    <button type="button" on:click={installApp}>
      Install app
    </button>
  </section>
{/if}

<style>
  .install {
    padding: 0.75rem;
    background: #f8faf9;
    display: flex;
    align-items: center;
    justify-content: center;
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
