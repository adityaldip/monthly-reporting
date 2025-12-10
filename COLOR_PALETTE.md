# Color Palette - Monthly Tracker

## Option 1: Modern Financial (Currently Active) ✅

**Theme**: Professional, trustworthy, modern

### Primary Colors
- **Primary Blue**: `#2563EB` (Blue-600) - Main actions, links, primary buttons
- **Primary Dark Blue**: `#1E40AF` (Blue-800) - Hover states, emphasis
- **Primary Light Blue**: `#3B82F6` (Blue-500) - Secondary actions

### Financial Colors
- **Income Green**: `#10B981` (Emerald-500) - Income, positive values
- **Income Dark Green**: `#059669` (Emerald-600) - Income hover
- **Outcome Red**: `#EF4444` (Red-500) - Expenses, negative values
- **Outcome Dark Red**: `#DC2626` (Red-600) - Outcome hover

### Accent Colors
- **Warning/Alert**: `#F59E0B` (Amber-500) - Budget alerts, warnings
- **Success**: `#10B981` (Emerald-500) - Success messages
- **Info**: `#3B82F6` (Blue-500) - Information, neutral actions

### Neutral Colors
- **Background**: `#F9FAFB` (Gray-50) - Page background
- **Card Background**: `#FFFFFF` - Card, modal backgrounds
- **Text Primary**: `#111827` (Gray-900) - Main text
- **Text Secondary**: `#6B7280` (Gray-500) - Secondary text
- **Border**: `#E5E7EB` (Gray-200) - Borders, dividers

### Budget Status Colors
- **Budget Safe**: `#10B981` (Green) - < 80% spent
- **Budget Warning**: `#F59E0B` (Amber) - 80-100% spent
- **Budget Exceeded**: `#EF4444` (Red) - > 100% spent

---

## Option 2: Clean & Minimal

**Theme**: Minimalist, clean, modern

### Primary Colors
- **Primary**: `#6366F1` (Indigo-500) - Main brand color
- **Primary Dark**: `#4F46E5` (Indigo-600)
- **Primary Light**: `#818CF8` (Indigo-400)

### Financial Colors
- **Income**: `#22C55E` (Green-500)
- **Outcome**: `#F43F5E` (Rose-500)

### Accent Colors
- **Warning**: `#FBBF24` (Amber-400)
- **Success**: `#22C55E` (Green-500)
- **Info**: `#06B6D4` (Cyan-500)

---

## Option 3: Professional Green

**Theme**: Financial trust, growth-oriented

### Primary Colors
- **Primary**: `#059669` (Emerald-600) - Main brand
- **Primary Dark**: `#047857` (Emerald-700)
- **Primary Light**: `#10B981` (Emerald-500)

### Financial Colors
- **Income**: `#10B981` (Emerald-500)
- **Outcome**: `#DC2626` (Red-600)

### Accent Colors
- **Warning**: `#D97706` (Amber-600)
- **Success**: `#059669` (Emerald-600)
- **Info**: `#0284C7` (Sky-600)

---

## Usage

Warna-warna ini didefinisikan di `app/globals.css` sebagai CSS variables dan digunakan di seluruh aplikasi dengan format:
- Primary: `#2563EB` atau `text-[#2563EB]`
- Income: `#10B981` atau `bg-[#10B981]`
- Outcome: `#EF4444` atau `border-[#EF4444]`

Untuk mengubah color palette, update CSS variables di `app/globals.css` dan semua referensi warna hardcoded di komponen.

