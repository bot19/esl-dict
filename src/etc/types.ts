import { models } from "./models";

export type ModelId = keyof typeof models;
export type ProviderId = (typeof models)[keyof typeof models]["provider"];
