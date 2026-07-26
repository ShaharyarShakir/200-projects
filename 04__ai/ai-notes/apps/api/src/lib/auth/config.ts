import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, user, session, account, verification } from "@repo/database";

export const authConfig = {
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  trustedOrigins: ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
};
