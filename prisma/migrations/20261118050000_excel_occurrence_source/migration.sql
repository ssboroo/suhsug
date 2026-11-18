ALTER TABLE "LotteryTransaction"
  ADD COLUMN "sourceFileHash" TEXT,
  ADD COLUMN "sourceSheet" TEXT,
  ADD COLUMN "sourceRow" INTEGER;

ALTER TABLE "ImportBatch"
  ADD COLUMN "fileHash" TEXT,
  ADD COLUMN "sheetName" TEXT;

-- New business rule: one imported source row is exactly one lottery right.
-- This normalizes existing retained rows without deleting any records.
UPDATE "LotteryTransaction" SET "ticketCount" = 1 WHERE "ticketCount" <> 1;

CREATE UNIQUE INDEX "LotteryTransaction_campaignId_sourceFileHash_sourceSheet_sourceRow_key"
  ON "LotteryTransaction"("campaignId", "sourceFileHash", "sourceSheet", "sourceRow");

CREATE INDEX "ImportBatch_campaignId_fileHash_sheetName_idx"
  ON "ImportBatch"("campaignId", "fileHash", "sheetName");
