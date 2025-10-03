// popup.js - Main popup script for NYC Address Validator

class PopupController {
    constructor() {
        this.addressInput = document.getElementById('addressInput');
        this.validateBtn = document.getElementById('validateBtn');
        this.loading = document.getElementById('loading');
        this.suggestionDialog = document.getElementById('suggestionDialog');
        this.suggestedAddress = document.getElementById('suggestedAddress');
        this.btnYes = document.getElementById('btnYes');
        this.btnNo = document.getElementById('btnNo');
        this.resultContainer = document.getElementById('resultContainer');
        this.resultContent = document.getElementById('resultContent');
        
        this.currentSuggestion = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Validate button click
        this.validateBtn.addEventListener('click', () => this.handleValidation());
        
        // Enter key in input field
        this.addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleValidation();
            }
        });

        // Suggestion dialog buttons
        this.btnYes.addEventListener('click', () => this.acceptSuggestion());
        this.btnNo.addEventListener('click', () => this.rejectSuggestion());

        // Auto-focus input field when popup opens
        this.addressInput.focus();
    }

    async handleValidation() {
        const address = this.addressInput.value.trim();
        
        if (!address) {
            this.showError('Please enter an address');
            return;
        }

        this.showLoading(true);
        this.hideResults();

        try {
            // Send message to background script for validation
            const response = await chrome.runtime.sendMessage({
                action: 'validateAddress',
                address: address
            });

            this.showLoading(false);
            this.handleValidationResponse(response);
        } catch (error) {
            this.showLoading(false);
            this.showError(`Validation failed: ${error.message}`);
        }
    }

    handleValidationResponse(result) {
        if (result.error) {
            this.showError(result.error);
            return;
        }

        // Check if there's a suggested address for typo correction
        if (result.suggestedAddress && result.confidence !== 'high') {
            this.showSuggestion(result.suggestedAddress, result);
            return;
        }

        // Show final results
        this.showResults(result);
    }

    showSuggestion(suggestedAddr, validationResult) {
        this.currentSuggestion = validationResult;
        this.suggestedAddress.textContent = suggestedAddr;
        this.suggestionDialog.style.display = 'block';
        this.resultContainer.style.display = 'none';
    }

    acceptSuggestion() {
        this.suggestionDialog.style.display = 'none';
        this.addressInput.value = this.currentSuggestion.suggestedAddress;
        this.showResults(this.currentSuggestion);
    }

    rejectSuggestion() {
        this.suggestionDialog.style.display = 'none';
        this.currentSuggestion = null;
        this.addressInput.focus();
    }

    showResults(result) {
        this.resultContainer.style.display = 'block';
        
        if (result.isNYC) {
            this.showSuccessResult(result);
        } else {
            this.showNotNYCResult(result);
        }
    }

    showSuccessResult(result) {
        const html = `
            <div class="success-result">
                <strong>✓ Valid NYC Address</strong>
            </div>
            <div class="address-info">
                <div style="margin-top: 8px;">
                    <strong>Address:</strong><br>
                    ${result.formattedAddress}
                </div>
                ${result.borough ? `<span class="borough-badge">${result.borough}</span>` : ''}
                <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
                    Confidence: ${result.confidence.toUpperCase()}
                </div>
            </div>
            <button id="showMapBtn" class="show-map-btn">
                📍 Show on Map
            </button>
        `;
        
        this.resultContent.innerHTML = html;
        
        // Add event listener for map button
        const btn = document.getElementById('showMapBtn');
        btn.addEventListener('click', async () => {
            // Put button into loading state
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'Loading map...';

            try {
                await this.showLocationOnMap(result);
                // On success the popup will close; if it doesn't, restore button
            } catch (err) {
                // Restore button state
                btn.disabled = false;
                btn.textContent = originalText;
                this.showError('Failed to open map: ' + (err && err.message ? err.message : 'Unknown error'));
            }
        });
    }

    showNotNYCResult(result) {
        const html = `
            <div class="error-result">
                <strong>⚠ Not a NYC Address</strong>
            </div>
            <div class="address-info">
                ${result.formattedAddress ? 
                    `<div style="margin-top: 8px;">This address appears to be outside the five boroughs of New York City.</div>
                     <div style="margin-top: 8px; font-size: 12px;"><strong>Found:</strong> ${result.formattedAddress}</div>` :
                    '<div style="margin-top: 8px;">Please check your address and try again.</div>'
                }
            </div>
        `;
        
        this.resultContent.innerHTML = html;
    }

    showError(message) {
        this.resultContainer.style.display = 'block';
        this.resultContent.innerHTML = `
            <div class="error-result">
                <strong>❌ Error</strong>
            </div>
            <div class="address-info" style="margin-top: 8px;">
                ${message}
            </div>
        `;
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.validateBtn.disabled = show;
        this.validateBtn.textContent = show ? 'Validating...' : 'Validate Address';
    }

    hideResults() {
        this.resultContainer.style.display = 'none';
        this.suggestionDialog.style.display = 'none';
    }

    async ensureContentScriptLoaded(tabId) {
        try {
            // Try to ping the content script
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            return true;
        } catch (error) {
            // Content script not loaded, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                
                await chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: ['content.css']
                });
                
                // Wait a moment for initialization
                await this.delay(100);
                return true;
            } catch (injectionError) {
                console.error('Failed to inject content script:', injectionError);
                return false;
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchComplaints(latitude, longitude) {
        const distanceInKm = .5; // 500 meters
        const apiUrl = `https://noisehack-service-730559099669.us-east1.run.app/api/near?lon=${longitude}&lat=${latitude}&distanceInKm=${distanceInKm}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${latitude} ${longitude}`);
            }
            const complaints = await response.json();
            return complaints;
        } catch (error) {
            console.error('Error fetching complaints:', error);
            return []; 
        }
    }

    async showLocationOnMap(result) {
        try {
            const complaints = await this.fetchComplaints(result.coordinates.lat, result.coordinates.lng);

            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }

            // Check if we can access this tab (not chrome:// pages etc.)
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
                this.showError('Cannot show map on this page. Please navigate to a regular website first.');
                return;
            }

            // Ensure content script is loaded
            const contentScriptReady = await this.ensureContentScriptLoaded(tab.id);
            
            if (!contentScriptReady) {
                this.showError('Unable to load map overlay. Please try refreshing the page.');
                return;
            }

            // Send message to content script with retry logic
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                try {
                    // Send message and wait for content script to confirm map loaded
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'showLocationMap',
                        data: {
                            address: result.formattedAddress,
                            coordinates: result.coordinates,
                            borough: result.borough,
                            complaints: complaints
                        }
                    });

                    if (response && response.success) {
                        // Close popup after successful map display
                        window.close();
                        return;
                    } else {
                        throw new Error(response && response.error ? response.error : 'Content script failed to initialize map');
                    }
                } catch (error) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Wait before retry
                        await this.delay(200);
                    } else {
                        throw error;
                    }
                }
            }

        } catch (error) {
            console.error('Failed to show map:', error);
            this.showError('Failed to show map. Please try refreshing the page and try again.');
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'validationComplete') {
        // Handle any additional validation completion logic if needed
        console.log('Validation completed:', message.result);
    }
});