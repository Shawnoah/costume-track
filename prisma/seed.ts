import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create initial invite code if it doesn't exist
  const existingCode = await prisma.systemInviteCode.findFirst({
    where: { code: "COSTUME2025" },
  });

  if (!existingCode) {
    await prisma.systemInviteCode.create({
      data: {
        code: "COSTUME2025",
        description: "Initial launch invite code",
        isActive: true,
        maxUses: null, // Unlimited
      },
    });
    console.log("Created initial invite code: COSTUME2025");
  } else {
    console.log("Initial invite code already exists");
  }

  // Create preset label formats if they don't exist
  const existingFormats = await prisma.labelFormat.findMany({
    where: { isPreset: true },
  });

  if (existingFormats.length === 0) {
    await prisma.labelFormat.createMany({
      data: [
        {
          name: "Standard Hang Tag (2.25\" × 1.37\")",
          widthInches: 2.25,
          heightInches: 1.37,
          isPreset: true,
          description: "Direct thermal tag with pre-punched hole, ideal for hanging on garments",
        },
        {
          name: "Large Label (4\" × 2\")",
          widthInches: 4.0,
          heightInches: 2.0,
          isPreset: true,
          description: "Large adhesive label for boxes or bins",
        },
        {
          name: "Small Label (2\" × 1\")",
          widthInches: 2.0,
          heightInches: 1.0,
          isPreset: true,
          description: "Compact adhesive label for accessories",
        },
        {
          name: "Jewelry Tag (0.875\" × 0.5\")",
          widthInches: 0.875,
          heightInches: 0.5,
          isPreset: true,
          description: "Tiny tag for jewelry and small accessories",
        },
      ],
    });
    console.log("Created preset label formats");
  } else {
    console.log("Preset label formats already exist");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
