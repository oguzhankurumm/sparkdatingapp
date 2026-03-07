# CLAUDE.md — Spark Dating App

> Bu dosya AI coding agent'ları için yazılmıştır.
> Her oturumda bu dosyayı oku — hiçbir issue'ya başlamadan önce.

---

## Proje Nedir?

**Spark**, TikTok Live + Bumble + Hinge ilhamlarını birleştiren global bir dating uygulamasıdır.
Kullanıcılar eşleşir, sohbet eder, video call yapar, canlı yayın açar ve token kazanır.

**Hedef pazar:** Global — EN default, TR otomatik (Accept-Language)
**Launch stratejisi:** Web önce → Mobile sonra (web validate edildikten sonra)

---

## Monorepo Yapısı

```
spark/                          # Turborepo root
├── apps/
│   ├── web/                    # NextJS 15 — ana uygulama (spark.app)
│   ├── admin/                  # NextJS 15 — admin panel (admin.spark.app)
│   ├── api/                    # NestJS 10 — backend API
│   └── mobile/                 # Expo 52 — React Native (web sonrası)
├── packages/
│   ├── ui/                     # Atomic Design component kütüphanesi
│   ├── types/                  # Paylaşılan TypeScript tipleri
│   ├── validators/             # Zod şemaları (client + server ortak)
│   ├── i18n/                   # next-intl mesaj dosyaları (en.json, tr.json)
│   └── config/                 # ESLint, Prettier, TypeScript base config
└── infra/                      # AWS CDK v2 (TypeScript)
```

---

## Tech Stack

### Frontend (apps/web + apps/admin)
- **NextJS 15** — App Router, RSC, Server Actions
- **TypeScript** — strict mode, no `any`
- **Tailwind CSS** — utility-first, design token'larını kullan
- **shadcn/ui** — base component kütüphanesi
- **TanStack Query v5** — server state yönetimi
- **Zustand** — client state (UI state, modal, etc.)
- **Framer Motion** — animasyonlar
- **next-intl** — i18n (cookie-based, EN default)
- **next-themes** — dark/light tema

### Backend (apps/api)
- **NestJS 10** — modüler mimari
- **Drizzle ORM** — type-safe SQL (PostgreSQL)
- **Socket.io** — real-time (chat, notifications, live stream events)
- **Bull/BullMQ** — job queue (cron, email, moderation)
- **Passport.js** — auth strategies (JWT, Google, Apple)

### Infrastructure
- **AWS RDS** — PostgreSQL 16 (Multi-AZ)
- **AWS ElastiCache** — Redis 7
- **AWS S3 + CloudFront** — media storage + CDN
- **AWS ECS Fargate** — container hosting
- **AWS SES** — system email
- **LiveKit** — WebRTC (video calls + live stream + speed dating)

### 3rd Party Servisler
| Servis | Kullanım | Env Var |
|--------|----------|---------|
| Anthropic | Dating Helper, Profil Analiz, Toksik Tespit, Uyumluluk | `ANTHROPIC_API_KEY` |
| Groq | Real-time Yazışma Koçu (~200ms) | `GROQ_API_KEY` |
| Gemini / Google Vision | Foto Moderasyon | `GEMINI_API_KEY` |
| LiveKit | Video Call, Live Stream, Speed Dating | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |
| Stripe | Subscription, Token satışı, Payout | `STRIPE_SECRET_KEY` |
| RevenueCat | iOS/Android IAP | `REVENUECAT_SECRET_API_KEY` |
| DeepL | Auto Translate (Premium) | `DEEPL_API_KEY` |
| Onfido | KYC Kimlik Doğrulama | `ONFIDO_API_TOKEN` |
| Branch.io | Deep Linking, Referral | `BRANCH_SECRET_KEY` |
| Statsig | A/B Testing, Feature Flags | `STATSIG_SERVER_SDK_KEY` |
| Amplitude | Analytics | `AMPLITUDE_API_KEY` |
| Sentry | Error Tracking | `SENTRY_DSN` |
| Resend | Transactional Email | `RESEND_API_KEY` |
| Twilio | SMS (OTP + Safe Date) | `TWILIO_ACCOUNT_SID` |
| Firebase/FCM | Push Notifications | `FIREBASE_PROJECT_ID` |

Tam env var listesi için: **Linear Doküman — "Environment Variables Master Reference"**

---

## Linear Issue Yapısı

Tüm issue'lar Linear'da. Her issue'nun başlığında PROMPT numarası var.
Kodlamaya başlamadan önce ilgili Linear issue'yu oku.

**Issue ID formatı:** `OGU-XXX` (örn. `OGU-138`)

### Milestone → Issue Mapping
```
M1 — Monorepo & Design System:  OGU-138, 139, 159, 161
M2 — Backend & AWS:             OGU-140, 141, 158
M3 — Web App Core:              OGU-142, 143, 144, 145, 151, 154, 162, 181, 183, 184, 186, 198
M3b — Core Monetization:        OGU-146, 147, 148, 150, 152, 160(deprecated), 182, 185
M4 — Admin Panel:               OGU-149
M5 — Mobile App:                OGU-153
M6 — Extended Features:         OGU-187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197
```

### Implementation Sırası
```
Phase 1 (Core):      138 → 139 → 159 → 161 → 140 → 141 → 142 → 143 → 144 → 145 → 146 → 147 → 148 → 150 → 152
Phase 2 (Infra/AI):  191 → 188 → 192
Phase 3 (Growth):    187 → 189 → 193 → 195
Phase 4 (Premium):   194 → 196 → 190 → 198
```

---

## Tasarım Sistemi

### Renk Paleti
```typescript
// Primary gradient
'#E11D48' → '#9333EA'  // rose → purple (brand)

// Accent
'#F59E0B'  // amber — warm, CTA'larda kullanılır

// Backgrounds
'#FAFAF9'  // warm off-white (landing, light mode)
'#0F0F0F'  // near-black (dark sections, dark mode)

// Semantic (Tailwind tokens olarak tanımlanmış)
// packages/ui/src/styles/tokens.css'e bak
```

### Tipografi
- **Başlıklar:** Space Grotesk (sans-serif, bold)
- **Body:** Inter
- **Landing page** için serif + sans karışımı (Hinge editorial tarzı)

### Component Kullanımı
`packages/ui`'dan import et — direkt shadcn kullanma:
```typescript
// ✅ Doğru
import { Button } from '@spark/ui'

// ❌ Yanlış
import { Button } from '@/components/ui/button'
```

---

## Kritik İş Kuralları

> Bu kuralları asla değiştirme, etrafından dolaşma, yorumda bırakma.

### Token Ekonomisi
```
1 USD = 100 token
Platform kesinti: %20
Kullanıcı kazancı: %80

Signup bonusu: 1000 token (tüm yeni kullanıcılar)
Referral bonusu: 200t (davet eden) + 100t (davet edilen)
Min çekim: 5000 token (~$50)
KYC zorunluluğu: 50,000+ token çekimde
İlk çekim için hesap yaşı: 30 gün
```

### Video Call Billing — HİÇ İADE YOK
```typescript
// Her dakika kesin billing — bağlantı kopsa bile
// Kullanıcıya uyarı göster ÖNCE:
// "Her dakika X token kesilir. İade yapılmaz."
// Bu kuralı ASLA değiştirme
```

### Match Expiry
```typescript
// 72 saat mesaj yoksa match sona erer
// 48 saat öncesinde push notification gönder
// Expired match: "Yeniden Eşleş?" butonu — 50 token
```

### Masa Limitleri
```typescript
const TABLE_LIMITS = {
  free: { maxActiveTables: 1 },
  premium: { maxActiveTables: 3 },
  platinum: { maxActiveTables: 3 },
}
```

### Boost Tipleri
```typescript
const BOOST_TYPES = {
  mini: { tokens: 500,  duration: 30 * 60,       multiplier: 10 }, // 30 dk
  pro:  { tokens: 1500, duration: 6 * 60 * 60,    multiplier: 5  }, // 6 saat
  max:  { tokens: 3000, duration: 24 * 60 * 60,   multiplier: 3  }, // 24 saat
}
```

### Gift Context — 3 Tip
```typescript
export type GiftContext = 'chat' | 'call' | 'stream'
// Match olmadan hediye gönderilebilir — herkese
// Platform %20 keser, alıcı %80 kazanır
```

---

## Subscription Planları

| Plan | Aylık | Yıllık |
|------|-------|--------|
| Free (Erkek) | $0 | — |
| Free (Kadın) | $0 | — premium özellikler dahil |
| Premium | $19.99 | $11.99/mo |
| Platinum | $29.99 | $17.99/mo |

### Kadın Kullanıcı Avantajları (ücretsiz)
Sınırsız like, seni beğenenleri gör (günlük 5), rewind, advanced filters, read receipts, haftalık 1 boost

### Premium Features
Sınırsız like, seni beğenenleri gör, rewind, advanced filters, read receipts, 5 boost/ay, Auto Translate, profile viewers

### Platinum Features (Premium + şunlar)
Dating Helper AI, incognito, priority discovery, 1000 bonus token/ay, Platinum badge, AI Compatibility detail, Date Planner AI (3/gün)

---

## AI Model Seçimi

```typescript
// Her feature için doğru modeli kullan:
'claude-sonnet-4-5'         → Dating Helper, Profil Analizör, Tarih Planlama
'claude-haiku-4-5-20251001' → Toksik Mesaj Tespiti, AI Uyumluluk Skoru (hız öncelikli)
'llama-3.1-70b-versatile'   // Groq → Yazışma Koçu (real-time, ~200ms)
'gemini-1.5-flash'          // Google → Foto Moderasyon
```

---

## Database — Drizzle ORM

### Schema Konumu
```
apps/api/src/database/schema/
├── users.ts
├── matches.ts      # expiresAt, lastMessageAt, ghostReminderSentAt
├── messages.ts
├── tables.ts       # isVip, vipPerks
├── video-calls.ts
├── wallet.ts
├── gifts.ts
├── live-streams.ts
├── stories.ts
├── ...             # toplam 37 tablo
```

### Kritik Schema Notları
```typescript
// matches tablosu — bu alanlar zorunlu:
expiresAt: timestamp        // matchedAt + 72 saat
lastMessageAt: timestamp    // expiry hesabı için
ghostReminderSentAt: timestamp // 48h uyarı gönderildi mi

// users tablosu — M6 eklemeleri:
currentStreak: integer
longestStreak: integer
lastActiveDate: timestamp
voiceNoteUrl: varchar       // 30 saniyelik sesli profil
videoProfileUrl: varchar    // max 15 sn video profil
kycStatus: enum             // 'none' | 'pending' | 'verified'
```

---

## NestJS Modül Listesi (26 modül)

```
Temel (M1-M5):
auth, users, discovery, matching, messaging, notifications,
subscriptions, moderation, analytics, admin, tables,
video-calls, wallet, gifts, daily-spin, zodiac,
dating-helper, translate, referrals, boost

M6 (Extended):
live-stream, stories, speed-dating, badges, leaderboard,
safe-date, ai-moderation
```

Her modül için: `apps/api/src/modules/<module-name>/` altında
`controller`, `service`, `module`, `dto`, `schema` dosyaları oluştur.

---

## Web App Route Yapısı

```
apps/web/app/
├── (marketing)/        # Landing page — ayrı layout (no navbar)
│   ├── page.tsx        # spark.app/
│   └── layout.tsx
├── (auth)/
│   ├── login/
│   ├── register/
│   └── onboarding/     # 9 adım wizard
├── (app)/              # Authenticated — app layout (5 tab)
│   ├── discover/       # Swipe + Browse modu
│   ├── tables/         # Masa ilanları
│   ├── calls/          # Video call, 1:1
│   ├── matches/        # Eşleşmeler + Chat
│   └── profile/        # Profil, settings, wallet
└── (admin)/            # apps/admin için ayrı app — buraya değil
```

### 5 Tab (Mobile ile aynı)
```
Discover | Tables | Calls | Matches | Profile
```

---

## Onboarding — 9 Adım

| # | Ekran | Zorunlu |
|---|-------|---------|
| 1 | BasicInfo (isim, yaş, cinsiyet, doğum tarihi) | ✅ |
| 2 | Photos (min 2, max 6) | ✅ |
| 3 | Bio + Prompts | ✅ |
| 4 | Location | ✅ |
| 5 | Interests (min 3) | ✅ |
| 6 | RelationshipGoals | ✅ |
| 7 | Discovery Preferences | ✅ |
| 8 | Notifications permission | ❌ |
| 9 | Photo Verify (selfie) → verified badge | ❌ |

---

## Discover Screen — İki Mod

### Mod A: Swipe (default)
Framer Motion kart stack, LIKE / PASS / SUPER LIKE, tam ekran

### Mod B: Browse
Grid layout — Stories şeridi üstte, aşağıda:
- "Şu An Görüşmeye Hazır" yatay scroll
- VIP Masalar
- Trending Profiller
- Nearby (konum izni varsa)

---

## Güvenlik Kuralları

```typescript
// JwtAuthGuard — tüm authenticated route'larda
// RolesGuard — admin route'larında
// PlanGuard — premium/platinum feature'larında

// Örnek:
@UseGuards(JwtAuthGuard, PlanGuard('platinum'))
@Get('dating-helper')
async datingHelper() { ... }
```

---

## Kod Standartları

```typescript
// 1. Her zaman Zod validation kullan (DTO'larda)
// 2. Service'lerde try/catch + Sentry.captureException
// 3. Database işlemlerinde transaction kullan (wallet değişiklikleri için zorunlu)
// 4. Token işlemlerini ATOMIK yap — kısmi başarı kabul edilemez
// 5. Real-time event'lerde Socket.io namespace kullan:
//    '/chat', '/notifications', '/stream', '/admin'

// Wallet transaction örneği (DOĞRU):
await db.transaction(async (tx) => {
  await tx.update(wallets).set({ balance: sql`balance - ${amount}` }).where(...)
  await tx.insert(walletTransactions).values({ type: 'debit', amount, ... })
})

// Hatalı — ASLA yapma:
await db.update(wallets)... // transaction olmadan
await db.insert(walletTransactions)... // ayrı sorgu
```

---

## Sık Başvurulan Linear Dokümanlar

- **Master Spec v8:** `spark-master-spec-v8-tum-kararlar-kesinlesti-b865d658c79d`
- **Token Economy v10:** `token-economy-kesin-spec-v10-b3dfe40b350e`
- **Env Variables:** `environment-variables-tum-servisler-master-reference-87338acd74d3`

---

## Başlarken — Checklist

Bir issue'ya başlamadan önce:

1. `CLAUDE.md` oku (bu dosya) ✓
2. Linear'da issue'yu aç ve tam spec'i oku
3. Hangi milestone'da olduğunu kontrol et
4. İlgili modülleri ve tablolari belirle
5. Kritik iş kurallarından etkilenen bir şey var mı kontrol et
6. Yaz, test et, commit et

---

*Son güncelleme: Tüm kararlar kesinleşmiş — OGU-138 ile kodlamaya başlanabilir.*
