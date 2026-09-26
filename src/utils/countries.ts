const COUNTRY_CODES = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT",
  "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT",
  "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "KH", "CM",
  "CA", "CV", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CR",
  "CI", "HR", "CU", "CY", "CZ", "CD", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI",
  "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN",
  "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IR", "IQ",
  "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW",
  "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU",
  "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX",
  "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA", "NR",
  "NP", "NL", "NZ", "NI", "NE", "NG", "KP", "MK", "NO", "OM",
  "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT",
  "QA", "RO", "RU", "RW", "KN", "LC", "VC", "WS", "SM", "ST",
  "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO",
  "ZA", "KR", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY",
  "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR",
  "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU",
  "VA", "VE", "VN", "YE", "ZM", "ZW",
] as const;

function resolveCountryName(code: string) {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return name || code;
  } catch {
    return code;
  }
}

export const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  code,
  name: resolveCountryName(code),
})).sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_NAME_BY_CODE = new Map(
  COUNTRY_OPTIONS.map((country) => [country.code, country.name]),
);

export function getCountryName(code?: string | null) {
  if (!code || typeof code !== "string") return "";
  const normalized = code.trim().toUpperCase();
  if (!normalized) return "";
  return COUNTRY_NAME_BY_CODE.get(normalized) ?? normalized;
}
