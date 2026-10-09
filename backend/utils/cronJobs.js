const cron = require('node-cron');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPickupReminderEmail, sendMonthlyReportEmail } = require('./emailService');

// Check for expiring donations every hour
const checkExpiringDonations = cron.schedule('0 * * * *', async () => {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    const expiringDonations = await Donation.find({
      status: 'pending',
      expiryTime: {
        $lte: oneHourFromNow,
        $gt: new Date()
      }
    }).populate('donorId', 'name email');

    for (const donation of expiringDonations) {
      // Create notification
      await Notification.create({
        userId: donation.donorId._id,
        type: 'donation_expiring',
        title: 'Donation Expiring Soon!',
        message: `Your donation "${donation.foodName}" will expire in less than an hour.`,
        data: {
          donationId: donation._id,
          link: `/donations/${donation._id}`
        },
        priority: 'urgent'
      });
    }

    console.log(`✅ Checked expiring donations: ${expiringDonations.length} found`);
  } catch (error) {
    console.error('Error checking expiring donations:', error);
  }
});

// Mark expired donations every 30 minutes
const markExpiredDonations = cron.schedule('*/30 * * * *', async () => {
  try {
    const result = await Donation.updateMany(
      {
        status: 'pending',
        expiryTime: { $lt: new Date() }
      },
      {
        status: 'expired'
      }
    );

    console.log(`✅ Marked expired donations: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Error marking expired donations:', error);
  }
});

// Send pickup reminders every hour
const sendPickupReminders = cron.schedule('0 * * * *', async () => {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    
    const upcomingPickups = await Donation.find({
      status: 'accepted',
      'scheduledPickup.date': {
        $lte: oneHourFromNow,
        $gt: new Date()
      },
      'scheduledPickup.confirmed': false
    })
    .populate('acceptedBy', 'name email')
    .populate('donorId', 'name phone address');

    for (const donation of upcomingPickups) {
      if (donation.acceptedBy) {
        // Create notification
        await Notification.create({
          userId: donation.acceptedBy._id,
          type: 'pickup_reminder',
          title: 'Upcoming Pickup Reminder',
          message: `Pickup for "${donation.foodName}" is scheduled in less than an hour.`,
          data: {
            donationId: donation._id,
            link: `/donations/${donation._id}`
          },
          priority: 'high'
        });

        // Send email
        if (donation.scheduledPickup) {
          await sendPickupReminderEmail(
            donation.acceptedBy.email,
            donation.acceptedBy.name,
            donation.foodName,
            donation.scheduledPickup.date.toLocaleString(),
            donation.pickupAddress
          );
        }
      }
    }

    console.log(`✅ Sent pickup reminders: ${upcomingPickups.length}`);
  } catch (error) {
    console.error('Error sending pickup reminders:', error);
  }
});

// Send monthly impact reports (1st of every month at 9 AM)
const sendMonthlyReports = cron.schedule('0 9 1 * *', async () => {
  try {
    const users = await User.find({ isActive: true, 'preferences.notifications.email': true });
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);

    for (const user of users) {
      let query = { status: 'completed' };
      
      if (user.role === 'restaurant') {
        query.donorId = user._id;
      } else if (user.role === 'ngo') {
        query.acceptedBy = user._id;
      } else {
        continue;
      }

      query.completedAt = {
        $gte: startOfLastMonth,
        $lte: endOfLastMonth
      };

      const donations = await Donation.find(query);
      
      if (donations.length > 0) {
        const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedMeals || 0), 0);
        const carbonSaved = donations.reduce((sum, d) => sum + (d.carbonFootprintSaved || 0), 0);

        const stats = {
          donations: donations.length,
          meals: totalMeals,
          carbon: carbonSaved.toFixed(2),
          people: Math.floor(totalMeals / 3)
        };

        await sendMonthlyReportEmail(user.email, user.name, stats);
        
        await Notification.create({
          userId: user._id,
          type: 'system_announcement',
          title: 'Monthly Impact Report Ready!',
          message: `Your impact report for ${lastMonth.toLocaleString('default', { month: 'long' })} is ready to view.`,
          data: {
            link: '/analytics'
          },
          priority: 'medium'
        });
      }
    }

    console.log(`✅ Sent monthly reports to ${users.length} users`);
  } catch (error) {
    console.error('Error sending monthly reports:', error);
  }
});

// Update user statistics daily at midnight
const updateUserStats = cron.schedule('0 0 * * *', async () => {
  try {
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      if (user.role === 'restaurant') {
        const totalDonations = await Donation.countDocuments({
          donorId: user._id,
          status: 'completed'
        });
        user.totalDonations = totalDonations;
      } else if (user.role === 'ngo') {
        const totalPickups = await Donation.countDocuments({
          acceptedBy: user._id,
          status: 'completed'
        });
        user.totalPickups = totalPickups;
      }
      
      await user.save();
    }

    console.log(`✅ Updated stats for ${users.length} users`);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
});

// Start all cron jobs
const startCronJobs = () => {
  checkExpiringDonations.start();
  markExpiredDonations.start();
  sendPickupReminders.start();
  sendMonthlyReports.start();
  updateUserStats.start();
  
  console.log('✅ All cron jobs started successfully');
};

// Stop all cron jobs
const stopCronJobs = () => {
  checkExpiringDonations.stop();
  markExpiredDonations.stop();
  sendPickupReminders.stop();
  sendMonthlyReports.stop();
  updateUserStats.stop();
  
  console.log('❌ All cron jobs stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  checkExpiringDonations,
  markExpiredDonations,
  sendPickupReminders,
  sendMonthlyReports,
  updateUserStats
};
