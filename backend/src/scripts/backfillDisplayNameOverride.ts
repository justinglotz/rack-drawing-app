import { prisma } from '../config/prisma.js';

async function main() {
  const catalogResult = await prisma.$executeRaw`
    UPDATE "PullsheetItem" AS p
    SET "displayNameOverride" = NULL
    FROM "EquipmentCatalog" AS c
    WHERE p."equipmentCatalogId" = c.id
      AND p."displayNameOverride" = c."displayName"
  `;
  console.log(`Cleared ${catalogResult} rows matching EquipmentCatalog displayName`);

  const genericResult = await prisma.$executeRaw`
    UPDATE "PullsheetItem" AS p
    SET "displayNameOverride" = NULL
    FROM "GenericEquipment" AS g
    WHERE p."genericEquipmentId" = g.id
      AND p."displayNameOverride" = g."displayName"
  `;
  console.log(`Cleared ${genericResult} rows matching GenericEquipment displayName`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
