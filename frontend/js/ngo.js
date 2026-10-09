// NGO related functions

// Get all available donations (with optional filters)
async function getAllDonations(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const url = queryParams ? `/donations?${queryParams}` : '/donations';
        const result = await apiGet(url);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to get donations'));
    }
}

// Accept a donation
async function acceptDonationRequest(donationId) {
    try {
        const result = await apiPut(`/donations/accept/${donationId}`, {});
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to accept donation'));
    }
}

// Update donation status (complete)
async function updateDonationStatus(donationId, status) {
    try {
        const result = await apiPut(`/donations/status/${donationId}`, { status });
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to update donation status'));
    }
}

// Get single donation details
async function getDonationDetails(donationId) {
    try {
        const result = await apiGet(`/donations/${donationId}`);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to get donation details'));
    }
}

// Get donations statistics for NGO dashboard
function getNGOStats(donations, currentUserId) {
    const stats = {
        totalDonations: donations.length,
        availableDonations: 0,
        myAccepted: 0,
        myCompleted: 0,
        totalAccepted: 0,
        totalCompleted: 0
    };
    
    donations.forEach(donation => {
        // Count available donations
        if (donation.status === 'pending') {
            stats.availableDonations++;
        }
        
        // Count total accepted and completed
        if (donation.status === 'accepted') {
            stats.totalAccepted++;
        }
        
        if (donation.status === 'completed') {
            stats.totalCompleted++;
        }
        
        // Count my accepted and completed donations
        if (donation.acceptedBy && donation.acceptedBy._id === currentUserId) {
            if (donation.status === 'accepted') {
                stats.myAccepted++;
            } else if (donation.status === 'completed') {
                stats.myCompleted++;
            }
        }
    });
    
    return stats;
}

// Filter donations for NGO view
function filterDonationsForNGO(donations, filters = {}) {
    let filteredDonations = [...donations];
    
    // Filter by status
    if (filters.status) {
        filteredDonations = filteredDonations.filter(donation => 
            donation.status === filters.status
        );
    }
    
    // Filter by food type
    if (filters.foodType) {
        filteredDonations = filteredDonations.filter(donation => 
            donation.foodType === filters.foodType
        );
    }
    
    // Filter by availability (for NGOs to see only what they can accept)
    if (filters.availableOnly) {
        filteredDonations = filteredDonations.filter(donation => 
            donation.status === 'pending'
        );
    }
    
    // Filter by NGO's accepted donations
    if (filters.myDonations && filters.userId) {
        filteredDonations = filteredDonations.filter(donation => 
            donation.acceptedBy && donation.acceptedBy._id === filters.userId
        );
    }
    
    // Filter by expiry (show only non-expired)
    if (filters.nonExpiredOnly) {
        filteredDonations = filteredDonations.filter(donation => 
            !isExpired(donation.expiryTime)
        );
    }
    
    return filteredDonations;
}

// Sort donations by priority for NGO
function sortDonationsByPriority(donations) {
    return donations.sort((a, b) => {
        // Priority 1: Expiring soon (within 6 hours)
        const aExpiringSoon = isExpiringSoon(a.expiryTime) && 
                             (new Date(a.expiryTime) - new Date()) < 6 * 60 * 60 * 1000;
        const bExpiringSoon = isExpiringSoon(b.expiryTime) && 
                             (new Date(b.expiryTime) - new Date()) < 6 * 60 * 60 * 1000;
        
        if (aExpiringSoon && !bExpiringSoon) return -1;
        if (!aExpiringSoon && bExpiringSoon) return 1;
        
        // Priority 2: Recently created
        const aCreated = new Date(a.createdAt);
        const bCreated = new Date(b.createdAt);
        
        return bCreated - aCreated; // Newest first
    });
}

// Check if NGO can accept donation
function canAcceptDonation(donation) {
    return donation.status === 'pending' && !isExpired(donation.expiryTime);
}

// Check if NGO can complete donation
function canCompleteDonation(donation, currentUserId) {
    return donation.status === 'accepted' && 
           donation.acceptedBy && 
           donation.acceptedBy._id === currentUserId;
}

// Get donations by location proximity (if GPS coordinates available)
function getDonationsNearLocation(donations, userLat, userLng, maxDistanceKm = 50) {
    if (!userLat || !userLng) return donations;
    
    return donations.filter(donation => {
        if (!donation.location || !donation.location.lat || !donation.location.lng) {
            return true; // Include donations without GPS coordinates
        }
        
        const distance = calculateDistance(
            userLat, userLng, 
            donation.location.lat, donation.location.lng
        );
        
        return distance <= maxDistanceKm;
    }).sort((a, b) => {
        // Sort by distance if both have coordinates
        if (a.location && a.location.lat && b.location && b.location.lat) {
            const distA = calculateDistance(userLat, userLng, a.location.lat, a.location.lng);
            const distB = calculateDistance(userLat, userLng, b.location.lat, b.location.lng);
            return distA - distB;
        }
        return 0;
    });
}

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Format donation for NGO display
function formatDonationForNGODisplay(donation, currentUserId) {
    const baseFormat = formatDonationForDisplay(donation);
    
    return {
        ...baseFormat,
        canAccept: canAcceptDonation(donation),
        canComplete: canCompleteDonation(donation, currentUserId),
        isMyDonation: donation.acceptedBy && donation.acceptedBy._id === currentUserId,
        distance: donation.distance ? `${donation.distance.toFixed(1)} km away` : null,
        urgencyLevel: getUrgencyLevel(donation),
        restaurantContact: donation.donorId ? donation.donorId.phone : null,
        restaurantEmail: donation.donorId ? donation.donorId.email : null
    };
}

// Get urgency level based on expiry time
function getUrgencyLevel(donation) {
    if (isExpired(donation.expiryTime)) {
        return { level: 'expired', text: 'Expired', color: '#e74c3c' };
    }
    
    const hoursUntilExpiry = (new Date(donation.expiryTime) - new Date()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry <= 2) {
        return { level: 'critical', text: 'Critical - Expires in 2h', color: '#e74c3c' };
    } else if (hoursUntilExpiry <= 6) {
        return { level: 'urgent', text: 'Urgent - Expires in 6h', color: '#f39c12' };
    } else if (hoursUntilExpiry <= 24) {
        return { level: 'moderate', text: 'Moderate - Expires today', color: '#f1c40f' };
    } else {
        return { level: 'normal', text: 'Normal', color: '#27ae60' };
    }
}

// Validate NGO operations
function validateAcceptDonation(donation) {
    const errors = [];
    
    if (!donation) {
        errors.push('Donation not found');
        return errors;
    }
    
    if (donation.status !== 'pending') {
        errors.push('This donation is no longer available for acceptance');
    }
    
    if (isExpired(donation.expiryTime)) {
        errors.push('This donation has already expired');
    }
    
    return errors;
}

function validateCompleteDonation(donation, currentUserId) {
    const errors = [];
    
    if (!donation) {
        errors.push('Donation not found');
        return errors;
    }
    
    if (donation.status !== 'accepted') {
        errors.push('This donation is not in accepted status');
    }
    
    if (!donation.acceptedBy || donation.acceptedBy._id !== currentUserId) {
        errors.push('You are not authorized to complete this donation');
    }
    
    return errors;
}

// Search donations by food name or restaurant name
function searchDonations(donations, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return donations;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return donations.filter(donation => 
        donation.foodName.toLowerCase().includes(term) ||
        (donation.donorId && donation.donorId.name.toLowerCase().includes(term)) ||
        donation.pickupAddress.toLowerCase().includes(term)
    );
}

// Export functions
window.NGO = {
    getAllDonations,
    acceptDonationRequest,
    updateDonationStatus,
    getDonationDetails,
    getNGOStats,
    filterDonationsForNGO,
    sortDonationsByPriority,
    canAcceptDonation,
    canCompleteDonation,
    getDonationsNearLocation,
    calculateDistance,
    formatDonationForNGODisplay,
    getUrgencyLevel,
    validateAcceptDonation,
    validateCompleteDonation,
    searchDonations
};