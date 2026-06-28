import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docDir = path.join(__dirname, "..", "doc");

const FILES = [
  { file: "Agenda Surat Masuk_Keluar - Masuk-23.csv", direction: "masuk", year: 2023 },
  { file: "Agenda Surat Masuk_Keluar - Masuk-24.csv", direction: "masuk", year: 2024 },
  { file: "Agenda Surat Masuk_Keluar - 2025-Masuk.csv", direction: "masuk", year: 2025 },
  { file: "Agenda Surat Masuk_Keluar - Keluar-23.csv", direction: "keluar", year: 2023 },
  { file: "Agenda Surat Masuk_Keluar - Keluar-24.csv", direction: "keluar", year: 2024 },
  { file: "Agenda Surat Masuk_Keluar - 2025-Keluar.csv", direction: "keluar", year: 2025 },
];

const MONTHS = [
  ["januari", 1], ["februari", 2], ["pebruari", 2], ["maret", 3], ["april", 4],
  ["mei", 5], ["juni", 6], ["juli", 7], ["agustus", 8], ["agust", 8],
  ["september", 9], ["sept", 9], ["sep", 9], ["oktober", 10], ["okt", 10],
  ["november", 11], ["nopember", 11], ["nov", 11], ["desember", 12], ["des", 12],
  ["jan", 1], ["feb", 2], ["mar", 3], ["apr", 4], ["jun", 6], ["jul", 7],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function parseDate(raw, year) {
  let s = (raw || "").toLowerCase().replace(/!/g, "1").trim();
  let month = null;
  for (const [name, num] of MONTHS) {
    if (s.includes(name)) { month = num; break; }
  }
  const dayMatch = s.match(/(\d{1,2})/);
  let day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
  if (!month) month = 1;
  if (day < 1 || day > 31) day = 1;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function sqlStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const records = [];
const warnings = [];

for (const { file, direction, year } of FILES) {
  const full = path.join(docDir, file);
  const text = fs.readFileSync(full, "utf8");
  const rows = parseCsv(text);
  for (const r of rows) {
    const agenda = (r[0] || "").trim();
    const dateRaw = (r[1] || "").trim();
    const number = (r[2] || "").trim();
    const counterpart = (r[3] || "").trim();
    const subject = (r[4] || "").trim();
    if (!/^\d+$/.test(agenda)) continue;
    if (/tanggal/i.test(dateRaw)) continue;
    if (/rekap/i.test(counterpart) || /rekap/i.test(dateRaw)) continue;
    if (!dateRaw && !number && !counterpart && !subject) continue;
    const letterDate = parseDate(dateRaw, year);
    if (!dateRaw) warnings.push(`${file} agenda ${agenda}: tanggal kosong -> ${letterDate}`);
    records.push({
      agenda: parseInt(agenda, 10),
      direction,
      year,
      letter_number: number || "-",
      letter_date: letterDate,
      counterpart: counterpart || "-",
      subject: subject || "-",
    });
  }
}

const lines = [];
lines.push("-- Impor arsip historis (surat masuk & keluar 2023-2025)");
lines.push("-- Dihasilkan otomatis dari CSV agenda. status = 'diarsipkan'.");
lines.push("begin;");
lines.push(
  "insert into public.letters (agenda_number, direction, letter_number, letter_date, counterpart, subject, status) values"
);
const valueRows = records.map(
  (x) =>
    `  (${x.agenda}, '${x.direction}', ${sqlStr(x.letter_number)}, '${x.letter_date}', ${sqlStr(
      x.counterpart
    )}, ${sqlStr(x.subject)}, 'diarsipkan')`
);
lines.push(valueRows.join(",\n") + ";");

const counters = {};
for (const x of records) {
  const aKey = `agenda_${x.direction}|${x.year}`;
  counters[aKey] = Math.max(counters[aKey] || 0, x.agenda);
  if (x.direction === "keluar") {
    const m = x.letter_number.match(/^\s*(\d+)/);
    if (m) {
      const nKey = `nomor_keluar|${x.year}`;
      counters[nKey] = Math.max(counters[nKey] || 0, parseInt(m[1], 10));
    }
  }
}
lines.push("");
lines.push("-- Sinkronkan counter agar penomoran berikutnya tidak bentrok");
for (const [key, val] of Object.entries(counters)) {
  const [scope, year] = key.split("|");
  lines.push(
    `insert into public.counters (scope, year, current_value) values ('${scope}', ${year}, ${val})\n  on conflict (scope, year) do update set current_value = greatest(public.counters.current_value, ${val});`
  );
}
lines.push("commit;");

const outPath = path.join(__dirname, "import_arsip.sql");
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

const summary = {};
for (const x of records) {
  const k = `${x.direction} ${x.year}`;
  summary[k] = (summary[k] || 0) + 1;
}
console.log("Total records:", records.length);
console.log(summary);
if (warnings.length) console.log("Warnings:\n" + warnings.join("\n"));
