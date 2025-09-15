# CommMob Volunteer Applicants

## Overview
This repository manages volunteer and applicant data for CommMob, with automated processing to maintain ArcGIS feature layers.

## Master Files
The core files that must maintain consistent structure for ArcGIS integration:

- **`Applicants 2025.csv`** - Master applicants file
- **`Volunteer 2025.csv`** - Master volunteers file

**Critical Requirements:**
- These files must always have the exact same names
- Column headers and structure must remain consistent
- Used to overwrite ArcGIS feature layers

## Data Processing Workflow

### Input Files
New data often comes in poorly formatted files (examples in repository):
- `NEIA Applicants 9 25.csv`
- `NEIA Volunteers 9 25.csv`

### Common Data Issues
- Extra header rows at the top
- Inconsistent column names/order
- Data formatting problems
- Missing or malformed fields

### Processing Requirements
1. Clean and standardize incoming data
2. Append new data to existing master files
3. Maintain consistent column structure
4. Generate updated master files for ArcGIS upload

## Future Development Goal
Build an application that allows users to:
- Drag and drop new data files
- Automatically clean and process the data
- Update the master files (`Applicants 2025.csv` and `Volunteer 2025.csv`)
- Generate ArcGIS-ready output files

## Repository Contents
- `Applicants 2025.csv` - Master applicants data (71,761 rows)
- `Volunteer 2025.csv` - Master volunteers data (45,580 rows)
- `NEIA Applicants 9 25.csv` - Example new applicant data (4,570 rows)
- `NEIA Volunteers 9 25.csv` - Example new volunteer data (3,402 rows)
- `index.html` - Web application interface
- `styles.css` - Application styling
- `script.js` - Data processing logic

## Web Application

### 🚀 Live Application
The application is deployed on GitHub Pages and available at:
**https://[your-username].github.io/CommMob-Volunteer-Applicants/**

### Features
- **Drag & Drop Interface**: Easy file upload for new data
- **Data Validation**: Automatic row counting and validation
- **Before/After Preview**: See exactly what will change
- **Safety Checks**: Prevents data loss with validation
- **Download Ready Files**: Generates ArcGIS-ready CSV files
- **Processing Log**: Detailed log of all operations

### How to Use
1. Open the web application in your browser
2. Drag and drop your new data files (NEIA files)
3. Review the processing options
4. Click "Process Data" to merge the files
5. Review the before/after counts and validation results
6. Download the updated master files
7. Upload to ArcGIS to update your feature layers

### Safety Features
- **Row Count Validation**: Ensures no data is lost during processing
- **Duplicate Detection**: Automatically removes duplicate records
- **Data Structure Validation**: Maintains consistent column structure
- **Preview Before Download**: See exactly what the final files contain
- **Processing Log**: Complete audit trail of all operations

