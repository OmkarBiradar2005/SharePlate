// SMS Notification Service using Twilio
let twilioClient = null;

// Initialize Twilio client only if valid credentials are provided
function initializeTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  
  // Check if credentials are valid (not placeholders)
  if (sid && token && sid.startsWith('AC') && sid.length > 10) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(sid, token);
      console.log('✅ Twilio SMS service initialized');
    } catch (error) {
      console.log('⚠️ Twilio initialization failed:', error.message);
      twilioClient = null;
    }
  } else {
    console.log('ℹ️ Twilio SMS service disabled (no valid credentials)');
  }
}

// Initialize on module load
initializeTwilio();

// Send SMS notification
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log('📱 SMS (Mock):', to, message);
    return { success: true, mock: true };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('📱 SMS sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send urgent donation alert
const sendUrgentDonationAlert = async (ngo, donation) => {
  const message = `🚨 URGENT: ${donation.foodName} expires in ${donation.urgency?.hoursRemaining}hrs! 
Location: ${donation.pickupAddress}
Accept now: ${process.env.FRONTEND_URL || 'http://localhost:5500'}/ngo-dashboard.html`;
  
  return await sendSMS(ngo.phone, message);
};

// Send pickup confirmation
const sendPickupConfirmation = async (donor, ngo, donation) => {
  const message = `✅ ${ngo.name} accepted your donation: ${donation.foodName}
Contact: ${ngo.phone}
Pickup Address: ${donation.pickupAddress}`;
  
  return await sendSMS(donor.phone, message);
};

// Send completion notification
const sendCompletionNotification = async (donor, donation, impact) => {
  const message = `🎉 Donation completed!
${donation.foodName} was successfully delivered.
Impact: ${impact.mealsServed} meals, ${impact.co2Saved}kg CO2 saved!
Thank you for fighting food waste! 🌍`;
  
  return await sendSMS(donor.phone, message);
};

// Send OTP for verification
const sendOTP = async (phone, otp) => {
  const message = `Your SharePlate verification code is: ${otp}
Valid for 10 minutes. Do not share this code.`;
  
  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendUrgentDonationAlert,
  sendPickupConfirmation,
  sendCompletionNotification,
  sendOTP
};
