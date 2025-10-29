# Brickyard Boarding Kennel Website

A modern, responsive website for Brickyard Boarding Kennel in Billings, MT. Built with HTML5, CSS3, and JavaScript, featuring a clean design and smooth animations.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Admin Panel**: Complete management system for appointments, clients, and operations
- **Photo Gallery**: Showcase facility and happy pets
- **Contact Form**: Easy communication with potential clients
- **Modern Animations**: Smooth hover effects and transitions

## Quick Start

### For Proxmox CT Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jallison154/Brickyard-Boarding-Webpage.git
   cd Brickyard-Boarding-Webpage
   ```

2. **Run the installation script:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Access your website:**
   - Main site: `http://YOUR_CONTAINER_IP`
   - Admin panel: `http://YOUR_CONTAINER_IP/admin.html`

### For Updates

```bash
git pull origin main
./update.sh
```

## File Structure

```
├── index.html              # Main website
├── admin.html              # Admin dashboard
├── styles.css              # Main stylesheet
├── admin.css               # Admin panel styles
├── script.js               # Main JavaScript
├── admin.js                # Admin panel JavaScript
├── theme.js                # Dark mode functionality
├── resources/
│   └── images/             # Website images and logo
├── install.sh              # Installation script
├── update.sh               # Update script
└── SETUP_COMMANDS.txt      # Manual setup instructions
```

## Admin Features

- **Client Management**: Add, edit, and manage client information
- **Appointment Scheduling**: Book and manage boarding appointments
- **Today's Operations**: View current check-ins and arrivals
- **Care Management**: Track pet care and special needs
- **Data Export**: Generate reports and export data

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

© 1995-2025 Brickyard Boarding Kennel. All rights reserved.

## Support

For technical support or questions about the website, please contact the development team.