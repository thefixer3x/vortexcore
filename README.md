# VortexCore Banking App

## Project Overview

VortexCore is a modern fintech platform offering comprehensive banking services, transaction management, and AI-powered financial insights. The application features a responsive dashboard, payment processing capabilities, and intelligent virtual assistants to enhance the user experience.

## 🚀 Key Features

### 💼 Core Banking Features
- **Modern Dashboard**: Gradient card designs with responsive layouts
- **Transaction Management**: Advanced filtering and categorization
- **Account Management**: Multi-account support with balance visibility controls
- **Beneficiary Management**: Add and manage payment recipients
- **Bulk Payment Processing**: Efficiently manage multiple payments

### 🤖 AI Integration
- **OpenAI Assistant**: Integrated chat assistance for financial questions
- **Gemini AI**: Alternative AI model for diverse insights
- **AI-Powered Insights**: Smart analysis of spending patterns and financial health
- **Personalized Recommendations**: Tailored financial advice and alerts

### 🎨 User Experience
- **Responsive Design**: Optimized for mobile and desktop
- **Dark/Light Mode**: Theme customization
- **Animated UI**: Smooth transitions and micro-interactions
- **Quick Actions**: Fast access to common functions

## 🧰 Development Setup

### Prerequisites
- Node.js (v18+)
- npm or bun package manager

### Local Development

```sh
# Clone the repository
git clone https://github.com/thefixer3x/vortex-core-app.git

# Navigate to project directory
cd vortex-core-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Supabase Edge Functions
To deploy the Supabase edge functions:

```sh
# Deploy all edge functions
./deploy-functions.sh
```

## 🛠️ Technologies

### Frontend
- **React 18**: Modern component-based UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **React Hook Form**: Form validation and handling

### Backend
- **Supabase**: Backend-as-a-Service platform
- **Edge Functions**: Serverless functions for AI integrations and authentication
- **PostgreSQL**: Database for user data and transactions

### AI Integration
- **OpenAI API**: Powers the AI assistant and financial insights
- **Google Gemini API**: Alternative AI model for diverse capabilities

### Mobile
- **Capacitor**: Native iOS application wrapper

## 🚀 Deployment

### Supabase Configuration

This project relies on Supabase for backend services. Make sure to set up the following environment variables in your Supabase project:

- `OPENAI_API_KEY`: Your OpenAI API key for the assistant feature
- `GEMINI_API_KEY`: Your Google Gemini API key for the AI insights
- `VITE_SUPABASE_URL`: URL of your Supabase project
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key used by the frontend

### Edge Functions

The application uses Supabase Edge Functions for serverless computing. These can be deployed using the provided script:

```sh
./deploy-functions.sh
```

### Web Deployment

For web deployment, you can use any static site hosting platform:

1. Build the production version:
   ```sh
   # Ensure environment variables like VITE_SUPABASE_URL and
   # VITE_SUPABASE_ANON_KEY are defined before building
   npm run build
   ```

2. Deploy the generated `dist` folder to your preferred hosting service (Netlify, Vercel, etc.)

### Custom Domain Setup

To use a custom domain with your deployment:

1. Configure your DNS settings to point to your hosting provider
2. Update the CORS settings in your Supabase project to allow requests from your domain
3. Update any callback URLs in your authentication settings

## 📋 Recent Updates

- Enhanced dashboard UI with modern fintech styling
- Added AI-powered financial insights
- Integrated OpenAI and Gemini AI assistants
- Fixed Supabase edge function deployment issues
- Upgraded esbuild to version 0.25.5
- Improved mobile responsiveness

## License

This project is licensed under the [MIT License](LICENSE).
