import { z } from 'zod';
import { entitySchema } from '../base';

// Query entity - represents a search query
export const querySchema = entitySchema.extend({
  type: z.literal('Query'),
  searchTerms: z.string().optional(),
  searchTarget: entitySchema.optional(),
});

// SearchResponse entity
export const searchResponseSchema = entitySchema.extend({
  type: z.literal('SearchResponse'),
  searchResultsCount: z.number().optional(),
  query: querySchema.optional(),
}); 