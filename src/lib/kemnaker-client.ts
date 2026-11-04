import {
  City,
  EnrichedApplication,
  ParticipantProfile,
  StudyProgram,
  Vacancy,
} from "./types";
import {
  KEMNAKER_API_BASE,
  enrichApplication,
  normalizeParticipant,
} from "./kemnaker-api";

export function extractCleanToken(input: string): string {
  const trimmed = input.trim();

  // If user pasted "naco_access_token=eyJ..." from DevTools cookies or document.cookie
  const cookieMatch = trimmed.match(/naco_access_token=([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/i);
  if (cookieMatch?.[1]) return cookieMatch[1].trim();

  // If user pasted JSON string containing "accessToken"
  const jsonMatch = trimmed.match(/"accessToken"\s*:\s*"([^"]+)"/);
  if (jsonMatch?.[1]) return jsonMatch[1].trim();

  // If user pasted "Bearer eyJ..."
  const bearerMatch = trimmed.match(/Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/i);
  if (bearerMatch?.[1]) return bearerMatch[1].trim();

  // If user pasted pure JWT token "eyJ..."
  const jwtMatch = trimmed.match(/([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/);
  if (jwtMatch?.[1]) return jwtMatch[1].trim();

  return trimmed.replace(/^Bearer\s+/i, "").replace(/["';]/g, "").trim();
}

export interface SiapkerjaSessionResult {
  token: string;
  participant: ParticipantProfile | null;
  applications: EnrichedApplication[];
  syncedAt: string;
}

export async function fetchSiapkerjaSession(rawInputToken: string): Promise<SiapkerjaSessionResult> {
  const token = extractCleanToken(rawInputToken);

  if (!token || token.length < 20) {
    throw new Error(
      "Format token tidak valid. Pastikan Anda menyalin nilai token 'naco_access_token' yang berawalan 'eyJ...' dari DevTools."
    );
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [participantRes, firstAppRes] = await Promise.all([
    fetch(`${KEMNAKER_API_BASE}/maganghub/onboarding/v2/participants/me`, {
      headers,
    }).catch((err) => {
      throw new Error(`Koneksi ke server Kemnaker gagal: ${err.message}`);
    }),
    fetch(
      `${KEMNAKER_API_BASE}/maganghub/recruitment/v2/applications/me?page=1`,
      { headers }
    ).catch((err) => {
      throw new Error(`Koneksi ke server Kemnaker gagal: ${err.message}`);
    }),
  ]);

  if (participantRes.status === 401 && firstAppRes.status === 401) {
    throw new Error(
      "Sesi token tidak valid atau sudah kedaluwarsa (HTTP 401). Silakan login ulang ke maganghub.kemnaker.go.id lalu salin cookie 'naco_access_token' yang baru."
    );
  }

  let participant: ParticipantProfile | null = null;
  if (participantRes.ok) {
    const pJson = await participantRes.json().catch(() => null);
    if (pJson?.data) {
      const rawP =
        typeof pJson.data === "object" && "id" in pJson.data
          ? pJson.data
          : pJson.data?.data || pJson.data;
      participant = normalizeParticipant(rawP);
    }
  }

  const rawApplications: Record<string, unknown>[] = [];
  if (firstAppRes.ok) {
    const appJson = await firstAppRes.json().catch(() => null);
    if (Array.isArray(appJson?.data)) {
      rawApplications.push(...appJson.data);
    }

    const lastPage = Number(
      appJson?.meta?.last_page ?? appJson?.meta?.lastPage ?? 1
    );
    if (Number.isFinite(lastPage) && lastPage > 1) {
      const maxPages = Math.min(lastPage, 10);
      const pagePromises: Promise<Response>[] = [];
      for (let p = 2; p <= maxPages; p++) {
        pagePromises.push(
          fetch(
            `${KEMNAKER_API_BASE}/maganghub/recruitment/v2/applications/me?page=${p}`,
            { headers }
          )
        );
      }

      const otherPages = await Promise.all(pagePromises);
      for (const res of otherPages) {
        if (res.ok) {
          const pgJson = await res.json().catch(() => null);
          if (Array.isArray(pgJson?.data)) {
            rawApplications.push(...pgJson.data);
          }
        }
      }
    }
  }

  const enrichedApplications: EnrichedApplication[] = rawApplications.map(
    (app) => enrichApplication(app)
  );

  return {
    token,
    participant,
    applications: enrichedApplications,
    syncedAt: new Date().toISOString(),
  };
}

export interface FetchVacanciesParams {
  keyword?: string;
  page?: number;
  limit?: number;
  cityId?: string;
  studyProgramId?: string;
  educationLevel?: string;
  organizerType?: string;
  interviewType?: string;
  sortBy?: string;
}

export interface VacanciesListResult {
  data: Vacancy[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchVacancies(
  params: FetchVacanciesParams = {}
): Promise<VacanciesListResult> {
  const url = new URL(
    `${KEMNAKER_API_BASE}/maganghub/vacancy/v2/vacancies/published`
  );

  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  if (params.keyword?.trim()) {
    url.searchParams.set("keyword", params.keyword.trim());
  }
  if (params.cityId?.trim()) {
    url.searchParams.append("city_ids[]", params.cityId.trim());
  }
  if (params.studyProgramId?.trim()) {
    url.searchParams.append("study_program_ids[]", params.studyProgramId.trim());
  }
  if (params.educationLevel?.trim()) {
    url.searchParams.append("education_levels[]", params.educationLevel.trim());
  }
  if (params.organizerType?.trim()) {
    url.searchParams.set("organizable_type", params.organizerType.trim());
  }
  if (params.interviewType?.trim()) {
    url.searchParams.append("interview_types[]", params.interviewType.trim());
  }
  if (params.sortBy?.trim()) {
    url.searchParams.set("sort_by", params.sortBy.trim());
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Gagal memuat lowongan dari Kemnaker (HTTP ${res.status}). Silakan coba beberapa saat lagi.`
    );
  }

  const json = await res.json();
  const list = Array.isArray(json?.data) ? json.data : [];
  const meta = {
    current_page: Number(json?.meta?.current_page || page),
    last_page: Number(json?.meta?.last_page || 1),
    per_page: Number(json?.meta?.per_page || limit),
    total: Number(json?.meta?.total || list.length),
  };

  return { data: list, meta };
}

export async function fetchVacancyDetail(id: string): Promise<Vacancy> {
  const res = await fetch(
    `${KEMNAKER_API_BASE}/maganghub/vacancy/v2/vacancies/published/${encodeURIComponent(
      id
    )}`,
    {
      headers: { Accept: "application/json" },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Gagal memuat detail lowongan (HTTP ${res.status}). Lowongan mungkin sudah ditutup atau dihapus.`
    );
  }

  const json = await res.json();
  const item = json?.data || json;
  return item as Vacancy;
}

export async function fetchMasterData(): Promise<{
  cities: City[];
  studyPrograms: StudyProgram[];
}> {
  const [citiesRes, prodisRes] = await Promise.all([
    fetch(`${KEMNAKER_API_BASE}/maganghub/onboarding/v2/cities?limit=600`, {
      headers: { Accept: "application/json" },
    }),
    fetch(`${KEMNAKER_API_BASE}/maganghub/vacancy/v2/study-programs?limit=1000`, {
      headers: { Accept: "application/json" },
    }),
  ]);

  let cities: City[] = [];
  if (citiesRes.ok) {
    const cJson = await citiesRes.json().catch(() => null);
    if (Array.isArray(cJson?.data)) {
      cities = cJson.data.map((c: Record<string, unknown>) => ({
        id: String(c.id),
        name: String(c.name || c.city_name || "Kota Tidak Diketahui"),
        province_id: c.province_id ? String(c.province_id) : undefined,
      }));
    }
  }

  let studyPrograms: StudyProgram[] = [];
  if (prodisRes.ok) {
    const pJson = await prodisRes.json().catch(() => null);
    if (Array.isArray(pJson?.data)) {
      studyPrograms = pJson.data.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        name: String(p.name || p.study_program_name || "Program Studi"),
      }));
    }
  }

  return { cities, studyPrograms };
}
