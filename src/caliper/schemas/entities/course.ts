import { z } from 'zod';
import { entitySchema, organizationSchema, dateTimeSchema } from '../base';

// CourseOffering entity
export const courseOfferingSchema = organizationSchema.extend({
  type: z.literal('CourseOffering'),
  courseNumber: z.string().optional(),
  academicSession: z.string().optional(),
  subOrganizationOf: organizationSchema.optional(),
});

// CourseSection entity  
export const courseSectionSchema = courseOfferingSchema.extend({
  type: z.literal('CourseSection'),
  category: z.string().optional(),
});

// Group entity
export const groupSchema = organizationSchema.extend({
  type: z.literal('Group'),
  subOrganizationOf: organizationSchema.optional(),
});

// CourseProgram entity
export const courseProgramSchema = organizationSchema.extend({
  type: z.literal('CourseProgram'),
  academicLevel: z.string().optional(),
  programCode: z.string().optional(),
});

// Curriculum entity
export const curriculumSchema = organizationSchema.extend({
  type: z.literal('Curriculum'),
  academicLevel: z.string().optional(),
}); 