// Construction Password Protection
const CONSTRUCTION_PASSWORD = 'brickyard2025';

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
        
        if (enteredPassword === CONSTRUCTION_PASSWORD) {
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
    
    submitButton.addEventListener('click', handleSubmit);
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });
    
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
