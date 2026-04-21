# Quick Start Guide - Hotel Management System

## Getting Started

### 1. Create Your First Account

#### Admin Account
1. Go to the login page
2. Click "Create Account"
3. Fill in:
   - Full Name: (your name)
   - Account Type: **Administrator**
   - Email: admin@hotel.com
   - Password: (6+ characters)
4. Click "Create Account"

#### Staff Account
1. Create another account with:
   - Account Type: **Staff Member**
   - Email: staff@hotel.com

#### Customer Account
1. Create a customer account with:
   - Account Type: **Customer**
   - Email: customer@hotel.com

### 2. Admin Setup

After logging in as Admin:

1. **Create Rooms**
   - Click "Add Room" in the Admin Dashboard
   - Fill in room details:
     - Room Number: 101, 102, 103, etc.
     - Type: Standard, Deluxe, Suite, or Presidential
     - Price: e.g., 150, 200, 350, 500
     - Max Occupancy: 2, 4, 2, 6
     - Floor: 1, 2, 3, etc.
   - Click "Save Room"

2. **Create Staff Users**
   - Have team members sign up with "Staff Member" role
   - Assign tasks from the admin dashboard

3. **View Dashboard Metrics**
   - Monitor occupancy rate
   - Track revenue
   - See pending payments
   - Monitor active bookings

### 3. Staff Operations

After logging in as Staff:

1. **Task Management**
   - View assigned tasks in "My Tasks"
   - Update task status:
     - Pending → In Progress → Completed
   - Track priority (High, Medium, Low)

2. **Booking Management**
   - View all bookings
   - Update booking status:
     - Pending → Confirmed → Checked-In → Checked-Out
   - See special guest requests
   - Monitor today's check-ins and check-outs

3. **Quick Stats**
   - See pending tasks count
   - Track completed tasks
   - Monitor guest arrivals/departures

### 4. Customer Booking

After logging in as Customer:

1. **Browse Available Rooms**
   - See room types and pricing
   - View available inventory

2. **Create a Booking**
   - Click "Book a Room"
   - Enter:
     - Check-in date
     - Check-out date
     - Number of guests
     - Special requests (optional)
   - Select room from list
   - Click "Confirm Booking"

3. **Manage Bookings**
   - View upcoming bookings
   - See booking status
   - Cancel pending bookings if needed
   - Review past stays

4. **Update Profile**
   - Add phone number
   - Add bio/preferences
   - Upload profile image

## Common Workflows

### Booking a Guest (Admin/Staff)

1. Go to Reservations
2. Create new reservation
3. Select guest or create new guest
4. Choose room and dates
5. Add special requests
6. Set status to "Confirmed"

### Processing a Payment

1. Go to Billing Management
2. View pending invoices
3. Record payment:
   - Amount
   - Payment method
   - Transaction reference
4. Invoice updates automatically to "Paid" when full payment received

### Assigning a Task

1. As Admin, view Staff Tasks
2. Create new task:
   - Description
   - Assign to staff member
   - Set priority (High/Medium/Low)
   - Set due date
   - Link to room if needed
3. Staff member sees task in dashboard
4. Staff updates status as work progresses

### Check-in Process

1. Staff sees today's check-ins on dashboard
2. Confirm booking status
3. Update to "Checked-In"
4. Assign housekeeping tasks if needed

### Check-out Process

1. Staff updates booking status to "Checked-Out"
2. System marks room as available for cleaning
3. Verify all charges added to invoice
4. Process final payment

## Dashboard Features by Role

### Admin Dashboard
- **Metrics**: Total users, rooms, bookings, revenue
- **Occupancy**: Real-time occupancy rate with progress bar
- **Room Management**: Add, edit, delete rooms
- **Room Status**: Available/Occupied/Cleaning/Maintenance
- **Financial**: Revenue, pending payments overview
- **Task Management**: Create and assign tasks

### Staff Dashboard
- **Task Stats**: Pending, In Progress, Completed counts
- **My Tasks**: List of assigned tasks with priority
- **Task Updates**: Change status directly from task list
- **Bookings**: View all bookings
- **Booking Updates**: Change reservation status
- **Daily Stats**: Today's check-ins and check-outs

### Customer Dashboard
- **Upcoming Bookings**: Organized by date
- **Available Rooms**: Browse room types and prices
- **Book a Room**: Quick booking interface
- **Special Requests**: Add notes for your stay
- **Past Stays**: Review completed bookings
- **My Profile**: Manage personal information

## Tips & Best Practices

### For Admins
- Create rooms before opening bookings
- Set realistic pricing based on demand
- Monitor occupancy rate weekly
- Track revenue trends
- Keep customer contact information updated

### For Staff
- Check dashboard daily for new tasks
- Update task status frequently
- Confirm bookings before guest arrival
- Note special requests prominently
- Report issues immediately

### For Customers
- Book well in advance for better availability
- Add special requests (accessibility needs, early check-in, etc.)
- Keep contact information up to date
- Provide feedback after stay
- Review past bookings for reference

## Troubleshooting

### Can't Sign Up
- **Issue**: "Failed to create account"
- **Solution**: 
  - Check email format is valid
  - Ensure password is 6+ characters
  - Wait 5 seconds before retrying
  - Check browser console for detailed errors

### Can't See Dashboard
- **Issue**: Redirected to login
- **Solution**:
  - Clear browser cache
  - Sign out and back in
  - Check that profile was created (check browser console)

### Room Not Appearing
- **Issue**: Created room doesn't show up
- **Solution**:
  - Refresh page
  - Check room status is "Available"
  - Verify room is on the correct property

### Booking Status Won't Update
- **Issue**: Can't change booking status
- **Solution**:
  - Check user role has permission
  - Verify booking isn't already completed
  - Try refreshing the page

## Contact & Support

For technical issues:
1. Check this Quick Start guide
2. Review BACKEND_DOCUMENTATION.md for detailed info
3. Check browser console for error messages
4. Contact system administrator

## Next Steps

1. **Customize Branding** - Add hotel logo and colors
2. **Setup Email Notifications** - Configure email templates
3. **Configure Payment Gateway** - Integrate Stripe or similar
4. **Create Guest Tiers** - Set up VIP/loyalty programs
5. **Add Services** - Room service, spa, dining options
6. **Setup Reporting** - Configure automated reports
7. **Mobile App** - Deploy to iOS/Android
8. **Integrations** - Connect with channel managers, OTAs
