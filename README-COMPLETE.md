# 🍽️ SharePlate - Advanced Food Waste Donation System v2.0

**Fighting Food Waste Together 🌍**

SharePlate is a comprehensive full-stack web application that connects restaurants with surplus food to NGOs who can distribute it to those in need. Version 2.0 includes 20+ advanced features to maximize impact and user experience.

---

## 🚀 New Features Implemented

### 1. **Real-Time Notifications** ✅
- Socket.IO integration for instant updates
- Push notifications for donation status changes
- Email notifications via Nodemailer
- Browser notifications support
- Customizable notification preferences

### 2. **Advanced Search & Filters** ✅
- Full-text search across donations
- Filter by food type, status, location
- Sort by distance, date, relevance
- Pagination support
- Location-based search with distance calculation

### 3. **Rating & Review System** ✅
- 5-star rating system
- Category-based ratings (punctuality, communication, food quality)
- Review comments and responses
- Helpful review markers
- Average rating calculation

### 4. **Analytics Dashboard** ✅
- Comprehensive statistics
- Monthly donation trends
- Carbon footprint tracking
- Meals saved counter
- Impact visualization

### 5. **Image Upload System** ✅
- Cloudinary integration
- Multiple image upload per donation
- Profile picture upload
- Verification document upload
- Image compression and optimization

### 6. **Real-Time Chat** ✅
- Socket.IO powered messaging
- One-to-one chat between donors and NGOs
- Typing indicators
- Read receipts
- Message attachments support

### 7. **QR Code System** ✅
- Auto-generated QR codes for donations
- QR scanning for pickup verification
- Secure donation confirmation

### 8. **Gamification** ✅
- Achievement badges
- Points system
- User rankings
- Leaderboards
- Progress tracking

### 9. **Blog & News** ✅
- Success stories
- Tips and guides
- Community updates
- Comments and likes
- SEO-optimized posts

### 10. **Admin Panel** ✅
- User management
- Donation oversight
- Verification approvals
- System announcements
- Comprehensive analytics

### 11. **Notification System** ✅
- In-app notifications
- Email notifications
- Priority levels
- Notification preferences
- Mark as read functionality

### 12. **Report Generation** ✅
- PDF donation reports
- CSV export
- Tax certificates
- Monthly summaries
- Custom date ranges

### 13. **Advanced Security** ✅
- API rate limiting
- Helmet.js security headers
- MongoDB sanitization
- JWT authentication
- Role-based access control

### 14. **Email Service** ✅
- Beautiful HTML templates
- Donation status emails
- Monthly impact reports
- Badge achievement notifications
- Pickup reminders

### 15. **Automated Tasks** ✅
- Cron job scheduler
- Expiring donation alerts
- Auto-mark expired donations
- Pickup reminders
- Monthly report generation

### 16. **Enhanced Models** ✅
- User verification system
- Donation tracking
- Scheduled pickups
- Carbon footprint calculation
- Recurring donations

### 17. **Multi-Resource Routes** ✅
- 11 RESTful API route sets
- Clean endpoint structure
- Proper HTTP methods
- Error handling

### 18. **Location Features** ✅
- Distance calculation (Haversine formula)
- Location-based filtering
- Map-ready data structure
- GPS coordinates support

### 19. **User Preferences** ✅
- Notification settings
- Language preference
- Theme selection (dark/light)
- Privacy controls

### 20. **Comprehensive Documentation** ✅
- API endpoint documentation
- Setup instructions
- Environment variables
- Feature guides

---

## 📁 Project Structure

```
SharePlate/
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── cloudinary.js            # Image upload configuration
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── donationController.js    # Donation CRUD & search
│   │   ├── reviewController.js      # Rating & reviews
│   │   ├── analyticsController.js   # Statistics & analytics
│   │   ├── chatController.js        # Real-time messaging
│   │   ├── gamificationController.js# Badges & points
│   │   ├── blogController.js        # Blog posts
│   │   ├── adminController.js       # Admin panel
│   │   ├── notificationController.js# Notifications
│   │   ├── uploadController.js      # File uploads
│   │   └── reportController.js      # PDF & CSV reports
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── rateLimiter.js           # API rate limiting
│   ├── models/
│   │   ├── User.js                  # Enhanced user model
│   │   ├── Donation.js              # Enhanced donation model
│   │   ├── Review.js                # Review model
│   │   ├── Chat.js                  # Chat & messages
│   │   ├── Notification.js          # Notification model
│   │   ├── Badge.js                 # Badges & achievements
│   │   ├── Blog.js                  # Blog posts
│   │   ├── Schedule.js              # Recurring donations
│   │   └── AdminSettings.js         # System settings
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── donationRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── gamificationRoutes.js
│   │   ├── blogRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── reportRoutes.js
│   ├── utils/
│   │   ├── emailService.js          # Email templates & sending
│   │   └── cronJobs.js              # Automated tasks
│   ├── server.js                    # Main server file
│   ├── server-new.js                # Enhanced server with Socket.IO
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── js/
│   │   ├── api.js                   # Original API calls
│   │   ├── api-enhanced.js          # Enhanced API with all features
│   │   ├── auth.js                  # Authentication
│   │   ├── donor.js                 # Donor functions
│   │   └── ngo.js                   # NGO functions
│   ├── css/
│   │   └── style.css
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── donor-dashboard.html
│   ├── ngo-dashboard.html
│   ├── create-donation.html
│   └── donation-details.html
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Cloudinary account (for image uploads)
- Gmail account (for emails) or SMTP server

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/shareplate.git
cd shareplate
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the backend folder:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/shareplate
JWT_SECRET=your_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Step 4: Start MongoDB
```bash
mongod
```

### Step 5: Start the Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will start on http://localhost:5000

### Step 6: Open Frontend
Use Live Server or any static file server to serve the frontend files on port 5500.

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Donations
- `GET /api/donations` - Get all donations (with filters & search)
- `GET /api/donations/my` - Get my donations
- `GET /api/donations/:id` - Get single donation
- `POST /api/donations/create` - Create donation
- `PUT /api/donations/accept/:id` - Accept donation
- `PUT /api/donations/status/:id` - Update status
- `DELETE /api/donations/:id` - Delete donation

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews
- `PUT /api/reviews/:id/response` - Add response
- `PUT /api/reviews/:id/helpful` - Mark helpful

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/analytics/leaderboard` - Get leaderboard
- `GET /api/analytics/stats` - Get system stats

### Chats
- `POST /api/chats` - Create/get chat
- `GET /api/chats` - Get user chats
- `POST /api/chats/:chatId/messages` - Send message
- `PUT /api/chats/:chatId/read` - Mark as read

### Gamification
- `GET /api/gamification/badges` - Get user badges
- `POST /api/gamification/check-badges` - Check for new badges
- `GET /api/gamification/rank` - Get user rank

### Blog
- `GET /api/blog` - Get all posts
- `GET /api/blog/:slug` - Get single post
- `POST /api/blog/:id/comments` - Add comment
- `PUT /api/blog/:id/like` - Like post

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Uploads
- `POST /api/upload/donation-images` - Upload images
- `POST /api/upload/profile-image` - Upload profile pic
- `POST /api/upload/verification-document` - Upload document

### Reports
- `GET /api/reports/donations` - Download PDF report
- `GET /api/reports/export-csv` - Download CSV
- `GET /api/reports/tax-certificate` - Download tax certificate

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/verify` - Verify user
- `POST /api/admin/announcement` - Send announcement

---

## 🎯 Usage Examples

### Advanced Donation Search
```javascript
const donations = await SharePlateAPI.apiGet('/donations?search=rice&foodType=veg&sortBy=distance&lat=40.7128&lng=-74.0060&maxDistance=10&page=1&limit=10');
```

### Upload Images
```javascript
const fileInput = document.querySelector('#imageUpload');
const result = await SharePlateAPI.uploadDonationImages(fileInput.files);
```

### Real-Time Chat
```javascript
const socket = SharePlateAPI.initializeSocket();
socket.on('new_message', (data) => {
  displayMessage(data.message);
});
```

### Download Report
```javascript
SharePlateAPI.downloadDonationReport('2024-01-01', '2024-12-31');
```

---

## 🔐 Security Features
- JWT token authentication
- Role-based access control (Restaurant, NGO, Admin)
- API rate limiting
- Input sanitization
- Helmet.js security headers
- CORS protection
- Password hashing with bcrypt

---

## 🌟 Key Features Highlights

### For Donors (Restaurants)
- Create donations with multiple images
- Track donation history
- View analytics & impact
- Real-time chat with NGOs
- Earn badges & points
- Download tax certificates
- QR code verification

### For NGOs
- Browse available donations
- Location-based search
- Accept and track pickups
- Rate and review donors
- View impact statistics
- Real-time notifications

### For Admins
- User management
- Donation oversight
- Verify accounts
- Send announcements
- System analytics
- Blog management

---

## 📊 Impact Metrics
- **Total Meals Saved**: Tracked and displayed
- **Carbon Footprint**: Automatically calculated
- **People Helped**: Estimated from meals
- **Success Rate**: Completed vs total donations

---

## 🤝 Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📝 License
MIT License - feel free to use this project for learning and development.

---

## 🙏 Acknowledgments
- MongoDB for database
- Express.js for backend framework
- Socket.IO for real-time features
- Cloudinary for image hosting
- Nodemailer for email service

---

## 📞 Support
For issues and questions:
- Create an issue on GitHub
- Email: support@shareplate.com
- Documentation: https://docs.shareplate.com

---

**Built with ❤️ to fight food waste and help communities**

