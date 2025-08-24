const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Configuration expected for Firebase Trigger Email extension (or custom mail queue consumer):
// functions.config().mail.from, functions.config().mail.reply_to (optional)
const getMailFrom = () => functions.config().mail?.from || 'makeivan@gmail.com';
const getReplyTo = () => functions.config().mail?.reply_to || 'makeivan@gmail.com';

const renderWelcomeEmail = ({ displayName, helpCenterUrl, appUrl }) => {
  const firstName = displayName?.split(' ')[0] || 'There';
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        .step{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-top:8px}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="section">
            <h2 style="margin:0 0 8px 0">Welcome to Couple Tracker, ${firstName}!</h2>
            <p class="muted" style="margin:0">We’re thrilled to have you. Here’s how to get started.</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Invite your partner</h3>
            <div class="step">1) Open the app and go to Profile → My Partner</div>
            <div class="step">2) Click “Invite Your Partner”</div>
            <div class="step">3) Enter their email and send the invite</div>
            <div class="step">4) They’ll receive a link to sign up and accept the partnership</div>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Need help?</h3>
            <p class="muted" style="margin:0 0 8px 0">Visit our Help Center for quick guides and FAQs.</p>
            <a href="${helpCenterUrl}" class="btn" style="background:#8b5cf6">Open Help Center</a>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Ready to begin?</h3>
            <a href="${appUrl}" class="btn">Log in now</a>
          </div>
          <div class="section muted" style="font-size:12px">Sent by Couples Tracker</div>
        </div>
      </div>
    </body>
  </html>`;
};

exports.sendWelcomeEmailOnSignup = functions.auth.user().onCreate(async (user) => {
  try {
    const userId = user.uid;
    const email = user.email;
    const displayName = user.displayName || '';
    if (!email) return;

    // Prevent duplicates
    const sentRef = db.collection('emailSends').doc(`welcome_${userId}`);
    const sentSnap = await sentRef.get();
    if (sentSnap.exists) return;

    const html = renderWelcomeEmail({
      displayName,
      helpCenterUrl: functions.config().app?.help_url || 'https://couples-tracker.web.app/help',
      appUrl: functions.config().app?.url || 'https://couples-tracker.web.app/'
    });

    const mailDoc = {
      to: [email],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: 'Welcome to Couple Tracker!',
        html,
      },
    };
    console.log('[functions] Queueing welcome email:', { to: email, from: mailDoc.from });
    await db.collection('mail').add(mailDoc);
    await sentRef.set({ userId, email, sentAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.error('[functions] Welcome email queue failed', err);
  }
});

// Invite email renderer
const renderInviteEmail = ({ inviterName, inviteeEmail, acceptUrl }) => {
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <h2 style="margin:12px 0 8px 0">You've been invited to connect</h2>
          <p class="muted" style="margin:0 0 12px 0">${inviterName || 'Your partner'} has invited you to connect as partners in Couples Tracker.</p>
          <a href="${acceptUrl}" class="btn">Accept Invitation</a>
          <p class="muted" style="margin-top:16px;font-size:12px">If you didn’t expect this, you can ignore this email.</p>
        </div>
      </div>
    </body>
  </html>`;
};

// Trigger email on invite creation
exports.sendInviteEmailOnCreate = functions.firestore
  .document('coupleInvitations/{inviteId}')
  .onCreate(async (snap) => {
    try {
      console.log('[functions] onCreate coupleInvitations fired for id:', snap.id);
      const invite = snap.data();
      console.log('[functions] invite payload:', invite);
      if (!invite?.inviteeEmail) return;
      if (invite.status && invite.status !== 'sent') return;

      const acceptBaseUrl = functions.config().app?.accept_url || 'https://couples-tracker.web.app/accept-invite';
      const acceptUrl = `${acceptBaseUrl}?inviteId=${snap.id}`;
      console.log('[functions] acceptUrl:', acceptUrl);

      const html = renderInviteEmail({
        inviterName: invite.inviterName || 'Your partner',
        inviteeEmail: invite.inviteeEmail,
        acceptUrl,
      });

      const mailDoc = {
        to: [invite.inviteeEmail],
        from: 'makeivan@gmail.com', // Explicitly set the FROM address
        replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
        message: {
          subject: 'Invitation to connect on Couples Tracker',
          html,
        },
      };
      console.log('[functions] Queueing invite email:', { to: invite.inviteeEmail, from: mailDoc.from });
      await db.collection('mail').add(mailDoc);

      await snap.ref.update({ emailedAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log('[functions] invite doc updated with emailedAt');
    } catch (err) {
      console.error('[functions] Invite email queue failed', err);
    }
  });

// Handle invitation status updates (accept/decline)
exports.handleInviteUpdate = functions.firestore
  .document('coupleInvitations/{inviteId}')
  .onUpdate(async (change) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      
      // Handle invitation acceptance
      if (before.status === 'sent' && after.status === 'accepted') {
        console.log('[functions] Invitation accepted, sending notification to inviter');
        await sendInvitationAcceptedEmail(after);
      }
      
      // Handle invitation decline
      if (before.status === 'sent' && after.status === 'declined') {
        console.log('[functions] Invitation declined, sending notification to inviter');
        await sendInvitationDeclinedEmail(after);
      }
      
      // Handle invitation completion (partner joined)
      if (before.status === 'accepted' && after.status === 'completed') {
        console.log('[functions] Invitation completed, partner joined');
        await sendPartnerJoinedEmail(after);
      }
      
    } catch (err) {
      console.error('[functions] Invite update handler failed', err);
    }
  });

// Trigger new account notification when user profile is created
exports.sendNewAccountNotificationOnProfileCreate = functions.firestore
  .document('userProfiles/{userId}')
  .onCreate(async (snap) => {
    try {
      console.log('[functions] onCreate userProfiles fired for id:', snap.id);
      const userProfile = snap.data();
      console.log('[functions] userProfile payload:', userProfile);
      
      if (!userProfile?.email) return;

      // Prevent duplicates
      const sentRef = db.collection('emailSends').doc(`new_account_${snap.id}`);
      const sentSnap = await sentRef.get();
      if (sentSnap.exists) return;

      const appUrl = functions.config().app?.url || 'https://couples-tracker.web.app/';
      const helpCenterUrl = functions.config().app?.help_url || 'https://couples-tracker.web.app/help';
      
      const html = renderNewAccountEmail({
        displayName: userProfile.firstName + ' ' + userProfile.lastName,
        email: userProfile.email,
        signupMethod: 'email', // Default, could be enhanced to detect Google signup
        appUrl,
        helpCenterUrl
      });

      const mailDoc = {
        to: [userProfile.email],
        from: 'makeivan@gmail.com', // Explicitly set the FROM address
        replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
        message: {
          subject: '🎉 Welcome to Couples Tracker - Your Account is Ready!',
          html,
        },
      };
      
      console.log('[functions] Queueing new account email:', { to: userProfile.email, from: mailDoc.from });
      await db.collection('mail').add(mailDoc);
      
      // Mark as sent to prevent duplicates
      await sentRef.set({ 
        userId: snap.id, 
        email: userProfile.email, 
        sentAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      // Log the email send
      await db.collection('emailLogs').add({
        type: 'new_account_created',
        userId: snap.id,
        sentTo: userProfile.email,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { 
          displayName: userProfile.firstName + ' ' + userProfile.lastName,
          signupMethod: 'email'
        }
      });
      
      console.log('[functions] new account notification sent successfully');
    } catch (err) {
      console.error('[functions] New account notification failed', err);
    }
  });

// Simple test email function (HTTP) that enqueues a mail doc
exports.sendTestEmail = functions.https.onRequest(async (req, res) => {
  try {
    const to = req.query.to || functions.config().app?.test_to;
    if (!to) return res.status(400).send({ ok: false, error: 'Missing ?to=' });
    const mailDoc = {
      to: [to],
      from: getMailFrom(),
      replyTo: getReplyTo(),
      message: {
        subject: 'Couples Tracker Test Email',
        text: 'This is a test email from Firebase Functions via mail queue.',
      },
    };
    console.log('[functions] Queueing test email:', { to, from: mailDoc.from });
    await db.collection('mail').add(mailDoc);
    res.status(200).send({ ok: true, to });
  } catch (err) {
    console.error('[functions] test email queue failed', err);
    res.status(500).send({ ok: false, error: err?.message || String(err) });
  }
});

// Callable test email function (no authentication required for testing)
exports.sendTestEmailCallable = functions.https.onCall(async (data, context) => {
  try {
    const { to } = data;
    if (!to) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing email address');
    }
    
    const mailDoc = {
      to: [to],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: 'Couples Tracker Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ec4899;">🎉 Email System Test Successful!</h2>
            <p>This is a test email from your Couples Tracker app.</p>
            <p>If you received this email, your SendGrid configuration is working correctly!</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      },
    };
    
    console.log('[functions] Queueing test email via callable:', { to, from: mailDoc.from });
    await db.collection('mail').add(mailDoc);
    
    // Log the email send
    await db.collection('emailLogs').add({
      type: 'test_email',
      sentTo: to,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { testType: 'manual' }
    });
    
    return { success: true, message: 'Test email queued successfully' };
  } catch (error) {
    console.error('[functions] test email callable failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test email');
  }
});

// Meeting reminder email renderer
const renderMeetingReminderEmail = ({ meetingTitle, meetingTime, partnerName, meetingUrl, agendaItems }) => {
  const formattedTime = new Date(meetingTime).toLocaleString();
  const agendaList = agendaItems?.length > 0 
    ? agendaItems.map(item => `<li>${item}</li>`).join('')
    : '<li>No agenda items set</li>';
    
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .urgent{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:12px 0}
        .agenda{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="urgent">
            <h2 style="margin:0 0 8px 0;color:#dc2626">Meeting Reminder</h2>
            <p style="margin:0;font-weight:600">${meetingTitle}</p>
            <p class="muted" style="margin:4px 0 0 0">${formattedTime}</p>
          </div>
          <div class="agenda">
            <h3 style="margin:0 0 8px 0">Agenda Items:</h3>
            <ul style="margin:0;padding-left:20px">
              ${agendaList}
            </ul>
          </div>
          <a href="${meetingUrl}" class="btn">Join Meeting</a>
          <p class="muted" style="margin-top:16px;font-size:12px">This meeting was scheduled by ${partnerName}</p>
        </div>
      </div>
    </body>
  </html>`;
};

// Todo notification email renderer
const renderTodoNotificationEmail = ({ todoTitle, todoDescription, priority, dueDate, partnerName, actionUrl }) => {
  const priorityColors = {
    high: '#dc2626',
    medium: '#f59e0b', 
    low: '#10b981'
  };
  const priorityColor = priorityColors[priority] || '#6b7280';
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';
  
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .todo{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:12px 0}
        .priority{display:inline-block;background:${priorityColor};color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <h2 style="margin:12px 0 8px 0">New Todo Assigned</h2>
          <div class="todo">
            <h3 style="margin:0 0 8px 0">${todoTitle}</h3>
            <p style="margin:0 0 8px 0">${todoDescription || 'No description provided'}</p>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="priority">${priority.toUpperCase()}</span>
              <span class="muted">Due: ${formattedDueDate}</span>
            </div>
          </div>
          <a href="${actionUrl}" class="btn">View Todo</a>
          <p class="muted" style="margin-top:16px;font-size:12px">This todo was assigned by ${partnerName}</p>
        </div>
      </div>
    </body>
  </html>`;
};

// New account created email renderer
const renderInvitationAcceptedEmail = ({ inviterName, inviteeEmail, coupleName, appUrl }) => {
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        .success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="success">
            <h2 style="margin:0 0 8px 0;color:#16a34a">🎉 Invitation Accepted!</h2>
            <p style="margin:0">Great news, ${inviterName}!</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Your partner has accepted your invitation!</h3>
            <p style="margin:0 0 8px 0"><strong>Partner Email:</strong> ${inviteeEmail}</p>
            <p style="margin:0 0 8px 0"><strong>Couple Name:</strong> ${coupleName}</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">What's next?</h3>
            <p style="margin:0 0 8px 0">Your partner is now creating their account. Once they complete the signup process, you'll both be able to:</p>
            <ul style="margin:8px 0;padding-left:20px">
              <li>Share your relationship goals and activities</li>
              <li>Track your weekly meetings together</li>
              <li>Manage your todos and rocks as a couple</li>
              <li>Build your relationship dashboard</li>
            </ul>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Ready to start your journey together?</h3>
            <a href="${appUrl}" class="btn">Access Your Couple Account</a>
          </div>
          <div class="section muted" style="font-size:12px">
            <p style="margin:0">Sent by Couples Tracker</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const renderInvitationDeclinedEmail = ({ inviterName, inviteeEmail, coupleName, appUrl }) => {
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        .info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="info">
            <h2 style="margin:0 0 8px 0;color:#1d4ed8">📧 Invitation Response</h2>
            <p style="margin:0">Hi ${inviterName},</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Your invitation was declined</h3>
            <p style="margin:0 0 8px 0"><strong>Invited Email:</strong> ${inviteeEmail}</p>
            <p style="margin:0 0 8px 0"><strong>Couple Name:</strong> ${coupleName}</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">What you can do:</h3>
            <ul style="margin:8px 0;padding-left:20px">
              <li>Send a new invitation to a different email address</li>
              <li>Check if the email address was correct</li>
              <li>Reach out to your partner to confirm their interest</li>
            </ul>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Send a new invitation?</h3>
            <a href="${appUrl}" class="btn">Manage Your Couple Account</a>
          </div>
          <div class="section muted" style="font-size:12px">
            <p style="margin:0">Sent by Couples Tracker</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const renderPartnerJoinedEmail = ({ inviterName, partnerName, coupleName, appUrl }) => {
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        .success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="success">
            <h2 style="margin:0 0 8px 0;color:#16a34a">🎉 Your partner has joined!</h2>
            <p style="margin:0">Congratulations, ${inviterName}!</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">${partnerName} has successfully joined your couple account!</h3>
            <p style="margin:0 0 8px 0"><strong>Couple Name:</strong> ${coupleName}</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">You can now:</h3>
            <ul style="margin:8px 0;padding-left:20px">
              <li>Share your relationship goals and activities</li>
              <li>Schedule and track your weekly meetings</li>
              <li>Manage your todos and rocks together</li>
              <li>Build your relationship dashboard</li>
              <li>See real-time updates from each other</li>
            </ul>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Start your journey together!</h3>
            <a href="${appUrl}" class="btn">Access Your Couple Account</a>
          </div>
          <div class="section muted" style="font-size:12px">
            <p style="margin:0">Sent by Couples Tracker</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const renderNewAccountEmail = ({ displayName, email, signupMethod, appUrl, helpCenterUrl }) => {
  const firstName = displayName?.split(' ')[0] || 'There';
  const signupMethodText = signupMethod === 'google' ? 'Google' : 'Email';
  
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:#ec4899;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        .step{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-top:8px}
        .success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <div class="success">
            <h2 style="margin:0 0 8px 0;color:#16a34a">🎉 Account Created Successfully!</h2>
            <p style="margin:0">Welcome to Couples Tracker, ${firstName}!</p>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Account Details</h3>
            <div class="step">
              <strong>Email:</strong> ${email}<br>
              <strong>Signup Method:</strong> ${signupMethodText}<br>
              <strong>Account Created:</strong> ${new Date().toLocaleDateString()}
            </div>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Next Steps</h3>
            <div class="step">1) Complete your profile with your partner's information</div>
            <div class="step">2) Invite your partner to join your couple account</div>
            <div class="step">3) Start tracking your relationship goals and activities</div>
            <div class="step">4) Schedule your first couple meeting</div>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Need help getting started?</h3>
            <p class="muted" style="margin:0 0 8px 0">Visit our Help Center for quick guides and FAQs.</p>
            <a href="${helpCenterUrl}" class="btn" style="background:#8b5cf6">Open Help Center</a>
          </div>
          <div class="section">
            <h3 style="margin:0 0 8px 0">Ready to begin?</h3>
            <a href="${appUrl}" class="btn">Access Your Account</a>
          </div>
          <div class="section muted" style="font-size:12px">
            <p style="margin:0">If you didn't create this account, please contact support immediately.</p>
            <p style="margin:4px 0 0 0">Sent by Couples Tracker</p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

// General notification email renderer
const renderGeneralNotificationEmail = ({ title, message, type, actionUrl, actionText }) => {
  const typeColors = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#3b82f6'
  };
  const typeColor = typeColors[type] || '#6b7280';
  
  return `
  <!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charset="UTF-8" />
      <style>
        body{margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827}
        .container{max-width:640px;margin:0 auto;padding:24px}
        .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px}
        .brand{display:flex;align-items:center}
        .logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(90deg,#ec4899,#f43f5e);display:flex;align-items:center;justify-content:center;margin-right:12px}
        .btn{display:inline-block;background:${typeColor};color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600}
        .muted{color:#6b7280}
        .notification{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:12px 0}
        @media(max-width:480px){.container{padding:16px}.card{padding:16px}}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="brand">
            <div class="logo">❤️</div>
            <div style="font-size:18px;font-weight:700">Couples Tracker</div>
          </div>
          <h2 style="margin:12px 0 8px 0">${title}</h2>
          <div class="notification">
            <p style="margin:0">${message}</p>
          </div>
          ${actionUrl && actionText ? `<a href="${actionUrl}" class="btn">${actionText}</a>` : ''}
          <p class="muted" style="margin-top:16px;font-size:12px">Sent by Couples Tracker</p>
        </div>
      </div>
    </html>`;
};

// HTTP function to send meeting reminder emails
exports.sendMeetingReminder = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication (allow testing without auth)
    if (!context.auth && !data.testMode) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { meetingId, partnerEmail, meetingTitle, meetingTime, agendaItems } = data;
    
    if (!meetingId || !partnerEmail || !meetingTitle || !meetingTime) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const appUrl = functions.config().app?.url || 'https://couples-tracker.web.app/';
    const meetingUrl = `${appUrl}/meetings/${meetingId}`;
    
    const html = renderMeetingReminderEmail({
      meetingTitle,
      meetingTime,
      partnerName: context.auth?.token?.name || 'Your partner',
      meetingUrl,
      agendaItems: agendaItems || []
    });

    const mailDoc = {
      to: [partnerEmail],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: `Meeting Reminder: ${meetingTitle}`,
        html,
      },
    };

    await db.collection('mail').add(mailDoc);
    
    // Log the email send
    await db.collection('emailLogs').add({
      type: 'meeting_reminder',
      meetingId,
      sentTo: partnerEmail,
      sentBy: context.auth?.uid || 'test-mode',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { meetingTitle, meetingTime }
    });

    return { success: true, message: 'Meeting reminder sent successfully' };
  } catch (error) {
    console.error('Meeting reminder email failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send meeting reminder');
  }
});

// HTTP function to send todo notification emails
exports.sendTodoNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication (allow testing without auth)
    if (!context.auth && !data.testMode) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { todoId, partnerEmail, todoTitle, todoDescription, priority, dueDate } = data;
    
    if (!todoId || !partnerEmail || !todoTitle) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const appUrl = functions.config().app?.url || 'https://couples-tracker.web.app/';
    const actionUrl = `${appUrl}/todos/${todoId}`;
    
    const html = renderTodoNotificationEmail({
      todoTitle,
      todoDescription,
      priority: priority || 'medium',
      dueDate,
      partnerName: context.auth?.token?.name || 'Your partner',
      actionUrl
    });

    const mailDoc = {
      to: [partnerEmail],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: `New Todo: ${todoTitle}`,
        html,
      },
    };

    await db.collection('mail').add(mailDoc);
    
    // Log the email send
    await db.collection('emailLogs').add({
      type: 'todo_notification',
      todoId,
      sentTo: partnerEmail,
      sentBy: context.auth?.uid || 'test-mode',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { todoTitle, priority, dueDate }
    });

    return { success: true, message: 'Todo notification sent successfully' };
  } catch (error) {
    console.error('Todo notification email failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send todo notification');
  }
});

// HTTP function to send new account created notification
exports.sendNewAccountNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication (allow testing without auth)
    if (!context.auth && !data.testMode) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, email, displayName, signupMethod } = data;
    
    if (!email || !displayName) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const appUrl = functions.config().app?.url || 'https://couples-tracker.web.app/';
    const helpCenterUrl = functions.config().app?.help_url || 'https://couples-tracker.web.app/help';
    
    const html = renderNewAccountEmail({
      displayName,
      email,
      signupMethod: signupMethod || 'email',
      appUrl,
      helpCenterUrl
    });

    const mailDoc = {
      to: [email],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: '🎉 Welcome to Couples Tracker - Your Account is Ready!',
        html,
      },
    };

    await db.collection('mail').add(mailDoc);
    
    // Log the email send
    await db.collection('emailLogs').add({
      type: 'new_account_created',
      userId: userId || context.auth?.uid || 'test-mode',
      sentTo: email,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { displayName, signupMethod: signupMethod || 'email' }
    });

    return { success: true, message: 'New account notification sent successfully' };
  } catch (error) {
    console.error('New account notification email failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send new account notification');
  }
});

// HTTP function to send general notification emails
exports.sendGeneralNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication (allow testing without auth)
    if (!context.auth && !data.testMode) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { partnerEmail, title, message, type, actionUrl, actionText } = data;
    
    if (!partnerEmail || !title || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const html = renderGeneralNotificationEmail({
      title,
      message,
      type: type || 'info',
      actionUrl,
      actionText
    });

    const mailDoc = {
      to: [partnerEmail],
      from: 'makeivan@gmail.com', // Explicitly set the FROM address
      replyTo: 'makeivan@gmail.com', // Explicitly set the REPLY-TO address
      message: {
        subject: title,
        html,
      },
    };

    await db.collection('mail').add(mailDoc);
    
    // Log the email send
    await db.collection('emailLogs').add({
      type: 'general_notification',
      sentTo: partnerEmail,
      sentBy: context.auth?.uid || 'test-mode',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { title, type }
    });

    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error('General notification email failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Scheduled function to send meeting reminders (runs every hour)
exports.scheduledMeetingReminders = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find meetings that are starting in the next 1-2 hours
    const meetingsSnapshot = await db.collection('meetings')
      .where('startTime', '>=', oneHourFromNow)
      .where('startTime', '<=', twoHoursFromNow)
      .where('reminderSent', '==', false)
      .get();

    const reminderPromises = meetingsSnapshot.docs.map(async (doc) => {
      const meeting = doc.data();
      
      // Get partner email
      const userDoc = await db.collection('users').doc(meeting.userId).get();
      const userData = userDoc.data();
      const partnerEmail = userData?.partnerEmail;
      
      if (!partnerEmail) return;

      const appUrl = functions.config().app?.url || 'https://couples-tracker.web.app/';
      const meetingUrl = `${appUrl}/meetings/${doc.id}`;
      
      const html = renderMeetingReminderEmail({
        meetingTitle: meeting.title,
        meetingTime: meeting.startTime.toDate(),
        partnerName: userData?.displayName || 'Your partner',
        meetingUrl,
        agendaItems: meeting.agendaItems || []
      });

      const mailDoc = {
        to: [partnerEmail],
        from: getMailFrom(),
        replyTo: getReplyTo(),
        message: {
          subject: `Meeting Reminder: ${meeting.title}`,
          html,
        },
      };

      await db.collection('mail').add(mailDoc);
      
      // Mark reminder as sent
      await doc.ref.update({ 
        reminderSent: true,
        reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log the email send
      await db.collection('emailLogs').add({
        type: 'scheduled_meeting_reminder',
        meetingId: doc.id,
        sentTo: partnerEmail,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { meetingTitle: meeting.title, meetingTime: meeting.startTime.toDate() }
      });
    });

    await Promise.all(reminderPromises);
    console.log(`Sent ${reminderPromises.length} meeting reminders`);
  } catch (error) {
    console.error('Scheduled meeting reminders failed:', error);
  }
});

// Send invitation accepted email
const sendInvitationAcceptedEmail = async (invitationData) => {
  try {
    const { inviterEmail, inviterName, inviteeEmail, coupleName } = invitationData;
    
    const emailContent = renderInvitationAcceptedEmail({
      inviterName,
      inviteeEmail,
      coupleName,
      appUrl: functions.config().app?.url || 'https://couples-tracker.web.app'
    });

    const mailDoc = {
      to: [inviterEmail],
      from: 'makeivan@gmail.com',
      replyTo: 'makeivan@gmail.com',
      message: {
        subject: '🎉 Your partner accepted your invitation!',
        html: emailContent,
      },
    };

    await db.collection('mail').add(mailDoc);
    console.log('[functions] Invitation accepted email sent to:', inviterEmail);
    
    // Log the email
    await db.collection('emailLogs').add({
      type: 'invitation_accepted',
      sentTo: inviterEmail,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { inviteeEmail, coupleName }
    });
    
  } catch (error) {
    console.error('[functions] Failed to send invitation accepted email:', error);
    throw error;
  }
};

// Send invitation declined email
const sendInvitationDeclinedEmail = async (invitationData) => {
  try {
    const { inviterEmail, inviterName, inviteeEmail, coupleName } = invitationData;
    
    const emailContent = renderInvitationDeclinedEmail({
      inviterName,
      inviteeEmail,
      coupleName,
      appUrl: functions.config().app?.url || 'https://couples-tracker.web.app'
    });

    const mailDoc = {
      to: [inviterEmail],
      from: 'makeivan@gmail.com',
      replyTo: 'makeivan@gmail.com',
      message: {
        subject: '📧 Your invitation was declined',
        html: emailContent,
      },
    };

    await db.collection('mail').add(mailDoc);
    console.log('[functions] Invitation declined email sent to:', inviterEmail);
    
    // Log the email
    await db.collection('emailLogs').add({
      type: 'invitation_declined',
      sentTo: inviterEmail,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { inviteeEmail, coupleName }
    });
    
  } catch (error) {
    console.error('[functions] Failed to send invitation declined email:', error);
    throw error;
  }
};

// Send partner joined email
const sendPartnerJoinedEmail = async (invitationData) => {
  try {
    const { inviterEmail, inviterName, coupleName } = invitationData;
    
    // Get partner name from the invitation data or user profile
    const partnerName = invitationData.partnerName || 'Your partner';
    
    const emailContent = renderPartnerJoinedEmail({
      inviterName,
      partnerName,
      coupleName,
      appUrl: functions.config().app?.url || 'https://couples-tracker.web.app'
    });

    const mailDoc = {
      to: [inviterEmail],
      from: 'makeivan@gmail.com',
      replyTo: 'makeivan@gmail.com',
      message: {
        subject: '🎉 Your partner has joined your couple account!',
        html: emailContent,
      },
    };

    await db.collection('mail').add(mailDoc);
    console.log('[functions] Partner joined email sent to:', inviterEmail);
    
    // Log the email
    await db.collection('emailLogs').add({
      type: 'partner_joined',
      sentTo: inviterEmail,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { coupleName, partnerName }
    });
    
  } catch (error) {
    console.error('[functions] Failed to send partner joined email:', error);
    throw error;
  }
};