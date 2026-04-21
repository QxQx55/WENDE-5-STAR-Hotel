# 5-Star Hotel Management System - Backend Documentation

## Overview

A complete backend system for a 5-star hotel management platform with secure authentication, role-based access control, and comprehensive booking/payment management.

## Architecture

### Database Schema

#### Users & Authentication
- **profiles** - User profiles with roles (admin, staff, customer)
  - id (uuid, foreign key to auth.users)
  - email (unique)
  - full_name
  - role (enum: admin, staff, customer)
  - phone
  - bio
  - profile_image_url
  - created_at, updated_at

#### Room Management
- **rooms** - Hotel room inventory
  - id (uuid, primary key)
  - room_number (unique)
  - room_type (Standard, Deluxe, Suite, Presidential)
  - price_per_night (decimal)
  - status (Available, Occupied, Cleaning, Maintenance)
  - max_occupancy (integer)
  - amenities (array)
  - floor (integer)
  - created_at, updated_at

#### Reservations & Bookings
- **reservations** - Guest bookings
  - id (uuid)
  - guest_id (foreign key)
  - room_id (foreign key)
  - check_in_date
  - check_out_date
  - number_of_guests
  - status (Pending, Confirmed, Checked-In, Checked-Out, Cancelled)
  - special_requests
  - created_by (staff user who created booking)
  - created_at, updated_at

- **guests** - Guest information
  - id (uuid)
  - first_name, last_name
  - email
  - phone
  - id_number (unique)
  - nationality
  - address
  - created_at, updated_at

#### Financial Management
- **invoices** - Billing records
  - id (uuid)
  - reservation_id (foreign key)
  - invoice_number (unique)
  - room_charges, service_charges
  - subtotal, tax_amount, total_amount
  - payment_status (Pending, Partial, Paid)
  - created_at

- **payments** - Payment transactions
  - id (uuid)
  - invoice_id (foreign key)
  - amount
  - payment_method (Cash, Card, Mobile)
  - transaction_reference
  - paid_at
  - received_by (staff user)

#### Staff Management
- **staff_tasks** - Task assignments
  - id (uuid)
  - staff_id (foreign key to profiles)
  - task_description
  - status (pending, in_progress, completed, cancelled)
  - priority (low, medium, high)
  - due_date
  - room_id (optional)
  - assigned_by (admin user)
  - assigned_at, completed_at

#### Reviews & Feedback
- **reviews** - Guest reviews
  - id (uuid)
  - user_id (foreign key)
  - room_id (foreign key)
  - booking_id (foreign key)
  - rating (1-5)
  - comment
  - created_at, updated_at

## Authentication System

### Signup Flow
1. User provides email, password, full name, and role
2. Supabase Auth creates user with email/password
3. User metadata stores role and full_name
4. Trigger `on_auth_user_created` automatically creates profile record
5. User is redirected to appropriate dashboard based on role

### Signin Flow
1. User enters email and password
2. Supabase Auth validates credentials
3. Profile is fetched from profiles table
4. User is redirected to role-based dashboard

### Password Reset
- Built-in Supabase Auth password reset via email link

## Role-Based Access Control

### Admin Dashboard
**Permissions:**
- View all users, guests, and staff
- Create, update, delete rooms
- View all bookings and reservations
- Monitor financial metrics (revenue, pending payments)
- Assign tasks to staff
- Generate reports and analytics

**Access:**
- Can view all data in the system
- Can modify system configuration
- Can manage all users and resources

### Staff Dashboard
**Permissions:**
- View assigned tasks
- Update task status
- View all bookings
- Update booking status
- Check-in/check-out guests
- View daily statistics

**Access:**
- Can only view and update their assigned tasks
- Can view all bookings (read-only except status)
- Cannot access financial or user management

### Customer Dashboard
**Permissions:**
- Browse available rooms
- Create bookings
- View own booking history
- Cancel own pending bookings
- Update own profile
- View booking details and special requests

**Access:**
- Can only view/modify their own data
- Cannot access other guests' information
- Cannot access financial or staff areas

## Row Level Security (RLS) Policies

All tables have RLS enabled with restrictive policies:

### profiles
- Users can view their own profile
- Admins can view all profiles
- Users can update their own profile (except role)
- Admins can update any profile

### rooms
- Authenticated users can view all rooms
- Only admins can insert/update/delete rooms

### reservations
- Customers see only their own reservations
- Staff and admins see all reservations
- Customers can only update status of pending reservations
- Staff/admins can update any reservation

### payments
- Users can view payments for their bookings
- Staff/admins can manage all payments

### staff_tasks
- Staff can view their own tasks
- Admins can view all tasks
- Staff can update their own tasks
- Admins can create/update all tasks

### guests
- All authenticated users can view guests
- Staff/admins can modify guest records

## Edge Functions API

### Authentication Endpoints

#### /auth-signup (POST)
Creates a new user account.
```json
{
  "email": "user@hotel.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "role": "customer"
}
```

#### /auth-login (POST)
Authenticates user and returns JWT token.
```json
{
  "email": "user@hotel.com",
  "password": "securepass123"
}
```

### Room Management

#### /room-management?action=list (GET)
Lists all rooms with availability status.

#### /room-management?action=available (GET)
Lists available rooms for booking.

#### /room-management (POST)
Creates a new room (admin only).

#### /room-management?id={roomId} (PUT)
Updates room details (admin only).

#### /room-management?id={roomId} (DELETE)
Deletes a room (admin only).

### Booking Management

#### /booking-management (GET)
Lists bookings (with optional user_id filter).

#### /booking-management (POST)
Creates a new booking.
```json
{
  "guest_id": "uuid",
  "room_id": "uuid",
  "check_in_date": "2024-12-25",
  "check_out_date": "2024-12-28",
  "number_of_guests": 2,
  "special_requests": "Early check-in if possible"
}
```

#### /booking-management?id={bookingId} (PUT)
Updates booking status.

#### /booking-management?id={bookingId} (DELETE)
Cancels a booking.

### Payment Management

#### /payment-management (GET)
Lists payments (with optional invoice_id filter).

#### /payment-management (POST)
Records a payment.
```json
{
  "invoice_id": "uuid",
  "amount": 500.00,
  "payment_method": "card",
  "transaction_reference": "TXN123456"
}
```

### User Management

#### /user-management?action=list (GET)
Lists all users (admin only).

#### /user-management?id={userId} (GET)
Gets user profile details.

#### /user-management?id={userId} (PUT)
Updates user profile.

#### /user-management?id={userId} (DELETE)
Deactivates/deletes user (admin only).

### Analytics

#### /analytics?action=dashboard (GET)
Gets key dashboard metrics:
- Total bookings
- Total revenue
- Occupied rooms
- Total guests
- Total users

#### /analytics?action=revenue (GET)
Gets revenue analytics and payment history.

#### /analytics?action=occupancy (GET)
Gets room occupancy statistics.

## Frontend Components

### Login
- Email/password sign-in
- Account creation with role selection
- Account type descriptions
- Error handling and validation

### AdminDashboard
- Key metrics cards (users, rooms, bookings, revenue)
- Occupancy rate tracking
- Room management interface
- Add/edit/delete room functionality
- Room status indicators
- Financial summary

### StaffDashboard
- Task statistics (pending, in-progress, completed)
- Task list with priority and due dates
- Booking list with status management
- Check-in/check-out counters
- Task status updates

### CustomerDashboard
- Quick stats (upcoming bookings, available rooms, past stays)
- Booking management (view, cancel)
- Room booking interface
- Special requests input
- Available rooms preview
- Past stays history

## Security Features

### Authentication
- Supabase Auth with email/password
- JWT token-based sessions
- Password hashing (bcrypt)
- Secure password reset via email

### Authorization
- Row Level Security on all tables
- Role-based access control
- User data isolation
- Admin-only operations

### Data Protection
- Foreign key constraints
- Data validation on all inputs
- CORS headers on Edge Functions
- Error handling without exposing sensitive data

## Setup & Deployment

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Initialization
1. Migrations automatically create all tables
2. RLS policies are created during migrations
3. Auth trigger is created for auto-profile generation

### Edge Function Deployment
Functions are automatically deployed with the provided tools:
- auth-signup
- auth-login
- user-management
- room-management
- booking-management
- payment-management
- analytics

## Testing Checklist

- [ ] Create admin account and test admin dashboard
- [ ] Create staff account and test staff dashboard
- [ ] Create customer account and test customer dashboard
- [ ] Verify role-based menu items appear correctly
- [ ] Test room creation/deletion (admin only)
- [ ] Test booking creation and cancellation
- [ ] Test task assignment and updates
- [ ] Verify RLS policies restrict access correctly
- [ ] Test payment recording
- [ ] Verify analytics calculations
- [ ] Test user profile updates
- [ ] Verify email validation on signup

## Performance Considerations

### Indexes
Indexes are created on frequently queried columns:
- users.role, users.email
- rooms.status, rooms.type
- bookings.user_id, bookings.room_id, bookings.status, bookings.dates
- payments.booking_id, payments.status
- tasks.staff_id, tasks.status

### Query Optimization
- Pagination implemented on list endpoints
- Selective column queries
- Relationship joins only when needed

## Common Issues & Solutions

### "Failed to create account"
- Check that Supabase Auth is configured
- Verify email format is valid
- Ensure password meets minimum requirements (6+ characters)

### Profile not created on signup
- Trigger may not have executed; migration includes safety checks
- Auth context includes fallback profile creation

### RLS permission denied errors
- Ensure user is authenticated
- Verify user role matches policy requirements
- Check that user ID matches the data ownership

## Future Enhancements

- [ ] Multi-property support
- [ ] Advanced reporting and analytics
- [ ] Email notifications for bookings
- [ ] SMS notifications for check-in/out
- [ ] Guest communication system
- [ ] Housekeeping workflow
- [ ] Maintenance scheduling
- [ ] Pricing rules engine
- [ ] Loyalty program integration
- [ ] PMS integration with other systems
