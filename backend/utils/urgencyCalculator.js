// Urgency Calculator for Food Donations
// Calculates urgency level based on expiration time

const calculateUrgency = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);

  if (hoursUntilExpiry <= 0) {
    return {
      level: 'expired',
      color: '#95a5a6',
      priority: 0,
      message: 'Expired',
      hoursRemaining: 0
    };
  } else if (hoursUntilExpiry <= 2) {
    return {
      level: 'critical',
      color: '#e74c3c',
      priority: 5,
      message: 'Critical - Expires very soon!',
      hoursRemaining: Math.round(hoursUntilExpiry * 10) / 10
    };
  } else if (hoursUntilExpiry <= 4) {
    return {
      level: 'urgent',
      color: '#e67e22',
      priority: 4,
      message: 'Urgent - Pickup needed soon',
      hoursRemaining: Math.round(hoursUntilExpiry * 10) / 10
    };
  } else if (hoursUntilExpiry <= 8) {
    return {
      level: 'moderate',
      color: '#f39c12',
      priority: 3,
      message: 'Moderate urgency',
      hoursRemaining: Math.round(hoursUntilExpiry * 10) / 10
    };
  } else if (hoursUntilExpiry <= 12) {
    return {
      level: 'low',
      color: '#3498db',
      priority: 2,
      message: 'Available for pickup',
      hoursRemaining: Math.round(hoursUntilExpiry * 10) / 10
    };
  } else {
    return {
      level: 'fresh',
      color: '#2ecc71',
      priority: 1,
      message: 'Fresh - Plenty of time',
      hoursRemaining: Math.round(hoursUntilExpiry * 10) / 10
    };
  }
};

const getTimeRemaining = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, display: 'Expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { 
      expired: false, 
      display: `${days}d ${hours % 24}h remaining`,
      hours: hours,
      minutes: minutes 
    };
  }

  return { 
    expired: false, 
    display: `${hours}h ${minutes}m remaining`,
    hours: hours,
    minutes: minutes 
  };
};

module.exports = { calculateUrgency, getTimeRemaining };
