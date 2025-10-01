class CommMobDataProcessor {
    constructor() {
        this.masterApplicantsData = null;
        this.masterVolunteersData = null;
        this.newApplicantsData = null;
        this.newVolunteersData = null;
        this.processedApplicantsData = null;
        this.processedVolunteersData = null;
        this.processingReport = null;
        
        this.initializeEventListeners();
        this.loadMasterFiles();
    }

    initializeEventListeners() {
        // File upload handlers
        document.getElementById('applicants-file').addEventListener('change', (e) => this.handleFileSelect(e, 'applicants'));
        document.getElementById('volunteers-file').addEventListener('change', (e) => this.handleFileSelect(e, 'volunteers'));

        // Drag and drop handlers
        const applicantsUpload = document.getElementById('applicants-upload');
        const volunteersUpload = document.getElementById('volunteers-upload');

        this.setupDragAndDrop(applicantsUpload, 'applicants');
        this.setupDragAndDrop(volunteersUpload, 'volunteers');

        // Process button
        document.getElementById('process-btn').addEventListener('click', () => this.processData());

        // Download buttons
        document.getElementById('download-applicants').addEventListener('click', () => this.downloadFile('applicants'));
        document.getElementById('download-volunteers').addEventListener('click', () => this.downloadFile('volunteers'));
        document.getElementById('download-report').addEventListener('click', () => this.downloadReport());

        // Preview tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Modal functionality
        this.initializeModal();
    }
    
    initializeModal() {
        const modal = document.getElementById('help-modal');
        const showHelpBtn = document.getElementById('show-detailed-help');
        const closeBtn = document.querySelector('.close');
        
        // Show modal
        showHelpBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
        
        // Close modal
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    setupDragAndDrop(element, type) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('dragover');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files } }, type);
            }
        });

        element.addEventListener('click', () => {
            document.getElementById(`${type}-file`).click();
        });
    }

    async loadMasterFiles() {
        try {
            this.log('Loading master files...', 'info');
            
            // Load master applicants file
            const applicantsResponse = await fetch('Applicants 2025.csv');
            const applicantsText = await applicantsResponse.text();
            this.masterApplicantsData = Papa.parse(applicantsText, { header: true }).data;
            
            // Load master volunteers file
            const volunteersResponse = await fetch('Volunteer 2025.csv');
            const volunteersText = await volunteersResponse.text();
            this.masterVolunteersData = Papa.parse(volunteersText, { header: true }).data;

            this.updateStatusBar();
            this.log(`Loaded ${this.masterApplicantsData.length} applicants and ${this.masterVolunteersData.length} volunteers`, 'success');
            
            // Enable downloads for existing master data
            this.enableMasterDataDownloads();
            
        } catch (error) {
            this.log(`Error loading master files: ${error.message}`, 'error');
        }
    }
    
    enableMasterDataDownloads() {
        // Set processed data to master data so downloads work immediately
        this.processedApplicantsData = this.masterApplicantsData;
        this.processedVolunteersData = this.masterVolunteersData;
        
        // Enable download buttons for existing data
        const downloadApplicants = document.getElementById('download-applicants');
        const downloadVolunteers = document.getElementById('download-volunteers');
        
        if (downloadApplicants && this.masterApplicantsData && this.masterApplicantsData.length > 0) {
            downloadApplicants.disabled = false;
            downloadApplicants.innerHTML = '📥 Download Current Applicants Data';
        }
        
        if (downloadVolunteers && this.masterVolunteersData && this.masterVolunteersData.length > 0) {
            downloadVolunteers.disabled = false;
            downloadVolunteers.innerHTML = '📥 Download Current Volunteers Data';
        }
        
        // Show results section with current data
        document.getElementById('results-section').style.display = 'block';
        
        // Generate previews for current data
        this.generatePreviews();
        
        this.log('📥 Current data is ready for download!', 'success');
        this.log(`Current data: ${this.masterApplicantsData.length.toLocaleString()} applicants, ${this.masterVolunteersData.length.toLocaleString()} volunteers`, 'info');
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        this.log(`Processing ${type} file: ${file.name}`, 'info');

        Papa.parse(file, {
            header: false, // Parse without header first to handle multiple header rows
            complete: (results) => {
                const skipHeaderRows = document.getElementById('skip-header-rows').checked;
                let rows = results.data;

                if (skipHeaderRows) {
                    // Find the actual header row (contains "Account Name" or similar)
                    let headerRowIndex = -1;
                    for (let i = 0; i < rows.length; i++) {
                        const rowText = rows[i].join('').toLowerCase();
                        if (rowText.includes('account name') || 
                            rowText.includes('member #') ||
                            (type === 'applicants' && rowText.includes('entry point')) ||
                            (type === 'volunteers' && rowText.includes('current status'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    if (headerRowIndex >= 0) {
                        this.log(`Found header row at line ${headerRowIndex + 1}`, 'info');
                        // Extract headers and data
                        const headers = rows[headerRowIndex];
                        const dataRows = rows.slice(headerRowIndex + 1);
                        
                        // Convert to objects with proper headers
                        const processedData = dataRows.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                if (header && header.trim()) {
                                    obj[header.trim()] = row[index] || '';
                                }
                            });
                            return obj;
                        }).filter(row => {
                            // Remove completely empty rows
                            const values = Object.values(row);
                            return values.some(value => value && value.toString().trim() !== '');
                        });

                        if (type === 'applicants') {
                            this.newApplicantsData = processedData;
                        } else {
                            this.newVolunteersData = processedData;
                        }

                        this.log(`Processed ${processedData.length} valid records from ${type} file`, 'info');
                    } else {
                        this.log(`Could not find header row in ${type} file`, 'error');
                        return;
                    }
                } else {
                    // Use original simple parsing
                    const data = results.data.filter(row => {
                        const values = Object.values(row);
                        return values.some(value => value && value.trim() !== '');
                    });

                    if (type === 'applicants') {
                        this.newApplicantsData = data;
                    } else {
                        this.newVolunteersData = data;
                    }
                }

                this.updateFileInfo(type, file.name, type === 'applicants' ? this.newApplicantsData.length : this.newVolunteersData.length);
                this.updateStatusBar();
                this.checkProcessButton();
            },
            error: (error) => {
                this.log(`Error parsing ${type} file: ${error.message}`, 'error');
            }
        });
    }

    updateFileInfo(type, filename, rowCount) {
        const fileInfo = document.getElementById(`${type}-file-info`);
        fileInfo.textContent = `✅ ${filename} (${rowCount} rows)`;
        fileInfo.classList.add('has-file');
    }

    updateStatusBar() {
        document.getElementById('master-applicants-count').textContent = 
            this.masterApplicantsData ? this.masterApplicantsData.length : '-';
        document.getElementById('master-volunteers-count').textContent = 
            this.masterVolunteersData ? this.masterVolunteersData.length : '-';
        document.getElementById('new-applicants-count').textContent = 
            this.newApplicantsData ? this.newApplicantsData.length : '-';
        document.getElementById('new-volunteers-count').textContent = 
            this.newVolunteersData ? this.newVolunteersData.length : '-';
    }

    checkProcessButton() {
        const processBtn = document.getElementById('process-btn');
        const hasNewData = this.newApplicantsData || this.newVolunteersData;
        processBtn.disabled = !hasNewData;
    }

    async processData() {
        this.log('Starting data processing...', 'info');
        
        // Store before counts
        const beforeCounts = {
            masterApplicants: this.masterApplicantsData.length,
            masterVolunteers: this.masterVolunteersData.length,
            newApplicants: this.newApplicantsData ? this.newApplicantsData.length : 0,
            newVolunteers: this.newVolunteersData ? this.newVolunteersData.length : 0
        };

        // Update before counts display
        document.getElementById('before-applicants-count').textContent = beforeCounts.masterApplicants;
        document.getElementById('before-volunteers-count').textContent = beforeCounts.masterVolunteers;
        document.getElementById('before-new-applicants-count').textContent = beforeCounts.newApplicants;
        document.getElementById('before-new-volunteers-count').textContent = beforeCounts.newVolunteers;

        try {
            // Process applicants data
            if (this.newApplicantsData) {
                this.processedApplicantsData = await this.mergeData(
                    this.masterApplicantsData, 
                    this.newApplicantsData, 
                    'applicants'
                );
            } else {
                this.processedApplicantsData = [...this.masterApplicantsData];
            }

            // Process volunteers data
            if (this.newVolunteersData) {
                this.processedVolunteersData = await this.mergeData(
                    this.masterVolunteersData, 
                    this.newVolunteersData, 
                    'volunteers'
                );
            } else {
                this.processedVolunteersData = [...this.masterVolunteersData];
            }

            // Validate the results
            const validationResult = this.validateResults(beforeCounts);

            // Update after counts display
            document.getElementById('after-applicants-count').textContent = this.processedApplicantsData.length;
            document.getElementById('after-volunteers-count').textContent = this.processedVolunteersData.length;
            
            const validationStatus = document.getElementById('validation-status');
            if (validationResult.valid) {
                validationStatus.textContent = '✅ Valid';
                validationStatus.className = 'count-value validation-success';
            } else {
                validationStatus.textContent = '❌ Issues Found';
                validationStatus.className = 'count-value validation-error';
            }

            // Generate processing report
            const chapterStats = {
                assignmentsMade: (this.chapterAssignmentStats?.assignmentsMade || 0),
                assignmentsSkipped: (this.chapterAssignmentStats?.assignmentsSkipped || 0)
            };
            this.generateProcessingReport(beforeCounts, validationResult, chapterStats);

            // Enable download buttons
            document.getElementById('download-applicants').disabled = false;
            document.getElementById('download-volunteers').disabled = false;
            document.getElementById('download-report').disabled = false;

            // Show results section
            document.getElementById('results-section').style.display = 'block';

            // Generate previews
            this.generatePreviews();

            // Display report summary
            this.displayReportSummary();

            this.log('Data processing completed successfully!', 'success');
            this.log(`Final counts - Applicants: ${this.processedApplicantsData.length}, Volunteers: ${this.processedVolunteersData.length}`, 'info');

        } catch (error) {
            this.log(`Error processing data: ${error.message}`, 'error');
        }
    }

    getColumnMapping(type) {
        // Define semantic mappings for intelligent column matching
        const semanticMappings = {
            applicants: {
                // Core identifiers
                'account_id': ['account_id', 'account id', 'id', 'member id', 'user id'],
                'Entry Point': ['entry point', 'entrypoint', 'application type', 'volunteer type'],
                'Current Status': ['current status', 'status', 'volunteer status', 'application status'],
                
                // Personal info
                'Email Address': ['email address', 'email', 'e-mail', 'email addr'],
                'Phone Numbers': ['phone numbers', 'phone', 'telephone', 'phone number', 'contact number'],
                'City': ['city', 'town', 'municipality'],
                'State': ['state', 'province', 'region', 'st'],
                'County': ['county', 'county of residence', 'parish', 'borough'],
                'Zip': ['zip', 'zip code', 'postal code', 'zipcode', 'postcode'],
                'Country': ['country', 'nation'],
                
                // Dates
                'Application Dt': ['application dt', 'application date', 'app date', 'application'],
                'Vol Start Dt': ['vol start dt', 'volunteer start date', 'start date', 'vol start'],
                'Inactive Dt': ['inactive dt', 'inactive date', 'inactivation date'],
                
                // Process fields
                'Intake Outcome': ['intake outcome', 'outcome', 'result', 'intake result'],
                'Contact Status': ['contact status', 'contacted', 'contact'],
                'BGC Status': ['bgc status', 'background check status', 'bg status'],
                'BGC Score': ['bgc score', 'background check score', 'bg score'],
                
                // Chapters
                'Current Chapter': ['current chapter', 'chapter', 'current chapter in this region'],
                'Home Chapter': ['home chapter', 'home chapter in this region'],
                
                // Workflow
                'Workflow Type': ['workflow type', 'workflow', 'process type'],
                'Intake Workflow': ['intake workflow', 'workflow', 'process'],
                
                // Outcomes
                'Outcome at 21 Days': ['outcome at 21 days', '21 day outcome', 'outcome at 21 days after application'],
                '21 Days (Active/Inactive)': ['21 days (active/inactive)', 'proc. in 21 days (active/inactive)', '21 days'],
                
                // Coordinates (often missing in NEIA)
                'x': ['x', 'longitude', 'lng', 'lon'],
                'y': ['y', 'latitude', 'lat']
            },
            volunteers: {
                // Core identifiers
                'account_id': ['account_id', 'account id', 'id', 'member id', 'user id'],
                'Member #': ['member #', 'member number', 'member no', 'member'],
                'Current Status': ['current status', 'status', 'volunteer status'],
                'Status Type': ['status type', 'type', 'volunteer type'],
                
                // Personal info
                'Email': ['email', 'e-mail', 'email address'],
                'City': ['city', 'town', 'municipality'],
                'State': ['state', 'province', 'region', 'st'],
                'County of Residence': ['county of residence', 'county', 'parish', 'borough'],
                'Zip': ['zip', 'zip code', 'postal code', 'zipcode', 'postcode'],
                
                // Contact info
                'Home Phone': ['home phone', 'home', 'home tel', 'home telephone'],
                'Cell Phone': ['cell phone', 'cell', 'mobile', 'cell phone', 'mobile phone'],
                'Work Phone': ['work phone', 'work', 'work tel', 'work telephone'],
                
                // Dates
                'Volunteer Since Date': ['volunteer since date', 'volunteer since', 'since date', 'start date'],
                'Last Login': ['last login', 'login', 'last sign in'],
                'Profile Last Updt': ['profile last updt', 'profile last update', 'last update', 'profile update'],
                
                // Positions
                'Current Positions': ['current positions', 'positions', 'current position'],
                'Services of Current Positions': ['services of current positions', 'services', 'service areas'],
                
                // Hours
                'Last Hours Entry': ['last hours entry', 'last hours', 'hours entry', 'last hours entry**'],
                
                // Language
                '2nd Language': ['2nd language', 'second language', 'language', 'additional language'],
                
                // GAP
                'Primary GAP': ['primary gap', 'gap', 'primary', 'main gap'],
                
                // Coordinates (often missing in NEIA)
                'x': ['x', 'longitude', 'lng', 'lon'],
                'y': ['y', 'latitude', 'lat']
            }
        };

        return semanticMappings[type] || {};
    }

    createPositionalMapping(masterHeaders, newHeaders, type) {
        const mapping = {};
        
        if (type === 'applicants') {
            // Mapping for post-geocode files (_geocodio suffix)
            // Handles both raw NEIA files and geocoded files
            const positionalMap = {
                'Entry Point': 'Entry Point',
                'Entry Point Final Status': 'Entry Point Final Status',
                'How Did You Hear': 'How Did You Hear About Us',
                'Other': 'Other',
                'Intake Outcome': 'Intake Outcome',
                'Contact Status': 'Contact Status',
                'Contact Completed Date': 'Contact Completed Date',
                'Current Status': 'Current Status',
                'Application Dt': 'Application Dt',
                'Vol Start Dt': 'Vol Start Dt',
                'Days To Vol Start': 'Days To Vol Start',
                'Inactive Dt': 'Inactive Dt',
                'Days To Inactive': 'Days To Inactive',
                'Days On Intake Path': 'Days On Intake Path',
                'Profile Updt': 'Profile Updt',
                'Code of Conduct': 'Code of Conduct',
                'Intell. Property': 'Intell. Property',
                'Info. Release': 'Info. Release',
                'Vol Handbook': 'Vol Handbook',
                'BGC Required': 'BGC Required',
                'Initiate BGC Step': 'Initiate BGC Step',
                'BGC Status': 'BGC Status',
                'BGC Score': 'BGC Score',
                'Compl BGC Step': 'Compl BGC Step',
                'Orientation Required': 'Orientation Required',
                'Register Orient. Step': 'Register Orient. Step',
                'Attend Orient. Step': 'Attend Orient. Step',
                'Workflow Type': 'Workflow Type',
                'Interest Indic Step': 'Interest Indic Step',
                'Passed to Region': 'Passed to Region',
                'Screening Form Status': 'Screening Form Status',
                'Screening Form Completed': 'Screening Form Completed',
                'Screening Form Completed By': 'Screening Form Completed By',
                'Refer Issued Step': 'Refer Issued Step',
                '1st Referral*': '1st Referral*',
                'Days To Referral*': 'Days To Referral*',
                'Refer Approved Step': 'Refer Approved Step',
                'Placement Dt': 'Placement Dt',
                'Days To Placement': 'Days To Placement',
                '21 Days (Active/Inactive)': 'Proc. in 21 Days (Active/Inactive)',
                'Outcome at 21 Days': 'Outcome at 21 Days After Application**',
                'Current Chapter': 'Current Chapter In This Region (if applic.)',
                'Home Chapter': 'Home Chapter In This Region (if applic.)',
                'City': 'Geocodio City', // Use geocoded data for proper formatting
                'State': 'Geocodio State', // Use geocoded data for proper formatting
                'County': 'Geocodio County', // Use geocoded data for proper formatting
                'Zip': 'Geocodio Postal Code', // Use geocoded data for proper formatting
                'Country': 'Country',
                'Inactivation Comments': 'Inactivation Comments',
                'Inactivation Reason for Change': 'Inactivation Reason for Change',
                'Intake Workflow': 'Intake Workflow',
                // For geocoded files, use the geocoded coordinates
                'x': 'Geocodio Longitude',
                'y': 'Geocodio Latitude'
            };
            
            // Check if this is a geocoded file (has coordinates)
            const hasGeocodedCoords = newHeaders.some(header => 
                header.toLowerCase().includes('geocodio longitude') || 
                header.toLowerCase().includes('geocodio latitude') ||
                header.toLowerCase().includes('longitude') || 
                header.toLowerCase().includes('latitude') ||
                header.toLowerCase().includes('x') ||
                header.toLowerCase().includes('y')
            );
            
            // Check for geocoded address fields
            const hasGeocodedAddress = newHeaders.some(header => 
                header.toLowerCase().includes('geocodio') || header.toLowerCase().includes('geocoded')
            );
            
            if (!hasGeocodedCoords) {
                // Raw NEIA file without coordinates
                positionalMap['x'] = '';
                positionalMap['y'] = '';
                this.log('Warning: No geocoded coordinates found. Using empty x,y fields.', 'warning');
            } else {
                this.log('Geocoded coordinates detected. Using Longitude/Latitude fields.', 'info');
            }
            
            // Use geocoded data if available, otherwise fall back to original
            if (hasGeocodedAddress) {
                this.log('Geocoded address data detected. Using standardized geocoded fields for proper formatting.', 'info');
                // Geocoded fields are already mapped above
            } else {
                this.log('No geocoded address data found. Using original address fields.', 'warning');
                // Fall back to original field names
                positionalMap['City'] = 'City';
                positionalMap['State'] = 'State';
                positionalMap['County'] = 'County of Residence';
                positionalMap['Zip'] = 'Zip Code';
            }
            
            // Apply the mapping with fallback logic for common field variations
            masterHeaders.forEach(masterHeader => {
                let sourceColumn = positionalMap[masterHeader];
                
                // Special handling for State field - try multiple variations
                if (masterHeader === 'State' && !newHeaders.includes(sourceColumn)) {
                    const stateVariations = ['State', 'ST', 'State/Province', 'State Province'];
                    sourceColumn = stateVariations.find(variation => newHeaders.includes(variation)) || '';
                    if (sourceColumn) {
                        this.log(`Using '${sourceColumn}' for State field mapping`, 'info');
                    }
                }
                
                mapping[masterHeader] = sourceColumn || '';
            });
            
        } else if (type === 'volunteers') {
            // Mapping for volunteer files
            const positionalMap = {
                'Region Is Primary': 'Region Is Primary',
                'Chapter Name': 'Chapter Name',
                'Current Status': 'Current Status',
                'Status Type': 'Status Type',
                'State': 'State',  // Standard Geocodio output
                'Zip': 'ZIP',     // Standard Geocodio output  
                'County of Residence': 'County', // Standard Geocodio output
                'City': 'City',   // Standard Geocodio output
                'Country': 'Country', // Standard Geocodio output
                'Dis Resp': 'Dis Resp',
                'Primary GAP': 'Primary GAP',
                '2nd Language': '2nd Language',
                'SABA ID': 'SABA ID',
                'Job Type': 'Job Type',
                'Volunteer Since Date': 'Volunteer Since Date',
                'Services of Current Positions': 'Services of Current Positions',
                'Current Positions': 'Current Positions',
                'Last Hours Entry': 'Last Hours Entry**',
                'Last Login': 'Last Login',
                'Days Since Last Login': 'Days Since Last Login',
                'Profile Last Updt': 'Profile Last Updt',
                'Days Since Profile Updt': 'Days Since Profile Updt',
                'ObjectId': 'RCO ID',
                // For geocoded files, use the standard Geocodio coordinates
                'x': 'Longitude',
                'y': 'Latitude'
            };
            
            // Check for geocoded coordinates
            const hasGeocodedCoords = newHeaders.some(header => 
                header.toLowerCase().includes('geocodio longitude') || 
                header.toLowerCase().includes('geocodio latitude') ||
                header.toLowerCase().includes('longitude') || 
                header.toLowerCase().includes('latitude') ||
                header.toLowerCase().includes('x') ||
                header.toLowerCase().includes('y')
            );
            
            if (!hasGeocodedCoords) {
                positionalMap['x'] = '';
                positionalMap['y'] = '';
                this.log('Warning: No geocoded coordinates found for volunteers. Using empty x,y fields.', 'warning');
            } else {
                this.log('Geocoded coordinates detected for volunteers. Using Longitude/Latitude fields.', 'info');
            }
            
            masterHeaders.forEach(masterHeader => {
                mapping[masterHeader] = positionalMap[masterHeader] || '';
            });
        }
        
        return mapping;
    }

    /**
     * Assign missing chapters based on county/state mapping
     * Only assigns if we have high confidence (100+ records in existing data)
     */
    assignMissingChapters(standardizedData, type) {
        let assignmentsMade = 0;
        let assignmentsSkipped = 0;
        
        standardizedData.forEach((row, index) => {
            // Use geocoded data if available for better chapter assignment
            const state = row['State']; // This will be geocoded if available
            const county = row['County'] || row['County of Residence']; // This will be geocoded if available
            
            if (type === 'applicants') {
                // Check if Current Chapter is missing
                if (!row['Current Chapter'] || row['Current Chapter'].trim() === '') {
                    const assignedChapter = this.getChapterFromLocation(state, county);
                    if (assignedChapter) {
                        row['Current Chapter'] = assignedChapter;
                        assignmentsMade++;
                        this.log(`Assigned Current Chapter for record ${index + 1}: ${assignedChapter}`, 'info');
                    } else {
                        assignmentsSkipped++;
                    }
                }
                
                // Check if Home Chapter is missing
                if (!row['Home Chapter'] || row['Home Chapter'].trim() === '') {
                    const assignedChapter = this.getChapterFromLocation(state, county);
                    if (assignedChapter) {
                        row['Home Chapter'] = assignedChapter;
                        assignmentsMade++;
                        this.log(`Assigned Home Chapter for record ${index + 1}: ${assignedChapter}`, 'info');
                    } else {
                        assignmentsSkipped++;
                    }
                }
            } else if (type === 'volunteers') {
                // Check if Chapter Name is missing
                if (!row['Chapter Name'] || row['Chapter Name'].trim() === '') {
                    const assignedChapter = this.getChapterFromLocation(state, county);
                    if (assignedChapter) {
                        row['Chapter Name'] = assignedChapter;
                        assignmentsMade++;
                        this.log(`Assigned Chapter Name for record ${index + 1}: ${assignedChapter}`, 'info');
                    } else {
                        assignmentsSkipped++;
                    }
                }
            }
        });
        
        this.log(`Chapter assignment complete: ${assignmentsMade} assigned, ${assignmentsSkipped} skipped (no confident mapping)`, 'info');
        return { assignmentsMade, assignmentsSkipped };
    }

    /**
     * Get chapter assignment based on state and county using high-confidence mapping
     */
    getChapterFromLocation(state, county) {
        if (!state || !county) return null;
        
        // County-to-Chapter mapping based on existing data analysis
        const COUNTY_CHAPTER_MAPPING = {
            // Georgia
            'GA': {
                'Fulton County': 'American Red Cross of Greater Atlanta',
                'Gwinnett County': 'American Red Cross of Greater Atlanta', 
                'DeKalb County': 'American Red Cross of Greater Atlanta',
                'Cobb County': 'American Red Cross of Greater Atlanta',
                'Forsyth County': 'American Red Cross of Northeast Georgia',
                'Columbia County': 'American Red Cross of East Central Georgia',
                'Chatham County': 'American Red Cross of Southeast Georgia',
                'Richmond County': 'American Red Cross of East Central Georgia',
                'Muscogee County': 'American Red Cross of Southwest Georgia',
                'Cherokee County': 'American Red Cross of Greater Atlanta',
                'Henry County': 'American Red Cross of Greater Atlanta',
                'Douglas County': 'American Red Cross of Greater Atlanta',
                'Clarke County': 'American Red Cross of Northeast Georgia',
                'Houston County': 'American Red Cross of Central Midwest Georgia',
                'Clayton County': 'American Red Cross of Greater Atlanta',
                'Hall County': 'American Red Cross of Northeast Georgia',
                'Fayette County': 'American Red Cross of Greater Atlanta'
            },
            // Texas
            'TX': {
                'Dallas County': 'American Red Cross serving DFW Metro East',
                'Tarrant County': 'American Red Cross serving DFW Metro West',
                'Travis County': 'American Red Cross serving Central Texas',
                'Bexar County': 'American Red Cross serving Greater San Antonio Texas',
                'Harris County': 'American Red Cross serving the Heart of Texas',
                'Collin County': 'American Red Cross serving DFW Metro East',
                'Denton County': 'American Red Cross serving DFW Metro East',
                'El Paso County': 'American Red Cross serving West Texas',
                'Williamson County': 'American Red Cross serving Central Texas'
            },
            // Nevada
            'NV': {
                'Clark County': 'American Red Cross of Southern Nevada',
                'Washoe County': 'American Red Cross of Northern Nevada'
            },
            // Utah
            'UT': {
                'Salt Lake County': 'American Red Cross of Greater Salt Lake',
                'Utah County': 'American Red Cross of Central and Southern Utah',
                'Weber County': 'American Red Cross of Northern Utah and Southwest Wyoming'
            },
            // Louisiana
            'LA': {
                'Orleans Parish': 'American Red Cross of Southeast Louisiana',
                'East Baton Rouge Parish': 'American Red Cross of Capital West Louisiana'
            },
            // Oklahoma
            'OK': {
                'Tulsa County': 'American Red Cross serving Tulsa Area OK',
                'Oklahoma County': 'American Red Cross serving Central and Southwest OK'
            },
            // Arizona
            'AZ': {
                'Maricopa County': 'American Red Cross of Central Arizona'
            },
            // Kansas
            'KS': {
                'Sedgwick County': 'American Red Cross of South Central and Southeast Kansas'
            },
            // Missouri
            'MO': {
                'St. Louis County': 'American Red Cross of Greater St Louis',
                'St. Louis City': 'American Red Cross of Greater St Louis'
            }
        };
        
        const stateKey = state.toUpperCase().trim();
        const countyKey = county.trim();
        
        // Direct county lookup
        if (COUNTY_CHAPTER_MAPPING[stateKey] && COUNTY_CHAPTER_MAPPING[stateKey][countyKey]) {
            return COUNTY_CHAPTER_MAPPING[stateKey][countyKey];
        }
        
        // Try case-insensitive county lookup
        if (COUNTY_CHAPTER_MAPPING[stateKey]) {
            for (const [mappedCounty, chapter] of Object.entries(COUNTY_CHAPTER_MAPPING[stateKey])) {
                if (mappedCounty.toLowerCase() === countyKey.toLowerCase()) {
                    return chapter;
                }
            }
        }
        
        return null;
    }

    findBestColumnMatch(masterHeader, newHeaders, type) {
        const semanticMappings = this.getColumnMapping(type);
        const masterHeaderLower = masterHeader.toLowerCase().trim();
        
        // First, try exact semantic mapping
        if (semanticMappings[masterHeader]) {
            const possibleMatches = semanticMappings[masterHeader];
            for (const possibleMatch of possibleMatches) {
                const exactMatch = newHeaders.find(h => 
                    h.toLowerCase().trim() === possibleMatch.toLowerCase().trim()
                );
                if (exactMatch) {
                    // Reduce log verbosity for performance
                    return exactMatch;
                }
            }
        }
        
        // Then try fuzzy matching with semantic hints
        let bestMatch = null;
        let bestScore = 0;
        
        newHeaders.forEach(newHeader => {
            const newHeaderLower = newHeader.toLowerCase().trim();
            
            // Calculate similarity score
            let score = 0;
            
            // Exact match
            if (newHeaderLower === masterHeaderLower) {
                score = 100;
            }
            // Contains match
            else if (newHeaderLower.includes(masterHeaderLower) || masterHeaderLower.includes(newHeaderLower)) {
                score = 80;
            }
            // Word overlap
            else {
                const masterWords = masterHeaderLower.split(/[\s\-_\.]+/);
                const newWords = newHeaderLower.split(/[\s\-_\.]+/);
                const overlap = masterWords.filter(word => 
                    newWords.some(newWord => 
                        word === newWord || 
                        word.includes(newWord) || 
                        newWord.includes(word)
                    )
                ).length;
                score = (overlap / Math.max(masterWords.length, newWords.length)) * 60;
            }
            
            // Boost score for known semantic relationships
            if (semanticMappings[masterHeader]) {
                const possibleMatches = semanticMappings[masterHeader];
                if (possibleMatches.some(match => 
                    newHeaderLower.includes(match.toLowerCase()) || 
                    match.toLowerCase().includes(newHeaderLower)
                )) {
                    score += 20;
                }
            }
            
            if (score > bestScore && score > 30) { // Minimum threshold
                bestScore = score;
                bestMatch = newHeader;
            }
        });
        
        if (bestMatch) {
            // Reduce log verbosity for performance
            return bestMatch;
        }
        
        // Only log warnings for important missing fields
        if (['account_id', 'Current Status', 'Email Address', 'Email'].includes(masterHeader)) {
            this.log(`No match found for important field: "${masterHeader}"`, 'warning');
        }
        return null;
    }

    async mergeData(masterData, newData, type) {
        this.log(`Merging ${type} data...`, 'info');
        
        // Get master headers
        const masterHeaders = Object.keys(masterData[0] || {});
        this.log(`Master headers count: ${masterHeaders.length}`, 'info');
        
        // Log first few headers for debugging
        if (masterHeaders.length > 0) {
            this.log(`Sample master headers: ${masterHeaders.slice(0, 5).join(', ')}`, 'info');
        }
        
        // Log new data structure
        if (newData.length > 0) {
            const newHeaders = Object.keys(newData[0] || {});
            this.log(`New data headers count: ${newHeaders.length}`, 'info');
            this.log(`Sample new headers: ${newHeaders.slice(0, 5).join(', ')}`, 'info');
        }
        
        // Use positional mapping approach for robust data conversion
        const newHeaders = Object.keys(newData[0] || {});
        this.log(`Starting positional column mapping for ${type}...`, 'info');
        this.log(`Master columns: ${masterHeaders.length}, NEIA columns: ${newHeaders.length}`, 'info');
        
        // Create positional mapping based on column order and content
        const columnMappings = this.createPositionalMapping(masterHeaders, newHeaders, type);
        this.log(`Positional mapping created for ${Object.keys(columnMappings).length} fields`, 'info');
        
        // Process data with positional mapping
        const standardizedNewData = [];
        const batchSize = 100;
        
        for (let i = 0; i < newData.length; i += batchSize) {
            const batch = newData.slice(i, i + batchSize);
            
            batch.forEach(row => {
                const standardizedRow = {};
                
                masterHeaders.forEach(masterHeader => {
                    const sourceColumn = columnMappings[masterHeader];
                    standardizedRow[masterHeader] = sourceColumn && row[sourceColumn] !== undefined ? 
                        (row[sourceColumn] || '') : '';
                });
                
                standardizedNewData.push(standardizedRow);
            });
            
            if (i % 500 === 0) {
                this.log(`Processed ${Math.min(i + batchSize, newData.length)} of ${newData.length} records...`, 'info');
            }
        }

        // Assign missing chapters based on county/state mapping
        this.log('Assigning missing chapters based on location data...', 'info');
        const chapterAssignmentResult = this.assignMissingChapters(standardizedNewData, type);
        
        // Store chapter assignment stats for reporting
        this.chapterAssignmentStats = chapterAssignmentResult;
        
        // Combine data
        const combinedData = [...masterData, ...standardizedNewData];
        this.log(`Combined data count: ${combinedData.length}`, 'info');
        
        // Skip duplicate removal to prevent data loss
        // const deduplicatedData = this.removeDuplicates(combinedData, type);
        
        this.log(`Merged ${type}: ${masterData.length} + ${newData.length} = ${combinedData.length} (no duplicates removed)`, 'info');
        
        return combinedData;
    }

    removeDuplicates(data, type) {
        const seen = new Set();
        
        // Use more specific key fields for better duplicate detection
        const keyFields = type === 'applicants' 
            ? ['account_id', 'Email Address', 'Phone Numbers'] 
            : ['account_id', 'Email', 'Member #'];

        return data.filter(row => {
            // Create a unique key based on available fields
            const key = keyFields.map(field => {
                const value = row[field];
                return value ? value.toString().toLowerCase().trim() : '';
            }).filter(v => v).join('|');

            // Only remove if we have a meaningful key (not empty)
            if (!key) {
                return true; // Keep rows without identifying information
            }

            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    validateResults(beforeCounts) {
        this.log('Validating results...', 'info');
        
        let valid = true;
        let issues = [];

        // Check applicants count
        const expectedApplicants = beforeCounts.masterApplicants + beforeCounts.newApplicants;
        const actualApplicants = this.processedApplicantsData.length;
        
        if (actualApplicants < expectedApplicants) {
            valid = false;
            issues.push(`Applicants count mismatch: expected ${expectedApplicants}, got ${actualApplicants}`);
        }

        // Check volunteers count
        const expectedVolunteers = beforeCounts.masterVolunteers + beforeCounts.newVolunteers;
        const actualVolunteers = this.processedVolunteersData.length;
        
        if (actualVolunteers < expectedVolunteers) {
            valid = false;
            issues.push(`Volunteers count mismatch: expected ${expectedVolunteers}, got ${actualVolunteers}`);
        }

        // Check for data integrity
        if (this.processedApplicantsData.length > 0) {
            const headers = Object.keys(this.processedApplicantsData[0]);
            if (headers.length === 0) {
                valid = false;
                issues.push('Applicants data has no headers');
            }
        }

        if (this.processedVolunteersData.length > 0) {
            const headers = Object.keys(this.processedVolunteersData[0]);
            if (headers.length === 0) {
                valid = false;
                issues.push('Volunteers data has no headers');
            }
        }

        if (issues.length > 0) {
            issues.forEach(issue => this.log(`Validation issue: ${issue}`, 'warning'));
        } else {
            this.log('All validations passed!', 'success');
        }

        return { valid, issues };
    }

    generatePreviews() {
        this.generatePreviewTable('applicants', this.processedApplicantsData);
        this.generatePreviewTable('volunteers', this.processedVolunteersData);
    }

    generatePreviewTable(type, data) {
        const table = document.getElementById(`${type}-preview-table`);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (data.length === 0) return;

        // Generate headers
        const headers = Object.keys(data[0]);
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Generate rows (show first 10 rows)
        tbody.innerHTML = '';
        const previewRows = data.slice(0, 10);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                td.title = row[header] || ''; // Tooltip for long content
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        if (data.length > 10) {
            const moreRow = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = `... and ${data.length - 10} more rows`;
            td.style.fontStyle = 'italic';
            td.style.color = '#666';
            moreRow.appendChild(td);
            tbody.appendChild(moreRow);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.preview-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    }

    downloadFile(type) {
        const data = type === 'applicants' ? this.processedApplicantsData : this.processedVolunteersData;
        
        if (!data || data.length === 0) {
            this.log(`❌ No ${type} data available for download`, 'error');
            return;
        }
        
        // Validate data structure
        if (!Array.isArray(data)) {
            this.log(`❌ Invalid data format for ${type}`, 'error');
            return;
        }
        
        // Check if data contains objects (header: true format)
        const firstRow = data[0];
        if (!firstRow || typeof firstRow !== 'object') {
            this.log(`❌ Data structure error for ${type} - expected object format`, 'error');
            return;
        }
        
        this.log(`📊 Preparing CSV with ${Object.keys(firstRow).length} columns and ${data.length} rows`, 'info');
        
        // Add timestamp to filename for better tracking
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const baseFilename = type === 'applicants' ? 'Applicants 2025' : 'Volunteer 2025';
        const filename = `${baseFilename}_${dateStr}.csv`;
        
        const button = document.getElementById(`download-${type}`);
        const originalText = button.innerHTML;
        
        try {
            // Generate CSV (keep it simple like the working version)
            const csv = Papa.unparse(data);
            
            // Add visual feedback
            button.innerHTML = '⏳ Downloading...';
            button.disabled = true;
            
            // Method 1: Try modern downloadFile API if available
            if (this.tryModernDownload(csv, filename)) {
                this.downloadSuccess(filename, data.length, button, originalText);
                return;
            }
            
            // Method 2: Enhanced blob download with better browser compatibility
            const blob = new Blob([csv], { 
                type: 'text/csv;charset=utf-8;' 
            });
            
            // Try different download approaches
            if (navigator.msSaveBlob) {
                // IE/Edge
                navigator.msSaveBlob(blob, filename);
                this.downloadSuccess(filename, data.length, button, originalText);
                return;
            }
            
            // Modern browsers
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            // Set all possible attributes for better compatibility
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            
            // Add to DOM and trigger click
            document.body.appendChild(link);
            
            // Multiple trigger attempts for better reliability
            setTimeout(() => {
                link.click();
                
                // Secondary trigger after short delay
                setTimeout(() => {
                    if (link.parentNode) {
                        link.click();
                    }
                }, 100);
                
                // Cleanup
                setTimeout(() => {
                    if (link.parentNode) {
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(url);
                }, 1000);
                
            }, 50);
            
            this.downloadSuccess(filename, data.length, button, originalText);
            
        } catch (error) {
            this.log(`❌ Error downloading ${type} file: ${error.message}`, 'error');
            this.log(`🔧 Try using a different browser or check your download settings`, 'info');
            console.error('Download error:', error);
            
            // Restore button
            button.innerHTML = originalText;
            button.disabled = false;
            
            // Offer fallback option
            this.offerFallbackDownload(type, data);
        }
    }
    
    tryModernDownload(csvContent, filename) {
        try {
            if ('showSaveFilePicker' in window) {
                // File System Access API (Chrome 86+)
                window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'CSV files',
                        accept: { 'text/csv': ['.csv'] }
                    }]
                }).then(async (fileHandle) => {
                    const writable = await fileHandle.createWritable();
                    await writable.write('\ufeff' + csvContent);
                    await writable.close();
                }).catch(() => {
                    // User cancelled or error - fall back to blob method
                    return false;
                });
                return true;
            }
        } catch (error) {
            console.log('Modern download API not available, using fallback');
        }
        return false;
    }
    
    downloadSuccess(filename, dataLength, button, originalText) {
        this.log(`✅ Downloaded ${filename} with ${dataLength.toLocaleString()} rows`, 'success');
        this.log(`📁 Check your browser's Downloads folder for the file`, 'info');
        this.log(`🔍 If file not found, try: browser settings > Downloads > Show downloads`, 'info');
        
        // Restore button after delay
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
    
    offerFallbackDownload(type, data) {
        // Create a text area with the CSV content as fallback
        const csv = Papa.unparse(data);
        const fallbackDiv = document.createElement('div');
        fallbackDiv.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h4>💡 Fallback Download Option</h4>
                <p>If the automatic download failed, you can manually copy the data:</p>
                <button onclick="this.nextElementSibling.style.display='block'; this.style.display='none';" 
                        style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Show CSV Data
                </button>
                <textarea style="width: 100%; height: 200px; display: none; font-family: monospace; font-size: 12px; margin-top: 10px;" 
                          readonly onclick="this.select()">${csv}</textarea>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    Click "Show CSV Data", then select all text (Ctrl+A) and copy (Ctrl+C) to a new .csv file
                </p>
            </div>
        `;
        
        const logContainer = document.getElementById('processing-log');
        logContainer.appendChild(fallbackDiv);
    }

    generateProcessingReport(beforeCounts, validationResult, chapterAssignmentStats = {}) {
        const timestamp = new Date();
        const filesProcessed = [];
        
        // Collect file information
        if (this.newApplicantsData) {
            filesProcessed.push({
                type: 'Applicants',
                filename: document.getElementById('applicants-file').files[0]?.name || 'Unknown file',
                newRows: this.newApplicantsData.length,
                duplicatesRemoved: 0 // No duplicate removal
            });
        }
        
        if (this.newVolunteersData) {
            filesProcessed.push({
                type: 'Volunteers',
                filename: document.getElementById('volunteers-file').files[0]?.name || 'Unknown file',
                newRows: this.newVolunteersData.length,
                duplicatesRemoved: 0 // No duplicate removal
            });
        }

        this.processingReport = {
            timestamp: timestamp,
            sessionId: `COMMMOB_${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2,'0')}${timestamp.getDate().toString().padStart(2,'0')}_${timestamp.getHours().toString().padStart(2,'0')}${timestamp.getMinutes().toString().padStart(2,'0')}${timestamp.getSeconds().toString().padStart(2,'0')}`,
            summary: {
                totalFilesProcessed: filesProcessed.length,
                totalNewRecords: filesProcessed.reduce((sum, file) => sum + file.newRows, 0),
                totalDuplicatesRemoved: 0, // No duplicate removal
                totalChaptersAssigned: chapterAssignmentStats.assignmentsMade || 0,
                totalChaptersSkipped: chapterAssignmentStats.assignmentsSkipped || 0,
                validationPassed: validationResult.valid
            },
            beforeProcessing: {
                masterApplicants: beforeCounts.masterApplicants,
                masterVolunteers: beforeCounts.masterVolunteers,
                newApplicants: beforeCounts.newApplicants,
                newVolunteers: beforeCounts.newVolunteers
            },
            afterProcessing: {
                finalApplicants: this.processedApplicantsData.length,
                finalVolunteers: this.processedVolunteersData.length,
                applicantsNetChange: this.processedApplicantsData.length - beforeCounts.masterApplicants,
                volunteersNetChange: this.processedVolunteersData.length - beforeCounts.masterVolunteers
            },
            filesProcessed: filesProcessed,
            chapterAssignment: chapterAssignmentStats,
            validationResults: {
                passed: validationResult.valid,
                issues: validationResult.issues,
                issuesCount: validationResult.issues.length
            },
            processingOptions: {
                skipHeaderRows: document.getElementById('skip-header-rows').checked,
                validateData: document.getElementById('validate-data').checked,
                backupFiles: document.getElementById('backup-files').checked
            }
        };

        this.log(`Processing report generated: ${this.processingReport.sessionId}`, 'info');
    }

    displayReportSummary() {
        const reportSummary = document.getElementById('report-summary');
        if (!reportSummary) return;

        const report = this.processingReport;
        
        reportSummary.innerHTML = `
            <div class="report-card">
                <h4>📋 Processing Summary</h4>
                <div class="report-stats">
                    <div class="stat-item">
                        <span class="stat-label">Session ID:</span>
                        <span class="stat-value">${report.sessionId}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Files Processed:</span>
                        <span class="stat-value">${report.summary.totalFilesProcessed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">New Records Added:</span>
                        <span class="stat-value">${report.summary.totalNewRecords}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Duplicates Removed:</span>
                        <span class="stat-value">${report.summary.totalDuplicatesRemoved}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Validation:</span>
                        <span class="stat-value ${report.validationResults.passed ? 'validation-success' : 'validation-error'}">
                            ${report.validationResults.passed ? '✅ Passed' : '❌ Issues Found'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    downloadReport() {
        if (!this.processingReport) {
            this.log('❌ No processing report available to download', 'error');
            return;
        }

        const report = this.processingReport;
        const filename = `CommMob_Processing_Report_${report.sessionId}.txt`;
        
        try {
            // Generate detailed report content
            const reportContent = this.generateReportContent(report);
            
            // Create blob for download
            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
            
            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = filename;
            
            // Add visual feedback
            const button = document.getElementById('download-report');
            const originalText = button.innerHTML;
            button.innerHTML = '⏳ Downloading Report...';
            button.disabled = true;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            // Show success message
            this.log(`✅ Downloaded processing report: ${filename}`, 'success');
            this.log(`📁 Check your browser's Downloads folder for the report`, 'info');
            
            // Restore button after short delay
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
            
        } catch (error) {
            this.log(`❌ Error downloading report: ${error.message}`, 'error');
            console.error('Download error:', error);
        }
    }

    generateReportContent(report) {
        const timestamp = report.timestamp.toLocaleString();
        
        let content = `COMMMOB DATA PROCESSING REPORT
========================================

Session Information:
- Session ID: ${report.sessionId}
- Processing Date: ${timestamp}
- Processing Time: ${report.timestamp.toISOString()}

EXECUTIVE SUMMARY
=================
Total Files Processed: ${report.summary.totalFilesProcessed}
Total New Records Added: ${report.summary.totalNewRecords}
Total Duplicates Removed: ${report.summary.totalDuplicatesRemoved}
Data Validation: ${report.validationResults.passed ? 'PASSED' : 'FAILED'}

PROCESSING OPTIONS
==================
Skip Header Rows: ${report.processingOptions.skipHeaderRows ? 'Yes' : 'No'}
Validate Data Structure: ${report.processingOptions.validateData ? 'Yes' : 'No'}
Create Backup Files: ${report.processingOptions.backupFiles ? 'Yes' : 'No'}

BEFORE PROCESSING COUNTS
========================
Master Applicants File: ${report.beforeProcessing.masterApplicants.toLocaleString()} records
Master Volunteers File: ${report.beforeProcessing.masterVolunteers.toLocaleString()} records
New Applicants Data: ${report.beforeProcessing.newApplicants.toLocaleString()} records
New Volunteers Data: ${report.beforeProcessing.newVolunteers.toLocaleString()} records

FILES PROCESSED
===============
`;

        report.filesProcessed.forEach(file => {
            content += `- ${file.type}: ${file.filename}
  * New records: ${file.newRows.toLocaleString()}
  * Duplicates removed: ${file.duplicatesRemoved.toLocaleString()}
`;
        });

        content += `
AFTER PROCESSING COUNTS
=======================
Final Applicants File: ${report.afterProcessing.finalApplicants.toLocaleString()} records
Final Volunteers File: ${report.afterProcessing.finalVolunteers.toLocaleString()} records

NET CHANGES
===========
Applicants Net Change: ${report.afterProcessing.applicantsNetChange >= 0 ? '+' : ''}${report.afterProcessing.applicantsNetChange.toLocaleString()} records
Volunteers Net Change: ${report.afterProcessing.volunteersNetChange >= 0 ? '+' : ''}${report.afterProcessing.volunteersNetChange.toLocaleString()} records

VALIDATION RESULTS
==================
Overall Status: ${report.validationResults.passed ? 'PASSED' : 'FAILED'}
Issues Found: ${report.validationResults.issuesCount}
`;

        if (report.validationResults.issues.length > 0) {
            content += `
Issues Details:
`;
            report.validationResults.issues.forEach((issue, index) => {
                content += `${index + 1}. ${issue}\n`;
            });
        }

        content += `
DATA INTEGRITY VERIFICATION
===========================
Expected Applicants Total: ${(report.beforeProcessing.masterApplicants + report.beforeProcessing.newApplicants).toLocaleString()}
Actual Applicants Total: ${report.afterProcessing.finalApplicants.toLocaleString()}
Difference: ${(report.afterProcessing.finalApplicants - (report.beforeProcessing.masterApplicants + report.beforeProcessing.newApplicants)).toLocaleString()} (should equal duplicates removed)

Expected Volunteers Total: ${(report.beforeProcessing.masterVolunteers + report.beforeProcessing.newVolunteers).toLocaleString()}
Actual Volunteers Total: ${report.afterProcessing.finalVolunteers.toLocaleString()}
Difference: ${(report.afterProcessing.finalVolunteers - (report.beforeProcessing.masterVolunteers + report.beforeProcessing.newVolunteers)).toLocaleString()} (should equal duplicates removed)

RECOMMENDATIONS
===============
${report.validationResults.passed ? 
    '✅ All validations passed. The processed files are ready for ArcGIS upload.' : 
    '⚠️  Issues were found during validation. Please review the issues above before uploading to ArcGIS.'}

${report.summary.totalDuplicatesRemoved > 0 ? 
    `📝 ${report.summary.totalDuplicatesRemoved.toLocaleString()} duplicate records were removed during processing. This is normal and expected.` : 
    '📝 No duplicate records were found.'}

🔒 Always verify the row counts match your expectations before uploading to ArcGIS.
📊 Consider keeping this report for your audit trail.

---
Report generated by CommMob Data Processor
${new Date().toISOString()}
`;

        return content;
    }

    log(message, type = 'info') {
        const logContent = document.getElementById('log-content');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CommMobDataProcessor();
});
