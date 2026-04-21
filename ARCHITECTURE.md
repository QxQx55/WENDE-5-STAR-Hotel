# Clean Architecture Overview

## Layer Structure

```
┌─────────────────────────────────────────────────┐
│           Pages & Routes (src/pages/)           │
│  (HomePage, RoomsPage, LoginPage, SignupPage)   │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│         Components & Layouts                    │
│  (Reusable UI components + MainLayout)          │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│        Custom Hooks (src/hooks/)                │
│  (useRooms, useBookings, usePagination)         │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│   Service Layer (src/services/supabase.ts)      │
│  (All API calls organized by entity)            │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│        Type Definitions (src/types/)            │
│  (TypeScript interfaces & types)                │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  Supabase Backend (PostgreSQL + Auth)           │
└─────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx (Router)
  ├─ AuthProvider (Authentication Context)
  │  └─ AppRoutes
  │     ├─ LoginPage (Public)
  │     ├─ SignupPage (Public)
  │     ├─ HomePage (Public)
  │     ├─ RoomsPage (Public)
  │     ├─ AdminDashboard (Protected)
  │     └─ CustomerDashboard (Protected)
  │
  └─ MainLayout (Navigation + Layout)
     └─ Page Content
```

## Data Flow

```
User Interaction
    ↓
Page Component
    ↓
Custom Hook (useRooms, useBookings, etc.)
    ↓
Service Layer (roomService, bookingService, etc.)
    ↓
Supabase API
    ↓
Database
```

## Service Organization

Each service module exports methods organized by entity:

```typescript
// Room Service
roomService.getRooms()
roomService.getAvailableRooms()
roomService.createRoom()
roomService.updateRoom()
roomService.deleteRoom()

// Booking Service
bookingService.getBookings()
bookingService.getUserBookings()
bookingService.createBooking()
bookingService.updateBooking()
bookingService.cancelBooking()

// User Service
userService.getProfile()
userService.getUsers()
userService.updateProfile()

// Guest Service
guestService.getGuests()
guestService.createGuest()
guestService.updateGuest()

// Invoice Service
invoiceService.getInvoices()
invoiceService.createInvoice()
invoiceService.updateInvoice()

// Payment Service
paymentService.getPayments()
paymentService.recordPayment()

// Task Service
taskService.getTasks()
taskService.createTask()
taskService.updateTask()

// Review Service
reviewService.getReviews()
reviewService.createReview()
```

## Type System

```typescript
// Core Domain Types
User          // Authenticated user profile
Room          // Hotel room with details
Booking       // Guest reservation
Guest         // Guest information
Invoice       // Billing record
Payment       // Payment transaction
Task          // Staff task assignment
Review        // Guest review

// Enums/Unions
UserRole          // 'admin' | 'staff' | 'customer'
RoomType          // 'Standard' | 'Deluxe' | 'Suite' | 'Presidential'
RoomStatus        // 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance'
BookingStatus     // 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled'
InvoiceStatus     // 'Pending' | 'Partial' | 'Paid'
PaymentMethod     // 'Cash' | 'Card' | 'Mobile'
TaskStatus        // 'pending' | 'in_progress' | 'completed' | 'cancelled'
TaskPriority      // 'low' | 'medium' | 'high'

// Utility Types
PaginationParams  // { page, limit, offset }
PaginatedResponse // { data[], count, page, limit, total_pages }
ApiResponse       // { data, error }
ApiError          // { message, code?, details? }
```

## Hook Patterns

### Data Fetching Hook
```typescript
const { data, loading, error, refetch } = useHook();

// Handle loading
if (loading) return <Spinner />;

// Handle error
if (error) return <ErrorMessage error={error} />;

// Render data
return <Component data={data} />;
```

### Pagination Hook
```typescript
const { page, limit, getPaginationParams, goToPage, nextPage } = usePagination();

const params = getPaginationParams(); // { page, limit, offset }
```

## Routing Structure

```typescript
// Public Routes
GET  /              → HomePage
GET  /rooms         → RoomsPage
GET  /login         → LoginPage
GET  /signup        → SignupPage

// Protected Routes (require authentication)
GET  /admin         → AdminDashboard (admin/staff only)
GET  /dashboard     → AdminDashboard (admin/staff only)
GET  /bookings      → CustomerDashboard (customer only)

// Redirect Rules
- Authenticated user tries /login → redirect to /
- Unauthenticated user tries /admin → redirect to /login
- Unknown route → redirect to /
```

## Authentication Flow

```
User visits site
    ↓
AuthProvider checks session
    ↓
If logged in: Fetch user profile
    ↓
Profile loaded → User sees protected content
    ↓
If not logged in → User sees public pages only
    ↓
User clicks Sign In → LoginPage
    ↓
User submits credentials
    ↓
AuthContext.signIn() called
    ↓
authService.signIn() called
    ↓
Supabase Auth validates
    ↓
Profile fetched
    ↓
User redirected to home
```

## Error Handling Strategy

```typescript
// Service Layer
try {
  return await supabase.from('rooms').select('*');
} catch (error) {
  throw error; // Propagate to hook/component
}

// Hook Layer
try {
  const data = await roomService.getRooms();
  setRooms(data);
} catch (err) {
  setError(err); // Store error in state
}

// Component Layer
const { rooms, error } = useRooms();
if (error) {
  return <div>Error: {error.message}</div>;
}
```

## State Management

```
App State (AuthContext)
├─ user: User | null
├─ profile: Profile | null
├─ loading: boolean
└─ functions: signIn, signUp, signOut

Component State (useState)
├─ Form inputs
├─ Loading states
├─ Error states
└─ UI state

Hook State (useState)
├─ Data fetched from service
├─ Loading state
├─ Error state
└─ Refetch function
```

## Security Layers

1. **Authentication:** Supabase Auth with JWT
2. **Authorization:** Row Level Security (RLS) in database
3. **Type Safety:** TypeScript catches errors at compile time
4. **Input Validation:** Components validate before submission
5. **Error Handling:** Errors don't expose sensitive data

## Performance Optimizations

1. **Code Splitting:** React Router enables automatic route splitting
2. **Lazy Components:** Use React.lazy() for heavy components
3. **Memoization:** React.memo for expensive renders
4. **Hook Dependencies:** Proper dependency arrays prevent re-renders
5. **Service Caching:** Consider React Query for advanced caching

## Testing Strategy

### Unit Tests
```typescript
// Test services independently
test('roomService.getRooms returns array', async () => {
  const rooms = await roomService.getRooms();
  expect(Array.isArray(rooms)).toBe(true);
});
```

### Component Tests
```typescript
// Test components with mocked hooks
test('RoomsPage renders rooms', () => {
  const mockRooms = [{ id: '1', room_number: '101', ... }];
  // Mock useRooms hook
  // Render and assert
});
```

### Integration Tests
```typescript
// Test full user flow
test('User can book a room', async () => {
  // Login
  // Browse rooms
  // Create booking
  // Verify success
});
```

## Monitoring & Debugging

### Console Logging
```typescript
// In development
console.log('Fetching rooms...', { checkIn, checkOut });
```

### Error Tracking
```typescript
// Log errors to service
if (error) {
  console.error('Failed to fetch rooms:', error);
  // Could send to Sentry, LogRocket, etc.
}
```

### Performance Monitoring
```typescript
// Measure load times
console.time('fetch-rooms');
const rooms = await roomService.getRooms();
console.timeEnd('fetch-rooms');
```

---

**Next:** See REFACTORING_GUIDE.md for detailed migration instructions.
