# Admin Guide - Manual Subscription Management

This guide explains how to manually grant subscriptions and bypass payment processing for testing, development, or special cases.

## ⚡ New Automatic Trial System

**All new users automatically get a 30-day Pro trial!** No manual intervention needed.

### New User Flow:
1. Sign up through Clerk (first/last name required)
2. Auto-granted 30-day Pro trial
3. Welcome screen: Shows setup progress (auto-completes)
4. Auto-assigned to Supplement King organization
5. Auto-generated franchise ID from Clerk name
6. Direct access to dashboard

**No payment screens, no manual subscription needed!**

## Quick Self-Grant (Easiest Method)

**URL**: `/admin/grant-me`

1. Sign in to your account
2. Visit `http://localhost:5174/admin/grant-me` (or your domain + `/admin/grant-me`)
3. Click "Grant Me Pro Subscription"
4. You'll instantly get a 12-month Pro subscription
5. Click "Go to Dashboard" to access your dashboard

## Full Admin Panel

**URL**: `/admin`

The admin panel allows you to grant subscriptions to any user in the system.

### Features:
- **Grant Subscriptions**: Manually assign subscriptions to any user
- **User Management**: View all registered users
- **Plan Types**: Basic, Pro, Enterprise
- **Duration Control**: 1-60 months

### How to Use:
1. Visit `/admin`
2. Select a user from the dropdown
3. Choose plan type and duration
4. Click "Grant Free Subscription"

## Convex Functions (Advanced)

You can also call the functions directly from the Convex dashboard:

### `grantFreeSubscription`
```typescript
// Parameters:
{
  userId: "user_2abc123...", // Clerk user ID
  planType: "pro",           // Optional: "basic", "pro", "enterprise"
  durationMonths: 12         // Optional: 1-60 months
}
```

### Helper Functions:
- `getAllUsers`: List all users in the system
- `getSubscriptionByUserId`: Check subscription status for any user

## What Gets Created

When you grant a subscription, the system creates a record in the `subscriptions` table with:

- **Status**: `active`
- **Amount**: `0` (free)
- **Duration**: Specified months (default 12)
- **Type**: `manual_grant` in metadata
- **Polar ID**: `manual_[timestamp]` (unique)

## Benefits

✅ **Instant Access** - No payment processing delays  
✅ **Development Testing** - Test subscription features immediately  
✅ **Customer Support** - Grant complimentary access  
✅ **Demo Accounts** - Set up demo users for sales  

## Security Notes

- Admin routes are not protected - consider adding authentication for production
- Manual subscriptions bypass all payment validation
- Records are permanent unless manually removed
- All actions are logged in the subscription metadata

## Troubleshooting

**"User not found"**: Make sure the user has signed up and exists in the system  
**"Already has subscription"**: User already has an active subscription  
**Not redirecting to dashboard**: Check if user has completed organization setup first
**"Stuck at onboarding"**: New users should see first/last name form, not organization selection
**"Trial not working"**: Check if auto-trial was granted in subscriptions table

## New Onboarding Features

✅ **Auto-Trial**: 30-day Pro trial granted on signup  
✅ **Supplement King Only**: All users assigned to same organization  
✅ **No Forms**: Clerk handles name collection  
✅ **Auto-Franchise**: Franchise ID generated from user name  
✅ **Skip Billing**: No subscription screens during onboarding  

## Example Workflow

### New Automatic Flow:
1. User signs up → Auto-granted 30-day trial
2. Welcome screen → Auto-setup (2 seconds)
3. Auto-assigned → Supplement King organization
4. Dashboard → "Welcome to Pro Trial" banner
5. Full access to all features immediately

### Manual Override (if needed):
1. User has issues → Admin visits `/admin/grant-me`
2. Enter user ID → Grant additional subscription
3. User gets extended access