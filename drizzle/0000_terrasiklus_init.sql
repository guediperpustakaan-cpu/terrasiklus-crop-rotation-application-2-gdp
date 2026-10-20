CREATE TABLE "crops" (
	"id" serial PRIMARY KEY NOT NULL,
	"common_name" text NOT NULL,
	"family_id" integer NOT NULL,
	"nutrient_demand" text DEFAULT 'sedang' NOT NULL,
	"growth_days" integer DEFAULT 90 NOT NULL,
	"ideal_ph_min" double precision DEFAULT 5.5 NOT NULL,
	"ideal_ph_max" double precision DEFAULT 7 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_families" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"local_name" text,
	"is_nitrogen_fixer" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" serial PRIMARY KEY NOT NULL,
	"plot_id" integer NOT NULL,
	"crop_id" integer NOT NULL,
	"planted_on" date NOT NULL,
	"harvested_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"name" text NOT NULL,
	"area" double precision DEFAULT 0 NOT NULL,
	"area_unit" text DEFAULT 'm2' NOT NULL,
	"soil_type" text DEFAULT 'lempung' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soil_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"plot_id" integer NOT NULL,
	"tested_on" date NOT NULL,
	"ph" double precision NOT NULL,
	"n" double precision NOT NULL,
	"p" double precision NOT NULL,
	"k" double precision NOT NULL,
	"organic_matter" double precision NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_family_id_plant_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."plant_families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_tests" ADD CONSTRAINT "soil_tests_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plant_families_name_key" ON "plant_families" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles" USING btree ("username");