<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getNotificationPermission,
    requestNotificationPermission,
    isWeeklyNotificationEnabled,
    setWeeklyNotificationEnabled,
    showWeeklyReminder,
    scheduleWeeklyNotification,
  } from '$lib/utils/notifications';

  let permission = getNotificationPermission();
  let enabled = isWeeklyNotificationEnabled();
  let showTestSuccess = false;

  async function toggleNotifications() {
    if (!enabled) {
      // Turning on
      const result = await requestNotificationPermission();
      permission = result;
      if (result === 'granted') {
        enabled = true;
        setWeeklyNotificationEnabled(true);
        scheduleWeeklyNotification();
      }
    } else {
      // Turning off
      enabled = false;
      setWeeklyNotificationEnabled(false);
    }
  }

  async function testNotification() {
    if (permission !== 'granted') {
      return;
    }
    await showWeeklyReminder();
    showTestSuccess = true;
    setTimeout(() => {
      showTestSuccess = false;
    }, 3000);
  }

  onMount(() => {
    if (enabled && permission === 'granted') {
      scheduleWeeklyNotification();
    }
  });
</script>

<section class="notification-settings" aria-label="Notification settings">
  <div class="row">
    <label class="toggle-label" for="weekly-notification-toggle">
      <span class="toggle-text">Weekly Sunday reminder (18:05 UK)</span>
      <span class="toggle-description">
        "Has everything been added to the shopping list?"
      </span>
    </label>
    <button
      id="weekly-notification-toggle"
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle weekly Sunday reminder notification"
      class="toggle"
      class:on={enabled}
      on:click={toggleNotifications}
    >
      <span class="toggle-knob" aria-hidden="true"></span>
    </button>
  </div>

  {#if enabled}
    <div class="test-row">
      <button type="button" class="test-btn" on:click={testNotification}>
        Test notification now
      </button>
      {#if showTestSuccess}
        <span class="test-success" role="status">Sent!</span>
      {/if}
    </div>
  {/if}

  {#if permission === 'denied'}
    <p class="warning" role="alert">
      Notifications are blocked. Enable them in your browser settings to use this feature.
    </p>
  {/if}
</section>

<style>
  .notification-settings {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8faf9;
    border-radius: 0.5rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .toggle-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    cursor: pointer;
    flex: 1;
  }

  .toggle-text {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .toggle-description {
    font-size: 0.85rem;
    color: #6b7280;
  }

  .toggle {
    position: relative;
    width: 48px;
    height: 28px;
    border-radius: 14px;
    border: none;
    background: #d1d5db;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
  }

  .toggle.on {
    background: #10b981;
  }

  .toggle:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 2px;
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .toggle.on .toggle-knob {
    transform: translateX(20px);
  }

  .test-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .test-btn {
    background: #fff;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: 500;
  }

  .test-btn:hover {
    background: #f3f4f6;
  }

  .test-btn:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 1px;
  }

  .test-success {
    font-size: 0.9rem;
    color: #10b981;
    font-weight: 500;
  }

  .warning {
    margin: 0;
    font-size: 0.85rem;
    color: #dc2626;
  }
</style>
