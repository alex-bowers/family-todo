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
    <section class="install" aria-label="Install FamilyToDo">
        <span>For a better experience, download the app.</span>
        <button type="button" on:click={installApp} class="install-btn">
            Install
        </button>
    </section>
{/if}

<style>
    .install {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: #f8faf9;
    }
    .install-btn {
        background: #fff;
        border-radius: 1rem;
        border: 1px solid #1f2937;
        font-size: 1rem;
        font-weight: 600;
        padding: 0.5rem 1rem;
        width: fit-content;
    }

    .install-btn:focus-visible {
        outline: 3px solid #0b5fff;
        outline-offset: 1px;
    }
</style>
