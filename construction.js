// Construction Password Protection
const CONSTRUCTION_PASSWORD = 'brickyard2025';

document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('constructionOverlay');
    const mainContent = document.getElementById('mainContent');
    const passwordInput = document.getElementById('constructionPassword');
    const submitButton = document.getElementById('constructionSubmit');
    const errorMessage = document.getElementById('constructionError');
    
    const isAuthenticated = sessionStorage.getItem('construction_authenticated');
    
    function showMainContent() {
        overlay.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        document.body.classList.add('unlocked');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.height = '';
    }
    
    function showOverlay() {
        overlay.style.display = 'flex';
        mainContent.style.display = 'none';
        document.body.classList.remove('unlocked');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.height = '100vh';
        document.body.style.width = '100vw';
    }
    
    function handleSubmit() {
        const enteredPassword = passwordInput.value.trim();
        
        if (enteredPassword === CONSTRUCTION_PASSWORD) {
            sessionStorage.setItem('construction_authenticated', 'true');
            errorMessage.style.display = 'none';
            passwordInput.value = '';
            
            overlay.style.transition = 'opacity 0.5s ease-out';
            overlay.style.opacity = '0';
            
            setTimeout(showMainContent, 500);
        } else {
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
            
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    }
    
    if (isAuthenticated === 'true') {
        showMainContent();
    } else {
        showOverlay();
        if (passwordInput) passwordInput.focus();
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
