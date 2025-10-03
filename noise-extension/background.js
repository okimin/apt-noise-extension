import { CONFIG } from './config.js';

class NYCAddressValidator {
    constructor() {
        // You would store your Google Maps API key in chrome.storage or as a constant
        this.GOOGLE_MAPS_API_KEY = null;
        this.initializeApiKey();
         
        this.NYC_BOROUGHS = [
            {
                name: 'Manhattan',
                bounds: { north: 40.8820, south: 40.6892, east: -73.9442, west: -74.0479 }
            },
            {
                name: 'Brooklyn',
                bounds: { north: 40.7394, south: 40.5707, east: -73.8336, west: -74.0421 }
            },
            {
                name: 'Queens',
                bounds: { north: 40.8007, south: 40.5431, east: -73.7004, west: -73.9626 }
            },
            {
                name: 'The Bronx',
                bounds: { north: 40.9176, south: 40.7854, east: -73.7658, west: -73.9339 }
            },
            {
                name: 'Staten Island',
                bounds: { north: 40.6514, south: 40.4960, east: -74.0340, west: -74.2591 }
            }
        ];
    }


     async initializeApiKey() {
        try {
      // First, try to get API key from chrome storage (e.g., if user set it or it was saved before)
            const result = await chrome.storage.sync.get(['googleMapsApiKey']);
            
            if (result.googleMapsApiKey) {
                this.GOOGLE_MAPS_API_KEY = result.googleMapsApiKey;
                console.log('API key loaded from storage.' + ' Key length: ' + this.GOOGLE_MAPS_API_KEY.length);
                return;
            }

            const apiUrl = `https://noisehack-service-730559099669.us-east1.run.app/api/mapKey`; // Replace with your actual API endpoint
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Api key not retrieved: ${response.status} statusText: ${response.statusText}`);
            }

            const data = (await response.text()).trim();
            console.log(data);
            this.GOOGLE_MAPS_API_KEY = data;
            await chrome.storage.sync.set({ googleMapsApiKey: this.GOOGLE_MAPS_API_KEY });
            console.log('API key loaded from remote server.' + ' Key length: ' + this.GOOGLE_MAPS_API_KEY.length);
            
        } catch (error) {
            console.error('Failed to initialize API key:', error);
        }
    }

    async validateAddress(inputAddress) {
        try {
            const normalizedAddress = this.normalizeInput(inputAddress);
            const geocodeResults = await this.geocodeAddress(normalizedAddress);

            if (!geocodeResults || geocodeResults.length === 0) {
                return {
                    isValid: false,
                    isNYC: false,
                    confidence: 'low',
                    error: 'Address not found'
                };
            }

            const primaryResult = geocodeResults[0];
            const borough = this.identifyBorough(primaryResult.geometry.location);
            const isNYC = borough !== null;

            const suggestionResult = this.handleTypoSuggestions(
                inputAddress,
                primaryResult,
                isNYC
            );

            return {
                isValid: true,
                isNYC,
                borough: borough || undefined,
                coordinates: primaryResult.geometry.location,
                formattedAddress: primaryResult.formatted_address,
                suggestedAddress: suggestionResult.suggestedAddress,
                confidence: suggestionResult.confidence,
                error: suggestionResult.error
            };

        } catch (error) {
            return {
                isValid: false,
                isNYC: false,
                confidence: 'low',
                error: `Validation failed: ${error.message}`
            };
        }
    }

    normalizeInput(address) {
        return address
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,]/g, ' ')
            .replace(/\b(st|street)\b/gi, 'Street')
            .replace(/\b(ave|avenue)\b/gi, 'Avenue')
            .replace(/\b(blvd|boulevard)\b/gi, 'Boulevard')
            .replace(/\b(rd|road)\b/gi, 'Road')
            .replace(/\b(dr|drive)\b/gi, 'Drive')
            .replace(/\b(pl|place)\b/gi, 'Place')
            .replace(/\b(pkwy|parkway)\b/gi, 'Parkway')
            + ', New York, NY, USA';
    }

    async geocodeAddress(address) {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.GOOGLE_MAPS_API_KEY}`;
        console.log('Geocoding URL:', url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK') {
                return data.results;
            } else if (data.status === 'ZERO_RESULTS') {
                return [];
            } else {
                throw new Error(`Geocoding API error: ${data.status}`);
            }
        } catch (error) {
            throw new Error(`Failed to geocode address: ${error}`);
        }
    }

    identifyBorough(coordinates) {
        for (const borough of this.NYC_BOROUGHS) {
            if (this.isWithinBounds(coordinates, borough.bounds)) {
                return borough.name;
            }
        }
        return null;
    }

    isWithinBounds(coords, bounds) {
        return coords.lat >= bounds.south &&
               coords.lat <= bounds.north &&
               coords.lng >= bounds.west &&
               coords.lng <= bounds.east;
    }

    handleTypoSuggestions(originalInput, geocodeResult, isNYC) {
        if (geocodeResult.partial_match) {
            const similarity = this.calculateSimilarity(
                originalInput.toLowerCase(),
                geocodeResult.formatted_address.toLowerCase()
            );

            if (similarity < 0.8) {
                return {
                    suggestedAddress: geocodeResult.formatted_address,
                    confidence: 'medium'
                };
            }
        }

        const locationType = geocodeResult.geometry.location_type;
        if (locationType === 'APPROXIMATE' && isNYC) {
            return {
                suggestedAddress: geocodeResult.formatted_address,
                confidence: 'low'
            };
        }

        if (isNYC && locationType === 'ROOFTOP') {
            return { confidence: 'high' };
        }

        if (isNYC && locationType === 'RANGE_INTERPOLATED') {
            return { confidence: 'medium' };
        }

        return { confidence: 'low' };
    }

    calculateSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const maxLength = Math.max(len1, len2);
        return maxLength === 0 ? 1 : (maxLength - matrix[len2][len1]) / maxLength;
    }
}

// Initialize validator
const validator = new NYCAddressValidator();

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'validateAddress') {
        handleAddressValidation(message.address)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Will respond asynchronously
    }
    
    if (message.action === 'getApiKey') {
        // Securely provide API key to content scripts if needed
        sendResponse({ apiKey: validator.GOOGLE_MAPS_API_KEY });
        return true;
    }
});

async function handleAddressValidation(address) {
    try {
        console.log('Validating address:', address);
        const result = await validator.validateAddress(address);
        console.log('Validation result:', result);
        
        // Store recent validation in storage for history (optional)
        await storeValidationHistory(address, result);
        
        return result;
    } catch (error) {
        console.error('Validation error:', error);
        return { error: error.message };
    }
}

async function storeValidationHistory(address, result) {
    try {
        const history = await chrome.storage.local.get({ validationHistory: [] });
        const newEntry = {
            address,
            result,
            timestamp: Date.now()
        };
        
        // Keep only last 10 validations
        const updatedHistory = [newEntry, ...history.validationHistory].slice(0, 10);
        
        await chrome.storage.local.set({ validationHistory: updatedHistory });
    } catch (error) {
        console.error('Failed to store validation history:', error);
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('NYC Address Validator installed');
        // Initialize any default settings
        chrome.storage.local.set({
            settings: {
                showConfidenceLevel: true,
                autoShowMap: true
            }
        });
    }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Content script is already injected via manifest, but we can handle additional logic here
        console.log('Tab updated:', tab.url);
    }
});