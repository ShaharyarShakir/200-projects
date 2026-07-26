import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@repo/database";

export const authConfig = {
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true
    }
};
