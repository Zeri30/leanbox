import data from "@/lib/data/ph-locations.json";

export interface PhProvince {
  code: string;
  name: string;
}

export interface PhCity {
  name: string;
  /** PSGC province code this city/municipality belongs to. */
  province: string;
}

/** Philippine provinces (PSGC), name-sorted. Bundled locally — no external API. */
export const PH_PROVINCES = data.provinces as PhProvince[];

/** Philippine cities / municipalities (PSGC), name-sorted. */
export const PH_CITIES = data.cities as PhCity[];

/** Cities/municipalities within a province (by PSGC province code). */
export function citiesForProvince(provinceCode: string): PhCity[] {
  return PH_CITIES.filter((c) => c.province === provinceCode);
}

/** Look up a province by its display name (e.g. to seed an edit form). */
export function provinceByName(name: string | null | undefined): PhProvince | undefined {
  if (!name) return undefined;
  return PH_PROVINCES.find((p) => p.name.toLowerCase() === name.toLowerCase());
}
