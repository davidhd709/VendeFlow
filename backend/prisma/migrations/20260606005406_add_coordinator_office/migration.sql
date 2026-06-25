-- CreateTable
CREATE TABLE "CoordinatorOffice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinatorOffice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinatorOffice_companyId_idx" ON "CoordinatorOffice"("companyId");

-- CreateIndex
CREATE INDEX "CoordinatorOffice_officeId_idx" ON "CoordinatorOffice"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinatorOffice_coordinatorId_officeId_key" ON "CoordinatorOffice"("coordinatorId", "officeId");

-- AddForeignKey
ALTER TABLE "CoordinatorOffice" ADD CONSTRAINT "CoordinatorOffice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorOffice" ADD CONSTRAINT "CoordinatorOffice_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorOffice" ADD CONSTRAINT "CoordinatorOffice_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
