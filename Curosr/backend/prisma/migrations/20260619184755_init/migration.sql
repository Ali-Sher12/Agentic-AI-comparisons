-- CreateTable
CREATE TABLE "PoliceHQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LostItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "numberPlate" TEXT,
    "conditionFoundIn" TEXT NOT NULL,
    "recoveredFromLocation" TEXT NOT NULL,
    "recoveryTimeAndPlace" TEXT NOT NULL,
    "holdingLocation" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedToOwner" BOOLEAN NOT NULL DEFAULT false,
    "returnedTo" TEXT,
    "returnedAt" DATETIME,
    "loggedByHQId" INTEGER NOT NULL,
    CONSTRAINT "LostItem_loggedByHQId_fkey" FOREIGN KEY ("loggedByHQId") REFERENCES "PoliceHQ" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "proofDocumentPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedByHQId" INTEGER,
    CONSTRAINT "Claim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LostItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PoliceHQ_name_key" ON "PoliceHQ"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceHQ_username_key" ON "PoliceHQ"("username");
