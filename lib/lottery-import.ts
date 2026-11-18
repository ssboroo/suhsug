import * as XLSX from "xlsx";
import { createHash } from "node:crypto";

export type SheetPreview = { name: string; rowCount: number; headers: string[]; suggestedPhoneColumn: number; sampleRows: string[][] };
export type PhoneParse = { phone: string | null; reason: "EMPTY" | "INVALID" | "MULTIPLE" | "OK" };

export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function readWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: "buffer", cellDates: true, dense: false });
}

export function inspectWorkbook(workbook: XLSX.WorkBook): SheetPreview[] {
  return workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: true });
    const headers = (rows[0] ?? []).map(value => String(value ?? "").trim());
    const suggested = headers.findIndex(value => /phone|mobile|утас|дугаар/i.test(value));
    return { name, rowCount: rows.length, headers, suggestedPhoneColumn: suggested >= 0 ? suggested + 1 : 1, sampleRows: rows.slice(0, 6).map(row => row.map(value => String(value ?? "").slice(0, 100))) };
  });
}

export function parsePhoneCell(value: unknown): PhoneParse {
  if (value === null || value === undefined || String(value).trim() === "") return { phone: null, reason: "EMPTY" };
  const input = String(value).trim();
  const pattern = /(?<!\d)(?:\+?976[\s().-]*)?([6-9](?:[\s().-]*\d){7})(?!\d)/g;
  const matches = [...input.matchAll(pattern)].map(match => match[1].replace(/\D/g, ""));
  const unique = [...new Set(matches)];
  if (unique.length > 1) return { phone: null, reason: "MULTIPLE" };
  if (unique.length === 1 && /^[6-9]\d{7}$/.test(unique[0])) return { phone: unique[0], reason: "INVALID" };
  const digits = input.replace(/\D/g, "");
  const normalized = digits.startsWith("976") && digits.length === 11 ? digits.slice(3) : digits;
  if (/^[6-9]\d{7}$/.test(normalized)) return { phone: normalized, reason: "INVALID" };
  return { phone: null, reason: "INVALID" };
}

export function dateFromCell(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));
  }
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function rowsForSheet(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("SHEET_NOT_FOUND");
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", blankrows: true });
}
