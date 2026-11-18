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
Next.js 15 App Router, TypeScript, Tailwind CSS 4, PostgreSQL, Prisma, ExcelJS, Upstash Redis rate limiting.

## Production тохиргоо

1. Node.js 20+ болон PostgreSQL 16 ашиглана.
2. Environment variables тохируулна:
   - `DATABASE_URL` — production PostgreSQL connection string.
   - `ADMIN_USERNAME` — админ нэвтрэх нэр.
   - `ADMIN_PASSWORD_HASH` — bcrypt cost 12+ hash.
   - `ADMIN_SESSION_SECRET` — `openssl rand -hex 32` командаар үүсгэсэн 64 тэмдэгтээс багагүй нууц.
   - `NEXT_PUBLIC_SITE_URL` — HTTPS production домэйн.
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — production rate limiting-д заавал.
3. Dependencies суулгана: `npm install`.
4. Prisma client үүсгэнэ: `npx prisma generate`.
5. Production migration ажиллуулна: `npx prisma migrate deploy`.
6. Үндсэн сугалааг үүсгэнэ: `npm run db:seed`.
7. Build: `npm run build`; start: `npm run start`.
8. `/api/health` endpoint-оор database холболтыг шалгана.
9. PostgreSQL автомат backup/PITR идэвхжүүлж, сэргээх туршилт хийнэ.

Админ нууц үгийн hash үүсгэх:
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_LONG_PASSWORD', 12))"
```

Session cookie нь HttpOnly, Secure (production), SameSite=Strict тохиргоотой. Хайлт 12 хүсэлт/минут, админ нэвтрэлт 5 оролдлого/15 минутын sliding-window хязгаартай. Redis тохиргоо байхгүй үед production хайлт болон login зориудаар хаагдана.

## Excel формат

Дэмжих формат: `.xlsx`, `.csv` (12MB хүртэл, нэг файлд 50,000 мөр хүртэл).

Дараах баганууд **заавал** шаардлагатай:
- `transaction_id` (эсвэл `id`, `гүйлгээний дугаар`, `гүйлгээний утга`) — давхардал танихад шаардлагатай.
- `transaction_date` (эсвэл `date`, `огноо`, `гүйлгээний огноо`).
- `phone_number` (эсвэл `phone`, `утас`, `утасны дугаар`).
- `ticket_count` (эсвэл `tickets`, `сугалааны эрх`, `эрхийн тоо`).

APPEND: өмнөх мэдээлэлд шинэ мөр нэмнэ.
REPLACE: алдаагүй файлын мэдээллээр тухайн идэвхтэй сугалааг бүхэлд нь сольж, өмнөх мөрүүдийг snapshot болгон хадгална. Алдаатай мөртэй REPLACE файлыг аюулгүй байдлын үүднээс хүлээн авахгүй.

## CI ба deployment
GitHub Actions нь push болон pull request бүрт PostgreSQL service дээр Prisma migration, ESLint, TypeScript, Next.js production build шалгана.

## Одоогоор үлдсэн production ажил
- Бодит hosting, домэйн, PostgreSQL, Upstash Redis credentials тохируулах.
- Object storage (S3/R2 зэрэг) холбож админаас зураг upload хийх.
- Админд сугалааны мэдээлэл засах UI болон Excel баганын визуал mapping нэмэх.
- Бодит Excel файлууд болон олон хэрэглэгчийн ачааллын тест хийх.
- Facebook Open Graph зурагт өөрийн эрхтэй зураг ашиглах.

Production deployment нь environment тохиргоо болон бодит өгөгдлийн QA дууссаны дараа л бэлэн гэж тооцогдоно.
