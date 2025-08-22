<d# 💊 MedCure Pharmacy Management System

**Complete, Production-Ready React + Supabase Pharmacy Management Solution**

A comprehensive web application for pharmacy inventory management, point-of-sale operations, sales reporting, and business analytics. Built with modern web technologies and designed for real-world pharmacy operations.

![Stack](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=fff) ![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e?logo=supabase&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38b2ac?logo=tailwindcss&logoColor=fff) ![React Query](https://img.shields.io/badge/React%20Query-5-ff4154) ![Production Ready](https://img.shields.io/badge/Production-Ready-success)n="center">

# 💊 MedCure Frontend (Professional Scaffold)

Opinionated, production‑ready React + Vite + Tailwind CSS architecture for a pharmacy / inventory & POS web application.

_This repository currently contains a clean professional scaffold **not** the full upstream feature set. It’s structured to let you progressively implement: inventory management, point‑of‑sale workflows, notifications, reporting (PDF/CSV), and configurable settings._

![Stack](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38b2ac?logo=tailwindcss&logoColor=fff) ![React Query](https://img.shields.io/badge/React%20Query-5-ff4154) ![ESLint](https://img.shields.io/badge/ESLint-Configured-4B32C3)

</div>

## 🌟 Core Features

### 📊 **Dashboard & Analytics**

- Real-time sales metrics and KPIs
- Low stock alerts and inventory warnings
- Sales trends and performance charts
- Quick action shortcuts and notifications

### 📦 **Inventory Management**

- Complete product CRUD operations
- Batch number and expiry date tracking
- Category management and filtering
- Stock level monitoring with reorder alerts
- Bulk operations (import/export, bulk updates)
- Advanced search and filtering capabilities

### 🛒 **Point of Sale (POS)**

- Intuitive product selection interface
- Multiple payment methods (Cash, GCash, Card, Digital)
- Receipt generation and printing
- Transaction history and refunds
- Real-time inventory updates

### 📈 **Reports & Analytics**

- Sales reports by date, product, category
- Inventory reports and stock analysis
- Financial summaries and profit tracking
- Export to PDF and CSV formats
- Custom date range filtering

### 🗂️ **Archive System**

- Soft delete with full audit trail
- Product archiving with reason tracking
- Safe bulk operations with sales history protection
- Easy restore functionality
- Archive analytics and management

### 🔔 **Notification System**

- Real-time toast notifications
- Persistent notification history
- Stock alerts and system notifications
- Configurable notification preferences

### ⚙️ **Settings & Configuration**

- Business information management
- Tax and pricing configuration
- User preferences and themes
- System settings and defaults

## � Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd medcure_official_web
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Configure your `.env.local` file:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database:**

   - Go to your Supabase Dashboard → SQL Editor
   - Run the migration script: `database/COMPLETE_MEDCURE_MIGRATION_V5.sql`
   - This will create all tables, functions, policies, and storage buckets

5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components for analytics
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── modals/         # Modal dialogs for forms
│   └── ...             # Other shared components
├── config/             # Configuration files
│   └── supabase.js     # Supabase client configuration
├── context/            # React context providers
│   └── NotificationContext.jsx
├── hooks/              # Custom React hooks
│   ├── useArchive.js   # Archive operations
│   ├── useProducts.js  # Product management
│   ├── useSales.js     # Sales operations
│   └── ...             # Other business logic hooks
├── layouts/            # Page layout components
├── pages/              # Main application pages
│   ├── Dashboard.jsx   # Analytics dashboard
│   ├── Inventory.jsx   # Product management
│   ├── POS.jsx         # Point of sale
│   ├── Reports.jsx     # Reports and analytics
│   ├── Archived.jsx    # Archive management
│   └── Settings.jsx    # System configuration
├── services/           # API service layers
│   ├── productService.js
│   ├── salesService.js
│   ├── archiveService.js
│   └── ...             # Other service modules
├── utils/              # Utility functions
│   ├── formatters.js   # Data formatting utilities
│   ├── calculations.js # Business calculations
│   └── exportUtils.js  # Export functionality
└── App.jsx             # Main application component
```

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern UI library with latest features
- **Vite** - Fast build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **React Query (TanStack Query)** - Data fetching and state management
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library

### Backend & Database

- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Data security and access control
- **Storage** - File upload and management

### Development Tools

- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Vite Plugins** - Development enhancements

## 📊 Database Schema

The application uses a comprehensive database schema with the following main tables:

- **`products`** - Product inventory with full metadata including archive and restore functionality
- **`sales`** - Transaction records with payment methods and status tracking
- **`sale_items`** - Individual items in transactions with variant information
- **`notifications`** - System notifications with user targeting
- **`activity_logs`** - Complete audit trail for all operations
- **`app_settings`** - Configurable system settings and business rules
- **`archive_logs`** - Archive operation history for compliance

### Key Features:

- ✅ Soft delete architecture for data integrity
- ✅ Full audit trail with activity logging
- ✅ Archive system with restore capabilities
- ✅ Comprehensive indexing for performance
- ✅ Row-level security for data protection
- ✅ Storage buckets for file management

## 🔧 Configuration

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Development settings
VITE_APP_NAME=MedCure
VITE_APP_VERSION=1.0.0
```

### Database Setup

Use the provided migration script for a complete setup:

```sql
-- Run this in Supabase SQL Editor
-- File: database/COMPLETE_MEDCURE_MIGRATION_V5.sql
```

This includes:

- All table schemas with constraints
- Indexes for optimal performance
- Security policies (RLS)
- Database functions for business logic
- Storage buckets and policies
- Default application settings

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Netlify

1. **Build command:** `npm run build`
2. **Publish directory:** `dist`
3. **Configure environment variables**

### Other Platforms

The application builds to static files and can be deployed to any static hosting service.

## 🔒 Security

### Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Secure API endpoints with Supabase
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure file upload handling

### Security Best Practices

- Environment variables for sensitive data
- Secure authentication flow
- Data encryption at rest and in transit
- Regular security updates

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper testing
4. **Commit with conventional commits:** `git commit -m 'feat: add amazing feature'`
5. **Push to your branch:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use TypeScript for type safety (when applicable)

## 📚 API Documentation

### Product Management

```javascript
// Get all products
const products = await productService.getProducts();

// Create product
const newProduct = await productService.createProduct(productData);

// Update product
const updated = await productService.updateProduct(id, updates);

// Archive product
const archived = await archiveService.archiveProduct(product, reason);
```

### Sales Operations

```javascript
// Process sale
const sale = await salesService.processSale(saleData);

// Get sales analytics
const analytics = await salesService.getSalesAnalytics(dateRange);
```

### Archive Management

```javascript
// Get archived items
const archived = await archiveService.getArchivedProducts();

// Restore product
const restored = await archiveService.restoreProduct(productId);

// Bulk delete with safety
const result = await archiveService.bulkDeleteProducts(productIds);
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues:**

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify Supabase project is active
# Check RLS policies in Supabase dashboard
```

**Archive/Restore Not Working:**

```sql
-- Check if restore columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name IN ('restored_by', 'restored_date');

-- Add missing columns if needed
ALTER TABLE products ADD COLUMN restored_by VARCHAR;
ALTER TABLE products ADD COLUMN restored_date TIMESTAMP WITH TIME ZONE;
```

**Performance Issues:**

```bash
# Check bundle size
npm run analyze

# Profile React components
# Use React DevTools Profiler
```

## 📋 Changelog

### Version 1.0.0 (Current)

- ✅ Complete pharmacy management system
- ✅ Full inventory management with archive system
- ✅ Point of sale with multiple payment methods
- ✅ Comprehensive reporting and analytics
- ✅ Real-time notifications
- ✅ Supabase integration with RLS
- ✅ Production-ready deployment

### Upcoming Features

- 🔄 Multi-user support with role-based access
- 🔄 Advanced inventory tracking (lot numbers, suppliers)
- 🔄 Integration with payment gateways
- 🔄 Mobile app support
- 🔄 Barcode scanning integration
- 🔄 Advanced analytics and insights

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Supabase for the excellent backend platform
- TailwindCSS for the utility-first approach
- All contributors and users of this project

## 📞 Support

### Getting Help

- 📖 Check the documentation above
- 🐛 [Open an issue](../../issues) for bug reports
- 💡 [Request features](../../issues) for new functionality
- 📧 Contact the maintainers for urgent matters

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)

---

<div align="center">

**Built with ❤️ for modern pharmacy management**

Made by developers who understand the challenges of pharmacy operations.

</div>
