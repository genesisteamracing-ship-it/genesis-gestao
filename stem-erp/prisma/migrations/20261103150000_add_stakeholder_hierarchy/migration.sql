-- AlterTable: Add optional parentStakeholderId for hierarchical Organization Map
ALTER TABLE IF EXISTS "Stakeholder"
ADD COLUMN IF NOT EXISTS "parentStakeholderId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Stakeholder_teamId_organization_idx" ON "Stakeholder"("teamId", "organization");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Stakeholder_teamId_parentStakeholderId_idx" ON "Stakeholder"("teamId", "parentStakeholderId");

-- AddForeignKey (Idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Stakeholder')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Stakeholder_parentStakeholderId_fkey') THEN
    ALTER TABLE "Stakeholder"
    ADD CONSTRAINT "Stakeholder_parentStakeholderId_fkey"
    FOREIGN KEY ("parentStakeholderId") REFERENCES "Stakeholder"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
