import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.campaign.upsert({
    where: { id: "suhbaataryn-khurd-default" },
    update: {},
    create: {
      id: "suhbaataryn-khurd-default",
      title: "Сүхбаатарын хурд — Морин сугалаа",
      description: "Сугалааны эрх шалгах үндсэн аян",
      status: "PUBLISHED",
      isActive: true
    }
  });
  console.log("Үндсэн сугалаа үүслээ. Админ нэвтрэх эрхийг .env тохиргоогоор удирдана.");
}

main().finally(async () => db.$disconnect());
