/*
  Warnings:

  - You are about to drop the column `decription` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "decription",
ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "event_invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
