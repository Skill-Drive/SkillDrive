# SkillDrive

A modern driving instructor booking platform built with React, TypeScript, and Supabase. SkillDrive makes it easy for learner drivers to find, compare, and book driving instructors online.

![SkillDrive](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Vite](https://img.shields.io/badge/Vite-7.2-purple)

## ✨ Features

- 🔍 **Smart Search** - Find driving instructors by postcode with advanced filtering
- 📅 **Real-time Booking** - View instructor availability and book lessons instantly
- 💳 **Secure Payments** - Complete checkout flow with payment processing
- 👤 **User Dashboard** - Manage bookings, view upcoming lessons, and track progress
- 🔐 **Authentication** - Secure login and signup with Supabase Auth
- 📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and production builds

## 🚀 Tech Stack

- **Frontend**: React 19.2 + TypeScript
- **Build Tool**: Vite (Rolldown)
- **Styling**: TailwindCSS 4.1
- **Backend**: Supabase (Authentication & Database)
- **State Management**: Zustand
- **Routing**: React Router 7
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd SkillDrive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 📁 Project Structure

```
SkillDrive/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BookingModal.tsx
│   │   ├── InstructorCard.tsx
│   │   └── Navbar.tsx
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── SearchResults.tsx
│   │   ├── InstructorProfile.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Checkout.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── services/            # API and service functions
│   │   ├── supabase.ts
│   │   └── bookingService.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useBookings.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## 🔑 Key Features Explained

### Search & Filter
- Search instructors by suburb or postcode
- Filter by transmission type (Auto/Manual)
- Filter by price range
- Filter by gender preference
- Filter by availability

### Booking System
- View instructor profiles and details
- Interactive calendar showing real-time availability
- Select time slots and complete bookings
- Automatic conflict detection

### User Dashboard
- View upcoming and past lessons
- Cancel or reschedule bookings
- Track lesson history
- Manage account settings

### Payment Flow
- Secure checkout process
- Order summary with pricing breakdown
- Card payment form with validation
- Payment confirmation

## 🔒 Security Features

- Environment variables for sensitive data
- Input sanitization to prevent XSS attacks
- Secure authentication with Supabase
- Protected routes and API calls
- Form validation on client and server side

## 🎨 Design System

The app uses a consistent design system with:
- **Primary Color**: Trust Blue (#0056D2)
- **Secondary Color**: Action Yellow (#FFD100)
- **Typography**: System fonts for optimal performance
- **Components**: Reusable button styles and utilities

## 🧪 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Built with ❤️ by the SkillDrive team

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [TailwindCSS](https://tailwindcss.com) for the styling system
- [Lucide](https://lucide.dev) for the beautiful icons
- [Unsplash](https://unsplash.com) for high-quality images
