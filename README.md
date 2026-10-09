# 🍽️ SharePlate - Food Waste Donation System

A complete full-stack web application that connects restaurants with NGOs to reduce food waste by facilitating food donations.

## 🌟 Features

### For Restaurants (Food Donors)
- ✅ Create food donation listings
- ✅ Track donation status in real-time
- ✅ Manage pickup details and contact information
- ✅ View donation history and statistics
- ✅ Cancel pending donations

### For NGOs (Food Receivers)
- ✅ Browse available food donations
- ✅ Accept donation requests
- ✅ Mark donations as completed after pickup
- ✅ Filter by food type, location, and urgency
- ✅ Contact restaurants directly

### General Features
- 🔐 Secure JWT-based authentication
- 📱 Fully responsive design
- 🎨 Modern, intuitive user interface
- 📊 Real-time status tracking
- 🗺️ Optional GPS location support
- 📸 Image upload capability (Cloudinary integration)

## 🚀 Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** (No frameworks)
- **Responsive design** with CSS Grid and Flexbox
- **Fetch API** for HTTP requests
- **Local Storage** for JWT token management

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Optional Integrations
- **Cloudinary** for image uploads
- **GPS coordinates** for location tracking

## 📁 Project Structure

```
SharePlate/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── donationController.js # Donation management
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema (Restaurant/NGO)
│   │   └── Donation.js           # Donation schema
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   └── donationRoutes.js     # Donation routes
│   ├── server.js                 # Express server setup
│   ├── package.json              # Dependencies and scripts
│   └── .env                      # Environment variables
└── frontend/
    ├── css/
    │   └── style.css             # Complete responsive styling
    ├── js/
    │   ├── api.js                # API helper functions
    │   ├── auth.js               # Authentication functions
    │   ├── donor.js              # Restaurant-specific functions
    │   └── ngo.js                # NGO-specific functions
    ├── index.html                # Landing page
    ├── login.html                # User login
    ├── register.html             # User registration
    ├── donor-dashboard.html      # Restaurant dashboard
    ├── create-donation.html      # Create new donation
    ├── ngo-dashboard.html        # NGO dashboard
    └── donation-details.html     # Detailed donation view
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file with the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/shareplate
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   PORT=5000
   NODE_ENV=development
   
   # Optional: Cloudinary for image uploads
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Serve the files using a local server:**
   
   **Option 1: Using VS Code Live Server extension**
   - Install Live Server extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

   **Option 2: Using Python HTTP server**
   ```bash
   python -m http.server 3000
   ```

   **Option 3: Using Node.js http-server**
   ```bash
   npx http-server -p 3000
   ```

The frontend will be available at `http://localhost:3000` (or your chosen port)

### MongoDB Setup

**Option 1: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use the connection string: `mongodb://localhost:27017/shareplate`

**Option 2: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Update `MONGO_URI` in your `.env` file

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user profile | Private |

### Donation Routes (`/api/donations`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/create` | Create new donation | Restaurant only |
| GET | `/` | Get all donations (with filters) | Private |
| GET | `/my` | Get user's donations | Restaurant only |
| GET | `/:id` | Get single donation details | Private |
| PUT | `/accept/:id` | Accept donation | NGO only |
| PUT | `/status/:id` | Update donation status | Private |
| DELETE | `/:id` | Delete donation | Restaurant only |

### Sample API Responses

**Register User:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Restaurant Name",
    "email": "restaurant@example.com",
    "phone": "1234567890",
    "role": "restaurant",
    "address": "123 Main St, City",
    "token": "jwt_token_here"
  }
}
```

**Get Donations:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "foodName": "Biryani",
      "quantity": "50 plates",
      "foodType": "nonveg",
      "cookedTime": "2026-01-16T14:00:00.000Z",
      "expiryTime": "2026-01-17T02:00:00.000Z",
      "pickupAddress": "123 Restaurant St, City",
      "contactNumber": "1234567890",
      "status": "pending",
      "donorId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Restaurant Name",
        "phone": "1234567890",
        "address": "123 Main St, City"
      },
      "createdAt": "2026-01-16T15:00:00.000Z"
    }
  ]
}
```

## 👥 User Roles & Permissions

### Restaurant (Donor)
- Create food donation listings
- View and manage their own donations
- Cancel pending donations
- Contact NGOs that accept their donations

### NGO (Receiver)
- Browse all available donations
- Accept pending donations
- Mark accepted donations as completed
- Contact restaurants for coordination

## 🔄 Donation Status Flow

```
pending → accepted → completed
    ↓
 cancelled
```

- **Pending**: Just created, available for NGOs to accept
- **Accepted**: NGO has accepted, pickup coordinated
- **Completed**: Food picked up and distributed
- **Cancelled**: Restaurant cancelled the donation

## 🎨 UI Features

### Modern Design Elements
- **Gradient backgrounds** and **shadow effects**
- **Responsive cards** with hover animations
- **Status badges** with color coding
- **Loading spinners** for better UX
- **Success/error messages** for user feedback

### Responsive Design
- **Mobile-first approach** with breakpoints
- **Flexible grid layouts** for all screen sizes
- **Touch-friendly** buttons and interfaces
- **Optimized typography** for readability

## 🛡️ Security Features

- **Password hashing** with bcryptjs
- **JWT token authentication** with expiration
- **Role-based access control**
- **Input validation** and sanitization
- **CORS protection** for cross-origin requests
- **SQL injection protection** through MongoDB/Mongoose

## 🧪 Testing the Application

### Demo Accounts
The application includes demo accounts for testing:

**Restaurant Demo:**
- Email: `restaurant@demo.com`
- Password: `demo123`

**NGO Demo:**
- Email: `ngo@demo.com`
- Password: `demo123`

### Testing Workflow
1. **Register/Login** as a restaurant
2. **Create a donation** with food details
3. **Login as NGO** and view available donations
4. **Accept the donation** as NGO
5. **Mark as completed** after "pickup"

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables on your platform
2. Ensure MongoDB connection string is updated
3. Deploy using Git or platform-specific tools

### Frontend Deployment (Netlify/Vercel/GitHub Pages)
1. Update API base URL in `js/api.js` to your backend URL
2. Deploy the frontend folder to your hosting platform

### Environment Variables for Production
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_very_secure_random_string_for_production
NODE_ENV=production
PORT=5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if MongoDB is running
- Verify `.env` file exists with correct values
- Check if port 5000 is available

**Frontend can't connect to backend:**
- Verify backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Ensure API base URL is correct in `js/api.js`

**Database connection fails:**
- Verify MongoDB connection string
- Check if database server is accessible
- Ensure network connectivity for MongoDB Atlas

## 🙏 Acknowledgments

- Built with ❤️ for reducing food waste
- Icons and emojis for better user experience
- Modern web standards and best practices
- Community-driven development approach

## 📞 Support

For support, email shareplate@example.com or create an issue in the repository.

---

**SharePlate** - Fighting food waste, feeding communities! 🌍✨