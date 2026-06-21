// Seed script: creates 4 police HQs, one login per HQ, and sample lost items.
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HQS = [
  { name: "Lahore HQ", city: "Lahore", username: "lahore.hq", password: "lahore123" },
  { name: "Karachi HQ", city: "Karachi", username: "karachi.hq", password: "karachi123" },
  { name: "Islamabad HQ", city: "Islamabad", username: "islamabad.hq", password: "islamabad123" },
  { name: "Peshawar HQ", city: "Peshawar", username: "peshawar.hq", password: "peshawar123" },
];

async function main() {
  console.log("Seeding database...");

  const hqRecords = {};

  for (const hq of HQS) {
    const createdHq = await prisma.hQ.upsert({
      where: { name: hq.name },
      update: {},
      create: { name: hq.name, city: hq.city },
    });
    hqRecords[hq.name] = createdHq;

    const passwordHash = await bcrypt.hash(hq.password, 10);
    await prisma.policeUser.upsert({
      where: { username: hq.username },
      update: {},
      create: {
        username: hq.username,
        passwordHash,
        hqId: createdHq.id,
      },
    });

    console.log(`  Created HQ "${hq.name}" with login ${hq.username} / ${hq.password}`);
  }

  const lahore = hqRecords["Lahore HQ"];
  const karachi = hqRecords["Karachi HQ"];
  const islamabad = hqRecords["Islamabad HQ"];
  const peshawar = hqRecords["Peshawar HQ"];

  const items = [
    {
      category: "ELECTRONICS",
      size: "Small (approx 15x7cm)",
      weight: "180 g",
      color: "Black",
      description:
        "Samsung Galaxy smartphone with a cracked top-left corner of the screen. Found powered off. Has a blue silicone case.",
      numberPlate: null,
      condition: "FAIR",
      recoveredFrom: "Liberty Market parking area",
      recoveryTime: new Date("2026-05-02T11:30:00"),
      recoveryPlace: "Liberty Market, Gulberg",
      holdingHqId: lahore.id,
      loggedByHqId: lahore.id,
    },
    {
      category: "VEHICLE",
      size: "Medium (motorcycle)",
      weight: "110 kg",
      color: "Red",
      description:
        "Honda CD 70 motorcycle, found unattended for over 48 hours. Minor scratches on the fuel tank. Ignition key missing.",
      numberPlate: "LEA-19-4471",
      condition: "GOOD",
      recoveredFrom: "Outside Anarkali Bazaar",
      recoveryTime: new Date("2026-05-10T09:15:00"),
      recoveryPlace: "Anarkali Bazaar, Lahore",
      holdingHqId: lahore.id,
      loggedByHqId: lahore.id,
    },
    {
      category: "DOCUMENTS",
      size: "A4 envelope",
      weight: "50 g",
      color: "Brown",
      description:
        "Brown envelope containing a CNIC, a driving license, and two bank cheque books, all under the same name. Found inside a rickshaw.",
      numberPlate: null,
      condition: "GOOD",
      recoveredFrom: "Rickshaw, Saddar area",
      recoveryTime: new Date("2026-05-14T16:45:00"),
      recoveryPlace: "Saddar, Karachi",
      holdingHqId: karachi.id,
      loggedByHqId: karachi.id,
    },
    {
      category: "JEWELRY",
      size: "Small",
      weight: "12 g",
      color: "Gold",
      description:
        "Gold-colored bangle set (3 pieces) with a small floral engraving. Found wrapped in tissue paper inside a shopping bag.",
      numberPlate: null,
      condition: "NEW",
      recoveredFrom: "Dolmen Mall food court",
      recoveryTime: new Date("2026-05-20T19:00:00"),
      recoveryPlace: "Dolmen Mall, Clifton, Karachi",
      holdingHqId: karachi.id,
      loggedByHqId: karachi.id,
    },
    {
      category: "BAGS_WALLETS",
      size: "Medium backpack",
      weight: "1.4 kg",
      color: "Navy blue",
      description:
        "Navy blue laptop backpack containing a charger, a notebook, and a pair of earphones. No laptop inside. Outer pocket has a small tear.",
      numberPlate: null,
      condition: "FAIR",
      recoveredFrom: "Metro bus stop, Faizabad",
      recoveryTime: new Date("2026-05-25T08:20:00"),
      recoveryPlace: "Faizabad Interchange, Islamabad",
      holdingHqId: islamabad.id,
      loggedByHqId: islamabad.id,
    },
    {
      category: "KEYS",
      size: "Small keyring",
      weight: "80 g",
      color: "Silver",
      description:
        "Set of 4 keys on a silver keyring with a small leather Toyota-branded fob attached. Likely car and house keys.",
      numberPlate: null,
      condition: "GOOD",
      recoveredFrom: "Near Saddar bus terminal",
      recoveryTime: new Date("2026-06-01T13:10:00"),
      recoveryPlace: "Saddar, Peshawar",
      holdingHqId: peshawar.id,
      loggedByHqId: peshawar.id,
    },
  ];

  for (const item of items) {
    await prisma.item.create({ data: item });
  }

  console.log(`  Created ${items.length} sample items.`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
