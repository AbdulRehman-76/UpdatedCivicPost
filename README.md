# 🏛️ CitizenConnect - Smart City Issue Reporting App

A comprehensive React Native (Expo) application for citizens to report and track civic issues, with an admin portal for government employees to manage and resolve reports.

## 📱 Features

### For Citizens (Users)
- **Easy Reporting**: Step-by-step form with categories, titles, and detailed descriptions
- **Visual Evidence**: Integrated camera and gallery access to upload photos
- **Location Precision**: GPS-based location detection or landmark selection
- **Real-time Tracking**: Monitor report lifecycle from "Pending" to "Resolved"
- **Report History**: Access all past reports in "My Reports" section
- **Push Notifications**: Get updates on report status changes

### For Administrators
- **Analytics Dashboard**: Overview of total, pending, and resolved cases
- **Centralized Management**: All reports with filtering by status and department
- **Workflow Automation**: Assign reports to departments and update status
- **Team Management**: View and manage department teams
- **Secure Access**: Dedicated admin login system

## 📂 Project Structure

```
citizen-connect/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Welcome/landing screen
│   ├── (user)/                  # User (Citizen) screens
│   │   ├── _layout.tsx          # User tab navigation
│   │   ├── home.tsx             # Home dashboard
│   │   ├── create.tsx           # Create new report (3-step form)
│   │   ├── reports.tsx          # My reports list
│   │   ├── report-detail.tsx    # Report detail view
│   │   ├── profile.tsx          # User profile
│   │   └── notifications.tsx    # Notifications screen
│   └── (admin)/                 # Admin screens
│       ├── _layout.tsx          # Admin tab navigation
│       ├── login.tsx            # Admin login
│       ├── dashboard.tsx        # Admin dashboard
│       ├── reports.tsx          # All reports management
│       ├── report-detail.tsx    # Report management view
│       ├── teams.tsx            # Team management
│       └── settings.tsx         # Admin settings
├── src/
│   ├── context/
│   │   └── AppContext.js        # Global state management
│   └── data/
│       ├── departments.js       # Department constants & categories
│       └── reports.js           # Mock report data
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## 📦 Dependencies

```json
{
  "expo": "~50.0.0",
  "expo-router": "~3.4.0",
  "expo-image-picker": "~14.7.1",
  "expo-location": "~16.5.2",
  "react-native-safe-area-context": "4.8.2",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/bottom-tabs": "^6.5.11"
}
```

## 🎨 UI/UX Features

### Citizen App (Light Theme)
- Clean, modern interface with green accent color
- Bottom tab navigation with floating action button
- Card-based layout for reports
- Step indicator for multi-step forms
- Status badges with color coding

### Admin Portal (Dark Theme)
- Professional dark interface with purple accent
- Dashboard with statistics and charts
- Advanced filtering capabilities
- Quick action buttons for workflow

## 📊 Report Status Flow

```
Pending → Assigned → In Progress → Resolved → Closed
```

## 🏢 Supported Departments

- 🗑️ Garbage Collection
- ⚡ Electricity
- 💧 Water Supply
- 🔥 Sui Gas
- 🛣️ Roads & Infrastructure
- 🚰 Sewerage
- 💡 Street Lights
- 📋 Other

## 🔐 Permissions Required

- **Camera**: For capturing photos of issues
- **Photo Library**: For selecting existing photos
- **Location**: For pinpointing issue location

## 📱 Screenshots

The app features:
1. Welcome screen with mode selection
2. Home dashboard with quick stats
3. 3-step report creation flow
4. Report list with filters
5. Detailed report view with timeline
6. Admin dashboard with analytics
7. Report management interface

## 🛠️ Customization

### Adding New Categories
Edit `src/data/departments.js`:
```javascript
export const categories = [
  { id: 'NewCategory', label: 'Label', icon: '🆕' },
  // ...
];
```

### Modifying Status Colors
Edit `src/data/departments.js`:
```javascript
export const statusColors = {
  'NewStatus': { bg: '#color', text: '#color' },
  // ...
};
```

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using React Native & Expo
