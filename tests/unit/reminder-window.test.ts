import { describe, it, expect } from "vitest";
import { getReminderWindowStart, needsReminder } from "$lib/utils/reminder-window";

function utc(iso: string): Date {
  return new Date(`${iso}Z`);
}

describe("getReminderWindowStart", () => {
  describe("in BST (13:00–20:00 UK is 12:00–19:00 UTC)", () => {
    it("returns null just before 13:00 UK time", () => {
      expect(getReminderWindowStart(utc("2026-10-11T11:59:59"))).toBeNull();
    });

    it("opens at exactly 13:00 UK time", () => {
      expect(getReminderWindowStart(utc("2026-10-11T12:00:00"))).toEqual(
        utc("2026-10-11T12:00:00"),
      );
    });

    it("returns the window start for a time inside the window", () => {
      expect(getReminderWindowStart(utc("2026-10-11T18:32:15.500"))).toEqual(
        utc("2026-10-11T12:00:00"),
      );
    });

    it("is still open at 19:59:59 UK time", () => {
      expect(getReminderWindowStart(utc("2026-10-11T18:59:59"))).toEqual(
        utc("2026-10-11T12:00:00"),
      );
    });

    it("closes at 20:00 UK time", () => {
      expect(getReminderWindowStart(utc("2026-10-11T19:00:00"))).toBeNull();
    });
  });

  describe("in GMT (13:00–20:00 UK is 13:00–20:00 UTC)", () => {
    it("returns null at 12:30 UTC", () => {
      expect(getReminderWindowStart(utc("2026-11-01T12:30:00"))).toBeNull();
    });

    it("opens at 13:00 UTC", () => {
      expect(getReminderWindowStart(utc("2026-11-01T13:00:00"))).toEqual(
        utc("2026-11-01T13:00:00"),
      );
    });

    it("is still open at 19:59 UTC", () => {
      expect(getReminderWindowStart(utc("2026-11-01T19:59:00"))).toEqual(
        utc("2026-11-01T13:00:00"),
      );
    });

    it("closes at 20:00 UTC", () => {
      expect(getReminderWindowStart(utc("2026-11-01T20:00:00"))).toBeNull();
    });
  });

  describe("on clock-change Sundays", () => {
    it("uses BST on the Sunday the clocks go forward", () => {
      expect(getReminderWindowStart(utc("2026-03-29T12:30:00"))).toEqual(
        utc("2026-03-29T12:00:00"),
      );
    });

    it("uses GMT on the Sunday the clocks go back", () => {
      expect(getReminderWindowStart(utc("2026-10-25T14:00:00"))).toEqual(
        utc("2026-10-25T13:00:00"),
      );
    });
  });

  it("returns null on a Saturday afternoon", () => {
    expect(getReminderWindowStart(utc("2026-10-10T15:00:00"))).toBeNull();
  });

  it("returns null on a Monday afternoon", () => {
    expect(getReminderWindowStart(utc("2026-10-12T15:00:00"))).toBeNull();
  });

  it("returns null late on Sunday night UTC when it is already Monday in the UK", () => {
    expect(getReminderWindowStart(utc("2026-10-11T23:30:00"))).toBeNull();
  });
});

describe("needsReminder", () => {
  const windowStart = utc("2026-10-11T12:00:00");

  it("returns true for a device that has never been sent a reminder", () => {
    expect(needsReminder(null, windowStart)).toBe(true);
  });

  it("returns true when the last send was before this window", () => {
    expect(needsReminder("2026-10-04T12:23:00.000Z", windowStart)).toBe(true);
  });

  it("returns false when the device was already sent the reminder in this window", () => {
    expect(needsReminder("2026-10-11T12:23:00.000Z", windowStart)).toBe(false);
  });

  it("returns false when the last send was exactly at the window start", () => {
    expect(needsReminder("2026-10-11T12:00:00.000Z", windowStart)).toBe(false);
  });

  it("returns true when the stored timestamp is invalid", () => {
    expect(needsReminder("not-a-date", windowStart)).toBe(true);
  });
});
