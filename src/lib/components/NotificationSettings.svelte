<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getNotificationPermission,
    requestNotificationPermission,
    isWeeklyNotificationEnabled,
    setWeeklyNotificationEnabled,
    scheduleWeeklyNotification,
  } from '$lib/utils/notifications';

  let permission: NotificationPermission = 'default';
  let enabled = false;

  async function toggleNotifications() {
    if (!enabled) {
      const result = await requestNotificationPermission();
      permission = result;
      if (result === 'granted') {
        enabled = true;
        setWeeklyNotificationEnabled(true);
        scheduleWeeklyNotification();
      }
    } else {
      enabled = false;
      setWeeklyNotificationEnabled(false);
    }
  }

  onMount(() => {
    // Defer reading browser-only APIs until after mount to avoid SSR hydration mismatches.
    permission = getNotificationPermission();
    enabled = isWeeklyNotificationEnabled();

    if (enabled && permission === 'granted') {
      scheduleWeeklyNotification();
    }
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
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 50%;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .bell:hover {
    background: #f3f4f6;
  }

  .bell:focus-visible {
    outline: 2px solid #0b5fff;
    outline-offset: 1px;
  }

  .bell svg {
    width: 20px;
    height: 20px;
  }

  .bell.on {
    color: #10b981;
  }

  .bell.blocked {
    color: #ef4444;
  }
</style>
