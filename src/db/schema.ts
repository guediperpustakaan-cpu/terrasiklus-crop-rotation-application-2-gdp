import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * TerraSiklus — skema basis data (PostgreSQL / Neon).
 * Menggunakan Drizzle ORM sebagai lapisan akses data.
 */

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("profiles_username_key").on(table.username)],
);

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plantFamilies = pgTable(
  "plant_families",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    localName: text("local_name"),
    isNitrogenFixer: boolean("is_nitrogen_fixer").notNull().default(false),
    notes: text("notes"),
  },
  (table) => [uniqueIndex("plant_families_name_key").on(table.name)],
);

export const plots = pgTable("plots", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  area: doublePrecision("area").notNull().default(0),
  areaUnit: text("area_unit").notNull().default("m2"),
  soilType: text("soil_type").notNull().default("lempung"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  commonName: text("common_name").notNull(),
  familyId: integer("family_id")
    .notNull()
    .references(() => plantFamilies.id, { onDelete: "cascade" }),
  nutrientDemand: text("nutrient_demand").notNull().default("sedang"),
  growthDays: integer("growth_days").notNull().default(90),
  idealPhMin: doublePrecision("ideal_ph_min").notNull().default(5.5),
  idealPhMax: doublePrecision("ideal_ph_max").notNull().default(7.0),
  notes: text("notes"),
});

export const plantings = pgTable("plantings", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id")
    .notNull()
    .references(() => plots.id, { onDelete: "cascade" }),
  cropId: integer("crop_id")
    .notNull()
    .references(() => crops.id, { onDelete: "cascade" }),
  plantedOn: date("planted_on", { mode: "string" }).notNull(),
  harvestedOn: date("harvested_on", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const soilTests = pgTable("soil_tests", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id")
    .notNull()
    .references(() => plots.id, { onDelete: "cascade" }),
  testedOn: date("tested_on", { mode: "string" }).notNull(),
  ph: doublePrecision("ph").notNull(),
  n: doublePrecision("n").notNull(),
  p: doublePrecision("p").notNull(),
  k: doublePrecision("k").notNull(),
  organicMatter: doublePrecision("organic_matter").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProfileRow = typeof profiles.$inferSelect;
export type FarmRow = typeof farms.$inferSelect;
export type PlotRow = typeof plots.$inferSelect;
export type PlantFamilyRow = typeof plantFamilies.$inferSelect;
export type CropRow = typeof crops.$inferSelect;
export type PlantingRow = typeof plantings.$inferSelect;
export type SoilTestRow = typeof soilTests.$inferSelect;
