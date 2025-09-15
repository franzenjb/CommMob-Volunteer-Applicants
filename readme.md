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

### ⚠️ CRITICAL PREPROCESSING REQUIREMENTS

**BEFORE uploading files to the web application, users MUST:**

1. **Delete All Unnecessary Header Rows** 
   - Remove rows 1-8 that contain metadata and descriptions
   - Keep ONLY the actual data headers (row 9) and data rows (row 10+)
   - The application expects clean CSV files with headers in row 1

2. **Geocode All Addresses**
   - Add `x` and `y` coordinate columns to your data
   - Use your preferred geocoding service (Google Maps, ArcGIS, etc.)
   - Master files require latitude/longitude coordinates for ArcGIS integration

### Common Data Issues with NEIA Files
- **Multiple header rows** (8-9 rows before actual data) - **MUST BE REMOVED FIRST**
- **Inconsistent column names/order** compared to master files
- **Missing coordinates** - **MUST BE GEOCODED FIRST**
- **Data formatting problems** (quotes, special characters)
- **Missing or malformed fields**
- **Red Cross software export format** - this is standard across regions

### NEIA File Structure (BEFORE preprocessing)
NEIA files typically have this structure:
```
Row 1: "American Red Cross - Created by Volunteer Connection - Report Run: [date]"
Row 2: "[Data from last night: [date]]"
Row 3: "Applicant Listing - Applications between [dates] ([count] people)"
Row 4: "Region: [Region Name]"
Row 5-8: Various description rows
Row 9: **ACTUAL HEADERS** - "Account Name (hyperlink),Entry Point,Entry Point Final Status..."
Row 10+: **ACTUAL DATA**
```

### Preprocessing Steps (REQUIRED)
1. **Clean Headers**: Delete rows 1-8, move actual headers to row 1
2. **Geocode Addresses**: Add x,y coordinates for all records
3. **Validate Data**: Check for missing required fields
4. **Upload to Application**: Use the cleaned, geocoded files

### Processing Requirements
1. Upload preprocessed (cleaned + geocoded) data files
2. Application merges new data with existing master files
3. Maintains consistent column structure
4. Generates updated master files for ArcGIS upload

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
1. **Preprocess your data** (REQUIRED):
   - Delete unnecessary header rows from NEIA files
   - Geocode all addresses to add x,y coordinates
   - Ensure clean CSV format with headers in row 1
2. Open the web application in your browser
3. Drag and drop your **preprocessed** data files
4. Review the processing options
5. Click "Process Data" to merge the files
6. Review the before/after counts and validation results
7. Download the updated master files
8. Upload to ArcGIS to update your feature layers

### Safety Features
- **Row Count Validation**: Ensures no data is lost during processing
- **Data Structure Validation**: Maintains consistent column structure
- **Preview Before Download**: See exactly what the final files contain
- **Processing Log**: Complete audit trail of all operations
- **Preprocessing Validation**: Expects clean, geocoded input files

### ⚠️ Important Notes
- **No Duplicate Removal**: Application preserves all data (no deduplication)
- **Requires Preprocessing**: Users must clean and geocode files before upload
- **Coordinate Requirements**: All records must have x,y coordinates for ArcGIS compatibility

`

