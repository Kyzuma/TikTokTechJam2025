import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'

// User Screens
// TBC

// Admin Screens
import { AdminDashboardScreen } from './screens/AdminDashboardScreen'
import { TransactionsScreen } from './screens/TransactionsScreen'
import { LogsScreen } from './screens/LogsScreen'
import { UserDataScreen } from './screens/UserDataScreen'

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
        case 'Dashboard':
          return <AdminDashboardScreen setActiveTab={setActiveTab} />
        case 'Profile':
          return <AdminDashboardScreen/>
        case 'Settings':
          return <AdminDashboardScreen/>
        default:
          return <AdminDashboardScreen setActiveTab={setActiveTab} />
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
              className={`TabItem ${activeTab === 'Dashboard' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Dashboard')}
            >
              <text className="TabIcon">🏠</text>
              <text className="TabLabel">Dashboard</text>
            </view>
            <view 
              className={`TabItem ${activeTab === 'Profile' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Profile')}
            >
              <text className="TabIcon">👤</text>
              <text className="TabLabel">Profile</text>
            </view>
            <view 
              className={`TabItem ${activeTab === 'Settings' ? 'active' : ''}`}
              bindtap={() => setActiveTab('Settings')}
            >
              <text className="TabIcon">⚙️</text>
              <text className="TabLabel">Settings</text>
            </view>
          </>
        )}
      </view>
    </view>
  );
};