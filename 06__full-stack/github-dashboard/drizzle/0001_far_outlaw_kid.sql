ALTER TABLE "repositories" ALTER COLUMN "github_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "stars" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "forks" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "open_issues" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "owner_avatar" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "full_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "private" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "visibility" varchar(50);--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "default_branch" varchar(100);--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "license" varchar(255);--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "homepage" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "watchers" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "size" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "disabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "has_issues" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "has_projects" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "has_wiki" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "pushed_at" timestamp;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "synced_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;