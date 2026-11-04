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
        padding: 1rem 1.25rem;
        background: var(--paper);
        border-bottom: 1px solid var(--line);
        color: var(--sumi);
    }
    .install-btn {
        background: var(--moss);
        color: var(--moss-ink);
        border-radius: var(--radius-sm);
        border: 1px solid var(--moss);
        font-size: 1rem;
        font-weight: 500;
        padding: 0.5rem 1.125rem;
        width: fit-content;
    }

    .install-btn:hover {
        background: var(--moss-strong);
    }

    .install-btn:focus-visible {
        outline: 2px solid var(--moss);
        outline-offset: 2px;
    }
</style>
