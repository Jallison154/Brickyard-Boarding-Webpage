# Admin Dashboard Guide

## Accessing the Admin Dashboard

1. Navigate to `admin.html` in your browser, or click the "Admin" link in the footer
2. Enter the password: `brickyard2025` (default - see below to change)
3. Click "Login"

## Features

### View Contact Submissions
- All contact form submissions are displayed on the dashboard
- Each submission shows:
  - Name, email, and phone number
  - Service requested (Boarding, Grooming, Both, or Other)
  - Message/notes
  - Date and time of submission

### Search & Filter
- **Search**: Use the search box to find submissions by name, email, or message content
- **Filter**: Click filter buttons to show submissions by service type:
  - All
  - Boarding
  - Grooming
  - Both

### Actions
- **Reply via Email**: Click to open your default email client with the submission's email pre-filled
- **Call**: Click to initiate a phone call (on mobile devices)
- **Delete**: Remove a submission from the list

### Statistics
- Total Submissions: Shows the total number of contact submissions
- Pending: Shows submissions that haven't been contacted yet

## Changing the Admin Password

1. Open `admin.js` in a text editor
2. Find the line: `const DEFAULT_PASSWORD = 'brickyard2025';`
3. Change `brickyard2025` to your desired password
4. Save the file

**Important**: For production use, you should implement a more secure authentication system with a backend server.

## Security Notes

⚠️ **Current Implementation**: This admin system uses localStorage for data storage and simple password authentication. This is suitable for:
- Local/development use
- Small-scale operations
- Temporary solutions

**For Production/Public Websites**, you should:
- Use a backend server (Node.js, PHP, Python, etc.)
- Store data in a database (MySQL, PostgreSQL, MongoDB)
- Implement proper user authentication with hashed passwords
- Use HTTPS for secure connections
- Consider using frameworks like Firebase, Supabase, or a custom backend API

## Data Storage

Contact submissions are stored in the browser's localStorage. This means:
- Data is stored locally in the browser
- Data persists until browser cache is cleared
- Each browser/device has its own data
- Data is not shared between browsers/devices

To export data for backup:
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Find "Local Storage" → your website
4. Look for the `contactSubmissions` key
5. Copy the JSON data

## Clearing All Submissions

1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Find "Local Storage"
4. Delete the `contactSubmissions` key

Or add this to the browser console:
```javascript
localStorage.removeItem('contactSubmissions');
location.reload();
```

