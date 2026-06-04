export const EXAM_CATEGORY_CODES = [
  'cg',
  'sc',
  'co',
  'la',
  'di',
  'jof',
  'jo',
  'joa',
] as const;

export type ExamCategoryCode = (typeof EXAM_CATEGORY_CODES)[number];

/** Short codes sent by the mobile app (e.g. `?category=cg`). */
export const EXAM_CATEGORY_CODE_LABELS: Record<ExamCategoryCode, string> = {
  cg: 'Culture generale',
  sc: 'Sciences',
  co: "Cours d'options",
  la: 'Langues',
  di: 'Dissertation',
  jof: 'Jury Oral Français',
  jo: 'Jury Oral',
  joa: 'Jury Oral Anglais',
};

/** Case-insensitive name fragments used to resolve DB category rows. */
export const EXAM_CATEGORY_NAME_FRAGMENTS: Record<ExamCategoryCode, string[]> =
  {
    cg: ['culture generale', 'culture générale'],
    sc: ['sciences'],
    co: ["cours d'options", 'cours d options'],
    la: ['langues'],
    di: ['dissertation'],
    jof: ['jury oral français', 'jury oral francais', 'jurry oral francais'],
    jo: ['jury oral'],
    joa: ['jury oral anglais', 'jurry oral anglais'],
  };

export const EXAM_CATEGORY_DEFAULT_LIMITS: Record<ExamCategoryCode, number> = {
  cg: 5,
  sc: 5,
  co: 5,
  la: 0,
  di: 1,
  jof: 5,
  jo: 5,
  joa: 5,
};

export function isExamCategoryCode(value: string): value is ExamCategoryCode {
  return (EXAM_CATEGORY_CODES as readonly string[]).includes(value);
}
