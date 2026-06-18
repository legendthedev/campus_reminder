# Bespoke Market

A scalable global e-commerce marketplace for the bespoke fashion industry, connecting clients with independent tailors and logistics providers.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend API | Python 3.12 + FastAPI + SQLAlchemy |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Real-time | WebSocket (FastAPI) |
| AI Engine | Python — measurement validation, recommendations, chat analysis |
| Auth | JWT + bcrypt + Google OAuth support |

## Three Role-Based Portals

### Client Portal
- Gender-based apparel browsing (casual, traditional, corporate)
- Marketplace with search and filters
- Ready-made and bespoke order placement
- Body measurement submission with AI verification
- Delivery fee calculation based on coordinates
- Order tracking

### Tailor Portal
- Digital storefront management (CRUD items, pricing, stock)
- Order processing with status workflow
- Revenue analytics dashboard
- Production timeline tracking

### Logistics Portal
- Available order claiming
- Waybill generation
- Delivery status progression (shipped → in transit → delivered)
- Waybill-based shipment tracking
- Distance-based fee calculation

### Cross-Portal Chat
- WebSocket real-time messaging
- AI-powered chat analysis (dispute detection, sentiment, delivery predictions)
- Encrypted data channels

### AI Engine
- Body measurement validation against anthropometric ranges
- Structural ratio verification
- Personalized clothing recommendations by gender/category
- Chat transcript analysis for dispute flags and delivery milestones

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## API Endpoints

### Auth
- `POST /api/auth/register` — Register with role
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/google` — Google OAuth
- `GET /api/auth/me` — Current user

### Client
- `PUT /api/client/profile` — Update profile
- `GET /api/client/marketplace` — Browse items
- `GET /api/client/tailors` — Browse tailors
- `POST /api/client/orders` — Place order
- `GET /api/client/orders` — List orders
- `POST /api/client/delivery-fee` — Calculate delivery fee

### Tailor
- `PUT /api/tailor/profile` — Update profile
- `POST /api/tailor/storefront` — Add item
- `GET /api/tailor/storefront` — List items
- `PUT /api/tailor/storefront/:id` — Update item
- `DELETE /api/tailor/storefront/:id` — Delete item
- `GET /api/tailor/orders` — List orders
- `PUT /api/tailor/orders/:id/status` — Update status
- `GET /api/tailor/analytics` — Revenue analytics

### Logistics
- `PUT /api/logistics/profile` — Update profile
- `GET /api/logistics/available-orders` — Available pickups
- `POST /api/logistics/orders/:id/claim` — Claim order
- `PUT /api/logistics/orders/:id/transit` — Mark in transit
- `PUT /api/logistics/orders/:id/delivered` — Mark delivered
- `GET /api/logistics/my-deliveries` — My deliveries
- `GET /api/logistics/tracking/:waybill` — Track by waybill

### Chat
- `POST /api/chat/rooms` — Create room
- `GET /api/chat/rooms` — List rooms
- `POST /api/chat/rooms/:id/messages` — Send message
- `GET /api/chat/rooms/:id/messages` — Get messages
- `GET /api/chat/rooms/:id/analysis` — AI analysis

### AI
- `POST /api/ai/validate-measurements` — Validate measurements
- `GET /api/ai/recommendations` — Get recommendations

### WebSocket
- `ws://localhost:8000/ws/chat/:room_id?token=...` — Real-time chat

## Environment Variables

```env
DATABASE_URL=sqlite:///./bespoke_market.db
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```
