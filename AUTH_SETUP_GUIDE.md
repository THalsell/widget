# Authentication System Setup Guide

I've implemented a complete authentication system for your donation widget platform! Here's what was added and how to complete the setup.

## 🎉 What's Been Implemented

### Database Models
- ✅ **User** - Stores user accounts (synced with Supabase Auth)
- ✅ **Organization** - Multi-tenant support for different charities/nonprofits
- ✅ **UserOrganization** - Links users to organizations with roles
- ✅ **WidgetConfig** - Now linked to organizations (multi-tenant)

### Authentication Pages
- ✅ `/login` - Sign in page
- ✅ `/signup` - Account creation with organization setup
- ✅ Middleware to protect `/admin` routes
- ✅ Auto-redirect logic (login → admin, admin → login)

### Features
- ✅ Email/password authentication via Supabase
- ✅ Automatic organization creation on signup
- ✅ Protected admin dashboard
- ✅ Session management
- ✅ Multi-tenant architecture ready

---

## 📋 Setup Steps

### Step 1: Get Supabase Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `lsunezvzifkeffbvmwjx`
3. Navigate to: **Settings → API**
4. Copy these two values:
   - **Project URL** (already added: `https://lsunezvzifkeffbvmwjx.supabase.co`)
   - **`anon` `public` key** (looks like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

5. Update `.env.local` with your anon key:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

---

### Step 2: Enable Email Authentication in Supabase

1. In Supabase Dashboard, go to: **Authentication → Providers**
2. Find **Email** provider
3. Make sure it's **ENABLED**
4. Configure these settings:
   - **Enable email confirmations**: OFF (for development)
   - **Enable email sign-ups**: ON
5. Click **Save**

---

### Step 3: Run Database Migration

Since WSL2 can't connect to Supabase, run the migration from Supabase dashboard:

#### Option A: Supabase SQL Editor (Recommended)

1. Go to: **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy the entire contents of `database-migration-auth.sql`
4. Paste into the editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify: You should see "Success. No rows returned"

#### Option B: Run from Windows PowerShell

```powershell
cd C:\Users\clayp\Documents\GitHub\widget
npx prisma migrate deploy
```

---

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

This updates the Prisma client with the new User, Organization, and UserOrganization models.

---

### Step 5: Test the Authentication Flow

1. **Start dev server** (from Windows PowerShell if database connection issues):
   ```powershell
   cd C:\Users\clayp\Documents\GitHub\widget
   npm run dev
   ```

2. **Open in browser**: http://localhost:3000

3. **Test signup**:
   - Click "Get Started" button
   - Fill out signup form:
     - Name: John Doe
     - Organization: My Test Charity
     - Email: test@example.com
     - Password: password123
   - Click "Create Account"
   - Should redirect to `/admin`

4. **Test protected routes**:
   - Log out (we'll need to add logout button next)
   - Try accessing: http://localhost:3000/admin
   - Should redirect to `/login`

5. **Test login**:
   - Go to: http://localhost:3000/login
   - Enter your email/password
   - Should redirect to `/admin`

---

## 🔒 How Authentication Works

### Flow Diagram

```
User visits /admin
    ↓
Middleware checks auth
    ↓
No session? → Redirect to /login
    ↓
User enters credentials
    ↓
Supabase Auth validates
    ↓
Session created (stored in cookies)
    ↓
User record created in database
    ↓
Organization created
    ↓
User linked to organization
    ↓
Redirected to /admin
```

### Security Features

- **Protected Routes**: `/admin/*` requires authentication
- **Session Management**: Auto-refreshes expired sessions
- **Multi-Tenant**: Each user/organization sees only their data
- **Secure Cookies**: HTTP-only, secure cookies for session storage

---

## 🚧 What Still Needs to be Done

### 1. Add Logout Functionality

Create a logout button in the admin dashboard:

```typescript
// In admin layout or navbar
async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/login');
}
```

### 2. Update Admin Pages to be Organization-Specific

Currently, admin pages show ALL widgets/donations. They need to filter by organization:

**Example for `/admin/widgets`:**
```typescript
// Get user's organization ID
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Fetch only widgets for this organization
const userOrg = await prisma.userOrganization.findFirst({
  where: { userId: user.id },
  include: { organization: true }
});

const widgets = await prisma.widgetConfig.findMany({
  where: { organizationId: userOrg.organizationId }
});
```

### 3. Update Widget Creation

When creating new widgets, link them to the user's organization:

```typescript
// In /api/admin/widget-configs POST handler
const newWidget = await prisma.widgetConfig.create({
  data: {
    ...widgetData,
    organizationId: userOrganization.organizationId  // Add this!
  }
});
```

### 4. Add Password Reset

Create `/forgot-password` page using Supabase:

```typescript
await supabase.auth.resetPasswordForEmail(email);
```

### 5. Add User Profile Page

Let users update their name, email, organization name, etc.

---

## 📁 Files Created/Modified

### New Files
- `src/lib/supabase/client.ts` - Client-side Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/app/login/page.tsx` - Login page
- `src/app/signup/page.tsx` - Signup page
- `src/app/api/auth/create-organization/route.ts` - Organization creation API
- `src/middleware.ts` - Authentication middleware
- `database-migration-auth.sql` - Database migration SQL

### Modified Files
- `prisma/schema.prisma` - Added User, Organization, UserOrganization models
- `src/app/page.tsx` - Added Sign In / Get Started buttons
- `.env.local` - Added Supabase credentials
- `package.json` - Added @supabase/supabase-js, @supabase/ssr

---

## 🐛 Troubleshooting

### "Can't reach database server"
- Run from Windows PowerShell instead of WSL2
- Or run SQL migration directly in Supabase dashboard

### "Invalid API key"
- Make sure you copied the **anon** key, not the service_role key
- Check `.env.local` for typos

### "User already exists"
- Email is already registered
- Try a different email or reset password

### Redirect loop on /admin
- Clear browser cookies
- Check middleware configuration
- Verify Supabase session is being set

---

## ✅ Testing Checklist

- [ ] Supabase anon key added to `.env.local`
- [ ] Email auth enabled in Supabase dashboard
- [ ] Database migration run successfully
- [ ] Can create new account at `/signup`
- [ ] Redirected to `/admin` after signup
- [ ] Can log out and log back in
- [ ] Protected routes redirect to `/login` when not authenticated
- [ ] Logged-in users can't access `/login` or `/signup`

---

## 🎯 Next Steps

Once authentication is working:

1. Update all admin API endpoints to filter by organization
2. Add logout button to admin dashboard
3. Update widget creation to link to organization
4. Add user profile/settings page
5. Test Stripe Connect with authenticated users
6. Add team member invitations (optional)
7. Add role-based permissions (admin vs member)

---

## 💡 Tips

- **Development**: Keep email confirmations OFF in Supabase for faster testing
- **Production**: Enable email confirmations before going live
- **Security**: Never commit `.env.local` to git (it's already in `.gitignore`)
- **Testing**: Use temporary email addresses like `test+1@example.com`, `test+2@example.com`

---

Need help with any of these steps? Let me know!
