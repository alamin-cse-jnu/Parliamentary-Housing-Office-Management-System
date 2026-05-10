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

const BN_DIGITS: Record<string, string> = {
  "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9",
};
function normDigits(s: string): string {
  return s.replace(/[০-৯]/g, (c) => BN_DIGITS[c] ?? c);
}

function resolve(row: Record<string, any>, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
      return String(row[alias]).trim();
    }
  }
  return "";
}

export interface ParsedMpRow {
  parliament_number: string; // copied from internal_user_id if Excel has session-number (e.g. 13)
  internal_user_id: string;
  name_en: string;
  name_bn: string;
  constituency: string;
  party_en: string;
  party_bn: string;
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

  // Find the header row — look for any known column header across first 6 rows
  const HEADER_SIGNALS = [
    "Parliament Number", "সংসদ নাম্বার",
    "Constituency", "নির্বাচনী এলাকার নাম ও নম্বর",
    "MP Name", "সংসদ সদস্যের নাম",
    "ইউজার আইডি", "User Id",
  ];
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allRows.length, 8); i++) {
    const rowStr = allRows[i].map(String).join("|");
    if (HEADER_SIGNALS.some((sig) => rowStr.includes(sig))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    return { valid: [], errors: [{ row: 0, data: {}, reason: "Could not find header row in Excel file" }] };
  }

  const headers = allRows[headerIdx].map((h: any) => String(h).trim());
  const dataRows = allRows.slice(headerIdx + 1);

  // Detect file language by header: English file has "Political Party", Bangla file has "রাজনৈতিক দল"
  const isEnglishFile = headers.some(h => h === "Political Party" || h === "MP Name(English)" || h === "MP Name (English)");

  const valid: ParsedMpRow[] = [];
  const errors: { row: number; data: any; reason: string }[] = [];
  const seenUserIds = new Set<string>(); // deduplicate on internal_user_id

  dataRows.forEach((rawRow, idx) => {
    const excelRowNum = headerIdx + idx + 2; // 1-based Excel row
    if (rawRow.every((c: any) => String(c).trim() === "")) return; // skip blank rows

    // Map array to object using header names
    const row: Record<string, any> = {};
    headers.forEach((h, i) => { row[h] = rawRow[i]; });

    const raw_parliament_number = normDigits(resolve(row, COL.parliament_number));
    const internal_user_id      = normDigits(resolve(row, COL.internal_user_id));
    const name_en               = resolve(row, COL.name_en);
    const name_bn               = resolve(row, COL.name_bn);
    const constituency          = resolve(row, COL.constituency);
    const partyValue            = resolve(row, COL.party);
    const party_en              = isEnglishFile ? partyValue : "";
    const party_bn              = isEnglishFile ? "" : partyValue;
    const rawStatus             = resolve(row, COL.status);
    const rawGender             = resolve(row, COL.gender);

    // parliament_number in the Excel may be the session number (e.g. "13" for all rows).
    // We only use it as the MP's unique number if it differs across rows.
    // The true unique key is internal_user_id.
    const missing: string[] = [];
    if (!internal_user_id)              missing.push("internal_user_id (ইউজার আইডি)");
    if (!constituency)                  missing.push("constituency");
    if (!party_en && !party_bn)         missing.push("party");
    if (!name_en && !name_bn)           missing.push("name (en or bn)");

    if (missing.length > 0) {
      errors.push({ row: excelRowNum, data: row, reason: `Missing required fields: ${missing.join(", ")}` });
      return;
    }

    if (seenUserIds.has(internal_user_id)) {
      errors.push({ row: excelRowNum, data: row, reason: `Duplicate internal_user_id in file: ${internal_user_id}` });
      return;
    }
    seenUserIds.add(internal_user_id);

    const status = STATUS_MAP[rawStatus.toLowerCase()] ?? "ACTIVE";
    const gender = GENDER_MAP[rawGender.toLowerCase()] ?? "MALE";

    // Use raw_parliament_number only if it looks like a per-MP number (unique, not session number).
    // Otherwise fall back to internal_user_id so every row still gets a distinct value.
    const parliament_number = raw_parliament_number && raw_parliament_number !== "13"
      ? raw_parliament_number
      : internal_user_id;

    valid.push({ parliament_number, internal_user_id, name_en, name_bn, constituency, party_en, party_bn, status, gender });
  });

  return { valid, errors };
}
