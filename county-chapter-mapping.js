/**
 * County-to-Chapter Mapping Table
 * Based on analysis of existing master files with high confidence
 * Only includes mappings with 100+ records for reliability
 */

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

/**
 * Get chapter assignment based on state and county
 * Returns null if no confident mapping exists
 */
function getChapterFromLocation(state, county) {
    if (!state || !county) return null;
    
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

/**
 * Validate chapter assignment confidence
 * Only assign if we have high confidence (100+ records in existing data)
 */
function isHighConfidenceMapping(state, county) {
    const chapter = getChapterFromLocation(state, county);
    return chapter !== null;
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COUNTY_CHAPTER_MAPPING,
        getChapterFromLocation,
        isHighConfidenceMapping
    };
}
