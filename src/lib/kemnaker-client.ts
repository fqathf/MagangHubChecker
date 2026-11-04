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
  const cookieMatch = trimmed.match(
    /naco_access_token=([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/i
  );
  if (cookieMatch?.[1]) return cookieMatch[1].trim();

  // If user pasted JSON string containing "accessToken"
  const jsonMatch = trimmed.match(/"accessToken"\s*:\s*"([^"]+)"/);
  if (jsonMatch?.[1]) return jsonMatch[1].trim();

  // If user pasted "Bearer eyJ..."
  const bearerMatch = trimmed.match(
    /Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/i
  );
  if (bearerMatch?.[1]) return bearerMatch[1].trim();

  // If user pasted pure JWT token "eyJ..."
  const jwtMatch = trimmed.match(
    /([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/
  );
  if (jwtMatch?.[1]) return jwtMatch[1].trim();

  return trimmed
    .replace(/^Bearer\s+/i, "")
    .replace(/["';]/g, "")
    .trim();
}

export interface SiapkerjaSessionResult {
  token: string;
  participant: ParticipantProfile | null;
  applications: EnrichedApplication[];
  syncedAt: string;
}

export async function fetchSiapkerjaSession(
  rawInputToken: string
): Promise<SiapkerjaSessionResult> {
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
  // Multi-select support
  cityIds?: string[];
  cityId?: string;
  studyProgramIds?: string[];
  studyProgramId?: string;
  educationLevels?: string[];
  educationLevel?: string;
  interviewTypes?: string[];
  interviewType?: string;
  isDisabilityFriendly?: boolean;
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

  // Multi-select Cities
  const combinedCityIds = new Set<string>();
  if (params.cityId?.trim()) combinedCityIds.add(params.cityId.trim());
  if (params.cityIds && Array.isArray(params.cityIds)) {
    params.cityIds.forEach((id) => {
      if (id?.trim()) combinedCityIds.add(id.trim());
    });
  }
  combinedCityIds.forEach((id) => {
    url.searchParams.append("city_ids[]", id);
  });

  // Multi-select Study Programs
  const combinedProdiIds = new Set<string>();
  if (params.studyProgramId?.trim()) combinedProdiIds.add(params.studyProgramId.trim());
  if (params.studyProgramIds && Array.isArray(params.studyProgramIds)) {
    params.studyProgramIds.forEach((id) => {
      if (id?.trim()) combinedProdiIds.add(id.trim());
    });
  }
  combinedProdiIds.forEach((id) => {
    url.searchParams.append("study_program_ids[]", id);
  });

  // Multi-select Education Levels
  const combinedEduLevels = new Set<string>();
  if (params.educationLevel?.trim()) combinedEduLevels.add(params.educationLevel.trim());
  if (params.educationLevels && Array.isArray(params.educationLevels)) {
    params.educationLevels.forEach((edu) => {
      if (edu?.trim()) combinedEduLevels.add(edu.trim());
    });
  }
  combinedEduLevels.forEach((edu) => {
    url.searchParams.append("education_levels[]", edu);
  });

  // Multi-select Interview Types
  const combinedInterviewTypes = new Set<string>();
  if (params.interviewType?.trim()) combinedInterviewTypes.add(params.interviewType.trim());
  if (params.interviewTypes && Array.isArray(params.interviewTypes)) {
    params.interviewTypes.forEach((it) => {
      if (it?.trim()) combinedInterviewTypes.add(it.trim());
    });
  }
  combinedInterviewTypes.forEach((it) => {
    url.searchParams.append("interview_types[]", it);
  });

  // Disability Friendly
  if (params.isDisabilityFriendly) {
    url.searchParams.set("is_disability_friendly", "1");
  }

  // Sort By
  if (params.sortBy?.trim()) {
    url.searchParams.set("sort_by", params.sortBy.trim());
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const failMessage = errorJson?.fails
      ? Object.values(errorJson.fails).flat().join(", ")
      : null;
    throw new Error(
      failMessage ||
        errorJson?.message ||
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

const MASTER_CACHE_KEY = "mhc_master_cache_v2";

export async function fetchMasterData(): Promise<{
  cities: City[];
  studyPrograms: StudyProgram[];
}> {
  // Check localStorage cache first
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(MASTER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          Array.isArray(parsed?.cities) &&
          parsed.cities.length > 0 &&
          Array.isArray(parsed?.studyPrograms) &&
          parsed.studyPrograms.length > 0 &&
          Date.now() - (parsed?.timestamp || 0) < 1000 * 60 * 60 * 24 // 24 hours
        ) {
          return {
            cities: parsed.cities,
            studyPrograms: parsed.studyPrograms,
          };
        }
      }
    } catch {}
  }

  // Fetch cities (Kemnaker supports up to limit=600 for cities)
  // Fetch prodi page 1 with safe limit=100 (Kemnaker rejects limit > 100 with 422)
  const [citiesRes, prodiP1Res] = await Promise.all([
    fetch(`${KEMNAKER_API_BASE}/maganghub/onboarding/v2/cities?limit=600`, {
      headers: { Accept: "application/json" },
    }),
    fetch(
      `${KEMNAKER_API_BASE}/maganghub/vacancy/v2/study-programs?limit=100&page=1`,
      {
        headers: { Accept: "application/json" },
      }
    ),
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
      cities.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
    }
  }

  let studyPrograms: StudyProgram[] = [];
  if (prodiP1Res.ok) {
    const p1Json = await prodiP1Res.json().catch(() => null);
    const p1Data = Array.isArray(p1Json?.data) ? p1Json.data : [];
    const lastPage = Math.min(Number(p1Json?.meta?.last_page || 1), 20);

    const remainingPromises: Promise<Record<string, unknown>[]>[] = [];
    for (let p = 2; p <= lastPage; p++) {
      remainingPromises.push(
        fetch(
          `${KEMNAKER_API_BASE}/maganghub/vacancy/v2/study-programs?limit=100&page=${p}`,
          { headers: { Accept: "application/json" } }
        )
          .then((r) => r.json())
          .then((j) => (Array.isArray(j?.data) ? j.data : []))
          .catch(() => [])
      );
    }

    const remainingPages = await Promise.all(remainingPromises);
    const combinedRaw = [...p1Data, ...remainingPages.flat()];

    studyPrograms = combinedRaw.map((p) => ({
      id: String(p.id),
      name: String(p.name || p.study_program_name || "Program Studi"),
    }));
    studyPrograms.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
  }

  // Cache to localStorage
  if (typeof window !== "undefined" && cities.length > 0 && studyPrograms.length > 0) {
    try {
      localStorage.setItem(
        MASTER_CACHE_KEY,
        JSON.stringify({
          cities,
          studyPrograms,
          timestamp: Date.now(),
        })
      );
    } catch {}
  }

  return { cities, studyPrograms };
}

export async function searchStudyPrograms(keyword: string): Promise<StudyProgram[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const res = await fetch(
    `${KEMNAKER_API_BASE}/maganghub/vacancy/v2/study-programs?limit=50&keyword=${encodeURIComponent(
      trimmed
    )}`,
    {
      headers: { Accept: "application/json" },
    }
  );

  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((p: Record<string, unknown>) => ({
    id: String(p.id),
    name: String(p.name || p.study_program_name || "Program Studi"),
  }));
}
