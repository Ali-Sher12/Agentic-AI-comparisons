const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash standard password for HQs
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('pakistan123', salt);

  // 1. Create HQs
  const hqsData = [
    { name: 'Lahore HQ', username: 'lahore_police', password: passwordHash },
    { name: 'Karachi HQ', username: 'karachi_police', password: passwordHash },
    { name: 'Islamabad HQ', username: 'islamabad_police', password: passwordHash },
    { name: 'Peshawar HQ', username: 'peshawar_police', password: passwordHash },
  ];

  const hqs = [];
  for (const hqData of hqsData) {
    const hq = await prisma.hQ.upsert({
      where: { username: hqData.username },
      update: {},
      create: hqData,
    });
    hqs.push(hq);
    console.log(`Created HQ: ${hq.name} (username: ${hq.username})`);
  }

  const lahoreHq = hqs.find(h => h.name === 'Lahore HQ');
  const karachiHq = hqs.find(h => h.name === 'Karachi HQ');
  const islamabadHq = hqs.find(h => h.name === 'Islamabad HQ');
  const peshawarHq = hqs.find(h => h.name === 'Peshawar HQ');

  // 2. Create Items
  const itemsData = [
    {
      size: 'Medium',
      weight: '200g',
      color: 'Black',
      description: 'Leather bi-fold wallet containing a national identity card (CNIC) of Ahmed Khan, two bank cards, and approximately 5000 PKR cash.',
      numberPlate: null,
      condition: 'Slightly worn, intact',
      recoveredLocation: 'Liberty Market, Gulberg, Lahore',
      recoveryTime: 'Recovered on 2026-06-15 at 14:30',
      status: 'AVAILABLE',
      uploaderId: lahoreHq.id,
      holdingLocationId: lahoreHq.id,
    },
    {
      size: 'Large',
      weight: '85kg',
      color: 'Red',
      description: 'Honda CD 70 motorcycle, red color, standard model with rear carrier rack.',
      numberPlate: 'LE-2026-4321',
      condition: 'Good working condition, few scratches on the fuel tank',
      recoveredLocation: 'Near Metro Station, Ichhra, Lahore',
      recoveryTime: 'Recovered on 2026-06-18 at 09:15',
      status: 'AVAILABLE',
      uploaderId: lahoreHq.id,
      holdingLocationId: lahoreHq.id,
    },
    {
      size: 'Small',
      weight: '204g',
      color: 'Sierra Blue',
      description: 'Apple iPhone 13 Pro (128GB) with a transparent silicon cover, locked, screen is clear of cracks.',
      numberPlate: null,
      condition: 'Excellent, screen protector has minor scratches',
      recoveredLocation: 'Tariq Road shopping area, Karachi',
      recoveryTime: 'Recovered on 2026-06-12 at 18:45',
      status: 'AVAILABLE',
      uploaderId: karachiHq.id,
      holdingLocationId: karachiHq.id,
    },
    {
      size: 'Medium',
      weight: '1.6kg',
      color: 'Silver',
      description: 'HP ProBook 450 G8 laptop. Serial number matches police logs, no bag, standard charger was found nearby.',
      numberPlate: null,
      condition: 'Operational, small dent in the bottom-left corner of the chassis',
      recoveredLocation: 'Centaurus Mall Food Court, Islamabad',
      recoveryTime: 'Recovered on 2026-06-10 at 21:00',
      status: 'AVAILABLE',
      uploaderId: islamabadHq.id,
      holdingLocationId: islamabadHq.id,
    },
    {
      size: 'Extra Large',
      weight: '1250kg',
      color: 'White',
      description: 'Toyota Corolla XLI, white color, key was missing, found parked illegally for 48 hours.',
      numberPlate: 'ICT-987-AB',
      condition: 'Dusty, tires are full, locked door was opened by authorized tow-service',
      recoveredLocation: 'G-11 Markaz, Islamabad',
      recoveryTime: 'Recovered on 2026-06-14 at 02:00',
      status: 'AVAILABLE',
      uploaderId: islamabadHq.id,
      holdingLocationId: peshawarHq.id, // Uploader is Islamabad, but currently held in Peshawar HQ
    },
    {
      size: 'Small',
      weight: '8g',
      color: 'Gold',
      description: '22k Gold Ring with a small ruby stone set in the center, traditional engraving on the inner band.',
      numberPlate: null,
      condition: 'Clean and polished',
      recoveredLocation: 'Saddar Bazaar near Khyber Bazar intersection, Peshawar',
      recoveryTime: 'Recovered on 2026-06-16 at 16:20',
      status: 'AVAILABLE',
      uploaderId: peshawarHq.id,
      holdingLocationId: peshawarHq.id,
    },
  ];

  for (const itemData of itemsData) {
    const item = await prisma.item.create({
      data: itemData,
    });
    console.log(`Created lost item: ${item.description.slice(0, 30)}... status: ${item.status}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
