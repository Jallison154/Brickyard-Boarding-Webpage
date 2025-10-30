// Construction Password Protection
// Simple hash function for basic obfuscation
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}

// Password hash (stored as integer for security)
const PASSWORD_HASH = -1897311967;

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('constructionPassword');
    const submitButton = document.getElementById('constructionSubmit');
    const errorMessage = document.getElementById('constructionError');
    
    // Auto-focus on password input
    if (passwordInput) {
        passwordInput.focus();
    }
    
    function handleSubmit() {
        if (!passwordInput) return;
        
        const enteredPassword = passwordInput.value.trim();
        const enteredHash = simpleHash(enteredPassword);
        
        if (enteredHash === PASSWORD_HASH) {
            // Set authentication flag
            sessionStorage.setItem('construction_authenticated', 'true');
            
            // Redirect to main site (use replace so user can't go back)
            window.location.replace('home.html');
        } else {
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            passwordInput.value = '';
            passwordInput.focus();
            
            // Shake animation
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    }
    
    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
    }
    
    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});
