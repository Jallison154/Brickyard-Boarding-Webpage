// Construction Password Protection
// Set your password here
const CONSTRUCTION_PASSWORD = 'temp2025';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('constructionOverlay');
    const mainContent = document.getElementById('mainContent');
    const passwordInput = document.getElementById('constructionPassword');
    const submitButton = document.getElementById('constructionSubmit');
    const errorMessage = document.getElementById('constructionError');

    // Check if user has already authenticated in this session
    const isAuthenticated = sessionStorage.getItem('construction_authenticated');
    
    if (isAuthenticated === 'true') {
        // User is authenticated, show the site
        showMainContent();
    } else {
        // User not authenticated, show construction overlay
        overlay.style.display = 'flex';
        mainContent.style.display = 'none';
    }

    // Function to show main content
    function showMainContent() {
        overlay.style.display = 'none';
        mainContent.style.display = 'block';
        
        // Trigger any animations or initialization needed for the main site
        if (typeof initMainSite === 'function') {
            initMainSite();
        }
    }

    // Handle password submission
    function handleSubmit() {
        const enteredPassword = passwordInput.value.trim();
        
        if (enteredPassword === CONSTRUCTION_PASSWORD) {
            // Correct password
            sessionStorage.setItem('construction_authenticated', 'true');
            errorMessage.style.display = 'none';
            passwordInput.value = '';
            
            // Fade out overlay and show content
            overlay.style.transition = 'opacity 0.5s ease-out';
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                showMainContent();
            }, 500);
        } else {
            // Incorrect password
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
            
            // Shake animation for feedback
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    }

    // Submit button click
    submitButton.addEventListener('click', handleSubmit);

    // Allow Enter key to submit
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });

    // Auto-focus on input when overlay is shown
    passwordInput.focus();
});

// Add shake animation for incorrect password
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);


