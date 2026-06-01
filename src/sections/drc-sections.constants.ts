import { normalizeSectionKey } from './section-legacy-match.util';

export interface DrcSection {
  id: string;
  title: string;
}

/** Stable slug used as `section_id` on profiles and subjects. */
export function buildSectionId(title: string): string {
  return normalizeSectionKey(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DRC_SECTION_TITLES = [
  'LATIN – PHILO',
  'LATIN – LANGUE',
  'LATIN – SCIENTIFIQUE',
  'LATIN – MATHÉMATIQUE',
  'SCIENTIFIQUE',
  'MATHÉMATIQUE',
  'ÉCONOMIQUE',
  'SOCIALE',
  'COMMERCIALE ET GESTION',
  'SOCIALE ET ADMINISTRATION',
  'ÉLECTRICITÉ',
  'MÉCANIQUE GÉNÉRALE',
  'MÉCANIQUE AUTO',
  'MÉCANIQUE DESSIN',
  'ÉLECTRONIQUE',
  'CONSTRUCTION',
  'CHIMIE',
  'INFORMATIQUE',
  'ARTS PLASTIQUES',
  'COUPE COUTURE',
  'ARTS DRAMATIQUES',
  'ESTHÉTIQUE ET COIFFURE',
  'HÔTELLERIE ET RESTAURATION',
  'TOURISME',
  "HÔTESSE D'ACCUEIL",
  'AGRICULTURE GÉNÉRALE',
  'VÉTÉRINAIRE',
  'AGRONOMIE',
  'INDUSTRIES AGRICOLES',
  'PÊCHE ET NAVIGATION',
] as const;

export const DRC_SECTIONS: readonly DrcSection[] = DRC_SECTION_TITLES.map(
  (title) => ({
    id: buildSectionId(title),
    title,
  }),
);
