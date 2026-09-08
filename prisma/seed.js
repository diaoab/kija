const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ALL_PERMISSIONS = "properties,categories,reservations,content,admins";

async function main() {
  const categories = [
    { name: "Appartements", slug: "appartements" },
    { name: "Villas", slug: "villas" },
    { name: "Studios", slug: "studios" },
    { name: "Maisons", slug: "maisons" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("Catégories de départ créées.");

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("Paramètres du site initialisés.");

  const ownerCount = await prisma.admin.count({ where: { isOwner: true } });
  if (ownerCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";

    if (!email || !password) {
      console.warn(
        "ADMIN_EMAIL ou ADMIN_PASSWORD manquant dans .env : aucun compte administrateur créé."
      );
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.admin.create({
        data: {
          name: "Propriétaire",
          email,
          passwordHash,
          permissions: ALL_PERMISSIONS,
          isOwner: true,
        },
      });
      console.log(`Compte administrateur propriétaire créé (${email}).`);
    }
  } else {
    console.log("Un compte propriétaire existe déjà, aucune modification.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
