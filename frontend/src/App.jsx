import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'

// User Screens
import { CreatorDashBoardScreen } from './screens/CreatorDashBoardScreen'
import { UploadScreen } from './screens/UploadScreen'

// Admin Screens
import { AdminDashboardScreen } from './screens/AdminDashboardScreen'
import { TransactionsScreen } from './screens/TransactionsScreen'
import { LogsScreen } from './screens/LogsScreen'
import { UserDataScreen } from './screens/UserDataScreen'

export const API_BASE = "http://192.168.88.13:8080"; // change per machine

export function App() {
  // State for navigation and role
  const [userRole, setUserRole] = useState('user') // 'user' or 'admin'
  const [activeTab, setActiveTab] = useState('Dashboard')

  const renderScreen = () => {
    if (userRole === 'admin') {
      switch(activeTab) {
        case 'Transactions':
          return <TransactionsScreen />
        case 'Logs':
          return <LogsScreen />
        case 'Users':
          return <UserDataScreen />
        default:
          return <AdminDashboardScreen setActiveTab={setActiveTab} />
      }
    } else {
      switch(activeTab) {
        case 'Profile':
          return <CreatorDashBoardScreen />
        case 'Upload':
          return <UploadScreen />
        default:
          return <CreatorDashBoardScreen />
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
      {/* Dashboard Button */}
      <view className="DashboardButton">
        <text className="DashboardButtonText" bindtap={() => setActiveTab('Dashboard')}>
          🏠 Dashboard
        </text>
      </view>
      
      {/* Role Toggle Button */}
      <view className="RoleToggle">
        <text className="RoleToggleButton" bindtap={toggleRole}>
          {userRole === 'user' ? '⚙️ Swap to Admin' : '👤 Swap to User'}
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
            <view 
              className={`TabItem ${activeTab === 'Transactions' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Transactions')}
            >
              <text className="TabIcon">💳</text>
              <text className="TabLabel">Transactions</text>
            </view>
            <view 
              className={`TabItem ${activeTab === 'Logs' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Logs')}
            >
              <text className="TabIcon">📜</text>
              <text className="TabLabel">Logs</text>
            </view>
            <view 
              className={`TabItem ${activeTab === 'Users' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Users')}
            >
              <text className="TabIcon">👤</text>
              <text className="TabLabel">Manage Users</text>
            </view>
          </>
        ) : (
          <>
            <view 
              className={`TabItem ${activeTab === 'Profile' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Profile')}
            >
              <text className="TabIcon">👤</text>
              <text className="TabLabel">Profile</text>
            </view>
            <view 
              className={`TabItem ${activeTab === 'Upload' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Upload')}
            >
              <text className="TabIcon">⬆️</text>
              <text className="TabLabel">Upload</text>
            </view>
          </>
        )}
      </view>
    </view>
  );
};