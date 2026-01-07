# Sloth.app

A personal project management tool with AI-powered assistance for organizing projects, views, issues, documents, and links.

## Features

- **Project & View Management** - Hierarchical organization of work items
- **Issue Tracking** - Create and manage issues within projects and views
- **AI Chat Assistant** - Integrated Perplexity AI for contextual help and insights
- **Document Management** - Attach and organize documents per view/issue
- **Link Management** - Collect and manage relevant links
- **Comment System** - Collaborate with comments on issues
- **Wallet Authentication** - MetaMask integration alongside email/password
- **Collaboration** - Invite collaborators to projects

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
- **AI**: Perplexity AI via Supabase Edge Function
- **Authentication**: Supabase Auth + MetaMask (wagmi/viem)
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Perplexity AI API key
- MetaMask wallet (optional, for wallet authentication)

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Perplexity AI
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key

# Encryption Key (32-byte hex string for AES-256)
VITE_ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# WalletConnect (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**How to get these values:**

- **Supabase**: Create a project at [supabase.com](https://supabase.com), find URL and anon key in Settings → API
- **Perplexity AI**: Get API key from [perplexity.ai](https://www.perplexity.ai/settings/api)
- **Encryption Key**: Generate with `openssl rand -hex 32`
- **WalletConnect**: Create project at [cloud.walletconnect.com](https://cloud.walletconnect.com)

### 2. Supabase Setup

#### Database Schema

The app expects the following Supabase tables (see `DATABASE_MIGRATIONS.md` for details):

- `users` - User profiles
- `projects` - Top-level projects
- `views` - Views within projects
- `issues` - Issues within views
- `documents` - File attachments
- `links` - URL references
- `comments` - Issue comments
- `invitations` - Collaboration invites

#### Edge Function Deployment

Deploy the Perplexity AI proxy function:

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your_project_ref

# Set Perplexity API key as secret
npx supabase secrets set PERPLEXITY_API_KEY=your_perplexity_api_key

# Deploy the Edge Function
npx supabase functions deploy perplexity-proxy
```

### 3. Storage Buckets

Create the following storage buckets in Supabase Dashboard (Storage section):

- `documents` - For file uploads

Configure bucket policies for authenticated access.

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Sign Up** - Create an account using email/password or connect MetaMask wallet
2. **Create Project** - Start with creating your first project
3. **Add Views** - Organize work within projects using views
4. **Create Issues** - Track tasks and issues within views
5. **Use AI Chat** - Click the AI chat button in views or issues for contextual assistance
6. **Manage Documents & Links** - Attach relevant files and URLs to views and issues

## AI Chat

The AI chat assistant uses Perplexity AI's `llama-3.1-sonar-small-128k-online` model. Chat history is stored locally in browser localStorage per context (view or issue). Messages are sent through a Supabase Edge Function to avoid CORS issues.

## Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── services/       # API service layers
├── hooks/          # Custom React hooks
├── contexts/       # React contexts
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── utils/          # Utility functions

supabase/
└── functions/      # Supabase Edge Functions
    └── perplexity-proxy/
```

## Documentation

- `PERPLEXITY_SETUP.md` - Detailed Perplexity AI integration setup
- `DATABASE_MIGRATIONS.md` - Database schema and migrations
- `CURRENT_ISSUES.md` - Known issues and pending tasks

## License

Private project - All rights reserved
