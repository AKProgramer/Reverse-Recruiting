# Next.js 14 Google OAuth 2.0 Integration

A complete implementation of Google OAuth 2.0 flow with Next.js 14 App Router, featuring Google Drive and Sheets API integration with n8n webhook processing.

## 🚀 Features

- **Complete Google OAuth 2.0 Flow**: Secure authentication with Google accounts
- **Google APIs Integration**: Access to Google Drive and Sheets APIs
- **Automatic Token Management**: Token refresh and secure storage
- **n8n Webhook Integration**: Automated data processing workflows
- **Modern React Patterns**: Context API for state management
- **Secure Cookie Handling**: httpOnly cookies with proper security settings
- **Error Handling**: Comprehensive error handling and retry logic
- **TypeScript Support**: Full TypeScript integration
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🛠️ Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the project root:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# n8n Webhook URL
NEXT_PUBLIC_N8N_WEBHOOK_URL=your-n8n-webhook-url

# OAuth Redirect URI (adjust for production)
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3001/api/auth/callback

# Session/Cookie Secret (generate a secure random string for production)
NEXTAUTH_SECRET=your-super-secure-secret-key
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API and Google Sheets API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/callback`
5. Copy the Client ID and Client Secret to your `.env.local`

### 3. Required Scopes

The application requests these Google OAuth scopes:
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/spreadsheets`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
/app
├── api/
│   ├── auth/
│   │   └── callback/
│   │       └── route.js          # OAuth callback handler
│   └── jobs/
│       └── submit/
│           └── route.js          # Job submission API
├── demo/
│   └── page.js                   # Demo landing page
├── google-job-form/
│   └── page.js                   # Google OAuth job form page
├── layout.js                     # Root layout
└── page.js                       # Original job discovery form

/components
├── ConnectGoogle.js              # Google OAuth connection component
└── JobForm.js                    # Job data form component

/contexts
└── AuthContext.js                # Authentication state management

/lib
└── oauth.js                      # OAuth utility functions

.env.local                        # Environment variables (create this)
```

## 🔄 OAuth Flow

1. **User clicks "Connect Google"** → Redirects to Google OAuth consent screen
2. **User grants permissions** → Google redirects back with authorization code
3. **Callback route exchanges code for tokens** → Stores access_token and refresh_token in secure cookies
4. **User submits form data** → Sends data + access_token to n8n webhook
5. **Token refresh handling** → Automatically refreshes expired tokens

## 🔧 API Endpoints

### `/api/auth/callback`
- **Method**: GET
- **Purpose**: Handle OAuth callback and token exchange
- **Parameters**: `code` (authorization code from Google)
- **Returns**: Redirects to form with success/error status

### `/api/jobs/submit`
- **Method**: POST
- **Purpose**: Submit job data to n8n webhook
- **Body**: Job form data (JSON)
- **Headers**: Cookies with access_token
- **Returns**: Success/error response with optional sheet URL

## 🔐 Security Features

- **Secure Cookie Storage**: httpOnly cookies with SameSite protection
- **Token Refresh**: Automatic handling of expired access tokens
- **CSRF Protection**: Built-in CSRF protection with Next.js
- **Environment Variables**: Sensitive data stored in environment variables
- **Error Handling**: Comprehensive error handling and logging

## 🎯 Usage Examples

### Basic OAuth Connection

```javascript
import { useAuth } from '@/contexts/AuthContext';
import ConnectGoogle from '@/components/ConnectGoogle';

function MyComponent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div>
      <ConnectGoogle />
      {isAuthenticated && <p>Connected to Google!</p>}
    </div>
  );
}
```

### Form Submission

```javascript
const handleSubmit = async (formData) => {
  const response = await fetch('/api/jobs/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Data submitted successfully!');
  }
};
```

## 🚀 Deployment

### Production Environment Variables

Update your production environment with:
- Production Google OAuth credentials
- Production redirect URI
- Secure NEXTAUTH_SECRET
- Production n8n webhook URL

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

### Google OAuth Production Setup

1. Update authorized redirect URIs in Google Cloud Console
2. Add your production domain
3. Verify domain ownership if required

## 🔍 Troubleshooting

### Common Issues

1. **OAuth Error: redirect_uri_mismatch**
   - Ensure redirect URI in Google Console matches your environment variable

2. **Token Refresh Failed**
   - Check that `access_type: 'offline'` and `prompt: 'consent'` are set

3. **API Request Failed**
   - Verify that required APIs are enabled in Google Cloud Console

4. **Cookie Issues**
   - Check cookie settings for your domain and HTTPS requirements

### Debug Mode

Enable debug logging by adding to your environment:
```env
NODE_ENV=development
```

## 📊 Webhook Data Format

The data sent to your n8n webhook includes:

```json
{
  "jobTitle": "Software Engineer",
  "company": "Google",
  "location": "San Francisco, CA",
  "experience": "Mid Level",
  "skills": "React, Node.js, Python",
  "salary": "$120,000 - $160,000",
  "description": "Job description...",
  "access_token": "ya29.a0ARrdaM...",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Google OAuth documentation
3. Open an issue in the repository

---

**Built with ❤️ using Next.js 14, React 19, and Google OAuth 2.0**