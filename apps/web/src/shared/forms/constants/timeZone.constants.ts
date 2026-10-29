export const UTC_TIME_ZONE = 'UTC';

export const EXTRA_TIME_ZONES: readonly string[] = [UTC_TIME_ZONE];

export const RENAMED_TIME_ZONES: Readonly<Record<string, string>> = {
  'Europe/Kiev': 'Europe/Kyiv',
};

export const EXCLUDED_TIME_ZONES: ReadonlySet<string> = new Set([
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
