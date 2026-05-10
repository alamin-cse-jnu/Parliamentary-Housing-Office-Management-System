import * as XLSX from "xlsx";

// ─── Column name aliases (English + Bangla) ──────────────────────────────────
const COL = {
  parliament_number: ["Parliament Number", "সংসদ নাম্বার"],
  constituency:      ["Constituency", "নির্বাচনী এলাকার নাম ও নম্বর"],
  name_en:           ["MP Name(English)", "MP Name (English)"],
  name_bn:           ["সংসদ সদস্যের নাম(বাংলা)", "সংসদ সদস্যের নাম (বাংলা)"],
  party:             ["Political Party", "রাজনৈতিক দল"],
  status:            ["Status", "স্ট্যাটাস"],
  internal_user_id:  ["User Id", "User ID", "ইউজার আইডি"],
  gender:            ["Gender", "লিঙ্গ"],
};

const STATUS_MAP: Record<string, string> = {
  "active": "ACTIVE", "সক্রিয়": "ACTIVE",
  "resigned": "RESIGNED", "পদত্যাগী": "RESIGNED",
  "deceased": "DECEASED", "মৃত": "DECEASED",
  "seat vacant": "SEAT_VACANT", "আসন শূন্য": "SEAT_VACANT",
};

const GENDER_MAP: Record<string, string> = {
  "male": "MALE", "পুরুষ": "MALE",
  "female": "FEMALE", "মহিলা": "FEMALE", "নারী": "FEMALE",
  "other": "OTHER", "অন্যান্য": "OTHER",
};

function resolve(row: Record<string, any>, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
      return String(row[alias]).trim();
    }
  }
  return "";
}

export interface ParsedMpRow {
  parliament_number: string;
  internal_user_id: string;
  name_en: string;
  name_bn: string;
  constituency: string;
  party: string;
  status: string;
  gender: string;
}

export interface ParseResult {
  valid: ParsedMpRow[];
  errors: { row: number; data: any; reason: string }[];
}

export function parseMpExcel(buffer: Buffer): ParseResult {
  const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
    header: 1,
    defval: "",
  }) as any[][];

  // Find the header row: first row where "Parliament Number" or "সংসদ নাম্বার" appears
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allRows.length, 6); i++) {
    const rowStr = allRows[i].map(String).join("|");
    if (
      rowStr.includes("Parliament Number") ||
      rowStr.includes("সংসদ নাম্বার")
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    return { valid: [], errors: [{ row: 0, data: {}, reason: "Could not find header row in Excel file" }] };
  }

  const headers = allRows[headerIdx].map((h: any) => String(h).trim());
  const dataRows = allRows.slice(headerIdx + 1);

  const valid: ParsedMpRow[] = [];
  const errors: { row: number; data: any; reason: string }[] = [];
  const seenParliamentNums = new Set<string>();

  dataRows.forEach((rawRow, idx) => {
    const excelRowNum = headerIdx + idx + 2; // 1-based Excel row
    if (rawRow.every((c: any) => String(c).trim() === "")) return; // skip blank rows

    // Map array to object using header names
    const row: Record<string, any> = {};
    headers.forEach((h, i) => { row[h] = rawRow[i]; });

    const parliament_number = resolve(row, COL.parliament_number);
    const internal_user_id  = resolve(row, COL.internal_user_id);
    const name_en           = resolve(row, COL.name_en);
    const name_bn           = resolve(row, COL.name_bn);
    const constituency      = resolve(row, COL.constituency);
    const party             = resolve(row, COL.party);
    const rawStatus         = resolve(row, COL.status);
    const rawGender         = resolve(row, COL.gender);

    const missing: string[] = [];
    if (!parliament_number) missing.push("parliament_number");
    if (!internal_user_id)  missing.push("internal_user_id");
    if (!constituency)       missing.push("constituency");
    if (!party)              missing.push("party");
    if (!name_en && !name_bn) missing.push("name (en or bn)");

    if (missing.length > 0) {
      errors.push({ row: excelRowNum, data: row, reason: `Missing required fields: ${missing.join(", ")}` });
      return;
    }

    if (seenParliamentNums.has(parliament_number)) {
      errors.push({ row: excelRowNum, data: row, reason: `Duplicate parliament_number in file: ${parliament_number}` });
      return;
    }
    seenParliamentNums.add(parliament_number);

    const status = STATUS_MAP[rawStatus.toLowerCase()] ?? "ACTIVE";
    const gender = GENDER_MAP[rawGender.toLowerCase()] ?? "MALE";

    valid.push({ parliament_number, internal_user_id, name_en, name_bn, constituency, party, status, gender });
  });

  return { valid, errors };
}
