import z from "zod";

export const level = z.object({
  rank: z.number(),
});

export const meaning = z.object({
  partOfSpeech: z.string(),
  definition: z.string(),
  example: z.string(),
  note: z.string(),
  synonyms: z.string().array(),
});

export type Meaning = z.infer<typeof meaning>;

export const entry = z.object({
  word: z.string(),
  level: level,
  phonetics: z.object({
    simplified: z.string(),
  }),
  wordFamily: z.string().array(),
  meanings: meaning.array(),
});

export type Entry = z.infer<typeof entry>;
