# Сүхбаатарын хурд — морины сугалааны эрх шалгах

Монгол үндэсний хэв маягтай, утасны дугаараар сугалааны эрх шалгах веб систем.

## Хэрэглэгчийн веб
- Зөвхөн 8 оронтой утасны дугаараар хайна.
- Хайлтын үр дүнд зөвхөн **гүйлгээний огноо, утасны дугаар, сугалааны эрхийн тоо** харагдана.
- Олон нийтэд банкны данс, гүйлгээний утга, гүйлгээний дүн, сугалааны дугаар болон статистик ил гаргахгүй.

## Админ хэсэг
- `/admin/login` — админ нэвтрэх.
- Нийт оролцогч (давхардалгүй утасны дугаар) болон нийт сугалааны эрхийн тоо.
- Facebook share action — зөвхөн админд харагдана. Open Graph preview ашиглана.
- Excel импортын түүх, амжилттай/алдаатай мөрийн тоо.
- APPEND импортын rollback нь тухайн batch-аас нэмсэн мөрүүдийг буцаана.
- REPLACE импортын rollback нь өмнөх snapshot-ийг сэргээнэ.
- Админ API-ууд session шалгалттай.

## Технологи
Next.js 15 App Router, TypeScript, Tailwind CSS 4, PostgreSQL, Prisma, ExcelJS.

## Ажиллуулах
1. Node.js 20+ болон PostgreSQL суулгана.
2. `npm install`
3. `.env.example` файлыг `.env` болгон хуулна.
4. Нууц үгийн bcrypt hash үүсгэнэ:

   `node -e "console.log(require('bcryptjs').hashSync('CHANGE_THIS_PASSWORD', 12))"`

5. `.env` дотор `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` (хамгийн багадаа 32 тэмдэгт), `DATABASE_URL` тохируулна.
6. `npx prisma generate`
7. `npx prisma migrate dev --name init`
8. `npm run db:seed`
9. `npm run dev`

Админ нэвтрэх URL: `http://localhost:3000/admin/login`.

## Excel формат
Дэмжих формат: `.xlsx`, `.csv` (12MB хүртэл).

Дараах баганууд шаардлагатай:
- `transaction_date` (эсвэл `date`, `огноо`, `гүйлгээний огноо`)
- `phone_number` (эсвэл `phone`, `утас`, `утасны дугаар`)
- `ticket_count` (эсвэл `tickets`, `сугалааны эрх`, `эрхийн тоо`)
- `transaction_id` (эсвэл `id`, `гүйлгээний дугаар`, `гүйлгээний утга`) — давхардал танихад шаардлагатай. Байхгүй бол файлын мөрийн дугаараар үүсгэнэ.

APPEND: өмнөх мэдээлэлд шинэ мөр нэмнэ.
REPLACE: тухайн идэвхтэй сугалааны мэдээллийг бүхэлд нь сольж, өмнөх мөрүүдийг snapshot болгон хадгална.

## Анхаарах зүйл
- Одоогийн хувилбарт анхны сугалааг seed скрипт үүсгэнэ.
- Excel import endpoint нь баганын нэрээр автоматаар тааруулдаг; дурын баганын нэрийг сонгох визуал mapping одоогоор байхгүй.
- Facebook share нь сайтны URL ба Open Graph preview-г ашиглана. Facebook-ийн preview cache шинэчлэгдэхэд хугацаа шаардаж болно.
- Production-д байрлуулахын өмнө migrations, environment variables, HTTPS, database backup, rate limiting болон бодит Excel файлуудаар QA тест хийх шаардлагатай.
- Одоогоор automated test suite болон production deployment тохиргоо нэмэгдээгүй.
