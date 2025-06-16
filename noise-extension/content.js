// content.js - Content script for NYC Address Validator (CSP Compliant)

class MapOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.initializeMessageListener();
    }

    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'showLocationMap') {
                this.showMap(message.data);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    async showMap(data) {
        if (this.isVisible) {
            this.hideMap();
        }

        try {
            await this.createMapOverlay(data);
            this.isVisible = true;
        } catch (error) {
            console.error('Failed to show map overlay:', error);
        }
    }

    async createMapOverlay(data) {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'nyc-address-validator-overlay';
        this.overlay.innerHTML = this.getOverlayHTML(data);
        
        // Add to page
        document.body.appendChild(this.overlay);
        
        // Initialize map - use static map instead of interactive due to CSP restrictions
        this.initializeStaticMap(data.coordinates);
        
        // Add event listeners
        this.addOverlayEventListeners();
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    getOverlayHTML(data) {
        return `
            <div class="overlay-backdrop">
                <div class="overlay-content">
                    <div class="overlay-header">
                        <h3>📍 NYC Address Location</h3>
                        <button class="close-btn" id="closeOverlay">✕</button>
                    </div>
                    <div class="address-info">
                        <div class="address-text">
                            <strong>${data.address}</strong>
                        </div>
                        <div class="borough-badge">
                            ${data.borough}
                        </div>
                        <div class="coordinates-info">
                            <small>📍 ${data.coordinates.lat.toFixed(6)}, ${data.coordinates.lng.toFixed(6)}</small>
                        </div>
                    </div>
                    <div class="map-container">
                        <div id="map" style="width: 100%; height: 300px; border-radius: 8px; position: relative; overflow: hidden;">
                            <div class="map-loading">
                                <div class="loading-spinner"></div>
                                <span>Loading map...</span>
                            </div>
                        </div>
                    </div>
                    <div class="overlay-actions">
                        <button class="action-btn" id="getDirections">
                            🗺️ Get Directions
                        </button>
                        <button class="action-btn" id="openGoogleMaps">
                            🌐 Open in Google Maps
                        </button>
                        <button class="action-btn secondary" id="copyAddress">
                            📋 Copy Address
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeStaticMap(coordinates) {
        try {
            // Get Google Maps API key from background script
            const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
            const apiKey = response.apiKey;

            // Create static map URL with custom marker
            const mapUrl = this.createStaticMapUrl(coordinates, apiKey);
            
            // Create map image element
            const mapElement = document.getElementById('map');
            const mapImg = document.createElement('img');
            mapImg.src = mapUrl;
            mapImg.alt = 'Map showing address location';
            mapImg.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s ease;
            `;
            
            // Add hover effect
            mapImg.addEventListener('mouseenter', () => {
                mapImg.style.transform = 'scale(1.02)';
            });
            
            mapImg.addEventListener('mouseleave', () => {
                mapImg.style.transform = 'scale(1)';
            });
            
            // Click to open in Google Maps
            mapImg.addEventListener('click', () => {
                this.openInGoogleMaps(coordinates);
            });
            
            // Handle image load
            mapImg.addEventListener('load', () => {
                mapElement.innerHTML = '';
                mapElement.appendChild(mapImg);
                
                // Add overlay controls
                this.addMapOverlayControls(mapElement, coordinates);
            });
            
            // Handle image error
            mapImg.addEventListener('error', () => {
                this.showMapError(mapElement);
            });

        } catch (error) {
            console.error('Failed to initialize static map:', error);
            this.showMapError(document.getElementById('map'));
        }
    }

    createStaticMapUrl(coordinates, apiKey) {
        const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
        const params = new URLSearchParams({
            center: `${coordinates.lat},${coordinates.lng}`,
            zoom: '16',
            size: '400x300',
            maptype: 'roadmap',
            markers: `color:red|size:mid|${coordinates.lat},${coordinates.lng}`,
            style: 'feature:poi|visibility:simplified',
            key: apiKey
        });
        
        return `${baseUrl}?${params.toString()}`;
    }

    addMapOverlayControls(mapElement, coordinates) {
        // Add zoom controls overlay
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'map-controls';
        controlsDiv.innerHTML = `
            <div class="zoom-controls">
                <button class="zoom-btn" id="zoomIn">+</button>
                <button class="zoom-btn" id="zoomOut">−</button>
            </div>
            <div class="view-controls">
                <button class="view-btn" id="satelliteView">🛰️</button>
                <button class="view-btn" id="roadmapView">🗺️</button>
            </div>
        `;
        
        mapElement.appendChild(controlsDiv);
        
        // Add event listeners for controls
        this.addMapControlListeners(coordinates);
    }

    addMapControlListeners(coordinates) {
        const mapElement = document.getElementById('map');
        let currentZoom = 16;
        let currentMapType = 'roadmap';
        
        // Zoom in
        document.getElementById('zoomIn')?.addEventListener('click', async () => {
            currentZoom = Math.min(currentZoom + 2, 20);
            await this.updateStaticMap(coordinates, currentZoom, currentMapType);
        });
        
        // Zoom out
        document.getElementById('zoomOut')?.addEventListener('click', async () => {
            currentZoom = Math.max(currentZoom - 2, 10);
            await this.updateStaticMap(coordinates, currentZoom, currentMapType);
        });
        
        // Satellite view
        document.getElementById('satelliteView')?.addEventListener('click', async () => {
            currentMapType = 'satellite';
            await this.updateStaticMap(coordinates, currentZoom, currentMapType);
        });
        
        // Roadmap view
        document.getElementById('roadmapView')?.addEventListener('click', async () => {
            currentMapType = 'roadmap';
            await this.updateStaticMap(coordinates, currentZoom, currentMapType);
        });
    }

    async updateStaticMap(coordinates, zoom, mapType) {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
            const apiKey = response.apiKey;
            
            const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
            const params = new URLSearchParams({
                center: `${coordinates.lat},${coordinates.lng}`,
                zoom: zoom.toString(),
                size: '400x300',
                maptype: mapType,
                markers: `color:red|size:mid|${coordinates.lat},${coordinates.lng}`,
                key: apiKey
            });
            
            const mapUrl = `${baseUrl}?${params.toString()}`;
            const mapElement = document.getElementById('map');
            const imgElement = mapElement.querySelector('img');
            
            if (imgElement) {
                // Show loading state
                imgElement.style.opacity = '0.5';
                
                // Create new image
                const newImg = document.createElement('img');
                newImg.src = mapUrl;
                newImg.alt = 'Map showing address location';
                newImg.style.cssText = imgElement.style.cssText;
                
                newImg.addEventListener('load', () => {
                    imgElement.src = mapUrl;
                    imgElement.style.opacity = '1';
                });
                
                newImg.addEventListener('error', () => {
                    imgElement.style.opacity = '1';
                    console.error('Failed to update map');
                });
            }
        } catch (error) {
            console.error('Failed to update static map:', error);
        }
    }

    showMapError(mapElement) {
        mapElement.innerHTML = `
            <div class="map-error">
                <div class="error-icon">🗺️</div>
                <div class="error-message">
                    <strong>Unable to load map</strong>
                    <br>
                    <small>Click "Open in Google Maps" to view location</small>
                </div>
            </div>
        `;
    }

    addOverlayEventListeners() {
        // Close button
        document.getElementById('closeOverlay').addEventListener('click', () => {
            this.hideMap();
        });

        // Click outside to close
        document.querySelector('.overlay-backdrop').addEventListener('click', (e) => {
            if (e.target.classList.contains('overlay-backdrop')) {
                this.hideMap();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideMap();
            }
        });

        // Get directions button
        document.getElementById('getDirections').addEventListener('click', () => {
            const address = document.querySelector('.address-text strong').textContent;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        });

        // Open in Google Maps button
        document.getElementById('openGoogleMaps').addEventListener('click', () => {
            const address = document.querySelector('.address-text strong').textContent;
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        });

        // Copy address button
        document.getElementById('copyAddress').addEventListener('click', () => {
            const address = document.querySelector('.address-text strong').textContent;
            navigator.clipboard.writeText(address).then(() => {
                this.showCopyConfirmation();
            }).catch(err => {
                console.error('Failed to copy address:', err);
                // Fallback for older browsers
                this.fallbackCopyTextToClipboard(address);
            });
        });
    }

    openInGoogleMaps(coordinates) {
        const url = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},16z`;
        window.open(url, '_blank');
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyConfirmation();
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopyConfirmation() {
        const button = document.getElementById('copyAddress');
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }

    hideMap() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.isVisible = false;
            // Restore body scrolling
            document.body.style.overflow = '';
        }
    }
}

// Initialize map overlay controller
const mapOverlay = new MapOverlay();

// Add required CSS styles
const style = document.createElement('style');
style.textContent = `
    #nyc-address-validator-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #nyc-address-validator-overlay .overlay-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    }

    #nyc-address-validator-overlay .overlay-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
    }

    #nyc-address-validator-overlay .overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    #nyc-address-validator-overlay .overlay-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    #nyc-address-validator-overlay .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
    }

    #nyc-address-validator-overlay .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    #nyc-address-validator-overlay .address-info {
        padding: 20px;
        border-bottom: 1px solid #eee;
    }

    #nyc-address-validator-overlay .address-text {
        font-size: 16px;
        margin-bottom: 10px;
        color: #333;
    }

    #nyc-address-validator-overlay .borough-badge {
        display: inline-block;
        background: #28a745;
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    #nyc-address-validator-overlay .coordinates-info {
        color: #666;
        font-size: 12px;
    }

    #nyc-address-validator-overlay .map-container {
        padding: 20px;
        position: relative;
    }

    #nyc-address-validator-overlay .map-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        background: #f8f9fa;
        border-radius: 8px;
        color: #666;
        flex-direction: column;
        gap: 10px;
    }

    #nyc-address-validator-overlay .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #ddd;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    #nyc-address-validator-overlay .map-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 300px;
        background: #f8f9fa;
        border-radius: 8px;
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }

    #nyc-address-validator-overlay .error-icon {
        font-size: 48px;
        opacity: 0.5;
    }

    #nyc-address-validator-overlay .error-message {
        color: #666;
    }

    #nyc-address-validator-overlay .map-controls {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    #nyc-address-validator-overlay .zoom-controls {
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        overflow: hidden;
    }

    #nyc-address-validator-overlay .zoom-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: white;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: background 0.2s ease;
    }

    #nyc-address-validator-overlay .zoom-btn:hover {
        background: #f0f0f0;
    }

    #nyc-address-validator-overlay .zoom-btn:not(:last-child) {
        border-bottom: 1px solid #ddd;
    }

    #nyc-address-validator-overlay .view-controls {
        display: flex;
        gap: 2px;
        margin-top: 5px;
    }

    #nyc-address-validator-overlay .view-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: white;
        cursor: pointer;
        font-size: 14px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: background 0.2s ease;
    }

    #nyc-address-validator-overlay .view-btn:hover {
        background: #f0f0f0;
    }

    #nyc-address-validator-overlay .overlay-actions {
        display: flex;
        gap: 10px;
        padding: 20px;
        background: #f8f9fa;
        flex-wrap: wrap;
    }

    #nyc-address-validator-overlay .action-btn {
        flex: 1;
        min-width: 120px;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #007bff;
        color: white;
    }

    #nyc-address-validator-overlay .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    }

    #nyc-address-validator-overlay .action-btn.secondary {
        background: #6c757d;
    }

    #nyc-address-validator-overlay .action-btn.secondary:hover {
        box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Responsive design */
    @media (max-width: 600px) {
        #nyc-address-validator-overlay .overlay-content {
            width: 95%;
            margin: 20px;
        }
        
        #nyc-address-validator-overlay .overlay-actions {
            flex-direction: column;
        }
        
        #nyc-address-validator-overlay .action-btn {
            min-width: auto;
        }
        
        #nyc-address-validator-overlay .map-container {
            padding: 15px;
        }
        
        #nyc-address-validator-overlay #map {
            height: 250px !important;
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        #nyc-address-validator-overlay .overlay-backdrop {
            background: rgba(0, 0, 0, 0.95);
        }
        
        #nyc-address-validator-overlay .overlay-content {
            border: 2px solid #000;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        #nyc-address-validator-overlay .overlay-backdrop,
        #nyc-address-validator-overlay .overlay-content,
        #nyc-address-validator-overlay .action-btn,
        #nyc-address-validator-overlay .loading-spinner {
            animation: none !important;
            transition: none !important;
        }
    }
`;

document.head.appendChild(style);