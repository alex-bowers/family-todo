<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getNotificationPermission,
    requestNotificationPermission,
    isWeeklyNotificationEnabled,
    setWeeklyNotificationEnabled,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    setPushNotificationEnabled,
  } from '$lib/utils/notifications';
  import { resolveHouseholdId } from '$lib/memory/household';

  let permission = 'default';
  let enabled = false;

  async function toggleNotifications() {
    if (!enabled) {
      const result = await requestNotificationPermission();
      permission = result;
      if (result === 'granted') {
        enabled = true;
        setWeeklyNotificationEnabled(true);
        setPushNotificationEnabled(true);
        // The weekly reminder is delivered by push, including when the app is closed
        const householdId = resolveHouseholdId();
        await subscribeToPushNotifications(householdId);
      }
    } else {
      enabled = false;
      setWeeklyNotificationEnabled(false);
      setPushNotificationEnabled(false);
      // Unsubscribe from push notifications
      await unsubscribeFromPushNotifications();
    }
  }

  onMount(() => {
    // Defer reading browser-only APIs until after mount to avoid SSR hydration mismatches.
    permission = getNotificationPermission();
    enabled = isWeeklyNotificationEnabled();
  });
</script>

<button
  type="button"
  class="bell"
  class:on={enabled}
  class:blocked={permission === 'denied'}
  aria-label={enabled ? 'Weekly reminder on' : 'Weekly reminder off'}
  title={enabled ? 'Weekly reminder on' : 'Weekly reminder off'}
  on:click={toggleNotifications}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    {#if enabled}
      <line x1="18" y1="2" x2="22" y2="6"/>
      <line x1="22" y1="2" x2="18" y2="6"/>
    {/if}
  </svg>
</button>

<style>
  .bell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--stone);
    cursor: pointer;
    border-radius: 50%;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .bell:hover {
    background: var(--sand);
  }

  .bell:focus-visible {
    outline: 2px solid var(--moss);
    outline-offset: 2px;
  }

  .bell svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .bell.on {
    color: var(--moss);
  }

  .bell.blocked {
    color: var(--clay);
  }
</style>
