import { z } from 'zod';
import { entitySchema, agentSchema } from '../base';

// LearningObjective entity
export const learningObjectiveSchema = entitySchema.extend({
  type: z.literal('LearningObjective'),
});

// Outcome entity  
export const outcomeSchema = entitySchema.extend({
  type: z.literal('Outcome'),
  achievedLevel: z.string().optional(),
  normalScore: z.number().optional(),
  penaltyScore: z.number().optional(),
  extraCreditScore: z.number().optional(),
  totalScore: z.number().optional(),
  curvedTotalScore: z.number().optional(),
  curveFactor: z.number().optional(),
  comment: z.string().optional(),
  scoredBy: agentSchema.optional(),
}); 