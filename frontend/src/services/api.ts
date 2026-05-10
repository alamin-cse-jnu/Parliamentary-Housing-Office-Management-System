import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; user: AppUser }>("/auth/login", { username, password }),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppUser {
  id: number;
  username: string;
  full_name: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

export interface Mp {
  id: number;
  parliament_number: string;
  name_bn: string;
  name_en: string;
  constituency: string | null;
  party?: { name_en: string; name_bn: string };
  gender: string;
  status: string;
  designation?: { name_en: string; name_bn: string } | null;
  photo_path: string | null;
  tenure_id: number;
}

export interface Staff {
  id: number;
  internal_user_id: string;
  name_bn: string;
  name_en: string;
  designation: string;
  department?: { name_en: string; name_bn: string };
  grade: number | null;
  employee_class: string | null;
  service_status: string;
  photo_path: string | null;
}

export interface Allocation {
  id: number;
  allocation_type: string;
  occupant_type: string;
  status: string;
  allotment_date: string;
  vacated_date: string | null;
  remarks: string | null;
  mp?: Mp;
  staff?: Staff;
  mp_office?: { id: number; room_number: string; building?: { name_en: string } };
  mp_flat?: { id: number; flat_number: string; building_name: string | null };
  staff_quarter?: { id: number; quarter_number: string; location: string };
}

// ─── Report download helper ────────────────────────────────────────────────

export interface ReportParams {
  format: "pdf" | "excel";
  lang: "en" | "bn";
  columns?: string;
  [key: string]: string | number | undefined;
}

export async function downloadReport(code: string, params: ReportParams): Promise<void> {
  const res = await api.get(`/reports/${code.toLowerCase()}`, {
    params,
    responseType: "blob",
  });

  const ext = params.format === "excel" ? "xlsx" : "pdf";
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${code}-${date}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
