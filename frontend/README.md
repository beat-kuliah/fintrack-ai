# FinTrack Frontend 💰

Aplikasi tracking keuangan modern untuk Gen Z. Built with Next.js 14, TypeScript, dan Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── globals.css      # Global styles & Tailwind utilities
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   ├── login/
│   │   └── page.tsx     # Login page
│   └── register/
│       └── page.tsx     # Register page
├── components/
│   ├── layout/
│   │   └── AuthLayout.tsx   # Auth pages layout
│   └── ui/
│       ├── Button.tsx       # Button component
│       └── Input.tsx        # Input component
├── tailwind.config.ts   # Tailwind configuration
└── package.json
```

## 🎨 Design Features

- **Dark Mode**: Modern dark theme yang easy on the eyes
- **Glassmorphism**: Glass effect dengan blur untuk aesthetic modern
- **Gradient Accents**: Lime/green gradient yang eye-catching
- **Smooth Animations**: Subtle animations untuk UX yang lebih baik
- **Responsive Design**: Works di semua screen sizes
- **Gen Z Friendly**: Copywriting casual dan relatable

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion ready

## 📱 Pages

1. **Landing Page** (`/`) - Hero section dengan features showcase
2. **Login** (`/login`) - Form login dengan social auth options
3. **Register** (`/register`) - Form registrasi dengan password validation

## 🎯 Features

- Form validation dengan error handling
- Password visibility toggle
- Password strength indicator (register)
- Remember me checkbox
- Social login buttons (Google, GitHub)
- Responsive navigation
- Animated background elements

## 📄 License

MIT License

