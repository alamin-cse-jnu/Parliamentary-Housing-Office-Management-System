import * as XLSX from "xlsx";

// ─── Column aliases (English + Bangla) ───────────────────────────────────────
const COL = {
  internal_user_id: ["User ID", "User Id", "ইউজার আইডি"],
  name_en:          ["Employee Name (English)", "Employee Name(English)"],
  name_bn:          ["কর্মকর্তা/কর্মচারির নাম (বাংলা)", "কর্মকর্তা/কর্মচারির নাম(বাংলা)"],
  mobile:           ["Mobile Number", "মোবাইল নাম্বার"],
  employee_class:   ["Employee Class", "কর্মকর্তা/কর্মচারি ক্লাস"],
  grade:            ["Grade", "গ্রেড"],
  department:       ["Office", "Department", "দপ্তর", "বিভাগ"],
  designation:      ["Designation", "পদবী"],
  gender:           ["Gender", "লিঙ্গ"],
  marital_status:   ["Marital Status", "বৈবাহিক অবস্থা"],
};

const CLASS_MAP: Record<string, string> = {
  "class-i": "CLASS_1",   "class-1": "CLASS_1",   "1st class": "CLASS_1",
  "১ম শ্রেনী": "CLASS_1", "১ম শ্রেণী": "CLASS_1",
  "class-ii": "CLASS_2",  "class-2": "CLASS_2",   "2nd class": "CLASS_2",
  "২য় শ্রেনী": "CLASS_2", "২য় শ্রেণী": "CLASS_2",
  "class-iii": "CLASS_3", "class-3": "CLASS_3",   "3rd class": "CLASS_3",
  "৩য় শ্রেনী": "CLASS_3", "৩য় শ্রেণী": "CLASS_3",
  "class-iv": "CLASS_4",  "class-4": "CLASS_4",   "4th class": "CLASS_4",
  "৪র্থ শ্রেনী": "CLASS_4","৪র্থ শ্রেণী": "CLASS_4",
  "no class": "NO_CLASS",
};

const GENDER_MAP: Record<string, string> = {
  "male": "MALE",   "পুরুষ": "MALE",
  "female": "FEMALE", "মহিলা": "FEMALE", "নারী": "FEMALE",
  "other": "OTHER", "অন্যান্য": "OTHER",
};

const MARITAL_MAP: Record<string, string> = {
  "single": "SINGLE",     "অবিবাহিত": "SINGLE",
  "married": "MARRIED",   "বিবাহিত": "MARRIED",
  "divorced": "DIVORCED", "তালাকপ্রাপ্ত": "DIVORCED",
  "widowed": "WIDOWED",   "বিধবা": "WIDOWED", "বিপত্নীক": "WIDOWED",
};

function resolve(row: Record<string, any>, aliases: string[]): string {
  for (const alias of aliases) {
    const val = row[alias];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function parseGrade(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "").trim();
  const n = parseInt(cleaned);
  return !isNaN(n) && n >= 1 && n <= 20 ? n : null;
}

export interface ParsedStaffRow {
  internal_user_id: string;
  name_en: string;
  name_bn: string;
  mobile: string;
  employee_class: string;
  grade: number;
  department: string;
  designation: string;
  gender: string;
  marital_status: string;
}

export interface StaffParseResult {
  valid: ParsedStaffRow[];
  errors: { row: number; data: any; reason: string }[];
}

export function parseStaffExcel(buffer: Buffer): StaffParseResult {
  const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" }) as any[][];

  // Find header row — staff files have 3 metadata rows before column headers
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allRows.length, 8); i++) {
    const rowStr = allRows[i].map(String).join("|");
    if (rowStr.includes("User ID") || rowStr.includes("ইউজার আইডি") ||
        rowStr.includes("Employee Name") || rowStr.includes("কর্মকর্তা")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    return { valid: [], errors: [{ row: 0, data: {}, reason: "Could not find header row in Excel file" }] };
  }

  const headers = allRows[headerIdx].map((h: any) => String(h).trim());
  const dataRows = allRows.slice(headerIdx + 1);

  const valid: ParsedStaffRow[] = [];
  const errors: { row: number; data: any; reason: string }[] = [];
  const seenIds = new Set<string>();

  dataRows.forEach((rawRow, idx) => {
    const excelRowNum = headerIdx + idx + 2;
    if (rawRow.every((c: any) => String(c).trim() === "")) return;

    const row: Record<string, any> = {};
    headers.forEach((h, i) => { row[h] = rawRow[i]; });

    const internal_user_id = resolve(row, COL.internal_user_id);
    const name_en          = resolve(row, COL.name_en);
    const name_bn          = resolve(row, COL.name_bn);
    const mobile           = resolve(row, COL.mobile);
    const rawClass         = resolve(row, COL.employee_class);
    const rawGrade         = resolve(row, COL.grade);
    const department       = resolve(row, COL.department);
    const designation      = resolve(row, COL.designation);
    const rawGender        = resolve(row, COL.gender);
    const rawMarital       = resolve(row, COL.marital_status);

    const missing: string[] = [];
    if (!internal_user_id)        missing.push("internal_user_id");
    if (!name_en && !name_bn)     missing.push("name (en or bn)");
    if (!department)              missing.push("department");
    if (!designation)             missing.push("designation");

    if (missing.length > 0) {
      errors.push({ row: excelRowNum, data: row, reason: `Missing required fields: ${missing.join(", ")}` });
      return;
    }

    if (seenIds.has(internal_user_id)) {
      errors.push({ row: excelRowNum, data: row, reason: `Duplicate internal_user_id in file: ${internal_user_id}` });
      return;
    }
    seenIds.add(internal_user_id);

    const grade = parseGrade(rawGrade);
    if (!grade) {
      errors.push({ row: excelRowNum, data: row, reason: `Invalid grade value: "${rawGrade}"` });
      return;
    }

    const employee_class = CLASS_MAP[rawClass.toLowerCase()] ?? CLASS_MAP[rawClass] ?? "NO_CLASS";
    const gender         = GENDER_MAP[rawGender.toLowerCase()] ?? GENDER_MAP[rawGender] ?? "MALE";
    const marital_status = MARITAL_MAP[rawMarital.toLowerCase()] ?? MARITAL_MAP[rawMarital] ?? "SINGLE";

    valid.push({
      internal_user_id, name_en, name_bn, mobile,
      employee_class, grade, department, designation,
      gender, marital_status,
    });
  });

  return { valid, errors };
}
