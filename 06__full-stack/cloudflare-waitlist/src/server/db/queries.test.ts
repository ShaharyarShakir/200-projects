import { beforeEach, expect, it, mock } from "bun:test";
import { insertSubscriber } from "./queries";
import type { D1Database } from "@cloudflare/workers-types";
import type { NewSubscriber } from "./schema";
import { getTestDB } from "../../../test/get-test-db";
import * as schema from "./schema"
import { reset } from "drizzle-seed"
mock.module('./db.ts', () => {
    return {
        getDB: () => getTestDB()
    }
})
beforeEach(async () => {
    const db = getTestDB()
    await reset(db, schema)
})
it("insert subscriber into the databse ", async () => {
    const newSub: NewSubscriber = { email: "test@test.com" }
    const subscriber = await insertSubscriber({} as D1Database, newSub)
    console.log(subscriber);
    expect(subscriber.email).toBe(newSub.email)
    expect(subscriber.id).toBeDefined(),
        expect(subscriber.createdAt).toBeDefined()

})


it("throw Error when inserting a new email", async () => {
    const newSub: NewSubscriber = { email: "test@test.com" }
    await insertSubscriber({} as D1Database, newSub)
    expect(insertSubscriber({} as D1Database, newSub)).rejects.toThrow()
})
it("throws an error when trying to insert an invalid email", async () => {
    const newSub: NewSubscriber = { email: "test@test" };
    expect(insertSubscriber({} as D1Database, newSub)).rejects.toThrow();
});