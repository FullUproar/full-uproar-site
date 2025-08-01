# Setting Up Admin Access

Since we've just implemented the user system, you'll need to grant yourself admin privileges. Here's how:

## Steps to Become Super Admin

1. **First, sign in to the website** at https://www.fulluproar.com
   - Use whatever authentication method you prefer (email, Google, etc.)
   - This will create your user account via the Clerk webhook

2. **Run the setup script** locally:
   ```bash
   npm run setup-admin your-email@example.com
   ```
   Replace `your-email@example.com` with the email you used to sign in.

3. **Verify it worked** by visiting https://www.fulluproar.com/admin
   - You should now have full access to all admin features
   - Your role badge should show "SUPER ADMIN"

## What the Script Does

- Finds your user account by email
- Updates your role to SUPER_ADMIN (highest permission level)
- Creates initial forum boards:
  - General Discussion
  - Game Feedback  
  - Bug Reports
  - Off Topic

## Role Hierarchy

- **SUPER_ADMIN**: Full system access, can assign roles to others
- **ADMIN**: Access to all admin features except role management
- **MODERATOR**: Can manage forum posts and moderate users
- **USER**: Regular user with profile and forum access
- **GUEST**: Limited access (future use)

## Troubleshooting

If the script says "User not found":
1. Make sure you've signed in at least once on the website
2. Check that you're using the exact email address from your sign-in
3. The Clerk webhook may need a moment to sync - wait 30 seconds and try again

## Important Security Note

The database migration has been applied, but you'll need to configure the Clerk webhook endpoint in your Clerk dashboard:

1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://www.fulluproar.com/api/webhooks/clerk`
4. Select these events:
   - user.created
   - user.updated
   - user.deleted
   - session.created
5. Copy the webhook secret and add it to your environment as `CLERK_WEBHOOK_SECRET`