/**
 * Match profiles.section (legacy free text) to a catalog section for backfill and practice.
 */

export type SectionLike = { id: string; title: string };

export function normalizeSectionKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function compactKey(value: string): string {
  return normalizeSectionKey(value).replace(/\s/g, '');
}

/**
 * Resolves legacy label to exactly one section when possible (exact / compact-unique / unique substring).
 */
export function findSectionMatchingLegacyLabel(
  legacyRaw: string | null | undefined,
  sections: SectionLike[],
): SectionLike | null {
  const legacy = legacyRaw?.trim();
  if (!legacy || sections.length === 0) {
    return null;
  }

  const idMatch = sections.find((s) => s.id === legacy);
  if (idMatch) {
    return idMatch;
  }

  const n = normalizeSectionKey(legacy);
  const exact = sections.find((s) => normalizeSectionKey(s.title) === n);
  if (exact) {
    return exact;
  }

  const compactLegacy = compactKey(legacy);
  const compactHits = sections.filter(
    (s) => compactKey(s.title) === compactLegacy,
  );
  if (compactHits.length === 1) {
    return compactHits[0];
  }

  const subHits = sections.filter((s) => {
    const sn = normalizeSectionKey(s.title);
    return sn.includes(n) || n.includes(sn);
  });
  if (subHits.length === 1) {
    return subHits[0];
  }

  return null;
}
