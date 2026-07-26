import type { DesignNotes } from '@sds/shared/src/index';

export function createEmptyDesignNotes(): DesignNotes {
  return {
    functionalRequirements: [],
    nonFunctionalRequirements: {
      availability: '',
      latency: '',
      scale: '',
      consistency: '',
      durability: '',
    },
    apiEndpoints: [],
    dataModel: '',
    tradeOffs: '',
  };
}

export function normalizeDesignNotes(notes?: DesignNotes): DesignNotes {
  if (!notes) return createEmptyDesignNotes();

  return {
    functionalRequirements: notes.functionalRequirements ?? [],
    nonFunctionalRequirements: {
      ...createEmptyDesignNotes().nonFunctionalRequirements,
      ...notes.nonFunctionalRequirements,
    },
    apiEndpoints: notes.apiEndpoints ?? [],
    dataModel: notes.dataModel ?? '',
    tradeOffs: notes.tradeOffs ?? '',
  };
}
