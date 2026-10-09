// Smart Matching Algorithm for Donations and NGOs
const User = require('../models/User');

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance; // Distance in km
};

// Score NGO based on multiple factors
const scoreNGO = (ngo, donation, distance) => {
  let score = 0;

  // Distance score (closer is better) - Max 40 points
  if (distance <= 2) score += 40;
  else if (distance <= 5) score += 30;
  else if (distance <= 10) score += 20;
  else if (distance <= 20) score += 10;
  else score += 5;

  // Rating score - Max 25 points
  score += (ngo.rating?.average || 0) * 5;

  // Reliability score (based on completion rate) - Max 20 points
  const completionRate = ngo.totalPickups > 0 
    ? (ngo.totalPickups / (ngo.totalPickups + (ngo.cancelledPickups || 0))) 
    : 0.5;
  score += completionRate * 20;

  // Verification score - 10 points
  if (ngo.isVerified) score += 10;

  // Response time score - 5 points
  if (ngo.averageResponseTime && ngo.averageResponseTime < 30) score += 5;

  return Math.round(score);
};

// Find best matching NGOs for a donation
const findMatchingNGOs = async (donation, maxResults = 10, maxDistance = 50) => {
  try {
    // Find all NGOs
    const ngos = await User.find({ 
      role: 'ngo',
      isVerified: true 
    }).select('name email phone address location rating totalPickups cancelledPickups averageResponseTime');

    if (!donation.location?.lat || !donation.location?.lng) {
      // If no location, return all NGOs sorted by rating
      return ngos
        .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
        .slice(0, maxResults);
    }

    // Calculate distance and score for each NGO
    const scoredNGOs = ngos
      .map(ngo => {
        const distance = ngo.location?.lat && ngo.location?.lng
          ? calculateDistance(
              donation.location.lat,
              donation.location.lng,
              ngo.location.lat,
              ngo.location.lng
            )
          : 999; // Far away if no location

        const score = scoreNGO(ngo, donation, distance);

        return {
          ngo,
          distance: Math.round(distance * 10) / 10,
          score,
          estimatedTime: Math.round(distance / 30 * 60) // Assuming 30km/h average speed
        };
      })
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scoredNGOs;
  } catch (error) {
    console.error('Matching algorithm error:', error);
    return [];
  }
};

// Auto-notify best matching NGOs
const notifyMatchingNGOs = async (donation, io) => {
  const matches = await findMatchingNGOs(donation, 5, 30);
  
  const Notification = require('../models/Notification');
  
  for (const match of matches) {
    // Create notification
    await Notification.create({
      userId: match.ngo._id,
      type: 'new_donation_match',
      title: '🔥 New Donation Match!',
      message: `${donation.foodName} available ${match.distance}km away. Score: ${match.score}/100`,
      data: {
        donationId: donation._id,
        distance: match.distance,
        score: match.score,
        urgency: donation.urgency?.level
      }
    });

    // Send socket notification
    if (io) {
      io.emit('donation_match', {
        ngoId: match.ngo._id,
        donation: donation,
        match: match
      });
    }
  }

  return matches;
};

module.exports = { 
  calculateDistance, 
  findMatchingNGOs, 
  notifyMatchingNGOs,
  scoreNGO 
};
