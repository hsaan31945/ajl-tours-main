# MongoDB Setup Guide

This guide will help you set up the TripGo backend with MongoDB instead of MySQL.

## Prerequisites

1. **MongoDB**: Install MongoDB on your system
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Node.js**: Ensure you have Node.js 16+ installed

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install the new MongoDB dependencies (mongoose) and remove the old MySQL dependencies.

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tripgo

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Admin Configuration
ADMIN_PASSCODE=<ADMIN_PASSCODE>

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 4. Bootstrap the Database

Run the bootstrap script to create initial data:

```bash
npm run setup
```

This will:
- Create the admin user (admin@tripgo.com / configured admin password)
- Create sample divisions, tours, and trips
- Set up initial homepage content settings

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Database Schema

The MongoDB conversion includes the following collections:

### Users
- `name`, `email`, `password`, `phone`, `role`, `isActive`
- Automatic password hashing
- Timestamps (createdAt, updatedAt)

### Admins
- `username`, `email`, `password`, `role`, `isActive`, `lastLogin`
- Automatic password hashing
- Timestamps (createdAt, updatedAt)

### Divisions
- `name`, `description`, `bannerImage`, `isActive`
- Timestamps (createdAt, updatedAt)

### Tours
- `division` (ObjectId reference), `name`, `description`, `price`
- `startDate`, `endDate`, `startLocation`, `endLocation`
- `routeDetails`, `minTicketsPerBooking`, `maxTotalTickets`
- `images` (array), `isActive`
- Timestamps (createdAt, updatedAt)

### Bookings
- `name`, `email`, `phone`, `travelers`, `specialRequests`
- `tourTitle`, `tourId` (ObjectId reference), `totalPrice`
- `tripDate`, `address`, `location` (lat/lng)
- `status`, `paymentStatus`, `stripePaymentId`
- Timestamps (createdAt, updatedAt)

### Trips
- `name`, `price`, `description`, `isActive`
- Timestamps (createdAt, updatedAt)

### HomepageContent
- `section`, `content` (flexible object), `isActive`
- Timestamps (createdAt, updatedAt)

## Key Changes from MySQL

1. **No more SQL queries**: All database operations now use Mongoose ODM
2. **Automatic timestamps**: MongoDB documents include createdAt/updatedAt automatically
3. **ObjectId references**: Relationships use MongoDB ObjectIds instead of foreign keys
4. **Flexible schema**: MongoDB allows for more flexible data structures
5. **Aggregation pipelines**: Complex queries use MongoDB aggregation framework

## API Endpoints

All existing API endpoints remain the same, but now use MongoDB:

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `POST /api/users/login` - User login
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `GET /api/tours` - Get all tours
- `POST /api/tours` - Create tour
- `GET /api/divisions` - Get all divisions
- `POST /api/divisions` - Create division
- And many more...

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` should connect successfully
- Check the MONGODB_URI in your .env file
- Verify MongoDB is listening on the correct port (default: 27017)

### Data Migration
If you have existing MySQL data, you'll need to:
1. Export your MySQL data
2. Transform it to match the new MongoDB schema
3. Import it using MongoDB tools or custom scripts

### Performance
MongoDB should provide better performance for:
- Complex queries with aggregation
- Flexible schema updates
- Horizontal scaling (if needed in the future)

## Support

If you encounter any issues during the MongoDB setup, check:
1. MongoDB logs for connection errors
2. Node.js console for application errors
3. Ensure all environment variables are set correctly


This guide will help you set up the TripGo backend with MongoDB instead of MySQL.

## Prerequisites

1. **MongoDB**: Install MongoDB on your system
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Node.js**: Ensure you have Node.js 16+ installed

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install the new MongoDB dependencies (mongoose) and remove the old MySQL dependencies.

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tripgo

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Admin Configuration
ADMIN_PASSCODE=<ADMIN_PASSCODE>

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 4. Bootstrap the Database

Run the bootstrap script to create initial data:

```bash
npm run setup
```

This will:
- Create the admin user (admin@tripgo.com / configured admin password)
- Create sample divisions, tours, and trips
- Set up initial homepage content settings

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Database Schema

The MongoDB conversion includes the following collections:

### Users
- `name`, `email`, `password`, `phone`, `role`, `isActive`
- Automatic password hashing
- Timestamps (createdAt, updatedAt)

### Admins
- `username`, `email`, `password`, `role`, `isActive`, `lastLogin`
- Automatic password hashing
- Timestamps (createdAt, updatedAt)

### Divisions
- `name`, `description`, `bannerImage`, `isActive`
- Timestamps (createdAt, updatedAt)

### Tours
- `division` (ObjectId reference), `name`, `description`, `price`
- `startDate`, `endDate`, `startLocation`, `endLocation`
- `routeDetails`, `minTicketsPerBooking`, `maxTotalTickets`
- `images` (array), `isActive`
- Timestamps (createdAt, updatedAt)

### Bookings
- `name`, `email`, `phone`, `travelers`, `specialRequests`
- `tourTitle`, `tourId` (ObjectId reference), `totalPrice`
- `tripDate`, `address`, `location` (lat/lng)
- `status`, `paymentStatus`, `stripePaymentId`
- Timestamps (createdAt, updatedAt)

### Trips
- `name`, `price`, `description`, `isActive`
- Timestamps (createdAt, updatedAt)

### HomepageContent
- `section`, `content` (flexible object), `isActive`
- Timestamps (createdAt, updatedAt)

## Key Changes from MySQL

1. **No more SQL queries**: All database operations now use Mongoose ODM
2. **Automatic timestamps**: MongoDB documents include createdAt/updatedAt automatically
3. **ObjectId references**: Relationships use MongoDB ObjectIds instead of foreign keys
4. **Flexible schema**: MongoDB allows for more flexible data structures
5. **Aggregation pipelines**: Complex queries use MongoDB aggregation framework

## API Endpoints

All existing API endpoints remain the same, but now use MongoDB:

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `POST /api/users/login` - User login
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `GET /api/tours` - Get all tours
- `POST /api/tours` - Create tour
- `GET /api/divisions` - Get all divisions
- `POST /api/divisions` - Create division
- And many more...

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` should connect successfully
- Check the MONGODB_URI in your .env file
- Verify MongoDB is listening on the correct port (default: 27017)

### Data Migration
If you have existing MySQL data, you'll need to:
1. Export your MySQL data
2. Transform it to match the new MongoDB schema
3. Import it using MongoDB tools or custom scripts

### Performance
MongoDB should provide better performance for:
- Complex queries with aggregation
- Flexible schema updates
- Horizontal scaling (if needed in the future)

## Support

If you encounter any issues during the MongoDB setup, check:
1. MongoDB logs for connection errors
2. Node.js console for application errors
3. Ensure all environment variables are set correctly

