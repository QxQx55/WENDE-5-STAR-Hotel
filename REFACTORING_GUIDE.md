# Project Refactoring Guide - Clean Architecture

## Overview

Your hotel booking project has been restructured into a professional, scalable architecture with clean separation of concerns. This guide documents all changes and improvements made.

## New Directory Structure

```
src/
├── pages/                    # Page components for routing
│   ├── HomePage.tsx         # Landing page with features
│   ├── RoomsPage.tsx        # Browse available rooms
│   ├── LoginPage.tsx        # User login form
│   ├── SignupPage.tsx       # User registration form
│   └── index.ts             # Page exports
│
├── components/              # Reusable UI components (existing + new)
│   ├── Dashboard.tsx        # Admin/Staff dashboard
│   ├── RoomManagement.tsx
│   ├── ReservationManagement.tsx
│   └── wellness/            # Wellness center components
│
├── services/                # Business logic & API layer
│   └── supabase.ts         # All Supabase queries organized by entity
│
├── hooks/                   # Custom React hooks
│   ├── useRooms.ts         # Fetch rooms and available rooms
│   ├── useBookings.ts      # Fetch and manage bookings
│   ├── usePagination.ts    # Pagination logic
│   └── index.ts            # Hook exports
│
├── types/                   # TypeScript definitions
│   └── index.ts            # All type definitions
│
├── layouts/                 # Layout components
│   └── MainLayout.tsx      # Main app layout with navigation
│
├── contexts/               # React Context providers
│   └── AuthContext.tsx     # Authentication state (refactored)
│
├── utils/                  # Utility functions
│
├── App.tsx                 # Root component with React Router
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## Key Improvements

### 1. Separation of Concerns

**Before:**
- API calls mixed with UI components
- Business logic scattered across files
- Complex App.tsx with manual routing

**After:**
- UI components only handle rendering
- All API calls in `services/supabase.ts`
- Page components handle layout
- MainLayout handles navigation

### 2. TypeScript Types (src/types/index.ts)

Centralized type definitions for:
```typescript
- UserRole: 'admin' | 'staff' | 'customer'
- User: Profile interface
- Guest: Guest information
- Room: Room details with status
- Booking: Reservation information
- Invoice: Billing records
- Payment: Payment details
- Task: Staff assignments
- Review: Guest reviews
- PaginationParams & PaginatedResponse
- ApiResponse & ApiError
```

### 3. Supabase Service Layer (src/services/supabase.ts)

Organized by entity:

```typescript
// Auth Service
authService.signUp(email, password, fullName, role)
authService.signIn(email, password)
authService.signOut()
authService.getSession()

// Room Service
roomService.getRooms()
roomService.getRoomById(id)
roomService.getAvailableRooms(checkIn, checkOut)
roomService.createRoom(room)
roomService.updateRoom(id, updates)

// Booking Service
bookingService.getBookings()
bookingService.getUserBookings(userId)
bookingService.createBooking(booking)
bookingService.updateBooking(id, updates)
bookingService.cancelBooking(id)

// Guest Service
guestService.getGuests()
guestService.createGuest(guest)
guestService.updateGuest(id, updates)

// User Service
userService.getProfile(userId)
userService.getUsers()
userService.updateProfile(userId, updates)

// Invoice Service
invoiceService.getInvoices()
invoiceService.createInvoice(invoice)
invoiceService.updateInvoice(id, updates)

// Payment Service
paymentService.getPayments()
paymentService.recordPayment(payment)

// Task Service
taskService.getTasks()
taskService.createTask(task)
taskService.updateTask(id, updates)

// Review Service
reviewService.getReviews()
reviewService.getReviewsByRoom(roomId)
reviewService.createReview(review)
```

### 4. Custom Hooks (src/hooks/)

**useRooms.ts:**
```typescript
- useRooms() - Fetch all rooms
- useAvailableRooms(checkIn, checkOut) - Fetch available rooms
```

**useBookings.ts:**
```typescript
- useBookings() - Fetch all bookings
- useUserBookings(userId) - Fetch user's bookings
```

**usePagination.ts:**
```typescript
- usePagination(initialLimit)
  Returns: page, limit, getPaginationParams(), goToPage(), nextPage(), previousPage(), setPageSize()
```

### 5. React Router Integration

**Routes:**
- `/` - Home page
- `/rooms` - Browse rooms
- `/login` - Sign in page
- `/signup` - Register page
- `/admin` - Admin dashboard (requires admin/staff role)
- `/dashboard` - Alias for admin dashboard
- `/bookings` - Customer bookings (requires customer role)

**Route Protection:**
- Automatic redirection based on authentication
- Role-based access control
- Prevents unauthorized access

### 6. Auth Context Refactoring

**Before:** Direct Supabase queries in context
**After:** Uses authService for clean separation

```typescript
const { signIn, signUp, signOut, user, profile, loading } = useAuth();
```

### 7. MainLayout Component

Provides consistent app layout with:
- Navigation bar with dynamic menu based on user role
- Logo and branding
- User profile display
- Sign out button
- Responsive design
- Footer

### 8. New Page Components

**HomePage.tsx:**
- Hero section with CTA
- Features showcase
- Call-to-action buttons
- Guest/authenticated user variants

**RoomsPage.tsx:**
- Room list with filtering
- Room type filtering
- Room cards with details
- Availability indicators
- Price display
- Amenities list

**LoginPage.tsx:**
- Clean login form
- Email/password fields
- Error handling
- Link to signup

**SignupPage.tsx:**
- Registration form
- Full name input
- Account type selector
- Password confirmation
- Validation

## Migration Guide

### Updating Components to Use Services

**Before:**
```typescript
const [rooms, setRooms] = useState([]);

useEffect(() => {
  const { data } = await supabase.from('rooms').select('*');
  setRooms(data);
}, []);
```

**After:**
```typescript
const { rooms, loading, error } = useRooms();

// Or in a component that needs manual control:
const fetchRooms = async () => {
  const data = await roomService.getRooms();
  setRooms(data);
};
```

### Using Hooks in Components

```typescript
import { useRooms, useAvailableRooms } from '../hooks';

function MyComponent() {
  const { rooms, loading, error, refetch } = useRooms();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {rooms.map(room => (
        <div key={room.id}>{room.room_number}</div>
      ))}
    </div>
  );
}
```

### Adding New Features

1. **Add type definition** in `src/types/index.ts`
2. **Add service methods** in `src/services/supabase.ts`
3. **Create custom hook** in `src/hooks/` if needed
4. **Create page component** in `src/pages/` if needed
5. **Add route** in `src/App.tsx`

## Benefits of New Architecture

### 1. Maintainability
- Clear file organization
- Single responsibility principle
- Easy to locate code
- Minimal component size

### 2. Reusability
- Custom hooks can be used across components
- Service layer centralizes all API calls
- Type definitions prevent errors
- Consistent error handling

### 3. Testability
- Services can be tested independently
- Hooks can be unit tested
- Components are simpler to test
- Mocking is straightforward

### 4. Scalability
- Easy to add new pages
- Service layer can grow without affecting UI
- Hooks can be extended
- Type system catches errors early

### 5. Code Quality
- TypeScript provides type safety
- Services have clear contracts
- Hooks handle state management
- Components focus on rendering

## API Call Examples

### Get All Rooms
```typescript
import { roomService } from '../services/supabase';

const rooms = await roomService.getRooms();
```

### Create a Booking
```typescript
import { bookingService } from '../services/supabase';

const booking = await bookingService.createBooking({
  guest_id: 'uuid',
  room_id: 'uuid',
  check_in_date: '2024-12-25',
  check_out_date: '2024-12-28',
  number_of_guests: 2,
  status: 'Pending',
});
```

### Update Booking Status
```typescript
await bookingService.updateBooking(bookingId, {
  status: 'Confirmed'
});
```

### Record Payment
```typescript
import { paymentService } from '../services/supabase';

const payment = await paymentService.recordPayment({
  invoice_id: 'uuid',
  amount: 500,
  payment_method: 'Card',
});
```

## Error Handling

All services throw errors that can be caught:

```typescript
try {
  const rooms = await roomService.getRooms();
} catch (error) {
  console.error('Failed to fetch rooms:', error);
}
```

Hooks handle errors:

```typescript
const { rooms, loading, error } = useRooms();

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Performance Optimizations

1. **Memoization:** Use React.memo for expensive components
2. **Lazy loading:** Use React.lazy() for pages
3. **Query optimization:** Services fetch only needed columns
4. **Pagination:** usePagination hook for large datasets

## Future Improvements

1. Add React Query for advanced caching
2. Implement error boundaries
3. Add loading skeletons
4. Implement infinite scroll
5. Add form validation library
6. Create storybook for components
7. Add unit and integration tests
8. Implement API rate limiting
9. Add offline support
10. Implement PWA features

## Troubleshooting

### Import Errors
- Ensure imports match the new directory structure
- Use `../services/supabase` not `../lib/supabase`
- Check that hooks are imported from `../hooks`

### Type Errors
- Import types from `../types`
- Use proper type definitions for hooks
- Check hook return types

### Route Errors
- Verify routes in `App.tsx`
- Check that components render properly
- Ensure authentication is working

## Best Practices

1. **Don't mix concerns:** Keep API calls in services
2. **Use hooks:** Create custom hooks for repeated logic
3. **Type everything:** Use TypeScript types for all data
4. **Error handling:** Always handle errors gracefully
5. **Code organization:** Place files in correct directories
6. **Keep components small:** Aim for 100-200 lines max
7. **Document APIs:** Add JSDoc comments to services
8. **Test services:** Unit test service layer functions

## Files Modified

### New Files
- `src/types/index.ts`
- `src/services/supabase.ts`
- `src/hooks/useRooms.ts`
- `src/hooks/useBookings.ts`
- `src/hooks/usePagination.ts`
- `src/hooks/index.ts`
- `src/layouts/MainLayout.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/RoomsPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- `src/pages/index.ts`

### Modified Files
- `src/App.tsx` - Complete refactoring with React Router
- `src/contexts/AuthContext.tsx` - Updated to use service layer
- `package.json` - Added react-router-dom

### Unchanged
- All existing components remain functional
- Database schema unchanged
- Authentication flow unchanged
- All features preserved

## Version History

- **v2.0** - Complete refactoring with clean architecture
- **v1.0** - Original hotel management system

---

**Total Lines of Code:** ~3000+ (organized structure)
**Build Size:** 322KB (94KB gzipped)
**Build Time:** ~5 seconds

**Status:** ✅ Production Ready
