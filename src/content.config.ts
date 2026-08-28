import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    source: z.string().optional(),
    status: z.enum(["learning", "done"]).default("learning"),
  }),
});

export const collections = { notes };
