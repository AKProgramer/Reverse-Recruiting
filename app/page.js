"use client";
import { useEffect, useState, useRef } from "react";
import Cookies from 'js-cookie';

// OAuth utility function
function getGoogleOAuthURL() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || window.location.origin + '/api/auth/callback';
  
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Client-side token refresh function
async function refreshAccessToken(refreshToken) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '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';

  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();
    
    return {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Token validation utility
function isTokenExpired(tokenData) {
  if (!tokenData || !tokenData.expires_at) return true;
  
  // Check if token expires in the next 5 minutes (300000 ms)
  const bufferTime = 5 * 60 * 1000;
  return Date.now() + bufferTime > tokenData.expires_at;
}

// Get valid access token (refresh if needed)
async function getValidAccessToken() {
  let tokenData = JSON.parse(localStorage.getItem('google_token_data') || '{}');
  const refreshToken = localStorage.getItem('google_refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available. Please reconnect your Google account.');
  }

  // If token is expired or missing, refresh it
  if (!tokenData.access_token || isTokenExpired(tokenData)) {
    console.log('Access token expired, refreshing...');
    
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      
      // Calculate expiry time
      const expiresAt = Date.now() + (newTokens.expires_in * 1000);
      
      // Store new token data
      tokenData = {
        access_token: newTokens.access_token,
        expires_at: expiresAt,
        token_type: newTokens.token_type || 'Bearer'
      };
      
      localStorage.setItem('google_token_data', JSON.stringify(tokenData));
      console.log('Token refreshed successfully');
      
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear invalid tokens
      localStorage.removeItem('google_token_data');
      localStorage.removeItem('google_refresh_token');
      throw new Error('Failed to refresh access token. Please reconnect your Google account.');
    }
  }

  return tokenData.access_token;
}

export default function Home() {
  // State management
  const [resumeFile, setResumeFile] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPostedSince, setSelectedPostedSince] = useState(null);
  const [selectedMaxResults, setSelectedMaxResults] = useState(null);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Dropdown states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  
  // Search/filter states
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  
  // Date picker state and ref
  const [selectedDate, setSelectedDate] = useState(null);
  const datePickerRef = useRef(null);
  const flatpickrInstance = useRef(null);
  
  // Google OAuth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(null);
  
  // Simple loader state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingPlatform, setLoadingPlatform] = useState('');
  const [messageIntervalId, setMessageIntervalId] = useState(null);


  
  // Allowed countries list
  const allowedCountries = [
    "Argentina", "Australia", "Austria", "Bahrain", "Bangladesh", "Belgium", 
    "Bulgaria", "Brazil", "Canada", "Chile", "China", "Colombia", "Costa Rica", 
    "Croatia", "Cyprus", "Czech Republic", "Denmark", "Ecuador", "Egypt", 
    "Estonia", "Finland", "France", "Germany", "Greece", "Hong Kong", 
    "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", 
    "Kuwait", "Latvia", "Lithuania", "Luxembourg", "Malaysia", "Malta", 
    "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", 
    "Oman", "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", 
    "Qatar", "Romania", "Saudi Arabia", "Singapore", "Slovakia", "Slovenia", 
    "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", 
    "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", 
    "United States", "Uruguay", "Venezuela", "Vietnam"
  ];

  const config = {
    cUrl: "https://api.countrystatecity.in/v1/countries",
    ckey: "NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==",
    webhookUrl: "https://ancillaai.app.n8n.cloud/webhook-test/508343c6-73ad-4dd9-b623-dc2b876c2749"
  };

  // Platform messages for loader
  const platforms = [
    { name: 'Indeed', message: 'Scraping jobs from Indeed...' },
    { name: 'LinkedIn', message: 'Searching LinkedIn for opportunities...' },
    { name: 'Glassdoor', message: 'Collecting data from Glassdoor...' },
    { name: 'Monster', message: 'Fetching listings from Monster...' },
    { name: 'ZipRecruiter', message: 'Gathering jobs from ZipRecruiter...' },
    { name: 'CareerBuilder', message: 'Analyzing CareerBuilder postings...' },
    { name: 'SimplyHired', message: 'Processing SimplyHired opportunities...' },
    { name: 'AngelList', message: 'Scanning startup jobs on AngelList...' }
  ];

  const startLoader = () => {
    setIsLoading(true);
    
    let platformIndex = 0;
    const updateMessage = () => {
      const platform = platforms[platformIndex];
      setLoadingPlatform(platform.name);
      setLoadingMessage(platform.message);
      platformIndex = (platformIndex + 1) % platforms.length;
    };
    
    // Start with first message
    updateMessage();
    
    // Update message every 10 seconds
    const intervalId = setInterval(updateMessage, 10000);
    setMessageIntervalId(intervalId);
  };

  const stopLoader = () => {
    setIsLoading(false);
    setLoadingMessage('');
    setLoadingPlatform('');
    if (messageIntervalId) {
      clearInterval(messageIntervalId);
      setMessageIntervalId(null);
    }
  };

  // API Functions - Create countries from allowed list
  const loadCountries = () => {
    // Convert allowed countries list to objects with required properties
    const countryObjects = allowedCountries.map((countryName, index) => {
      // Create a simple mapping for ISO codes (this is a simplified approach)
      // In a real application, you'd have a proper mapping
      const isoMapping = {
        "Argentina": "AR", "Australia": "AU", "Austria": "AT", "Bahrain": "BH", 
        "Bangladesh": "BD", "Belgium": "BE", "Bulgaria": "BG", "Brazil": "BR", 
        "Canada": "CA", "Chile": "CL", "China": "CN", "Colombia": "CO", 
        "Costa Rica": "CR", "Croatia": "HR", "Cyprus": "CY", "Czech Republic": "CZ", 
        "Denmark": "DK", "Ecuador": "EC", "Egypt": "EG", "Estonia": "EE", 
        "Finland": "FI", "France": "FR", "Germany": "DE", "Greece": "GR", 
        "Hong Kong": "HK", "Hungary": "HU", "India": "IN", "Indonesia": "ID", 
        "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Japan": "JP", 
        "Kuwait": "KW", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", 
        "Malaysia": "MY", "Malta": "MT", "Mexico": "MX", "Morocco": "MA", 
        "Netherlands": "NL", "New Zealand": "NZ", "Nigeria": "NG", "Norway": "NO", 
        "Oman": "OM", "Pakistan": "PK", "Panama": "PA", "Peru": "PE", 
        "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA", 
        "Romania": "RO", "Saudi Arabia": "SA", "Singapore": "SG", "Slovakia": "SK", 
        "Slovenia": "SI", "South Africa": "ZA", "South Korea": "KR", "Spain": "ES", 
        "Sweden": "SE", "Switzerland": "CH", "Taiwan": "TW", "Thailand": "TH", 
        "Turkey": "TR", "Ukraine": "UA", "United Arab Emirates": "AE", 
        "United Kingdom": "GB", "United States": "US", "Uruguay": "UY", 
        "Venezuela": "VE", "Vietnam": "VN"
      };
      
      return {
        name: countryName,
        iso2: isoMapping[countryName] || countryName.substring(0, 2).toUpperCase()
      };
    });
    
    setCountries(countryObjects);
    setFilteredCountries(countryObjects);
  };

  const loadStates = async (countryIso2) => {
    if (!countryIso2) return;
    
    try {
      setLoadingStates(true);
      const res = await fetch(`${config.cUrl}/${countryIso2}/states`, {
        headers: { "X-CSCAPI-KEY": config.ckey },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch states');
      }
      
      const data = await res.json();
      setStates(data);
      setFilteredStates(data);
    } catch (err) {
      console.error('Error loading states:', err);
      setErrors(prev => ({ ...prev, states: 'Failed to load states' }));
    } finally {
      setLoadingStates(false);
    }
  };

  const loadCities = async (countryIso2, stateIso2) => {
    if (!countryIso2 || !stateIso2) return;
    
    try {
      setLoadingCities(true);
      const res = await fetch(`${config.cUrl}/${countryIso2}/states/${stateIso2}/cities`, {
        headers: { "X-CSCAPI-KEY": config.ckey },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const data = await res.json();
      setCities(data);
      setFilteredCities(data);
    } catch (err) {
      console.error('Error loading cities:', err);
      setErrors(prev => ({ ...prev, cities: 'Failed to load cities' }));
    } finally {
      setLoadingCities(false);
    }
  };

  // Scraping progress functions
  // Simple response handler
  const handleResponse = (response) => {
    stopLoader();
    if (response.status === 'success' && response.sheetUrl) {
      setSubmitStatus('success');
      setGoogleSheetUrl(response.sheetUrl);
      
      // Don't attempt automatic popup - just show the button for user to click
      // This avoids popup blocker issues completely
    } else {
      setSubmitStatus('error');
      setErrors(prev => ({ 
        ...prev, 
        submit: response.message || 'Failed to process your request. Please try again.' 
      }));
    }
  };

  // Load countries on component mount and check authentication
  useEffect(() => {
    loadCountries();
    checkAuthentication();
    handleAuthCallback();
  }, []);

  // Check if user is authenticated
  const checkAuthentication = () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('google_token_data') || '{}');
      const refreshToken = localStorage.getItem('google_refresh_token');
      
      // User is authenticated if they have a refresh token (for long-term auth)
      // Access token can be refreshed using the refresh token
      setIsAuthenticated(!!(refreshToken));
      setAuthLoading(false);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthLoading(false);
    }
  };

  // Handle OAuth callback
  const handleAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const error = urlParams.get('error');
    const tokenData = urlParams.get('token_data');
    const refreshToken = urlParams.get('refresh_token');

    if (authSuccess === 'success') {
      // Store tokens in localStorage
      if (tokenData && refreshToken) {
        try {
          const decodedTokenData = decodeURIComponent(tokenData);
          const decodedRefreshToken = decodeURIComponent(refreshToken);
          
          localStorage.setItem('google_token_data', decodedTokenData);
          localStorage.setItem('google_refresh_token', decodedRefreshToken);
          
          console.log('Tokens stored successfully in localStorage');
        } catch (error) {
          console.error('Error storing tokens:', error);
        }
      }
      
      setIsAuthenticated(true);
      setSubmitStatus('auth_success');
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSubmitStatus(null), 5000);
      
    } else if (error) {
      setSubmitStatus('auth_error');
      setErrors(prev => ({ ...prev, auth: `Authentication error: ${error}` }));
      setTimeout(() => {
        setSubmitStatus(null);
        setErrors(prev => ({ ...prev, auth: null }));
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 5000);
    }
  };

  // Google OAuth handlers
  const handleConnectGoogle = () => {
    const oauthUrl = getGoogleOAuthURL();
    window.location.href = oauthUrl;
  };

  const handleDisconnectGoogle = () => {
    // Clear all Google-related data from localStorage
    localStorage.removeItem('google_token_data');
    localStorage.removeItem('google_refresh_token');
    
    // Also clear cookies if they exist (for backward compatibility)
    Cookies.remove('google_access_token');
    Cookies.remove('google_refresh_token');
    
    setIsAuthenticated(false);
    setGoogleSheetUrl(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const countryDropdown = document.getElementById('countryDropdown');
      const stateDropdown = document.getElementById('stateDropdown');
      const cityDropdown = document.getElementById('cityDropdown');
      
      if (countryDropdown && !countryDropdown.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
      if (stateDropdown && !stateDropdown.contains(event.target)) {
        setStateDropdownOpen(false);
      }
      if (cityDropdown && !cityDropdown.contains(event.target)) {
        setCityDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Selection handlers
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
    setStates([]);
    setCities([]);
    setFilteredStates([]);
    setFilteredCities([]);
    setCountryDropdownOpen(false);
    setCountrySearchTerm('');
    setStateSearchTerm('');
    setCitySearchTerm('');
    setErrors(prev => ({ ...prev, country: null }));
    
    // Load states for selected country
    loadStates(country.iso2);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setCities([]);
    setFilteredCities([]);
    setStateDropdownOpen(false);
    setStateSearchTerm('');
    setCitySearchTerm('');
    setErrors(prev => ({ ...prev, state: null }));
    
    // Load cities for selected state
    loadCities(selectedCountry.iso2, state.iso2);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityDropdownOpen(false);
    setCitySearchTerm('');
    setErrors(prev => ({ ...prev, city: null }));
  };

  // Search handlers
  const handleCountrySearch = (searchTerm) => {
    setCountrySearchTerm(searchTerm);
    const filtered = countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
    setCountryDropdownOpen(true);
    
    // Clear selection if search term doesn't match selected country
    if (selectedCountry && !selectedCountry.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setStates([]);
      setCities([]);
      setFilteredStates([]);
      setFilteredCities([]);
    }
  };

  const handleStateSearch = (searchTerm) => {
    setStateSearchTerm(searchTerm);
    const filtered = states.filter(state => 
      state.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStates(filtered);
    setStateDropdownOpen(true);
    
    // Clear selection if search term doesn't match selected state
    if (selectedState && !selectedState.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      setSelectedState(null);
      setSelectedCity(null);
      setCities([]);
      setFilteredCities([]);
    }
  };

  const handleCitySearch = (searchTerm) => {
    setCitySearchTerm(searchTerm);
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
    setCityDropdownOpen(true);
    
    // Clear selection if search term doesn't match selected city
    if (selectedCity && !selectedCity.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      setSelectedCity(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    
    setResumeFile(file);
    setErrors(prev => ({ ...prev, resume: null }));
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      setErrors(prev => ({ 
        ...prev, 
        resume: 'Resume must be a PDF, DOC, or DOCX file' 
      }));
      setResumeFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Date picker initialization
  useEffect(() => {
    const initializeDatePicker = () => {
      if (typeof window !== 'undefined' && window.flatpickr && datePickerRef.current) {
        // Destroy existing instance if any
        if (flatpickrInstance.current) {
          flatpickrInstance.current.destroy();
        }
        
        flatpickrInstance.current = window.flatpickr(datePickerRef.current, {
          dateFormat: "Y-m-d",
          maxDate: "today",
          allowInput: false,
          clickOpens: true,
          onChange: (selectedDates) => {
            if (selectedDates.length > 0) {
              setSelectedDate(selectedDates[0]);
              setSelectedPostedSince(selectedDates[0].toISOString().split('T')[0]);
              setErrors(prev => ({ ...prev, postedSince: null }));
            }
          },
          onClose: () => {
            // Optional: handle close event
          }
        });
      } else {
        // If flatpickr is not available yet, try again after a short delay
        setTimeout(initializeDatePicker, 100);
      }
    };

    // Initialize with a small delay to ensure the library is loaded
    const timer = setTimeout(initializeDatePicker, 200);

    return () => {
      clearTimeout(timer);
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
      }
    };
  }, []);

  // Date shortcuts handler
  const handleDateShortcut = (type) => {
    const today = new Date();
    let targetDate = null;
    
    switch (type) {
      case 'today':
        targetDate = today;
        break;
      case 'week':
        targetDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        targetDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'clear':
        setSelectedDate(null);
        setSelectedPostedSince(null);
        if (flatpickrInstance.current) {
          flatpickrInstance.current.clear();
        }
        return;
      default:
        return;
    }
    
    if (targetDate) {
      setSelectedDate(targetDate);
      setSelectedPostedSince(targetDate.toISOString().split('T')[0]);
      setErrors(prev => ({ ...prev, postedSince: null }));
      
      if (flatpickrInstance.current) {
        flatpickrInstance.current.setDate(targetDate, false);
      }
    }
  };

  // Form validation
  const validateForm = (formData) => {
    const validationErrors = {};
    
    // Required fields validation
    if (!formData.jobTitle?.trim()) {
      validationErrors.jobTitle = 'Job Title is required';
    }
    
    if (!formData.searchTerms?.trim()) {
      validationErrors.searchTerms = 'Search Terms are required';
    }
    
    if (!selectedDate) {
      validationErrors.postedSince = 'Posted Since date is required';
    }
    
    if (!selectedMaxResults) {
      validationErrors.maxResults = 'Max Results is required';
    }
    
    if (!selectedCountry) {
      validationErrors.country = 'Country is required';
    }
    
    if (!selectedState) {
      validationErrors.state = 'State is required';
    }
    
    if (!selectedCity) {
      validationErrors.city = 'City is required';
    }
    
    if (!resumeFile) {
      validationErrors.resume = 'Resume is required';
    }
    
    // Validate Max Results range (if provided)
    if (selectedMaxResults && (selectedMaxResults < 10 || selectedMaxResults > 10000)) {
      validationErrors.maxResults = 'Max Results must be between 10 and 10000';
    }
    
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setErrors({ auth: 'Please connect your Google account first' });
      return;
    }
    
    // Clear previous errors and status
    setErrors({});
    setSubmitStatus(null);
    setGoogleSheetUrl(null);
    
    const formData = {
      jobTitle: e.target.jobTitle.value.trim(),
      searchTerms: e.target.searchTerms.value.trim(),
      postedSince: selectedDate ? selectedDate.toISOString().split('T')[0] : "",
      maxResults: selectedMaxResults || "",
      country: selectedCountry?.name || "",
      state: selectedState?.name || "",
      city: selectedCity?.name || "",
      resume: resumeFile?.name || "",
      submittedAt: new Date().toISOString()
    };

    // Validate form
    const validationErrors = validateForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      // Start loader with rotating messages
      startLoader();
      
      // Get valid access token (will refresh if needed)
      let accessToken;
      try {
        accessToken = await getValidAccessToken();
      } catch (tokenError) {
        console.error('Token error:', tokenError);
        setErrors({ auth: tokenError.message });
        setIsAuthenticated(false);
        stopLoader();
        return;
      }
      
      // Add access token to form data
      const dataWithToken = {
        ...formData,
        access_token: accessToken
      };
      
      console.log('Submitting to webhook:', config.webhookUrl);
      
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(dataWithToken),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Webhook response:', result);
        handleResponse(result);
      } else {
        const errorText = await res.text();
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }
      
    } catch (err) {
      console.error('Error submitting form:', err);
      stopLoader();
      setSubmitStatus('error');
      setErrors(prev => ({ 
        ...prev, 
        submit: `Error submitting form: ${err.message}` 
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="job-form-container">
        <h1 className="job-form-title">Job Discovery Form</h1>
        <p className="job-form-subtitle">
          Fill out this form to get a list of jobs based on your preferences.
        </p>

        {/* Google OAuth Section */}
        {authLoading ? (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-gray-600">Checking authentication...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Connect Your Google Account</h3>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Connect Google</span>
              </button>
            </div>
            <p className="text-sm">
                  Connect your Google account to enable automatic Google Sheets creation and data processing.
                </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Google Account Connected</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="job-form-group">
            <label htmlFor="jobTitle" className="job-form-label required">
              Job Title
            </label>
            <input 
              type="text" 
              id="jobTitle" 
              name="jobTitle" 
              className={`job-form-input ${errors.jobTitle ? 'border-danger' : ''}`}
              placeholder="e.g. Software Engineer, Data Analyst..."
            />
            {errors.jobTitle && <div className="text-danger small mt-1">{errors.jobTitle}</div>}
          </div>

          <div className="job-form-group">
            <label htmlFor="searchTerms" className="job-form-label required">
              Search Terms
            </label>
            <textarea 
              id="searchTerms" 
              name="searchTerms" 
              rows="3" 
              className={`job-form-textarea ${errors.searchTerms ? 'border-danger' : ''}`}
              placeholder="Enter keywords, skills, or requirements..."
            ></textarea>
            {errors.searchTerms && <div className="text-danger small mt-1">{errors.searchTerms}</div>}
          </div>

          {/* Country Dropdown */}
          <div className="job-form-group">
            <label htmlFor="country" className="job-form-label required">
              Country
            </label>
            <div className="search-dropdown" id="countryDropdown">
              <div className="search-input-container">
                <input 
                  type="text" 
                  className={`search-input ${errors.country ? 'border-danger' : ''}`}
                  id="countrySearch" 
                  placeholder="Search country..." 
                  autoComplete="off"
                  value={countrySearchTerm || (selectedCountry ? selectedCountry.name : '')}
                  onChange={(e) => handleCountrySearch(e.target.value)}
                  onFocus={() => setCountryDropdownOpen(true)}
                />
                <i className="fas fa-chevron-down dropdown-arrow"></i>
              </div>
              <div className={`dropdown-list ${countryDropdownOpen ? 'show' : ''}`} id="countryList">
                {filteredCountries.length === 0 ? (
                  <div className="dropdown-item no-results">No countries found</div>
                ) : (
                  filteredCountries.map((c) => (
                    <div
                      key={c.iso2}
                      className="dropdown-item"
                      onClick={() => handleCountrySelect(c)}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
            {errors.country && <div className="text-danger small mt-1">{errors.country}</div>}
          </div>

          {/* State Dropdown */}
          <div className="job-form-group">
            <label htmlFor="state" className="job-form-label required">
              State / Province
            </label>
            <div className={`search-dropdown ${!selectedCountry ? 'disabled' : ''}`} id="stateDropdown">
              <div className="search-input-container">
                <input 
                  type="text" 
                  className={`search-input ${errors.state ? 'border-danger' : ''}`}
                  id="stateSearch" 
                  placeholder={!selectedCountry ? 'Select country first...' : loadingStates ? 'Loading states...' : 'Search state...'}
                  autoComplete="off"
                  disabled={!selectedCountry || loadingStates}
                  value={stateSearchTerm || (selectedState ? selectedState.name : '')}
                  onChange={(e) => handleStateSearch(e.target.value)}
                  onFocus={() => selectedCountry && setStateDropdownOpen(true)}
                />
                <i className="fas fa-chevron-down dropdown-arrow"></i>
              </div>
              <div className={`dropdown-list ${stateDropdownOpen ? 'show' : ''}`} id="stateList">
                {!selectedCountry ? (
                  <div className="dropdown-item no-results">Select a country first</div>
                ) : loadingStates ? (
                  <div className="loading">Loading...</div>
                ) : errors.states ? (
                  <div className="dropdown-item no-results">{errors.states}</div>
                ) : filteredStates.length === 0 ? (
                  <div className="dropdown-item no-results">No states found</div>
                ) : (
                  filteredStates.map((s) => (
                    <div
                      key={s.iso2}
                      className="dropdown-item"
                      onClick={() => handleStateSelect(s)}
                    >
                      {s.name}
                    </div>
                  ))
                )}
              </div>
            </div>
            {errors.state && <div className="text-danger small mt-1">{errors.state}</div>}
          </div>

          {/* City Dropdown */}
          <div className="job-form-group">
            <label htmlFor="city" className="job-form-label required">
              City / Town
            </label>
            <div className={`search-dropdown ${!selectedState ? 'disabled' : ''}`} id="cityDropdown">
              <div className="search-input-container">
                <input 
                  type="text" 
                  className={`search-input ${errors.city ? 'border-danger' : ''}`}
                  id="citySearch" 
                  placeholder={!selectedState ? 'Select state first...' : loadingCities ? 'Loading cities...' : 'Search city...'}
                  autoComplete="off"
                  disabled={!selectedState || loadingCities}
                  value={citySearchTerm || (selectedCity ? selectedCity.name : '')}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => selectedState && setCityDropdownOpen(true)}
                />
                <i className="fas fa-chevron-down dropdown-arrow"></i>
              </div>
              <div className={`dropdown-list ${cityDropdownOpen ? 'show' : ''}`} id="cityList">
                {!selectedState ? (
                  <div className="dropdown-item no-results">Select a state first</div>
                ) : loadingCities ? (
                  <div className="loading">Loading...</div>
                ) : errors.cities ? (
                  <div className="dropdown-item no-results">{errors.cities}</div>
                ) : filteredCities.length === 0 ? (
                  <div className="dropdown-item no-results">No cities found</div>
                ) : (
                  filteredCities.map((c) => (
                    <div
                      key={c.id}
                      className="dropdown-item"
                      onClick={() => handleCitySelect(c)}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
            {errors.city && <div className="text-danger small mt-1">{errors.city}</div>}
          </div>

          

          {/* Posted Since Date Picker */}
          <div className="job-form-group">
            <label className="job-form-label required">
              Posted Since
            </label>
            <div className="date-picker-container">
              <input 
                type="text" 
                ref={datePickerRef}
                className={`job-form-input ${errors.postedSince ? 'border-danger' : ''}`}
                placeholder="Select date..."
                readOnly
                value={selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                }) : ''}
              />
              <i className="fas fa-calendar-alt date-picker-icon"></i>
            </div>
            <div className="date-shortcuts mt-2">
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary me-2" 
                onClick={() => handleDateShortcut('today')}
              >
                Today
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary me-2" 
                onClick={() => handleDateShortcut('week')}
              >
                Last Week
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary me-2" 
                onClick={() => handleDateShortcut('month')}
              >
                Last Month
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary" 
                onClick={() => handleDateShortcut('clear')}
              >
                Clear
              </button>
            </div>
            {errors.postedSince && <div className="text-danger small mt-1">{errors.postedSince}</div>}
          </div>

          {/* Max Results Dropdown */}
          <div className="job-form-group">
            <label className="job-form-label required">
              Max Results
            </label>
                  <div className="dropdown">
                    <button
                      className={`btn btn-outline-secondary dropdown-toggle w-100 text-start ${errors.maxResults ? 'border-danger' : ''}`}
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="fas fa-list-ol me-2"></i>
                      {selectedMaxResults ? `${selectedMaxResults} results` : "Select max number of results"}
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(10); setErrors(prev => ({ ...prev, maxResults: null })); }}>10 results</button></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(25); setErrors(prev => ({ ...prev, maxResults: null })); }}>25 results</button></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(50); setErrors(prev => ({ ...prev, maxResults: null })); }}>50 results</button></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(100); setErrors(prev => ({ ...prev, maxResults: null })); }}>100 results</button></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(250); setErrors(prev => ({ ...prev, maxResults: null })); }}>250 results</button></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(500); setErrors(prev => ({ ...prev, maxResults: null })); }}>500 results</button></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" type="button" onClick={() => { setSelectedMaxResults(1000); setErrors(prev => ({ ...prev, maxResults: null })); }}>1000 results</button></li>
                    </ul>
            </div>
            {errors.maxResults && <div className="text-danger small mt-1">{errors.maxResults}</div>}
          </div>
{/* Resume Upload */}
          <div className="job-form-group">
            <label className="job-form-label required">
              Upload Resume
            </label>
            <div 
              className="file-upload" 
              onClick={() => document.getElementById('resumeFile').click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="resumeFile"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
              />
              <div className="file-upload-icon">
                <i className={`fas ${resumeFile ? 'fa-file-check' : 'fa-cloud-upload-alt'}`}></i>
              </div>
              <div className="file-upload-text">
                {resumeFile ? (
                  <>
                    <span className="text-success fw-bold">{resumeFile.name}</span>
                    <br />
                    <small className="text-muted">Click to change file</small>
                  </>
                ) : (
                  <>
                    Click to upload or drag and drop
                    <br />
                    <small className="text-muted">PDF, DOC, DOCX files only</small>
                  </>
                )}
              </div>
            </div>
            {errors.resume && <div className="text-danger small mt-1">{errors.resume}</div>}
          </div>

          {/* Simple Loader */}
          {isLoading && (
            <div className="scraping-progress-container">
              <div className="scraping-loader">
                <div className="scraping-spinner"></div>
                <div className="scraping-content">
                  <h4 className="scraping-title">Processing Your Job Search</h4>
                  <div className="scraping-message">
                    <i className="fas fa-search me-2"></i>
                    {loadingMessage}
                  </div>
                  <div className="scraping-platform">
                    Currently scanning: <strong>{loadingPlatform}</strong>
                  </div>
                  <div className="scraping-time">
                    <small className="text-muted">
                      Please wait while we process your job search request.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`job-submit-btn ${
              submitStatus === 'success' ? 'btn-success' : 
              submitStatus === 'error' || submitStatus === 'timeout_error' ? 'btn-danger' : 
              !isAuthenticated ? 'btn-disabled' : ''
            }`}
            disabled={submitting || !isAuthenticated || isLoading}
          >
                  {isLoading ? (
                    <>
                      <i className="fas fa-search fa-spin me-2"></i>
                      Processing Jobs...
                    </>
                  ) : submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Processing...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Submitted Successfully!
                    </>
                  ) : submitStatus === 'error' ? (
                    <>
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Submission Failed
                    </>
                  ) : submitStatus === 'timeout_error' ? (
                    <>
                      <i className="fas fa-clock me-2"></i>
                      Process Timed Out
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <i className="fas fa-lock me-2"></i>
                      Connect Google to Submit
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Submit
                    </>
                  )}
                </button>

          {/* Authentication error message */}
          {errors.auth && (
            <div className="alert alert-warning mt-3 d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <span>{errors.auth}</span>
            </div>
          )}

          {/* Form-wide error message */}
          {errors.submit && (
            <div className="alert alert-danger mt-3 d-flex align-items-center">
              <i className="fas fa-exclamation-circle me-2"></i>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Authentication success message */}
          {submitStatus === 'auth_success' && (
            <div className="alert alert-info mt-3 d-flex align-items-center">
              <i className="fas fa-check-circle me-2"></i>
              <span>Successfully connected to Google! You can now submit your job data.</span>
            </div>
          )}

          {/* Authentication error message */}
          {submitStatus === 'auth_error' && (
            <div className="alert alert-danger mt-3 d-flex align-items-center">
              <i className="fas fa-exclamation-circle me-2"></i>
              <span>Authentication failed. Please try connecting to Google again.</span>
            </div>
          )}

          {/* Success message */}
          {submitStatus === 'success' && (
            <div className="alert alert-success mt-3">
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-check-circle me-2"></i>
                <span className="fw-bold">Your job data has been submitted successfully!</span>
              </div>
              {googleSheetUrl && (
                <div className="mt-3 p-3 bg-light rounded border">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <strong className="text-success">📊 Your Google Sheet is ready!</strong>
                      <br />
                      <small className="text-muted">Click the button below to view your job results</small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        // Open the Google Sheet in a new tab
                        window.open(googleSheetUrl, '_blank');
                        
                        // Refresh the page after a short delay
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                    >
                      <i className="fas fa-external-link-alt me-2"></i>
                      Open Google Sheet
                    </button>
                  </div>
                </div>
              )}
              <small className="text-muted d-block mt-2">
                The page will refresh automatically after you click the Google Sheet button.
              </small>
            </div>
          )}

        </form>
      </div>
    </>
  );
}
