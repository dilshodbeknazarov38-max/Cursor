## CPAMaRKeT.Uz — CPA boshqaruv platformasi

CPAMaRKeT.Uz — CPA (Cost Per Action) reklama kampaniyalarini boshqarish, targetologlarni monitoring qilish va hamkorlar bilan ishlashni soddalashtiruvchi platforma. Loyihada Next.js 14 (App Router, TailwindCSS, shadcn/ui) asosidagi frontend va NestJS + Prisma + PostgreSQL asosidagi backend mavjud. Barcha UI matnlari o‘zbek tilida.

### Asosiy texnologiyalar
- Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, react-hook-form, zod
- Backend: NestJS, Prisma ORM, PostgreSQL, JWT autentifikatsiya (access + refresh), bcrypt
- Deploy: Docker-compose (frontend, backend, PostgreSQL)

### Loyihaning katalog tuzilmasi
```
/.dockerignore
/docker/
  backend.Dockerfile
  frontend.Dockerfile
  docker-compose.yml
/frontend/        # Next.js 14 ilovasi (App Router)
/backend/         # NestJS API
/prisma/schema.prisma
```

### Muhit sozlamalari
1. **PostgreSQL**: lokal yoki Docker orqali `cpamarket` nomli bazani ishga tushiring.
2. Namuna konfiguratsiyalarini nusxa oling va to‘ldiring:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Asosiy o‘zgaruvchilar:
   - `DATABASE_URL`, `SHADOW_DATABASE_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `FRONTEND_URL`, `CORS_ORIGINS`
   - `ADMIN_PHONE`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_NICKNAME`
3. Kutubxonalarni o‘rnating va Prisma klientini generatsiya qiling:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   npx prisma generate --schema=prisma/schema.prisma
   ```
4. (Ixtiyoriy) Migratsiyani qo‘llang:
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

### Lokal ishga tushirish
Backend va frontendni alohida terminalda ishga tushiring:
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

### Docker orqali ishga tushirish
Loyiha ildizida:
```bash
cd docker
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- PostgreSQL: localhost:5432 (foydalanuvchi/parol: cpamarket/cpamarket)

### Backend modullari va API
- **Auth**: ro‘yxatdan o‘tish (`/api/auth/register`), telefon + parol + captcha bilan kirish (`/api/auth/login`), tokenni yangilash, parolni unutish/tiklash, sessiyani yakunlash (`/api/auth/logout`). Barcha javob va xatoliklar o‘zbek tilida.
- **Users**: `/api/users` (Admin/Super Admin) — foydalanuvchilar ro‘yxati, rolni o‘zgartirish, bloklash (`PATCH /users/:id/status`). Har bir login/logout va rol o‘zgarishi `activity_log` jadvaliga yoziladi.
- **Products**: `/api/products` (Admin/Seller Admin) — mahsulotlarni CRUD, sellerga biriktirish.
- **Leads**: `/api/leads` — Targetolog o‘z leadlarini yaratadi, Target/Admin statuslarni yangilaydi. Lead statusi o‘zgarganda bildirishnoma yuboriladi.
- **Orders**: `/api/orders` — buyurtma oqimi `NEW → ASSIGNED → IN_DELIVERY → DELIVERED/RETURNED → ARCHIVED`. Operator faqat o‘ziga biriktirilgan buyurtmalarni ko‘radi, Sklad Admin faqat `IN_DELIVERY` holatini ko‘radi.
- **Payouts**: `/api/payouts` — foydalanuvchilar to‘lov so‘rovi yuboradi, Admin tasdiqlaydi/ rad etadi. Har bir harakat uchun bildirishnoma yuboriladi.
- **Notifications**: `/api/notifications` — foydalanuvchi uchun bildirishnomalar ro‘yxati, ko‘rildi deb belgilash.
- **Activity**: `/api/activity/me` va `/api/activity` — foydalanuvchi faolligi va admin uchun audit jurnali.
- **Stats**: `/api/stats/landing`, `/api/stats/dashboard/:role` — landing va rolega mos dashboard statistikasi (foydalanuvchilar, leadlar, sotuvlar, top targetologlar).

### Frontend sahifalari (o‘zbek tilida)
- **Landing** — 8 ta bo‘lim (header, hero, about, how-it-works, stats, testimonials, CTA, footer) va real vaqt statistikasi.
- **Auth** — `/royxatdan-otish`, `/kirish`, `/parolni-unutdingizmi`, `/parolni-tiklash`. Barcha formlar zod + react-hook-form + shadcn/ui komponentlari.
- **Dashboard** — `/dashboard/[role]` yo‘li orqali har bir rol uchun alohida panel:
  - Admin: foydalanuvchilarni bloklash/faollashtirish, mahsulotlar, buyurtmalar, to‘lovlar statistikasi, faollik jurnali.
  - Targetolog: leadlar statistikasi, to‘lov so‘rovi yuborish formasi, bildirishnomalar va faollik.
  - Operator, Sklad Admin, Seller Admin va boshqalar uchun moslashtirilgan metrikalar va nav menyular.
- **Middleware** — `/panel` va `/dashboard/*` yo‘llarini cookie orqali rolega qarab himoyalaydi va yo‘naltiradi.
- Har bir dashboardda logout tugmasi, real vaqt bildirishnomalari, activity log va dinamik grafika (Recharts) mavjud.

### Test va linterlar
```bash
npm run lint --prefix frontend
npm run lint --prefix backend
npm run build --prefix backend
npm run build --prefix frontend
```

### Keyingi qadamlar
- Autentifikatsiya endpointlarini Next.js frontend bilan to‘liq bog‘lash (axios/fetch orqali).
- Rollar (Admin/Manager) uchun qo‘shimcha kirish darajalari va sahifalar.
- Email/SMS orqali parol tiklash xizmatlari.
- Prisma migratsiyalarini `prisma migrate dev` bilan boshqarish va urug‘ ma’lumotlarini kiritish.
- CI/CD pipeline (GitHub Actions, Vercel, Docker Registry va h.k.) qo‘shish.
