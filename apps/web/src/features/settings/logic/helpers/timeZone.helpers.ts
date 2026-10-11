const EXTRA_TIME_ZONES: readonly string[] = ['UTC'];

const RENAMED_TIME_ZONES: Readonly<Record<string, string>> = {
  'Europe/Kiev': 'Europe/Kyiv',
};

const EXCLUDED_TIME_ZONES: ReadonlySet<string> = new Set([
  'Asia/Anadyr',
  'Asia/Barnaul',
  'Asia/Chita',
  'Asia/Irkutsk',
  'Asia/Kamchatka',
  'Asia/Khandyga',
  'Asia/Krasnoyarsk',
  'Asia/Magadan',
  'Asia/Novokuznetsk',
  'Asia/Novosibirsk',
  'Asia/Omsk',
  'Asia/Sakhalin',
  'Asia/Srednekolymsk',
  'Asia/Tomsk',
  'Asia/Ust-Nera',
  'Asia/Vladivostok',
  'Asia/Yakutsk',
  'Asia/Yekaterinburg',
  'Europe/Astrakhan',
  'Europe/Kaliningrad',
  'Europe/Kirov',
  'Europe/Moscow',
  'Europe/Samara',
  'Europe/Saratov',
  'Europe/Ulyanovsk',
  'Europe/Volgograd',
]);

export const canonicalTimeZone = (timeZone: string): string =>
  RENAMED_TIME_ZONES[timeZone] ?? timeZone;

export const supportedTimeZones = (): readonly string[] => {
  const zones = new Set<string>(EXTRA_TIME_ZONES);
  for (const timeZone of Intl.supportedValuesOf('timeZone')) {
    const canonical = canonicalTimeZone(timeZone);
    if (!EXCLUDED_TIME_ZONES.has(canonical)) {
      zones.add(canonical);
    }
  }
  return [...zones];
};

export const timeZoneChoices = (current: string): readonly string[] => {
  const canonical = canonicalTimeZone(current);
  const zones = supportedTimeZones();
  return canonical === '' || zones.includes(canonical) ? zones : [canonical, ...zones];
};
