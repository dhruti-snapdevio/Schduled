import { describe, expect, it } from "vitest";
import { escapeCsvValue, toCsv } from "./csv";

// Backs the Members / Pending Invites CSV export (app/actions/members.ts
// exportMembersCsvAction). A missed comma or embedded quote here silently
// shifts every column after it — the kind of bug that looks fine in a quick
// glance and only shows up once someone's name has a comma in it.
describe("escapeCsvValue", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvValue("member")).toBe("member");
    expect(escapeCsvValue("jane@example.com")).toBe("jane@example.com");
  });

  it("quotes a value containing a comma", () => {
    expect(escapeCsvValue("Doe, Jane")).toBe('"Doe, Jane"');
  });

  it("quotes and doubles embedded double-quotes", () => {
    expect(escapeCsvValue('Jane "JD" Doe')).toBe('"Jane ""JD"" Doe"');
  });

  it("quotes a value containing a newline", () => {
    expect(escapeCsvValue("line one\nline two")).toBe('"line one\nline two"');
  });

  it("leaves an empty string untouched", () => {
    expect(escapeCsvValue("")).toBe("");
  });
});

describe("toCsv", () => {
  it("joins headers and rows with commas and newlines", () => {
    const csv = toCsv(
      ["Name", "Email", "Role"],
      [
        ["Jane Doe", "jane@example.com", "manager"],
        ["John Smith", "john@example.com", "member"],
      ]
    );
    expect(csv).toBe(
      "Name,Email,Role\nJane Doe,jane@example.com,manager\nJohn Smith,john@example.com,member"
    );
  });

  it("escapes fields that need it without disturbing the ones that don't", () => {
    const csv = toCsv(["Name", "Notes"], [["Doe, Jane", 'Says "hi"']]);
    expect(csv).toBe('Name,Notes\n"Doe, Jane","Says ""hi"""');
  });

  it("handles zero rows — headers only", () => {
    expect(toCsv(["Email", "Role"], [])).toBe("Email,Role");
  });
});
