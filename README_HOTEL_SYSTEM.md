# 5-Star Hotel Management System

A complete, production-ready hotel management platform built with React, TypeScript, Supabase, and Tailwind CSS.

## Quick Links

📚 **Documentation**
- [System Overview](./SYSTEM_OVERVIEW.md) - Complete system features and architecture
- [Backend Documentation](./BACKEND_DOCUMENTATION.md) - Technical reference and API docs
- [Quick Start Guide](./QUICK_START.md) - Getting started and common workflows

## What You Get

### Core System
✅ **Authentication** - Secure signup/login with role assignment  
✅ **Role-Based Access** - Admin, Staff, and Customer dashboards  
✅ **Room Management** - Full CRUD operations for hotel rooms  
✅ **Booking System** - Complete reservation management  
✅ **Payment Tracking** - Financial records and invoicing  
✅ **Staff Tasks** - Task assignment and tracking  
✅ **Analytics** - Real-time metrics and reporting  
✅ **Security** - Row Level Security and role-based authorization  

### Dashboards

**Admin Dashboard**
- System overview with key metrics
- Room management interface
- User and staff management
- Financial analytics
- Task assignment
- Occupancy tracking

**Staff Dashboard**
- Task management with priority
- Booking status updates
- Check-in/check-out management
- Daily operation stats
- Task completion tracking

**Customer Dashboard**
- Browse available rooms
- Create and manage bookings
- View booking history
- Cancel reservations
- Profile management
- Special requests

### Features
- 8+ core database tables
- 25+ Row Level Security policies
- 7 Edge Functions for APIs
- 15+ performance indexes
- Responsive design
- Real-time analytics
- Complete authentication flow

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Default Test Accounts

After signup, try these account types:

1. **Admin Account**
   - Email: admin@hotel.com
   - Password: admin123456
   - Role: Administrator

2. **Staff Account**
   - Email: staff@hotel.com
   - Password: staff123456
   - Role: Staff Member

3. **Customer Account**
   - Email: customer@hotel.com
   - Password: customer123
   - Role: Customer

(Create accounts through the signup page for testing)

## File Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx          # Admin interface
│   ├── StaffDashboard.tsx          # Staff operations
│   ├── CustomerDashboard.tsx       # Guest booking
│   ├── Login.tsx                   # Authentication
│   ├── RoomManagement.tsx
│   ├── ReservationManagement.tsx
│   ├── BillingManagement.tsx
│   └── ... (other components)
├── contexts/
│   └── AuthContext.tsx             # Authentication context
├── lib/
│   └── supabase.ts                 # Supabase client
├── App.tsx                         # Main app with routing
└── main.tsx                        # Entry point

supabase/
├── migrations/                     # Database migrations
└── functions/                      # Edge Functions
    ├── auth-signup/
    ├── auth-login/
    ├── user-management/
    ├── room-management/
    ├── booking-management/
    ├── payment-management/
    └── analytics/
```

## Key Components

### Authentication
- Supabase Auth with email/password
- JWT-based sessions
- Automatic profile creation
- Role-based redirects

### Database
- PostgreSQL via Supabase
- Row Level Security
- Foreign key relationships
- 15+ performance indexes

### APIs
- 7 Edge Functions
- RESTful endpoints
- Error handling
- CORS support

## Architecture Diagram

```
Frontend (React)
    ↓
AuthContext (State Management)
    ↓
Login / Dashboards (Components)
    ↓
Supabase Client
    ├→ Supabase Auth (Authentication)
    ├→ PostgreSQL DB (Data)
    └→ Edge Functions (APIs)
        ├→ auth-signup
        ├→ auth-login
        ├→ user-management
        ├→ room-management
        ├→ booking-management
        ├→ payment-management
        └→ analytics
```

## Database Schema

### Core Tables
- `profiles` - Users with roles
- `rooms` - Hotel room inventory
- `reservations` - Guest bookings
- `guests` - Guest information
- `invoices` - Billing records
- `payments` - Payment transactions
- `staff_tasks` - Task assignments
- `reviews` - Guest feedback

### Security
- All tables have RLS enabled
- 25+ access control policies
- Data isolation by role
- Admin-only operations

## API Endpoints

### Authentication
```
POST /auth-signup        - Create account
POST /auth-login         - Login
```

### Users
```
GET  /user-management?action=list     - List users
GET  /user-management?id={id}         - Get user
PUT  /user-management?id={id}         - Update user
DELETE /user-management?id={id}       - Delete user
```

### Rooms
```
GET  /room-management?action=list     - List rooms
POST /room-management                 - Create room
PUT  /room-management?id={id}         - Update room
DELETE /room-management?id={id}       - Delete room
```

### Bookings
```
GET  /booking-management              - List bookings
POST /booking-management              - Create booking
PUT  /booking-management?id={id}      - Update booking
DELETE /booking-management?id={id}    - Cancel booking
```

### Payments
```
GET  /payment-management              - List payments
POST /payment-management              - Record payment
```

### Analytics
```
GET  /analytics?action=dashboard      - Metrics
GET  /analytics?action=revenue        - Revenue
GET  /analytics?action=occupancy      - Occupancy
```

## Features by Role

### Admin Can
- ✅ Create and manage rooms
- ✅ View all users and bookings
- ✅ Track financial metrics
- ✅ Assign tasks to staff
- ✅ Manage customer accounts
- ✅ View analytics and reports

### Staff Can
- ✅ View and update assigned tasks
- ✅ Manage booking statuses
- ✅ Check guests in/out
- ✅ View bookings
- ✅ Track daily operations

### Customer Can
- ✅ Browse available rooms
- ✅ Create bookings
- ✅ Cancel pending bookings
- ✅ View booking history
- ✅ Update profile
- ✅ Add special requests

## Performance

- Optimized queries with indexes
- Pagination on list endpoints
- Lazy loading of components
- Efficient state management
- CORS headers for APIs
- Database connection pooling

## Security

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Row Level Security
- ✅ Role-based authorization
- ✅ Input validation
- ✅ CORS headers
- ✅ Secure API endpoints
- ✅ Error messages without sensitive data

## Testing

Run these test flows:

1. **Authentication**
   - Sign up with each role
   - Sign in
   - View role-specific dashboard
   - Sign out

2. **Admin Operations**
   - Create room
   - Edit room
   - Delete room
   - View analytics

3. **Customer Operations**
   - Browse rooms
   - Create booking
   - Cancel booking
   - View history

4. **Staff Operations**
   - View tasks
   - Update task status
   - View bookings
   - Update booking status

## Troubleshooting

### Issue: "Failed to create account"
**Solution**: Check that email is valid and password is 6+ characters

### Issue: Can't see dashboard
**Solution**: Clear cache and sign out/back in

### Issue: Can't create room
**Solution**: Ensure logged in as admin

### Issue: Booking not visible
**Solution**: Refresh page and verify user role

## Deployment

### Prerequisites
- Supabase project (provided)
- PostgreSQL database (provided)
- Edge Functions deployed (included)

### Steps
1. Set environment variables
2. Run `npm run build`
3. Deploy dist/ folder to hosting
4. Verify database migrations
5. Test authentication flow

### Hosting Options
- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3
- Firebase Hosting

## Support

For help:
1. Check [QUICK_START.md](./QUICK_START.md)
2. Review [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
3. Check [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)
4. Inspect browser console for errors
5. Review Supabase dashboard

## Technology Stack

**Frontend**
- React 18.3
- TypeScript 5.5
- Vite 5.4
- Tailwind CSS 3.4
- Lucide React 0.344

**Backend**
- Supabase (PostgreSQL)
- Supabase Auth
- Edge Functions (Deno)

**Tools**
- ESLint
- TypeScript compiler
- Autoprefixer
- PostCSS

## Performance Metrics

- Build size: ~437KB (108KB gzipped)
- Build time: ~6 seconds
- No runtime dependencies beyond Supabase
- Optimized for mobile and desktop

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Contributing

Feel free to:
- Add features
- Improve UI/UX
- Optimize performance
- Add new components
- Fix bugs

## Next Steps

1. **Read**: Review QUICK_START.md
2. **Setup**: Create test accounts
3. **Explore**: Try each dashboard
4. **Customize**: Modify for your needs
5. **Deploy**: Push to production

## Version History

- **v1.0** (2026-04-21) - Initial release
  - Complete backend system
  - Three role-based dashboards
  - Full authentication
  - Room and booking management
  - Financial tracking
  - Analytics dashboard

## License

This system is provided as-is for use in your hotel management project.

---

**Ready to get started?** See [QUICK_START.md](./QUICK_START.md)

**Need technical details?** Check [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)

**Want an overview?** Read [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)
