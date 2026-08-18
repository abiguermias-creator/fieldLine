-- AddForeignKey
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
