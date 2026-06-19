-- CreateTable
CREATE TABLE "HQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "size" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "numberPlate" TEXT,
    "condition" TEXT NOT NULL,
    "recoveredLocation" TEXT NOT NULL,
    "recoveryTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT NOT NULL,
    "holdingLocationId" TEXT NOT NULL,
    "returnedToName" TEXT,
    "returnedToCnic" TEXT,
    "returnedToContact" TEXT,
    "returnedAt" DATETIME,
    CONSTRAINT "Item_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "HQ" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_holdingLocationId_fkey" FOREIGN KEY ("holdingLocationId") REFERENCES "HQ" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "emailOrCnic" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "proofPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Claim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HQ_name_key" ON "HQ"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HQ_username_key" ON "HQ"("username");
