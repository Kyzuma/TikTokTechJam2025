import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'
// User Screens
import { UserDashboardScreen } from './screens/UserDashboardScreen'
import { UserProfileScreen } from './screens/UserProfileScreen'
import { UserSettingsScreen } from './screens/UserSettingsScreen'
// Admin Screens
import { AdminDashboardScreen } from './screens/AdminDashboardScreen'
import { AdminUsersScreen } from './screens/AdminUsersScreen'
import { AdminReportsScreen } from './screens/AdminReportsScreen'


export function App() {
  // State for navigation and role
  const [userRole, setUserRole] = useState('user') // 'user' or 'admin'
  const [activeTab, setActiveTab] = useState('Dashboard')

  const renderScreen = () => {
    if (userRole === 'admin') {
      switch(activeTab) {
        case 'Dashboard':
          return <AdminDashboardScreen />
        case 'Users':
          return <AdminUsersScreen />
        case 'Reports':
          return <AdminReportsScreen />
        default:
          return <AdminDashboardScreen />
      }
    } else {
      switch(activeTab) {
        case 'Dashboard':
          return <UserDashboardScreen />
        case 'Profile':
          return <UserProfileScreen />
        case 'Settings':
          return <UserSettingsScreen />
        default:
          return <UserDashboardScreen />
      }
    }
  }

  const toggleRole = () => {
    const newRole = userRole === 'user' ? 'admin' : 'user'
    setUserRole(newRole)
    setActiveTab('Dashboard') // Reset to dashboard when switching roles
  }

  return (
    <view className="App">
      {/* Role Toggle Button */}
      <view className="RoleToggle">
        <text className="RoleToggleButton" bindtap={toggleRole}>
          {userRole === 'user' ? '⚙️ Admin' : '👤 User'}
        </text>
      </view>
      
      <view className="PlaceHolder" />
      {/* Screen Content */}
      <view className="Content">
        {renderScreen()}
      </view>
      {/* Bottom Tab Bar */}
      <view className="TabBar">
        {userRole === 'admin' ? (
          <>
            <text 
              className={`TabItem ${activeTab === 'Dashboard' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Dashboard')}
            >
              Dashboard
            </text>
            <text 
              className={`TabItem ${activeTab === 'Users' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Users')}
            >
              Users
            </text>
            <text 
              className={`TabItem ${activeTab === 'Reports' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Reports')}
            >
              Reports
            </text>
          </>
        ) : (
          <>
            <text 
              className={`TabItem ${activeTab === 'Dashboard' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Dashboard')}
            >
              Dashboard
            </text>
            <text 
              className={`TabItem ${activeTab === 'Profile' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Profile')}
            >
              Profile
            </text>
            <text 
              className={`TabItem ${activeTab === 'Settings' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Settings')}
            >
              Settings
            </text>
          </>
        )}
      </view>
    </view>
  );
};