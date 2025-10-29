// Theme Management for Admin Dashboard

(function() {
    // Detect system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Get saved preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply theme on page load
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme === 'dark');
    }
    
    applyTheme(initialTheme);
    
    // Listen for system preference changes (if no manual preference set)
    if (!savedTheme) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle') || document.getElementById('adminThemeToggle');
    
    if (themeToggle) {
        updateThemeIcon(initialTheme === 'dark');
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme === 'dark');
        });
    }
    
    function updateThemeIcon(isDark) {
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            const sunIcon = toggle.querySelector('.sun');
            const moonIcon = toggle.querySelector('.moon');
            
            if (sunIcon && moonIcon) {
                if (isDark) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        });
    }
    
    // Make theme management available globally
    window.applyTheme = applyTheme;
    window.updateThemeIcon = updateThemeIcon;
})();

