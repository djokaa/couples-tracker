# Partner Invitation System

## Overview

The Partner Invitation System allows couples to invite their partners to join their couple account, enabling shared access to relationship data including meetings, todos, rocks, and other features.

## Features

### ✅ Implemented Features

1. **Invitation Creation & Sending**
   - Create invitations with partner's email
   - Send invitation emails with unique links
   - Track invitation status (sent, accepted, declined, completed)

2. **Invitation Acceptance Flow**
   - Partner clicks email link to view invitation details
   - Shows who invited them and couple information
   - Option to accept or decline invitation
   - Email notifications sent to inviter for accept/decline actions

3. **Partner Account Creation**
   - After accepting, partner creates account with invited email (non-editable)
   - Automatic linking to couple account
   - Email notification when partner joins

4. **Couple Data Sharing**
   - All data shared between partners
   - Real-time updates when either partner makes changes
   - No privacy settings - full transparency

5. **Partner Management**
   - Revoke partner access (removes from couple but keeps account)
   - Transfer ownership when original owner deletes account
   - One couple per user at a time

6. **Email Notifications**
   - Invitation sent notification
   - Invitation accepted/declined notifications
   - Partner joined notification
   - Partner revoked notification

## Technical Implementation

### Database Structure

#### `coupleInvitations` Collection
```javascript
{
  id: "invitation_id",
  coupleId: "couple_id",
  inviterId: "user_id",
  inviterName: "John Doe",
  inviterEmail: "john@example.com",
  inviteeEmail: "partner@example.com",
  status: "sent" | "accepted" | "declined" | "completed" | "revoked",
  createdAt: timestamp,
  acceptedAt: timestamp,
  declinedAt: timestamp,
  completedAt: timestamp,
  partnerUid: "partner_user_id" // set when partner joins
}
```

#### `couples` Collection
```javascript
{
  id: "couple_id",
  coupleName: "John & Jane",
  ownerId: "owner_user_id",
  partners: [
    {
      uid: "user_id",
      name: "John Doe",
      email: "john@example.com",
      status: "active",
      joinedAt: timestamp
    },
    {
      uid: "partner_user_id",
      name: "Jane Doe", 
      email: "jane@example.com",
      status: "active",
      joinedAt: timestamp
    }
  ],
  invitationStatus: "open" | "pending" | "completed",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `userProfiles` Collection
```javascript
{
  id: "user_id",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  coupleId: "couple_id", // null if not in couple
  profileImageUrl: "url",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Components

#### `AcceptInvitation.js`
- Handles invitation acceptance/decline
- Shows invitation details
- Updates invitation status
- Redirects to signup after acceptance

#### `PartnerSignup.js`
- Account creation for invited partners
- Email field is non-editable (must use invited email)
- Links partner to couple account
- Updates invitation status to completed

#### `CoupleSettings.js`
- Manage couple account settings
- Revoke partner access
- Transfer ownership
- Delete couple account

### Firebase Functions

#### Email Templates
- `renderInvitationAcceptedEmail()` - Notify inviter of acceptance
- `renderInvitationDeclinedEmail()` - Notify inviter of decline
- `renderPartnerJoinedEmail()` - Notify inviter when partner joins

#### Email Functions
- `sendInvitationAcceptedEmail()` - Send acceptance notification
- `sendInvitationDeclinedEmail()` - Send decline notification
- `sendPartnerJoinedEmail()` - Send partner joined notification

#### Firestore Triggers
- `handleInviteUpdate` - Automatically sends emails when invitation status changes

## User Flow

### 1. Invitation Creation
1. User creates couple account
2. User invites partner via email
3. Invitation email sent with unique link
4. Invitation status: "sent"

### 2. Invitation Acceptance
1. Partner clicks email link
2. Views invitation details (who invited, couple name)
3. Chooses to accept or decline
4. If accepted: redirected to signup
5. If declined: email notification sent to inviter
6. Invitation status: "accepted" or "declined"

### 3. Partner Account Creation
1. Partner creates account with invited email
2. Account automatically linked to couple
3. Invitation status updated to "completed"
4. Email notification sent to inviter
5. Both partners can now access shared data

### 4. Couple Management
1. Partners can revoke access (removes from couple)
2. Original owner can delete account (transfers to partner)
3. All data shared between active partners

## Security & Validation

### Invitation Security
- Unique invitation IDs
- Status validation (can't accept already processed invitations)
- Email validation (must use invited email for signup)

### Data Access
- Partners have full access to couple data
- No privacy settings - complete transparency
- Real-time updates between partners

### Account Management
- One couple per user at a time
- Ownership transfer on account deletion
- Partner removal preserves individual accounts

## Error Handling

### Common Scenarios
- Invalid invitation links
- Already accepted invitations
- Email already has account
- Network errors during signup
- Missing invitation data

### Best Practices
- Comprehensive error messages
- Graceful fallbacks
- Email notifications for all actions
- Audit logging for all operations

## Future Enhancements

### Potential Features
1. **Invitation Expiration** - Auto-expire old invitations
2. **Multiple Couples** - Support for multiple couple relationships
3. **Privacy Settings** - Granular control over data sharing
4. **Partner Verification** - Additional verification steps
5. **Invitation Templates** - Customizable invitation messages
6. **Bulk Operations** - Manage multiple invitations
7. **Analytics** - Track invitation success rates

### Technical Improvements
1. **Real-time Updates** - WebSocket connections for live updates
2. **Offline Support** - Handle operations when offline
3. **Performance** - Optimize database queries
4. **Testing** - Comprehensive test coverage
5. **Monitoring** - Track system health and usage

## Configuration

### Environment Variables
```bash
# Firebase Functions
APP_URL=https://couples-tracker.web.app
SENDGRID_FROM_EMAIL=makeivan@gmail.com
```

### Email Templates
- All email templates use consistent branding
- Responsive design for mobile devices
- Clear call-to-action buttons
- Professional styling with couple theme

## Troubleshooting

### Common Issues
1. **Invitation not received** - Check spam folder, verify email address
2. **Can't accept invitation** - Ensure invitation is still valid
3. **Signup fails** - Verify email matches invitation
4. **Partner not linked** - Check couple ID in user profile

### Debug Steps
1. Check invitation status in database
2. Verify email addresses match
3. Review Firebase function logs
4. Check user profile coupleId field
5. Validate couple document structure

## Support

For technical support or questions about the Partner Invitation System, refer to:
- Firebase Console logs
- Email delivery status
- Database document structure
- Component error handling
