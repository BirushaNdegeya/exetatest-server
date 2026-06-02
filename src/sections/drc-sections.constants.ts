import drcSections from './drc-sections.json';

export interface DrcSection {
  id: string;
  title: string;
}

export const DRC_SECTIONS: readonly DrcSection[] =
  drcSections as readonly DrcSection[];
