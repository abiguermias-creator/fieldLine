-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "agreed_date" TIMESTAMPTZ(6),
ADD COLUMN     "sla_resolve_by" TIMESTAMPTZ(6),
ADD COLUMN     "sla_respond_by" TIMESTAMPTZ(6);
