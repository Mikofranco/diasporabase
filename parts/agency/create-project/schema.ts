import { z } from "zod";
import { CATEGORIES, MIN_DESCRIPTION_WORDS } from "./types";

export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter((w) => w.length > 0).length;

const milestoneSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  due_date: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid due date"),
  status: z.enum(["Done", "Pending", "In Progress", "Cancelled"]),
});

const deliverableSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  due_date: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid due date"),
  status: z.enum(["Done", "Pending", "In Progress", "Cancelled"]),
  milestone_id: z.string().optional(),
});

export const baseProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .max(5000)
    .refine(
      (val) => countWords(val) >= MIN_DESCRIPTION_WORDS,
      `Description must be at least ${MIN_DESCRIPTION_WORDS} words`,
    ),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  lga: z.string().optional(),
  start_date: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid start date")
    .refine((v) => new Date(v) >= new Date(), "Start date must be today or later"),
  end_date: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid end date"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  required_skills: z.array(z.string()).min(1, "At least one skill is required"),
  milestones: z.array(milestoneSchema).optional().default([]),
  deliverables: z.array(deliverableSchema).optional().default([]),
});

const startDateEdit = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), "Invalid start date");

export const projectSchema = baseProjectSchema.refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: "End date must be after start date", path: ["end_date"] },
);

/** Use when editing existing project (allows past start date). */
export const projectSchemaForEdit = baseProjectSchema
  .extend({ start_date: startDateEdit })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    { message: "End date must be after start date", path: ["end_date"] },
  );

export const stepSchemas = {
  1: z.object({
    title: baseProjectSchema.shape.title,
    description: baseProjectSchema.shape.description,
  }),
  2: z
    .object({
      country: baseProjectSchema.shape.country,
      start_date: baseProjectSchema.shape.start_date,
      end_date: baseProjectSchema.shape.end_date,
    })
    .refine(
      (data) =>
        new Date(data.end_date as string) >= new Date(data.start_date as string),
      { message: "End date must be after start date", path: ["end_date"] },
    ),
  3: z.object({
    category: baseProjectSchema.shape.category,
    required_skills: baseProjectSchema.shape.required_skills,
  }),
  4: z.object({}),
} as const;

/** Step 2 schema for edit mode (allows past start date). */
export const step2SchemaForEdit = z
  .object({
    country: baseProjectSchema.shape.country,
    start_date: startDateEdit,
    end_date: baseProjectSchema.shape.end_date,
  })
  .refine(
    (data) =>
      new Date(data.end_date as string) >= new Date(data.start_date as string),
    { message: "End date must be after start date", path: ["end_date"] },
  );
