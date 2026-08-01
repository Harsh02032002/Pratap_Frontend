lucide.createIcons();

        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';

        let citiesData = [];
        let areasData = [];
        let propertiesData = [];

        // Initialize - Load cities on page load
        window.addEventListener('DOMContentLoaded', () => {
            console.log('Page loaded, initializing...');
            
            // Auto-fill user info if logged in
            autoFillUserInfo();
            
            loadCities();
        });
        
        // Auto-fill form with logged-in user data
        function autoFillUserInfo() {
            const user = AuthUtils.getCurrentUser();
            if (!user) {
                console.log('No user logged in');
                return;
            }
            
            console.log('Auto-filling user info:', user);
            
            // Fill name field
            const nameInput = document.getElementById('fullName');
            if (nameInput) {
                const userName = user.firstName || user.name || '';
                if (userName) {
                    nameInput.value = userName;
                    console.log('Auto-filled name:', userName);
                }
            }
            
            // Fill email/gmail field
            const emailInput = document.getElementById('gmail');
            if (emailInput) {
                const userEmail = user.email || user.gmail || user.userEmail || '';
                if (userEmail) {
                    emailInput.value = userEmail;
                    console.log('Auto-filled email:', userEmail);
                }
            }
        }

        // Load cities from location data or API
        async function loadCities() {
            try {
                console.log('Attempting to load cities from API...');
                // Try to fetch from API endpoint
                const response = await fetch(`${API_URL}/api/locations/cities`);
                console.log('API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Cities from API:', data);
                    citiesData = data.data || data || [];
                    if (citiesData.length === 0) {
                        console.log('No cities in API response, using fallback');
                        citiesData = getDefaultCities();
                    }
                } else {
                    console.log('API response not OK, using fallback cities');
                    citiesData = getDefaultCities();
                }
            } catch (error) {
                console.error('Error loading cities:', error);
                citiesData = getDefaultCities();
            }
            console.log('Final citiesData:', citiesData);
            populateCitiesDropdown();
        }

        // Get default cities
        function getDefaultCities() {
            return [
                { _id: 'kota', name: 'Kota, Rajasthan' },
                { _id: 'indore', name: 'Indore, Madhya Pradesh' },
                { _id: 'sikar', name: 'Sikar, Rajasthan' },
                { _id: 'pune', name: 'Pune, Maharashtra' },
                { _id: 'delhi', name: 'Delhi' }
            ];
        }

        // Populate cities dropdown
        function populateCitiesDropdown() {
            const citySelect = document.getElementById('city');
            if (!citySelect) {
                console.error('City select element not found');
                return;
            }
            
            console.log('Populating cities dropdown with', citiesData.length, 'cities');
            citySelect.innerHTML = '<option value="">Select a city</option>';
            
            citiesData.forEach(city => {
                const option = document.createElement('option');
                // Handle both possible ID field names
                option.value = city._id || city.id;
                // Handle both possible name field names
                option.textContent = city.name || city.city_name;
                citySelect.appendChild(option);
                console.log('Added option:', option.textContent);
            });
        }

        // Load areas based on selected city
        async function loadAreas() {
            const cityId = document.getElementById('city').value;
            const areaSelect = document.getElementById('area');

            if (!cityId) {
                areaSelect.innerHTML = '<option value="">Select a city first</option>';
                return;
            }

            console.log('Loading areas for city ID:', cityId);
            
            try {
                // Fetch all areas and filter by city ID
                console.log('Fetching all areas from API...');
                const response = await fetch(`${API_URL}/api/locations/areas`);
                console.log('Areas API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    const allAreas = data.data || [];
                    console.log('Total areas available:', allAreas.length);
                    
                    // Filter areas by city ID - areas have city object with _id
                    areasData = allAreas.filter(area => {
                        const areasCityId = area.city?._id;
                        const matches = areasCityId === cityId;
                        if (matches) {
                            console.log('Matched area:', area.name, 'for city ID:', cityId);
                        }
                        return matches;
                    });
                    
                    console.log('Filtered areas:', areasData.length);
                } else {
                    console.log('API response not OK, using fallback');
                    areasData = getAreasByCity(cityId);
                }
                
                if (areasData.length === 0) {
                    console.log('No areas found, using fallback data');
                    areasData = getAreasByCity(cityId);
                }
            } catch (error) {
                console.error('Error loading areas:', error);
                areasData = getAreasByCity(cityId);
            }
            
            console.log('Final areasData to display:', areasData);
            populateAreasDropdown();
        }

        // Get city name from ID
        function getCityName(cityId) {
            const city = citiesData.find(c => c._id === cityId);
            return city ? city.name : '';
        }

        // Get areas by city (fallback)
        function getAreasByCity(cityId) {
            const areasByCity = {
                '6971cb61d151f66921db15b6': [  // AYnavaram
                    { _id: 'syr', name: 'SYR' }
                ],
                '6970d2d7b000ee27c1347749': [  // Madurai
                    { _id: 'mtr', name: 'MTR' }
                ],
                '696fa3712ee84dada0b0a5e8': [  // Chennai
                    { _id: 'ktc', name: 'KTC' },
                    { _id: 'tvk', name: 'TVK Nagar' }
                ],
                'kota': [
                    { _id: 'east', name: 'East Kota' },
                    { _id: 'west', name: 'West Kota' },
                    { _id: 'central', name: 'Central Kota' }
                ],
                'indore': [
                    { _id: 'vijay', name: 'Vijay Nagar' },
                    { _id: 'palasia', name: 'Palasia' },
                    { _id: 'mg', name: 'MG Road' }
                ],
                'sikar': [
                    { _id: 'market', name: 'Market Area' },
                    { _id: 'civil', name: 'Civil Lines' }
                ],
                'pune': [
                    { _id: 'hinjawadi', name: 'Hinjawadi' },
                    { _id: 'baner', name: 'Baner' },
                    { _id: 'kharadi', name: 'Kharadi' }
                ],
                'delhi': [
                    { _id: 'campus', name: 'North Campus' },
                    { _id: 'south', name: 'South Delhi' }
                ]
            };
            return areasByCity[cityId] || [];
        }

        // Populate areas dropdown
        function populateAreasDropdown() {
            const areaSelect = document.getElementById('area');
            if (!areaSelect) {
                console.error('Area select element not found');
                return;
            }
            
            console.log('Populating areas dropdown with', areasData.length, 'areas');
            console.log('Areas data:', areasData);
            
            areaSelect.innerHTML = '<option value="">Select an area</option>';
            
            if (areasData.length === 0) {
                console.warn('No areas to display!');
                areaSelect.innerHTML += '<option disabled>No areas available for this city</option>';
                return;
            }
            
            areasData.forEach((area, index) => {
                try {
                    const option = document.createElement('option');
                    const areaId = area._id || area.id;
                    const areaName = area.name || area.area_name;
                    
                    if (!areaId || !areaName) {
                        console.warn(`Area ${index} missing ID or name:`, area);
                        return;
                    }
                    
                    option.value = areaId;
                    option.textContent = areaName;
                    areaSelect.appendChild(option);
                    console.log('✓ Added area option:', areaName, '(' + areaId + ')');
                } catch (e) {
                    console.error('Error adding area option:', e.message, area);
                }
            });
            
            console.log('Total area options in dropdown:', areaSelect.options.length - 1);
        }

        // Load properties based on filters (using same logic as ourproperty)
        async function loadProperties() {
            const area = document.getElementById('area').value;
            const minPrice = document.getElementById('minPrice').value;
            const maxPrice = document.getElementById('maxPrice').value;

            if (!area) {
                document.getElementById('propertiesList').innerHTML = '';
                document.getElementById('noPropertiesMsg').style.display = 'block';
                return;
            }

            document.getElementById('propertiesLoadingSpinner').classList.add('show');
            document.getElementById('noPropertiesMsg').style.display = 'none';

            try {
                // Fetch from the same endpoint as ourproperty
                const response = await fetch(`${API_URL}/api/approved-properties/public/approved`);
                console.log('Properties API response status:', response.status);

                if (!response.ok) {
                    throw new Error('Failed to fetch properties');
                }

                const data = await response.json();
                let properties = [];

                // Handle different response formats
                if (Array.isArray(data)) {
                    properties = data;
                } else if (data && data.properties && Array.isArray(data.properties)) {
                    properties = data.properties;
                } else if (data && typeof data === 'object') {
                    properties = [data];
                } else {
                    console.warn('Unexpected API response format');
                    propertiesData = [];
                    displayProperties();
                    return;
                }

                console.log('✅ Fetched', properties.length, 'properties from API');
                console.log('📋 Sample property data:', properties[0]);

                // Filter for live/approved properties only
                properties = properties.filter(p => {
                    const isLive = p.isLiveOnWebsite === true;
                    const isApproved = p.status === 'live' || p.status === 'approved';
                    console.log('  Property:', p.property_name || p._id, '| isLiveOnWebsite:', p.isLiveOnWebsite, '| status:', p.status, '| Keep?:', isLive || isApproved);
                    return isLive || isApproved;
                });

                console.log('After live filter:', properties.length, 'properties');
                console.log('Selected area value:', area);
                const areaSelect = document.getElementById('area');
                const selectedOption = areaSelect.options[areaSelect.selectedIndex];
                console.log('Selected area text:', selectedOption ? selectedOption.text : 'N/A');

                // Apply client-side filters (same logic as ourproperty)
                propertiesData = properties.filter((prop) => {
                    const propInfo = prop.propertyInfo || {};
                    const propertyName = propInfo.name || prop.property_name || prop._id;
                    
                    // Area filter
                    if (area) {
                        const propArea = (prop.locality || propInfo.area || '').toString().toLowerCase().trim();
                        // Get the area name from the selected option text
                        const areaSelect = document.getElementById('area');
                        const selectedOption = areaSelect.options[areaSelect.selectedIndex];
                        const filterAreaName = selectedOption ? selectedOption.text.toLowerCase().trim() : area.toLowerCase().trim();
                        
                        console.log('🔍', propertyName, '- Comparing property area:', propArea, 'with filter area:', filterAreaName, 'filter ID:', area);
                        
                        if (propArea) {  // Only filter if property has area data
                            const areaMatch = propArea.includes(filterAreaName) || filterAreaName.includes(propArea);
                            console.log('  ✓ Area match result:', areaMatch);
                            if (!areaMatch) {
                                console.log('  ✗ REJECTED by area filter');
                                return false;
                            }
                        } else {
                            console.log('  ✗ REJECTED - property has no area data');
                            return false;
                        }
                    }

                    // Gender filter (if needed)
                    const gender = document.getElementById('gender').value;
                    if (gender) {
                        const propGender = (prop.gender || propInfo.gender || prop.genderSuitability || '').toString().toLowerCase();
                        console.log('  Gender filter active:', gender, '| Property gender:', propGender);
                        
                        // Allow: co-ed, exact match, or property gender contains the filter gender
                        const genderMatch = propGender.includes('co-ed') || 
                                          propGender.includes(gender.toLowerCase()) || 
                                          gender.toLowerCase().includes(propGender);
                        
                        if (propGender && !genderMatch) {
                            console.log('  ✗ REJECTED by gender filter');
                            return false;
                        }
                    }

                    // Price range filter
                    if (minPrice || maxPrice) {
                        const rent = parseInt(prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent) || null;
                        console.log('  Price range:', minPrice, '-', maxPrice, '| Property rent:', rent);
                        if (rent !== null) {  // Only apply price filter if property has rent data
                            if (minPrice && rent < parseInt(minPrice)) {
                                console.log('  ✗ REJECTED - rent too low');
                                return false;
                            }
                            if (maxPrice && maxPrice !== '50000_plus' && rent > parseInt(maxPrice)) {
                                console.log('  ✗ REJECTED - rent too high');
                                return false;
                            }
                        }
                    }

                    console.log('  ✅ PASSED all filters');
                    return true;
                });

                console.log('After filters:', propertiesData.length, 'properties match criteria');
                displayProperties();
            } catch (error) {
                console.error('Error loading properties:', error);
                propertiesData = [];
                displayProperties();
            } finally {
                document.getElementById('propertiesLoadingSpinner').classList.remove('show');
            }
        }

        // Display properties list
        function displayProperties() {
            const listDiv = document.getElementById('propertiesList');
            const noMsg = document.getElementById('noPropertiesMsg');

            if (propertiesData.length === 0) {
                listDiv.innerHTML = '';
                noMsg.style.display = 'block';
                return;
            }

            noMsg.style.display = 'none';
            listDiv.innerHTML = propertiesData.map(prop => {
                // Handle both property data structures
                const propInfo = prop.propertyInfo || {};
                const propertyId = prop._id || prop.propertyNumber;
                const propertyName = propInfo.name || prop.property_name || 'Property ' + propertyId;
                const rent = prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent || 0;
                const gender = prop.gender || propInfo.gender || prop.genderSuitability || 'Not specified';
                const propertyType = propInfo.propertyType || prop.propertyType || 'Property';

                return `
                    <div class="property-item" onclick="toggleProperty(this, '${propertyId}')">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-900">${propertyName}</h4>
                                <p class="text-sm text-gray-600 mt-1">
                                    <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i> Property #${propertyId}
                                </p>
                                <div class="flex gap-4 mt-2 text-xs">
                                    <span class="text-gray-600"><strong>₹${rent}</strong>/month</span>
                                    <span class="text-gray-600">${gender}</span>
                                    <span class="bg-gray-200 text-gray-700 px-2 py-1 rounded">${propertyType}</span>
                                </div>
                            </div>
                            <div class="ml-4">
                                <input type="checkbox" class="property-checkbox w-5 h-5 text-blue-600 rounded" data-property-id="${propertyId}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }

        // Toggle property selection
        function toggleProperty(element, propertyId) {
            element.classList.toggle('selected');
            const checkbox = element.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
        }

        // Form validation
        function validateForm() {
            const fullName = document.getElementById('fullName').value.trim();
            const gmail = document.getElementById('gmail').value.trim();
            const gender = document.getElementById('gender').value;
            const city = document.getElementById('city').value;
            const area = document.getElementById('area').value;
            const minPrice = document.getElementById('minPrice').value;
            const maxPrice = document.getElementById('maxPrice').value;

            let isValid = true;

            // Reset error messages
            document.querySelectorAll('[id$="Error"]').forEach(el => el.classList.add('hidden'));

            if (!fullName) {
                document.getElementById('nameError').textContent = 'Full name is required';
                document.getElementById('nameError').classList.remove('hidden');
                isValid = false;
            }

            if (!gmail || !gmail.includes('@gmail.com')) {
                document.getElementById('emailError').textContent = 'Valid Gmail address is required';
                document.getElementById('emailError').classList.remove('hidden');
                isValid = false;
            }

            if (!gender) {
                isValid = false;
            }

            if (!city) {
                document.getElementById('cityError').textContent = 'City selection is required';
                document.getElementById('cityError').classList.remove('hidden');
                isValid = false;
            }

            if (!area) {
                document.getElementById('areaError').textContent = 'Area selection is required';
                document.getElementById('areaError').classList.remove('hidden');
                isValid = false;
            }

            if (!minPrice || !maxPrice || minPrice > maxPrice) {
                isValid = false;
            }

            return isValid;
        }

        // Handle form submission
        document.getElementById('fastBiddingForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            if (typeof AuthUtils !== 'undefined' && AuthUtils.ensureValidSessionOrPrompt) {
                const ok = await AuthUtils.ensureValidSessionOrPrompt('Please login/signup to send bids.');
                if (!ok) return;
            } else if (typeof AuthUtils !== 'undefined' && AuthUtils.showAuthPromptModal) {
                AuthUtils.showAuthPromptModal('Please login/signup to send bids.');
                return;
            }

            if (!validateForm()) {
                alert('Please fill in all required fields correctly');
                return;
            }

            // Get email from form
            const emailFromForm = document.getElementById('gmail').value.trim();

            // Check if user is signed up - try MongoDB first
            let signedUpUser = (typeof AuthUtils !== 'undefined' && AuthUtils.getCurrentUser) ? AuthUtils.getCurrentUser() : null;
            
            try {
                // Fetch from MongoDB only if local session user is unavailable
                if (!signedUpUser) {
                    const response = await fetch(`${API_URL}/api/kyc`);
                    if (response.ok) {
                        const signupUsers = await response.json();
                        signedUpUser = signupUsers.find(u => u.email && u.email.toLowerCase() === emailFromForm.toLowerCase());
                        console.log('User email checked against MongoDB');
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch from MongoDB, falling back to localStorage');
            }

            // Fallback to localStorage if API/session lookup fails
            if (!signedUpUser) {
                const signupUsers = JSON.parse(localStorage.getItem('roomhy_kyc_verification') || '[]');
                signedUpUser = signupUsers.find(u => u.email.toLowerCase() === emailFromForm.toLowerCase());
            }

            if (!signedUpUser) {
                // User not found in signups - show signup modal
                showSignupModal(emailFromForm);
                return;
            }

            // User is signed up - proceed with bid submission
            // Get selected properties
            const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedCheckboxes.length === 0) {
                alert('Please select at least one property to bid on');
                return;
            }

            const selectedPropertyIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.propertyId);

            // Get user ID from signup data
            const userId = signedUpUser.loginId || signedUpUser.id || signedUpUser._id || '';

            document.getElementById('propertiesLoadingSpinner').classList.add('show');

            // Submit bids and wait for completion before showing success
            console.log('📋 Submitting bids for', selectedPropertyIds.length, 'properties');

            // Submit bids and wait for completion
            (async () => {
                let successCount = 0;
                let failedCount = 0;

                for (const propertyId of selectedPropertyIds) {
                    try {
                        // Find the property object from propertiesData to get owner details
                        const property = propertiesData.find(p => p._id === propertyId || p.propertyId === propertyId || p.visitId === propertyId);
                        
                        if (!property) {
                            console.warn('Property not found for ID:', propertyId);
                            failedCount++;
                            continue;
                        }

                        // Get property owner ID
                        const propertyOwnerId = (property.generatedCredentials && property.generatedCredentials.loginId) || 
                                               property.ownerLoginId || 
                                               property.createdBy || 
                                               property.owner || 
                                               property.propertyOwnerId;

                        if (!propertyOwnerId) {
                            console.warn('Could not find property owner for property:', propertyId);
                            failedCount++;
                            continue;
                        }

                        const selectedCityOption = document.querySelector('#city option:checked');
                        const selectedAreaOption = document.querySelector('#area option:checked');
                        const bidMinValue = parseInt(document.getElementById('minPrice').value || 0);
                        const bidMaxValue = parseInt(document.getElementById('maxPrice').value || 0);
                        const selectedGender = document.getElementById('gender').value || '';
                        const selectedCityId = document.getElementById('city').value || '';
                        const selectedAreaId = document.getElementById('area').value || '';

                        // Prepare bid data for MongoDB booking requests collection
                        const bidData = {
                            property_id: propertyId,
                            property_name: property.property_name || property.propertyInfo?.name || 'Property',
                            area: property.locality || property.propertyInfo?.area || '',
                            property_type: property.propertyType || property.propertyInfo?.propertyType || 'Property',
                            rent_amount: parseInt(property.monthlyRent || property.rent || property.propertyInfo?.rent || 0),
                            user_id: userId,
                            owner_id: propertyOwnerId,
                            name: document.getElementById('fullName').value,
                            email: emailFromForm,
                            phone: '',
                            request_type: 'bid',
                            bid_min: Number.isFinite(bidMinValue) && bidMinValue > 0 ? bidMinValue : null,
                            bid_max: Number.isFinite(bidMaxValue) && bidMaxValue > 0 ? bidMaxValue : null,
                            filter_criteria: {
                                gender: selectedGender,
                                city_id: selectedCityId,
                                city: selectedCityOption ? selectedCityOption.textContent.trim() : '',
                                area_id: selectedAreaId,
                                area: selectedAreaOption ? selectedAreaOption.textContent.trim() : '',
                                min_price: Number.isFinite(bidMinValue) && bidMinValue > 0 ? bidMinValue : null,
                                max_price: Number.isFinite(bidMaxValue) && bidMaxValue > 0 ? bidMaxValue : null,
                                property_type: property.propertyType || property.propertyInfo?.propertyType || 'Property'
                            },
                            message: 'Looking for property with rent Rs ' + document.getElementById('minPrice').value + '-' + document.getElementById('maxPrice').value + ', Gender: ' + selectedGender
                        };

                        console.log('📤 Submitting bid for property:', propertyId);

                        // Submit to /api/booking/create with 5 second timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);

                        const response = await fetch(`${API_URL}/api/booking/create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(bidData),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Bid submitted successfully for property:', propertyId, 'Booking ID:', result.bookingId || result._id);
                            successCount++;
                        } else {
                            const error = await response.text();
                            console.error('❌ Failed to submit bid for property:', propertyId, error);
                            failedCount++;
                        }
                    } catch (error) {
                        console.error('Error submitting bid for property:', propertyId, error.message);
                        failedCount++;
                    }
                }

                // Background completion logging
                console.log('🏁 Bid submission batch complete:', successCount, 'successful,', failedCount, 'failed');

                // Show success modal only if at least one bid was successful
                if (successCount > 0) {
                    showSuccessModal(successCount);
                }

                // Store user email and loginId for websitechat
                if (!localStorage.getItem('user_email')) {
                    localStorage.setItem('user_email', emailFromForm);
                }
                if (!localStorage.getItem('user_id')) {
                    localStorage.setItem('user_id', userId);
                }

                // Hide spinner after all requests complete
                document.getElementById('propertiesLoadingSpinner').classList.remove('show');
            })();
        });

        // Show success modal
        function showSuccessModal(count) {
            document.getElementById('bidCountDisplay').textContent = count;
            document.getElementById('submissionModal').classList.remove('hidden');
            document.getElementById('submissionModal').classList.add('flex');
        }

        // Close modal
        function closeModal() {
            document.getElementById('submissionModal').classList.add('hidden');
            document.getElementById('submissionModal').classList.remove('flex');
            // Reset form
            document.getElementById('fastBiddingForm').reset();
            // Reload to clear selections
            document.getElementById('propertiesList').innerHTML = '';
            document.getElementById('noPropertiesMsg').style.display = 'block';
        }

        // Show signup modal
        function showSignupModal(email) {
            document.getElementById('signupModal').classList.remove('hidden');
            document.getElementById('signupModal').classList.add('flex');
            document.getElementById('signupEmailDisplay').textContent = email;
        }

        // Close signup modal
        function closeSignupModal() {
            document.getElementById('signupModal').classList.add('hidden');
            document.getElementById('signupModal').classList.remove('flex');
        }

        // Proceed to signup
        function proceedToSignup() {
            window.location.href = 'signup';
        }
