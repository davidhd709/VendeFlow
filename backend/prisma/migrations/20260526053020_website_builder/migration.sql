-- CreateEnum
CREATE TYPE "WebsitePageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "WebsiteSectionType" AS ENUM ('HERO', 'FEATURED_PRODUCTS', 'SERVICES', 'BENEFITS', 'OFFICES', 'FAQ', 'CTA', 'CONTACT', 'FOOTER');

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "WebsitePageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedSnapshot" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "WebsiteSectionType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsitePage_companyId_idx" ON "WebsitePage"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_companyId_slug_key" ON "WebsitePage"("companyId", "slug");

-- CreateIndex
CREATE INDEX "WebsiteSection_companyId_idx" ON "WebsiteSection"("companyId");

-- CreateIndex
CREATE INDEX "WebsiteSection_pageId_order_idx" ON "WebsiteSection"("pageId", "order");

-- AddForeignKey
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSection" ADD CONSTRAINT "WebsiteSection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSection" ADD CONSTRAINT "WebsiteSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
