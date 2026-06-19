import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hqs = [
  { name: 'Lahore HQ', username: 'lahore_police', password: 'lahore123' },
  { name: 'Karachi HQ', username: 'karachi_police', password: 'karachi123' },
  { name: 'Islamabad HQ', username: 'islamabad_police', password: 'islamabad123' },
  { name: 'Peshawar HQ', username: 'peshawar_police', password: 'peshawar123' },
];

const sampleItems = [
  {
    size: 'Medium',
    weight: '1.2 kg',
    color: 'Black',
    detailedDescription: 'Samsung Galaxy S23 smartphone in black silicone case, screen cracked on bottom-right corner',
    numberPlate: null,
    conditionFoundIn: 'Good — functional with minor screen damage',
    recoveredFromLocation: 'Liberty Market, Gulberg III, Lahore',
    recoveryTimeAndPlace: '2026-03-15, 14:30 at Liberty Market food court',
    holdingLocation: 'Lahore HQ',
    loggedByHQ: 'Lahore HQ',
  },
  {
    size: 'Large',
    weight: '850 kg',
    color: 'White',
    detailedDescription: '2020 Honda CD 70 motorcycle, white body with red seat cover, slight rust on exhaust pipe',
    numberPlate: 'LEA-4521',
    conditionFoundIn: 'Fair — runs but needs servicing',
    recoveredFromLocation: 'Ferozepur Road near Kalma Chowk, Lahore',
    recoveryTimeAndPlace: '2026-03-18, 09:00 at roadside parking area',
    holdingLocation: 'Lahore HQ',
    loggedByHQ: 'Lahore HQ',
  },
  {
    size: 'Small',
    weight: '350 g',
    color: 'Brown',
    detailedDescription: 'Leather wallet containing no cash, Pakistani CNIC card holder slot visible',
    numberPlate: null,
    conditionFoundIn: 'Worn but intact',
    recoveredFromLocation: 'Saddar Bazaar, Karachi',
    recoveryTimeAndPlace: '2026-03-20, 18:45 at Saddar bus stop',
    holdingLocation: 'Karachi HQ',
    loggedByHQ: 'Karachi HQ',
  },
  {
    size: 'Medium',
    weight: '2.5 kg',
    color: 'Blue',
    detailedDescription: 'HP Pavilion laptop bag with charger cable, no laptop inside',
    numberPlate: null,
    conditionFoundIn: 'Good',
    recoveredFromLocation: 'Blue Area, Islamabad',
    recoveryTimeAndPlace: '2026-03-22, 11:00 at Jinnah Avenue coffee shop',
    holdingLocation: 'Islamabad HQ',
    loggedByHQ: 'Islamabad HQ',
  },
  {
    size: 'Large',
    weight: '1200 kg',
    color: 'Silver',
    detailedDescription: '2019 Toyota Corolla GLI, silver metallic paint, dent on rear bumper',
    numberPlate: 'ISB-7890',
    conditionFoundIn: 'Good — drivable',
    recoveredFromLocation: 'F-10 Markaz, Islamabad',
    recoveryTimeAndPlace: '2026-03-25, 07:30 at F-10 parking lot',
    holdingLocation: 'Islamabad HQ',
    loggedByHQ: 'Islamabad HQ',
  },
  {
    size: 'Small',
    weight: '15 g',
    color: 'Gold',
    detailedDescription: 'Gold ring with small emerald stone, inscribed "A.K." on inner band',
    numberPlate: null,
    conditionFoundIn: 'Excellent',
    recoveredFromLocation: 'Qissa Khwani Bazaar, Peshawar',
    recoveryTimeAndPlace: '2026-03-28, 16:00 at bazaar entrance',
    holdingLocation: 'Peshawar HQ',
    loggedByHQ: 'Peshawar HQ',
  },
];

async function main() {
  console.log('Seeding database...');

  await prisma.claim.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.policeHQ.deleteMany();

  const hqMap = {};

  for (const hq of hqs) {
    const hashed = await bcrypt.hash(hq.password, 10);
    const created = await prisma.policeHQ.create({
      data: {
        name: hq.name,
        username: hq.username,
        password: hashed,
      },
    });
    hqMap[hq.name] = created.id;
    console.log(`  Created HQ: ${hq.name} (login: ${hq.username} / ${hq.password})`);
  }

  for (const item of sampleItems) {
    await prisma.lostItem.create({
      data: {
        size: item.size,
        weight: item.weight,
        color: item.color,
        detailedDescription: item.detailedDescription,
        numberPlate: item.numberPlate,
        conditionFoundIn: item.conditionFoundIn,
        recoveredFromLocation: item.recoveredFromLocation,
        recoveryTimeAndPlace: item.recoveryTimeAndPlace,
        holdingLocation: item.holdingLocation,
        loggedByHQId: hqMap[item.loggedByHQ],
      },
    });
    console.log(`  Created item: ${item.detailedDescription.slice(0, 50)}...`);
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
