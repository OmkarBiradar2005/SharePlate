// Donor (Restaurant) related functions

// Create a new donation
async function createDonation(donationData) {
    try {
        const result = await apiPost('/donations/create', donationData);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to create donation'));
    }
}

// Get all donations by current restaurant
async function getMyDonations() {
    try {
        const result = await apiGet('/donations/my');
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to get donations'));
    }
}

// Update donation status (cancel)
async function updateDonationStatus(donationId, status) {
    try {
        const result = await apiPut(`/donations/status/${donationId}`, { status });
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to update donation status'));
    }
}

// Delete donation (only pending)
async function deleteDonation(donationId) {
    try {
        const result = await apiDelete(`/donations/${donationId}`);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to delete donation'));
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

// Validate donation form data
function validateDonationForm(donationData) {
    const errors = [];
    const now = new Date();
    
    // Required fields
    if (!donationData.foodName || donationData.foodName.trim().length < 2) {
        errors.push('Food name must be at least 2 characters long');
    }
    
    if (!donationData.quantity || donationData.quantity.trim().length < 2) {
        errors.push('Please specify the quantity');
    }
    
    if (!donationData.foodType || !['veg', 'nonveg'].includes(donationData.foodType)) {
        errors.push('Please select food type (veg or nonveg)');
    }
    
    if (!donationData.pickupAddress || donationData.pickupAddress.trim().length < 10) {
        errors.push('Please enter a complete pickup address');
    }
    
    if (!isValidPhone(donationData.contactNumber)) {
        errors.push('Please enter a valid contact number (10-15 digits)');
    }
    
    // Date validations
    if (!donationData.cookedTime) {
        errors.push('Please enter when the food was cooked');
    } else {
        const cookedTime = new Date(donationData.cookedTime);
        if (cookedTime > now) {
            errors.push('Cooked time cannot be in the future');
        }
        
        // Check if cooked time is too old (more than 24 hours ago)
        const hoursSinceCooked = (now - cookedTime) / (1000 * 60 * 60);
        if (hoursSinceCooked > 24) {
            errors.push('Food cooked more than 24 hours ago may not be safe to consume');
        }
    }
    
    if (!donationData.expiryTime) {
        errors.push('Please enter when the food expires');
    } else {
        const expiryTime = new Date(donationData.expiryTime);
        if (expiryTime <= now) {
            errors.push('Expiry time must be in the future');
        }
        
        if (donationData.cookedTime) {
            const cookedTime = new Date(donationData.cookedTime);
            if (expiryTime <= cookedTime) {
                errors.push('Expiry time must be after cooked time');
            }
        }
    }
    
    // Optional URL validation
    if (donationData.imageUrl && donationData.imageUrl.trim() !== '') {
        try {
            new URL(donationData.imageUrl);
        } catch (e) {
            errors.push('Please enter a valid image URL');
        }
    }
    
    // Location validation
    if (donationData.location) {
        if (typeof donationData.location.lat !== 'number' || 
            typeof donationData.location.lng !== 'number') {
            errors.push('Please enter valid GPS coordinates');
        }
        
        if (Math.abs(donationData.location.lat) > 90) {
            errors.push('Latitude must be between -90 and 90');
        }
        
        if (Math.abs(donationData.location.lng) > 180) {
            errors.push('Longitude must be between -180 and 180');
        }
    }
    
    return errors;
}

// Get donation statistics for dashboard
function getDonationStats(donations) {
    const stats = {
        total: donations.length,
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0
    };
    
    donations.forEach(donation => {
        if (stats.hasOwnProperty(donation.status)) {
            stats[donation.status]++;
        }
    });
    
    return stats;
}

// Filter donations by status
function filterDonationsByStatus(donations, status) {
    if (!status) return donations;
    return donations.filter(donation => donation.status === status);
}

// Filter donations by food type
function filterDonationsByFoodType(donations, foodType) {
    if (!foodType) return donations;
    return donations.filter(donation => donation.foodType === foodType);
}

// Sort donations by creation date (newest first)
function sortDonationsByDate(donations, ascending = false) {
    return donations.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

// Check if donation can be cancelled
function canCancelDonation(donation) {
    return donation.status === 'pending';
}

// Check if donation can be edited
function canEditDonation(donation) {
    return donation.status === 'pending';
}

// Get time remaining until expiry
function getTimeUntilExpiry(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) {
        return 'Expired';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m left`;
    } else {
        return `${diffMinutes}m left`;
    }
}

// Format donation for display
function formatDonationForDisplay(donation) {
    return {
        ...donation,
        formattedCreatedAt: formatDateTime(donation.createdAt),
        formattedCookedTime: formatDateTime(donation.cookedTime),
        formattedExpiryTime: formatDateTime(donation.expiryTime),
        timeUntilExpiry: getTimeUntilExpiry(donation.expiryTime),
        isExpired: isExpired(donation.expiryTime),
        isExpiringSoon: isExpiringSoon(donation.expiryTime),
        canCancel: canCancelDonation(donation),
        canEdit: canEditDonation(donation),
        acceptedByName: donation.acceptedBy ? donation.acceptedBy.name : null,
        restaurantName: donation.donorId ? donation.donorId.name : 'Unknown'
    };
}

// Helper function to prepare donation data for API
function prepareDonationData(formData) {
    const data = {
        foodName: formData.foodName.trim(),
        quantity: formData.quantity.trim(),
        foodType: formData.foodType,
        cookedTime: formData.cookedTime,
        expiryTime: formData.expiryTime,
        pickupAddress: formData.pickupAddress.trim(),
        contactNumber: formData.contactNumber.trim()
    };
    
    // Optional fields
    if (formData.imageUrl && formData.imageUrl.trim() !== '') {
        data.imageUrl = formData.imageUrl.trim();
    }
    
    if (formData.location && formData.location.lat && formData.location.lng) {
        data.location = {
            lat: parseFloat(formData.location.lat),
            lng: parseFloat(formData.location.lng)
        };
    }
    
    return data;
}

// Export functions
window.DONOR = {
    createDonation,
    getMyDonations,
    updateDonationStatus,
    deleteDonation,
    getDonationDetails,
    validateDonationForm,
    getDonationStats,
    filterDonationsByStatus,
    filterDonationsByFoodType,
    sortDonationsByDate,
    canCancelDonation,
    canEditDonation,
    getTimeUntilExpiry,
    formatDonationForDisplay,
    prepareDonationData
};