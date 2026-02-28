// Content Script for Debesties Mail
console.log('Debesties Mail Extension Active');

function injectFillButton() {
    const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]');
    
    emailInputs.forEach(input => {
        if (input.dataset.debestiesInjected) return;
        
        // Wrap input if needed or just position absolutely
        const rect = input.getBoundingClientRect();
        if (rect.width === 0) return;

        const button = document.createElement('div');
        button.innerHTML = '⚡';
        button.title = 'Fill with Debesties Temp Mail';
        button.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            z-index: 10000;
            background: #10b981;
            color: white;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
            user-select: none;
        `;

        button.addEventListener('mouseover', () => {
            button.style.background = '#059669';
            button.style.transform = 'translateY(-50%) scale(1.1)';
        });

        button.addEventListener('mouseout', () => {
            button.style.background = '#10b981';
            button.style.transform = 'translateY(-50%) scale(1)';
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            chrome.storage.local.get(['currentInbox'], (result) => {
                if (result.currentInbox && result.currentInbox.email) {
                    input.value = result.currentInbox.email;
                    // Trigger input and change events
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    button.innerHTML = '✓';
                    setTimeout(() => { button.innerHTML = '⚡'; }, 2000);
                } else {
                    alert('Please open the Debesties Mail extension popup first to generate an email!');
                }
            });
        });

        // Ensure parent is positioned relatively
        const parent = input.parentElement;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        parent.appendChild(button);
        input.dataset.debestiesInjected = 'true';
    });
}

// Run initially and then on mutations
injectFillButton();

const observer = new MutationObserver((mutations) => {
    injectFillButton();
});

observer.observe(document.body, { childList: true, subtree: true });
