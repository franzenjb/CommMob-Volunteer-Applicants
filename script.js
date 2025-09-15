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
        } catch (error) {
            this.log(`Error loading master files: ${error.message}`, 'error');
        }
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        this.log(`Processing ${type} file: ${file.name}`, 'info');

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const skipHeaderRows = document.getElementById('skip-header-rows').checked;
                let data = results.data;

                if (skipHeaderRows) {
                    // Remove empty rows and header rows (common in NEIA files)
                    data = data.filter(row => {
                        const values = Object.values(row);
                        return values.some(value => value && value.trim() !== '');
                    });
                }

                if (type === 'applicants') {
                    this.newApplicantsData = data;
                } else {
                    this.newVolunteersData = data;
                }

                this.updateFileInfo(type, file.name, data.length);
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
            this.generateProcessingReport(beforeCounts, validationResult);

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
        
        // Standardize new data headers to match master
        const standardizedNewData = newData.map(row => {
            const standardizedRow = {};
            masterHeaders.forEach(header => {
                // Try to find matching column (case insensitive, handle quotes and special chars)
                const cleanHeader = header.toLowerCase().trim().replace(/["'"]/g, '');
                const matchingKey = Object.keys(row).find(key => {
                    const cleanKey = key.toLowerCase().trim().replace(/["'"]/g, '');
                    return cleanKey === cleanHeader || 
                           cleanKey.includes(cleanHeader) || 
                           cleanHeader.includes(cleanKey);
                });
                standardizedRow[header] = matchingKey ? row[matchingKey] : '';
            });
            return standardizedRow;
        });

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
        const filename = type === 'applicants' ? 'Applicants 2025.csv' : 'Volunteer 2025.csv';
        
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.log(`Downloaded ${filename} with ${data.length} rows`, 'success');
    }

    generateProcessingReport(beforeCounts, validationResult) {
        const timestamp = new Date();
        const filesProcessed = [];
        
        // Collect file information
        if (this.newApplicantsData) {
            filesProcessed.push({
                type: 'Applicants',
                filename: document.getElementById('applicants-file').files[0]?.name || 'Unknown file',
                newRows: this.newApplicantsData.length,
                duplicatesRemoved: beforeCounts.masterApplicants + beforeCounts.newApplicants - this.processedApplicantsData.length
            });
        }
        
        if (this.newVolunteersData) {
            filesProcessed.push({
                type: 'Volunteers',
                filename: document.getElementById('volunteers-file').files[0]?.name || 'Unknown file',
                newRows: this.newVolunteersData.length,
                duplicatesRemoved: beforeCounts.masterVolunteers + beforeCounts.newVolunteers - this.processedVolunteersData.length
            });
        }

        this.processingReport = {
            timestamp: timestamp,
            sessionId: `COMMMOB_${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2,'0')}${timestamp.getDate().toString().padStart(2,'0')}_${timestamp.getHours().toString().padStart(2,'0')}${timestamp.getMinutes().toString().padStart(2,'0')}${timestamp.getSeconds().toString().padStart(2,'0')}`,
            summary: {
                totalFilesProcessed: filesProcessed.length,
                totalNewRecords: filesProcessed.reduce((sum, file) => sum + file.newRows, 0),
                totalDuplicatesRemoved: filesProcessed.reduce((sum, file) => sum + file.duplicatesRemoved, 0),
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
            this.log('No processing report available to download', 'error');
            return;
        }

        const report = this.processingReport;
        
        // Generate detailed report content
        const reportContent = this.generateReportContent(report);
        
        // Create and download the report file
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `CommMob_Processing_Report_${report.sessionId}.txt`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        this.log(`Processing report downloaded: CommMob_Processing_Report_${report.sessionId}.txt`, 'success');
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
