# Brilworks Time Logger - Application Guide

## Overview

Brilworks Time Logger is a comprehensive time tracking and activity monitoring system designed for teams and organizations. The application provides real-time tracking of user activities, screenshots, productivity metrics, and detailed reporting capabilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Features Overview](#features-overview)
4. [Time Tracking](#time-tracking)
5. [User Management](#user-management)
6. [Projects & Tasks](#projects--tasks)
7. [Reports](#reports)
8. [Screenshots](#screenshots)
9. [Activity Timeline](#activity-timeline)
10. [Multi-language Support](#multi-language-support)
11. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### First Login

1. Navigate to the login page
2. Enter your username and password provided by your administrator
3. Click "Login" to access the dashboard

### Navigation

- **Sidebar Menu**: Access all features from the left sidebar
- **User Profile**: Click on your username in the top-right to view profile options
- **Language Switcher**: Change interface language (English/Spanish) from the top-right

---

## User Roles

### Admin Users

Admin users have full access to all features:
- User management (create, edit, delete, lock/unlock users)
- Project and task management
- View all users' time tracking data
- Generate comprehensive reports
- Access dashboard statistics
- Assign projects and tasks to users

### Regular Users

Regular users have limited access:
- View their own time tracking data
- View their own screenshots
- View their own activity timeline
- Cannot access user management or reports

---

## Features Overview

### Main Sections

1. **Time Tracking** - Monitor and analyze time tracking data
2. **Users** - Manage user accounts (Admin only)
3. **Projects** - Manage projects (Admin only)
4. **Tasks** - Manage tasks (Admin only)
5. **Dashboard** - Overview statistics (Admin only)

---

## Time Tracking

The Time Tracking section is the core of the application, providing multiple views and tools for monitoring user activity.

### Summary Dashboard (Admin Only)

**Location**: Time Tracking → Summary

**Features**:
- **Date Range Selection**: Choose from Day, Week, Month, or Custom date ranges
- **Statistics Overview**:
  - Total active users
  - Total hours tracked
  - Average activity percentage
  - Active vs idle time breakdown
- **Charts and Visualizations**:
  - Activity trends over time
  - User productivity comparisons
  - Time distribution charts
- **User List**: View all users with their tracking statistics

**How to Use**:
1. Select a date range using the buttons (Day/Week/Month) or Custom date picker
2. View the automatically updated statistics and charts
3. Click on any user to see detailed information

### Screenshots

**Location**: Time Tracking → Screenshots

**Features**:
- View screenshots captured during user sessions
- Filter by user and date
- Full-screen screenshot viewer
- Navigate between screenshots with arrow keys or buttons
- View session information (start/end time)

**How to Use**:
1. Select a user from the search dropdown (type at least 3 characters)
2. Select a date using the date picker
3. Browse screenshots in the grid view
4. Click on any screenshot to view it in full screen
5. Use arrow keys (← →) or navigation buttons to move between screenshots
6. Press ESC to close the full-screen viewer

**Keyboard Shortcuts**:
- `←` Previous screenshot
- `→` Next screenshot
- `ESC` Close viewer

### Activity Timeline

**Location**: Time Tracking → Activity

**Features**:
- View detailed session timeline for users
- See start/end times for each session
- View active vs idle time breakdown
- See pause information
- View associated project and task (if assigned)
- Pagination for browsing multiple sessions

**How to Use**:
1. Select a user from the search dropdown
2. Select a date to view sessions for that day
3. Review the session list showing:
   - Session start and end times
   - Total duration
   - Active duration
   - Idle duration
   - Activity percentage
   - Pause details
   - Project and task assignments
4. Use pagination controls to navigate through multiple sessions

**Session Information Displayed**:
- **Start Time**: When the session began
- **End Time**: When the session ended
- **Total Duration**: Complete session length
- **Active Duration**: Time user was actively working
- **Idle Duration**: Time user was inactive
- **Activity Percentage**: Percentage of active time vs total time
- **Pauses**: List of all pauses during the session with reasons
- **Project**: Associated project (if assigned)
- **Task**: Associated task (if assigned)

---

## User Management

**Location**: Users (Admin only)

**Features**:
- Create new users
- Edit existing users
- Delete users
- Lock/unlock user accounts
- Search and filter users
- Assign projects and tasks to users
- Set default project and task for users
- View user details and statistics

### Creating a User

1. Click the "+" (Add) button
2. Fill in the form:
   - **Name**: User's full name
   - **Username**: Unique username for login
   - **Email**: User's email address
   - **Password**: Initial password (user can change later)
   - **Role**: Select "Admin" or "User"
   - **Status**: Active (checked) or Locked (unchecked)
3. Click "Save" to create the user

### Editing a User

1. Click the edit icon (pencil) next to the user
2. Modify the desired fields
3. Click "Save" to update

### Assigning Projects and Tasks

1. Click the settings icon (gear) next to a user
2. In the modal:
   - **Assign Projects**: Check the projects to assign to the user
   - **Default Project**: Select a default project for the user
   - **Default Task**: Select a default task for the user
3. Click "Save" to apply changes

### Locking/Unlocking Users

- Click the lock icon to lock a user account (prevents login)
- Click the unlock icon to unlock a user account (allows login)

---

## Projects & Tasks

### Projects Management (Admin Only)

**Location**: Projects

**Features**:
- Create, edit, and delete projects
- Search projects by name
- Activate/deactivate projects
- View project details

**How to Use**:
1. Click "+" to create a new project
2. Enter:
   - **Name**: Project name
   - **Description**: Project description (optional)
   - **Active**: Check to make project active
3. Use the search bar to find projects
4. Click edit icon to modify a project
5. Click delete icon to remove a project (only if not in use)

### Tasks Management (Admin Only)

**Location**: Tasks

**Features**:
- Create, edit, and delete tasks
- Associate tasks with projects
- Search tasks by name or filter by project
- Activate/deactivate tasks

**How to Use**:
1. Click "+" to create a new task
2. Enter:
   - **Name**: Task name
   - **Description**: Task description (optional)
   - **Project**: Select the associated project
   - **Active**: Check to make task active
3. Use the search bar to find tasks
4. Filter by project using the project dropdown
5. Click edit icon to modify a task
6. Click delete icon to remove a task (only if not in use)

---

## Reports

**Location**: Time Tracking → Reports (Admin only)

The Reports section provides three types of detailed reports that can be exported.

### User Activity Report

**Features**:
- Export user activity data for selected date range
- Filter by specific user or all users
- Export format: Excel (XLSX)
- Shows detailed session information

**How to Use**:
1. Select the "User Activity" tab
2. Choose date range (From Date and To Date)
3. Optionally select a specific user (or leave as "All Users")
4. Click "Submit" to download the report

**Report Contents**:
- User name
- Session start time
- Session end time
- Total duration
- Active time
- Idle time
- Activity percentage
- Project and task (if assigned)

### Inactivity Log Report

**Features**:
- Export inactivity events for selected date range
- Filter by specific user or all users
- Export format: Excel (XLSX)
- Shows idle periods and reasons

**How to Use**:
1. Select the "Inactivity Log" tab
2. Choose date range (From Date and To Date)
3. Optionally select a specific user (or leave as "All Users")
4. Click "Submit" to download the report

**Report Contents**:
- User name
- Inactivity start time
- Inactivity end time
- Duration
- Reason for inactivity

### Productivity Report

**Features**:
- View productivity metrics and charts
- Filter by date range and user
- Visual charts showing productivity trends
- Productivity scores and efficiency metrics

**How to Use**:
1. Select the "Productivity" tab
2. Choose date range (From Date and To Date)
3. Optionally select a specific user (or leave as "All Users")
4. View the productivity charts and metrics

**Metrics Displayed**:
- Productivity Score
- Active Hours
- Efficiency Percentage
- Time distribution charts
- Trends over time

---

## Screenshots

### Viewing Screenshots

Screenshots are automatically captured during user sessions when the desktop application is running.

**Features**:
- Automatic capture during active sessions
- Organized by user and session
- Full-screen viewing capability
- Session context information

**Best Practices**:
- Screenshots are captured periodically during active work
- Screenshots are linked to specific sessions
- View screenshots to verify user activity and work progress
- Screenshots help in understanding what users were working on

---

## Activity Timeline

The Activity Timeline provides a chronological view of all user sessions.

### Understanding the Timeline

**Session Status Indicators**:
- **Active**: User is currently working
- **Paused**: Session is temporarily paused
- **Ended**: Session has been completed

**Session Details**:
- Each session shows complete time breakdown
- Pause information includes reason and duration
- Project and task assignments are displayed when available

### Filtering and Searching

- Use the user search to find specific users
- Select dates to view sessions for specific days
- Use pagination to browse through multiple sessions

---

## Multi-language Support

The application supports multiple languages:
- **English** (default)
- **Spanish** (Español)

### Changing Language

1. Click on the language selector in the top-right corner
2. Select your preferred language
3. The interface will update immediately

**Note**: All user-generated content (names, descriptions, etc.) remain in the original language. Only the interface elements are translated.

---

## Keyboard Shortcuts

### Screenshot Viewer
- `←` (Left Arrow): Previous screenshot
- `→` (Right Arrow): Next screenshot
- `ESC`: Close full-screen viewer

### General Navigation
- Use `Tab` to navigate between form fields
- Use `Enter` to submit forms
- Use `Escape` to close modals and dialogs

---

## Tips & Best Practices

### For Administrators

1. **Regular Monitoring**: Check the Summary dashboard regularly to monitor team activity
2. **User Management**: Keep user accounts up to date, lock inactive accounts
3. **Project Organization**: Create clear project and task structures for better tracking
4. **Reports**: Generate reports regularly for management and analysis
5. **User Assignments**: Assign default projects and tasks to users for easier tracking

### For Users

1. **Desktop App**: Ensure the desktop tracking application is running for accurate tracking
2. **Project Selection**: Select appropriate projects and tasks when starting work
3. **Pause Sessions**: Use pause functionality when taking breaks
4. **Review Activity**: Check your activity timeline to review your work patterns

### Data Management

- **Screenshots**: Screenshots are stored securely and linked to sessions
- **Session Data**: All session data is timestamped and cannot be modified
- **Reports**: Reports are generated on-demand and reflect current data
- **Privacy**: Only administrators can view all user data; regular users see only their own data

---

## Troubleshooting

### Common Issues

**Cannot see screenshots**:
- Ensure the user has active sessions on the selected date
- Check that the desktop application is running and capturing screenshots
- Verify user permissions

**Reports not generating**:
- Ensure date range is selected
- Check that data exists for the selected date range
- Verify user has admin permissions

**User cannot login**:
- Check if account is locked (admin can unlock)
- Verify username and password are correct
- Contact administrator if issues persist

**Missing time tracking data**:
- Ensure desktop application is running
- Check that user is logged into the desktop application
- Verify network connectivity

---

## Support

For technical support or questions:
1. Check this guide first
2. Contact your system administrator
3. Review the README.md for setup and configuration information

---

## Version Information

This guide is for Brilworks Time Logger version 1.0.0

For the latest updates and features, refer to the application changelog or contact your administrator.

