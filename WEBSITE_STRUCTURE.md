# KBC Brake & Clutch - Complete Website Structure

## PUBLIC WEBSITE

### Homepage
- **Route**: `/` 
- **File**: `/app/page.tsx`
- **Features**: Hero section, featured products, services grid, testimonials carousel, stats cards, CTAs

### Products Catalog
- **Route**: `/products`
- **File**: `/app/products/page.tsx`
- **Features**: Product listing, advanced filtering (category/type), search by name/SKU, responsive grid with 145+ products

### Product Details
- **Route**: `/products/[id]`
- **File**: `/app/products/[id]/page.tsx`
- **Features**: Full product specifications, image gallery, related products, enquiry forms

### About Page
- **Route**: `/about`
- **File**: `/app/about/page.tsx`
- **Features**: Company history, mission/vision, team, values

### Services Page
- **Route**: `/services`
- **File**: `/app/services/page.tsx`
- **Features**: Service offerings, benefits, industries served

### Contact Page
- **Route**: `/contact`
- **File**: `/app/contact/page.tsx`
- **Features**: Contact form, business hours, location, support information, contact details

### Navigation
- **Navbar**: `/components/navigation/navbar.tsx` - Sticky header with logo, menu, search, login button
- **Footer**: `/components/navigation/footer.tsx` - Company info, links, contact details

---

## CUSTOMER PORTAL

### Customer Login
- **Route**: `/login`
- **File**: `/app/login/page.tsx`
- **Features**: Email/password authentication, remember me, modern gradient design
- **Action**: Redirects to `/dashboard` on successful login

### Customer Dashboard (PORTAL)
- **Route**: `/dashboard`
- **File**: `/app/dashboard/page.tsx`
- **Features**: Multi-tab interface with 5 main sections

#### Dashboard Tabs:

1. **Overview Tab**
   - Welcome banner with customer name and logout
   - 3 stat cards: Total Orders, Active Quotes, Total Spent
   - Recent orders table (last 3 orders)
   - Active quotes cards with countdown timers
   - Create new quote button

2. **Orders Tab**
   - Complete order history table
   - Order ID, date, items count, total amount
   - Color-coded status badges (Pending, Completed, Shipped)
   - Track order functionality

3. **Quotes Tab**
   - Quote management interface
   - Active/expired status tracking
   - Days until expiration countdown
   - Convert quote to order button
   - View quote details

4. **Documents Tab**
   - Downloadable invoices
   - Receipt files
   - Certificates and documents
   - File metadata (type, date, size)
   - Download buttons with icon

5. **Account Tab**
   - Personal information display
   - Company details
   - Email and join date
   - Security settings (change password, 2FA)
   - Account status indicator
   - Quick actions (create quote, contact support)
   - Support contact information

**Design Features**:
- Animated stat cards with gradient icons
- Tabbed navigation with smooth transitions
- Status color coding (green=active/completed, yellow=pending, blue=shipped, gray=expired)
- Responsive grid layouts
- Gradient cards with hover effects
- Staggered fade-in animations
- Logout button with redirect to login

---

## ADMIN PORTAL

### Admin Login
- **Route**: `/admin/login`
- **File**: `/app/admin/login/page.tsx`
- **Features**: Email/password authentication for admin access
- **Action**: Redirects to `/admin` on successful login

### Admin Dashboard
- **Route**: `/admin`
- **File**: `/app/admin/page.tsx`
- **Layout**: Sidebar navigation + main content area

#### Admin Features:

1. **Overview Tab**
   - 4 stat cards: Total Products (145), Active Customers (234), Total Orders (1,248), Revenue YTD (R2.4M)
   - Recent orders summary (last 3 orders)
   - Top customers list with order counts
   - Quick access to all management areas

2. **Product Management Tab**
   - Full product inventory listing
   - Search by product name or SKU
   - Edit/delete functionality
   - Stock tracking with visual indicators
   - Status management (Active, Low Stock)
   - Add new product button
   - Columns: SKU, Name, Category, Price, Stock, Status

3. **Customer Management Tab**
   - Customer database with all details
   - Name, company, email, phone, status
   - Order count per customer
   - Approve/reject pending customers
   - Color-coded customer status (Active, Pending)
   - Search functionality

4. **Order Management Tab**
   - Complete order tracking system
   - Search by order ID or customer name
   - Order details: ID, customer, date, items, total, status
   - Color-coded status badges
   - View order details functionality

5. **Settings Tab**
   - General settings (company info, email, payment methods)
   - Admin settings (change password, manage users, activity logs)
   - System configuration options

**Design Features**:
- Sidebar navigation with emoji icons
- Responsive mobile menu toggle
- Admin header with logout
- Color-coded stats with gradient icons
- Gradient cards with hover effects
- Search functionality across all management areas
- Status color coding for quick identification
- Animated staggered loading
- Professional data tables with hover states

---

## DESIGN SYSTEM

### Colors
- **Primary**: Navy/Dark Blue (#1A3A4A)
- **Secondary**: Vibrant Orange/Red (#E57037)
- **Gradients**: Gradient combinations for modern effect
- **Status**: Green (active), Yellow (pending), Blue (shipped), Gray (expired)

### Animations
- Fade-in-up on page load
- Hover scale effects on cards
- Smooth transitions on buttons
- Staggered animations for lists

### Components
- Gradient cards with backdrop blur
- Modern input styling with focus rings
- Color-coded status badges
- Icon buttons with hover effects
- Responsive tables
- Mobile-friendly navigation

---

## HOW TO ACCESS

1. **Public Website**: Visit `/` to access homepage
2. **Customer Portal**: 
   - Go to `/login`
   - Enter any email and password
   - Redirects to `/dashboard`
3. **Admin Portal**:
   - Go to `/admin/login`
   - Enter any email and password
   - Redirects to `/admin`

All three sections are fully functional, styled consistently, and feature modern animations and gradient designs.
