const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  donationAccepted: (donorName, donationName, ngoName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">🎉 Donation Accepted!</h2>
      <p>Hi ${donorName},</p>
      <p>Great news! Your donation "<strong>${donationName}</strong>" has been accepted by <strong>${ngoName}</strong>.</p>
      <p>They will be picking it up soon. Thank you for making a difference!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/donations" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Donation</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  donationCompleted: (donorName, donationName, mealsServed) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">✅ Donation Completed!</h2>
      <p>Hi ${donorName},</p>
      <p>Your donation "<strong>${donationName}</strong>" has been successfully completed!</p>
      <p><strong>Impact:</strong> Approximately ${mealsServed} meals served 🍽️</p>
      <p>Thank you for your continued support in fighting food waste!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/analytics" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Impact</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  newDonationAvailable: (ngoName, donationName, location) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF9800;">🍽️ New Donation Available!</h2>
      <p>Hi ${ngoName},</p>
      <p>A new donation is available near you:</p>
      <ul>
        <li><strong>Food:</strong> ${donationName}</li>
        <li><strong>Location:</strong> ${location}</li>
      </ul>
      <p>Act fast to help reduce food waste!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/donations" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Donations</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  pickupReminder: (ngoName, donationName, pickupTime, address) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">⏰ Pickup Reminder</h2>
      <p>Hi ${ngoName},</p>
      <p>This is a reminder about your scheduled pickup:</p>
      <ul>
        <li><strong>Food:</strong> ${donationName}</li>
        <li><strong>Time:</strong> ${pickupTime}</li>
        <li><strong>Address:</strong> ${address}</li>
      </ul>
      <p>Please don't forget!</p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  verificationApproved: (userName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">✓ Account Verified!</h2>
      <p>Hi ${userName},</p>
      <p>Congratulations! Your account has been verified.</p>
      <p>You now have access to all SharePlate features including:</p>
      <ul>
        <li>Create and manage donations</li>
        <li>Real-time chat</li>
        <li>Advanced analytics</li>
        <li>Badges and rewards</li>
      </ul>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  badgeEarned: (userName, badgeName, badgeDescription) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FFD700;">🏆 New Badge Earned!</h2>
      <p>Hi ${userName},</p>
      <p>Congratulations! You've earned a new badge:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h3 style="color: #333;">${badgeName}</h3>
        <p>${badgeDescription}</p>
      </div>
      <p>Keep up the great work!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/profile/badges" style="background-color: #FFD700; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Badges</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `,
  
  monthlyReport: (userName, stats) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">📊 Your Monthly Impact Report</h2>
      <p>Hi ${userName},</p>
      <p>Here's a summary of your impact this month:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p><strong>Total Donations:</strong> ${stats.donations}</p>
        <p><strong>Meals Served:</strong> ${stats.meals} 🍽️</p>
        <p><strong>Carbon Saved:</strong> ${stats.carbon} kg CO2 🌍</p>
        <p><strong>People Helped:</strong> ${stats.people} 👥</p>
      </div>
      <p>Thank you for making a difference!</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/analytics" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report</a>
      </p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">SharePlate - Fighting Food Waste Together 🌍</p>
    </div>
  `
};

// Send email function
const sendEmail = async (to, subject, template, data) => {
  try {
    const htmlContent = typeof template === 'function' ? template(...data) : template;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Helper functions for specific emails
const sendDonationAcceptedEmail = (to, donorName, donationName, ngoName) => {
  return sendEmail(
    to,
    '🎉 Your Donation Has Been Accepted!',
    emailTemplates.donationAccepted,
    [donorName, donationName, ngoName]
  );
};

const sendDonationCompletedEmail = (to, donorName, donationName, mealsServed) => {
  return sendEmail(
    to,
    '✅ Donation Completed!',
    emailTemplates.donationCompleted,
    [donorName, donationName, mealsServed]
  );
};

const sendNewDonationEmail = (to, ngoName, donationName, location) => {
  return sendEmail(
    to,
    '🍽️ New Donation Available Near You!',
    emailTemplates.newDonationAvailable,
    [ngoName, donationName, location]
  );
};

const sendPickupReminderEmail = (to, ngoName, donationName, pickupTime, address) => {
  return sendEmail(
    to,
    '⏰ Pickup Reminder',
    emailTemplates.pickupReminder,
    [ngoName, donationName, pickupTime, address]
  );
};

const sendVerificationApprovedEmail = (to, userName) => {
  return sendEmail(
    to,
    '✓ Account Verified!',
    emailTemplates.verificationApproved,
    [userName]
  );
};

const sendBadgeEarnedEmail = (to, userName, badgeName, badgeDescription) => {
  return sendEmail(
    to,
    '🏆 New Badge Earned!',
    emailTemplates.badgeEarned,
    [userName, badgeName, badgeDescription]
  );
};

const sendMonthlyReportEmail = (to, userName, stats) => {
  return sendEmail(
    to,
    '📊 Your Monthly Impact Report',
    emailTemplates.monthlyReport,
    [userName, stats]
  );
};

module.exports = {
  sendEmail,
  sendDonationAcceptedEmail,
  sendDonationCompletedEmail,
  sendNewDonationEmail,
  sendPickupReminderEmail,
  sendVerificationApprovedEmail,
  sendBadgeEarnedEmail,
  sendMonthlyReportEmail,
  transporter
};
