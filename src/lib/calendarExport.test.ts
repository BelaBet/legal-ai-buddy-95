import { describe, expect, it } from "vitest";
import { generateGoogleCalendarUrl, generateICSContent } from "./calendarExport";
import type { CalendarEvent } from "@/hooks/useEvents";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "evt-1",
    title: "Audiência de conciliação",
    description: null,
    event_date: "2026-09-15",
    event_time: "14:30:00",
    location: null,
    meeting_link: null,
    participants: null,
    notification_enabled: false,
    notification_minutes_before: null,
    ...overrides,
  } as CalendarEvent;
}

describe("generateGoogleCalendarUrl", () => {
  it("encodes the title and date range into the Google Calendar URL", () => {
    const url = generateGoogleCalendarUrl(makeEvent());
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(parsed.searchParams.get("text")).toBe("Audiência de conciliação");
    expect(parsed.searchParams.get("dates")).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });

  it("appends the meeting link to the details field when present", () => {
    const url = generateGoogleCalendarUrl(
      makeEvent({ description: "Levar procuração", meeting_link: "https://meet.example.com/abc" })
    );
    const details = new URL(url).searchParams.get("details");

    expect(details).toContain("Levar procuração");
    expect(details).toContain("https://meet.example.com/abc");
  });
});

describe("generateICSContent", () => {
  it("produces a well-formed VEVENT block with the expected fields", () => {
    const ics = generateICSContent(makeEvent({ location: "Fórum Central" }));

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Audiência de conciliação");
    expect(ics).toContain("LOCATION:Fórum Central");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes ICS-reserved characters so the file doesn't get corrupted", () => {
    const ics = generateICSContent(
      makeEvent({ title: "Reunião; pauta, itens\ne prazos" })
    );

    expect(ics).toContain("SUMMARY:Reunião\\; pauta\\, itens\\ne prazos");
    // The raw (unescaped) separators must not leak into the line unescaped.
    expect(ics).not.toContain("SUMMARY:Reunião; pauta");
  });

  it("adds a VALARM block only when notifications are enabled", () => {
    const withAlarm = generateICSContent(
      makeEvent({ notification_enabled: true, notification_minutes_before: 30 })
    );
    const withoutAlarm = generateICSContent(makeEvent());

    expect(withAlarm).toContain("BEGIN:VALARM");
    expect(withAlarm).toContain("TRIGGER:-PT30M");
    expect(withoutAlarm).not.toContain("BEGIN:VALARM");
  });
});
