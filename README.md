
# FinSight - Personal Finance Management & Forecasting

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-black?style=for-the-badge)](https://ui.shadcn.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-black?style=for-the-badge)](https://next-auth.js.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Recharts](https://img.shields.io/badge/Recharts-8884d8?style=for-the-badge)](http://recharts.org/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge)](https://zod.dev/)
[![date-fns](https://img.shields.io/badge/date--fns-56403A?style=for-the-badge&logo=date-fns&logoColor=white)](https://date-fns.org/)
[![Lucide React](https://img.shields.io/badge/Lucide_React-lucide?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)](https://numpy.org/)

## Overview

FinSight is a modern, intuitive personal finance management application designed to help users gain clarity and control over their financial lives. It allows users to effortlessly track income and expenses, set and monitor budgets, and visualize their financial health through an interactive dashboard. Built with a robust stack including Next.js, React, and Tailwind CSS for the frontend, and powered by a Spring Boot backend, FinSight aims to provide a seamless and insightful user experience. The application is also primed for future AI-driven financial forecasting using Genkit and Python-based machine learning models.

## Key Features

### 1. Authentication & User Management
*   **Secure Sign-in/Sign-up**: Users can authenticate using Google or GitHub through NextAuth.js.
*   **Onboarding Setup**: A guided setup process for new users to personalize their profile (name, phone, DOB, gender) and initial preferences (theme, font size, default currency).
*   **Profile Management**: Users can view and update their personal information on a dedicated profile page.
*   **Account Deletion**: Secure account deletion with a confirmation code step to prevent accidental data loss.

### 2. Dashboard & Financial Overview
*   **At-a-Glance Summary**: Interactive summary cards displaying Total Income, Total Expenses, Net Savings, and Budget Left for the current month, complete with percentage change trends from the previous month.
*   **Income Overview Chart**: A line chart visualizing total income over the last 6 months.
*   **Expense Overview Chart**: A line chart visualizing total expenses over the last 6 months.
*   **Expense Breakdown Chart**: A pie chart showing the distribution of expenses by category for the current month.
*   **Net Savings Overview Chart**: A line chart illustrating net savings (income - expenses) over the last 6 months, with a reference line at zero.
*   All charts and financial figures are displayed in the user's selected currency.

### 3. Transaction Management
*   **Comprehensive Tracking**: Add, view, edit, and delete income and expense transactions.
*   **Detailed Entry**: Forms include fields for date, description, category, amount, and type (income/expense).
*   **Data Table**: Transactions are displayed in a sortable and filterable data table for easy navigation and review.
*   **Duplicate Prevention**: Basic checks to warn users about potentially duplicate or similar transactions.

### 4. Budgeting
*   **Monthly Budgets**: Set monthly spending goals for different categories.
*   **Budget Cards**: Visually track progress for each budget, showing allocated amount, spent amount, and remaining balance.
*   **Automatic Calculation**: The 'spent' amount for each budget is automatically calculated based on relevant expense transactions for the category and month.
*   **Over-Budget Alerts**: Visual cues and notifications for budgets nearing or exceeding their allocated limits.
*   **Add, Edit, Delete Budgets**: Full CRUD operations for managing budget entries.

### 5. Personalization & Settings
*   **Appearance Customization**:
    *   **Theme**: Choose between Light, Dark, or System default themes.
    *   **Font Size**: Select Small, Medium, or Large font sizes for readability.
*   **Regional Preferences**:
    *   **Default Currency**: Set the preferred display currency (INR, USD, EUR, GBP). All financial data is stored in a base currency (INR) and converted for display.
*   **Settings Persistence**: User preferences are saved to the backend and applied across sessions.

### 6. Notifications
*   **In-App Alerts**: A notification bell system provides updates on:
    *   Budget status (nearing limit, exceeded).
    *   Success/error/warning messages for application actions (e.g., saving data, API errors).
*   **Toast Notifications**: Non-intrusive toast messages for quick feedback.

### 7. Currency Conversion
*   **Multi-Currency Support**: Although data is stored in INR (Indian Rupee) on the backend (as implied by context logic), users can view all financial figures in their selected currency (USD, EUR, GBP, INR).
*   **Fixed Conversion Rates**: Uses pre-defined fixed conversion rates for display purposes.

### 8. (Future) Financial Forecasting
*   **Dedicated Forecast Page**: A placeholder page for future AI-powered financial forecasting.
*   **Genkit Integration**: The application is set up with Genkit, preparing for AI/ML model integration to predict future income, expenses, and net balance.

## Tech Stack

### Frontend
*   **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions)
*   **UI Library**: [React](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Component Library**: [ShadCN UI](https://ui.shadcn.com/) (built on Radix UI and Tailwind CSS)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google & GitHub providers)
*   **State Management**: React Context API, `useState`, `useReducer` (implicitly by some hooks)
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Charting**: [Recharts](http://recharts.org/)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Schema Validation**: [Zod](https://zod.dev/) (for forms)
*   **Date Utility**: [date-fns](https://date-fns.org/)
*   **Development Environment**: Firebase Studio

### Backend
*   **Framework**: [Spring Boot](https://spring.io/projects/spring-boot) (Java)
*   **Database**: (Not specified, but typically SQL or NoSQL with Spring Boot)
*   **API**: RESTful APIs consumed by the Next.js frontend.

### AI/Machine Learning (Future Integration)
*   **AI Orchestration**: [Genkit by Firebase](https://firebase.google.com/docs/genkit) (for interacting with LLMs and other AI models)
*   **ML Model Development**: [Python](https://www.python.org/)
    *   **Libraries**: [Scikit-learn](https://scikit-learn.org/), [TensorFlow](https://www.tensorflow.org/)/[Keras](https://keras.io/), [PyTorch](https://pytorch.org/), [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/) (for data manipulation, model building, and evaluation)

## Project Structure (Simplified Frontend)

*   `src/app/`: Contains all Next.js App Router pages, layouts, and API route handlers (like NextAuth).
    *   `(app)/`: Authenticated routes (Dashboard, Transactions, Budgets, etc.).
    *   `login/`: Public login page.
    *   `welcome/setup/`: User onboarding/setup page.
*   `src/components/`: Reusable UI components, categorized by feature (e.g., `dashboard`, `budgets`, `transactions`) and general UI elements (`ui`).
*   `src/contexts/`: React Context providers for global state management (e.g., `CurrencyContext`, `TransactionContext`, `BudgetContext`, `NotificationContext`).
*   `src/hooks/`: Custom React hooks (e.g., `useAuthState`, `useToast`, `useIsMobile`).
*   `src/lib/`: Utility functions and placeholder data.
*   `src/ai/`: Genkit related code, including flows and prompts (currently minimal, for future expansion).
*   `src/types/`: TypeScript type definitions.

## Backend Interaction

The frontend application communicates with a Spring Boot backend via REST APIs. The base URL for this backend is configurable via an environment variable `NEXT_PUBLIC_BACKEND_API_URL`. These APIs handle data persistence for user profiles, settings, transactions, and budgets. All user-specific data is associated with the user's email.

## Environment Variables

To run this application, you will need to set up environment variables. For local development, create a `.env.local` file in the root of your project. For production deployments (e.g., on Netlify), configure these in your hosting provider's settings.

\`\`\`env
# --- GENERAL SETTINGS ---
# NextAuth.js Configuration
# Generate a strong secret using: openssl rand -base64 32
AUTH_SECRET=your_nextauth_secret_here

# !! IMPORTANT: Set AUTH_URL to your application's actual base URL.
# Ensure it does NOT have a trailing slash.
#
# --- Example for Local Development (Next.js dev server on port 9002) ---
# AUTH_URL=http://localhost:9002
#
# --- Example for Production (Deployed to https://finsight27.netlify.app) ---
AUTH_URL=https://finsight27.netlify.app # Replace with your actual production URL

# Google OAuth Credentials (Optional - for Google Login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth Credentials (Optional - for GitHub Login)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Backend API URL
# The base URL of your Spring Boot backend.
# Example: http://localhost:8080 (for local dev) or your deployed backend URL.
# Ensure it does NOT have a trailing slash.
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080
\`\`\`

**Important Notes for Deployment (e.g., to `https://finsight27.netlify.app`):**
*   `NEXT_PUBLIC_BACKEND_API_URL`: This variable tells the Next.js frontend where to find your Spring Boot backend API. Update this to your deployed backend's URL. If not set, it defaults to `http://localhost:8080`.
*   `AUTH_URL`: This is **critical** for NextAuth.js.
    *   For **local development** (e.g., Next.js running on port 9002), set `AUTH_URL=http://localhost:9002`.
    *   For **production deployment** to `https://finsight27.netlify.app`, set `AUTH_URL=https://finsight27.netlify.app`.
*   **OAuth Redirect URIs**: You **must** configure the OAuth redirect URIs in your Google Cloud Console and GitHub OAuth App settings to match your `AUTH_URL`.
    *   For **production** (`https://finsight27.netlify.app`):
        *   Google: Add `https://finsight27.netlify.app/api/auth/callback/google`
        *   GitHub: Set Authorization callback URL to `https://finsight27.netlify.app/api/auth/callback/github`
    *   For **local development** (if `AUTH_URL=http://localhost:9002`):
        *   Google: Add `http://localhost:9002/api/auth/callback/google`
        *   GitHub: Set Authorization callback URL to `http://localhost:9002/api/auth/callback/github`
    *   It's common to add *both* local and production callback URLs to your OAuth provider settings to support both environments.

---

This README provides a comprehensive overview. You can copy and paste this content into your `README.md` file.
