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
1. **Ixtiyoriy**: `cpamarket` nomli PostgreSQL bazasini yarating.
2. Namuna konfiguratsiyalarini nusxa oling:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Kerakli qiymatlarni (`DATABASE_URL`, JWT sirlari va h.k.) to‘ldiring.
4. Prisma client generatsiyasi va migratsiyalar:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   npx prisma generate --schema=prisma/schema.prisma
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

### Backend API imkoniyatlari
- `POST /api/auth/register` — foydalanuchi ro‘yxatdan o‘tkazish (avtomatik “Targetolog” roli, parolni xeshlash, access + refresh tokenlarni qaytarish).
- `POST /api/auth/login` — telefon va parol orqali kirish (`captcha` flag bilan).
- `POST /api/auth/refresh` — refresh token asosida yangi tokenlar.
- `POST /api/auth/forgot-password` — 10 daqiqalik token yaratish (hozircha javobda token qaytariladi, e-mail/SMS integratsiyasi keyin qo‘shiladi).
- `POST /api/auth/reset-password` — tiklash tokeni bilan yangi parol o‘rnatish.
- `GET /api/health` — xizmat holatini tekshirish.

### Frontend sahifalari (O‘zbek tilida)
- `/` — CPAMaRKeT.Uz haqida umumiy ma’lumot sahifasi.
- `/royxatdan-otish` — ro‘yxatdan o‘tish formasi (ism, nickname, telefon, parol, captcha).
- `/kirish` — kirish formasi (telefon, parol, captcha, “Esda saqlash” 30 kunlik refresh token).
- `/parolni-unutdingizmi` — parolni tiklash formasi.
- `/panel` — boshqaruv paneli uchun bo‘sh stub sahifa.

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
