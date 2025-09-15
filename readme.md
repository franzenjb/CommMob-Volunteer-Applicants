# CommMob Volunteer Applicants

## 🚨 **CRITICAL: READ THIS FIRST BEFORE USING THE APPLICATION**

### **⚠️ MANDATORY PREPROCESSING STEPS - APPLICATION WILL FAIL WITHOUT THESE:**

#### **STEP 1: DELETE EXCESS HEADER ROWS** 
**⚠️ MANDATORY - The application will FAIL without this step**

1. **Open your NEIA files** (e.g., `NEIA Applicants 9 25.csv`)
2. **Delete rows 1-8** that contain:
   - "American Red Cross - Created by Volunteer Connection"
   - "Data from last night: [date]"
   - "Applicant Listing - Applications between [dates]"
   - "Region: [Region Name]"
   - Various description rows
3. **Keep ONLY row 9** (actual headers) and rows 10+ (data)
4. **Move row 9 to row 1** (headers must be in first row)
5. **Save the cleaned file**

#### **STEP 2: GEOCODE WITH GEOCODIO**
**⚠️ MANDATORY - Required for ArcGIS integration**

1. **Go to [Geocodio.com](https://www.geocod.io/)**
2. **Upload your cleaned CSV file**
3. **Select appropriate address columns** (Address, City, State, Zip)
4. **Run the geocoding process**
5. **Download the results** - this will have `_geocodio` suffix
6. **Verify coordinates were added** (Longitude, Latitude columns)

#### **STEP 3: UPLOAD _GEOCODIO FILES TO APPLICATION**
**⚠️ MANDATORY - Only _geocodio files work properly**

1. **Use the files with `_geocodio` suffix** (e.g., `NEIA Applicants 9 25_geocodio.csv`)
2. **Do NOT upload raw NEIA files** - they will cause processing errors
3. **The application expects geocoded files** with coordinates

### **❌ COMMON MISTAKES TO AVOID:**
- ❌ Uploading raw NEIA files without header cleanup
- ❌ Uploading files without geocoding
- ❌ Uploading files without `_geocodio` suffix
- ❌ Leaving multiple header rows in the file

---

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
New data comes in these formats:
- **Raw NEIA files** (examples in repository):
  - `NEIA Applicants 9 25.csv`
  - `NEIA Volunteers 9 25.csv`
- **Post-geocode files** (processed with geocoding service):
  - `NEIA Applicants 9 25_geocodio.csv`
  - `NEIA Volunteers 9 25_geocodio.csv`

### Preprocessing Summary
**See the critical preprocessing steps at the top of this README before using the application.**

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
1. Upload preprocessed (cleaned + geocoded) data files with `_geocodio` suffix
2. Application performs intelligent column mapping to match master file structure
3. Eliminates excess columns introduced by geocoding process
4. Preserves improved address data from geocoding (more accurate addresses, zip codes, county names)
5. Maintains exact column structure required for ArcGIS feature layer overwrite
6. Generates updated master files (`Applicants 2025.csv` and `Volunteers 2025.csv`)

### ⚠️ CRITICAL: ArcGIS Integration Requirements
- **Files MUST match exactly** - `Applicants 2025.csv` and `Volunteers 2025.csv` structure
- **Column order and names must be identical** to existing hosted feature layers
- **Any deviation will cause ArcGIS upload failures**
- Application handles column mapping and structure standardization automatically

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
**https://franzenjb.github.io/CommMob-Volunteer-Applicants/**

### Features
- **Drag & Drop Interface**: Easy file upload for new data
- **Data Validation**: Automatic row counting and validation
- **Before/After Preview**: See exactly what will change
- **Safety Checks**: Prevents data loss with validation
- **Download Ready Files**: Generates ArcGIS-ready CSV files
- **Processing Log**: Detailed log of all operations

### How to Use

#### **PREPROCESSING (REQUIRED BEFORE USING APPLICATION):**
1. **Delete excess header rows** from NEIA files (rows 1-8)
2. **Geocode addresses** using [Geocodio.com](https://www.geocod.io/)
3. **Download _geocodio files** with coordinates
4. **Verify file structure** (headers in row 1, coordinates present)

#### **APPLICATION WORKFLOW:**
1. **Open the web application** in your browser
2. **Drag and drop your _geocodio files** (NOT raw NEIA files)
3. **Review the processing options** (skip header rows should be checked)
4. **Click "Process Data"** to merge and standardize the files
5. **Review the before/after counts** and validation results
6. **Check chapter assignment statistics** in the processing report
7. **Download the updated master files** (`Applicants 2025.csv` and `Volunteers 2025.csv`)
8. **Upload to ArcGIS** to overwrite your hosted feature layers

### Safety Features
- **Row Count Validation**: Ensures no data is lost during processing
- **Data Structure Validation**: Maintains consistent column structure
- **Preview Before Download**: See exactly what the final files contain
- **Processing Log**: Complete audit trail of all operations
- **Preprocessing Validation**: Expects clean, geocoded input files
- **Chapter Assignment**: Automatic assignment of missing chapters based on location

### ⚠️ Important Notes
- **No Duplicate Removal**: Application preserves all data (no deduplication)
- **Requires Preprocessing**: Users must clean and geocode files before upload
- **Coordinate Requirements**: All records must have x,y coordinates for ArcGIS compatibility
- **Post-Geocode Files**: Use files with `_geocodio` suffix after geocoding
- **Exact Structure Match**: Output files must match master file structure exactly for ArcGIS
- **Improved Data**: Geocoding often provides more accurate addresses, zip codes, and county names
- **Chapter Assignment**: Missing chapters automatically assigned based on county/state (high confidence only)

### 🎯 Current System Capabilities
- **Handles 117K+ records** with high performance
- **50+ county mappings** across 9 states for chapter assignment
- **Robust column mapping** for 53+ column structures
- **Batch processing** prevents UI freezing on large datasets
- **Comprehensive reporting** with chapter assignment statistics
- **ArcGIS-ready output** with exact structure matching

`

