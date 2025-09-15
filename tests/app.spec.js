const { test, expect } = require('@playwright/test');

test.describe('CommMob Data Processor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1')).toContainText('CommMob Data Processor');
    
    // Check if upload areas are present
    await expect(page.locator('#applicants-upload')).toBeVisible();
    await expect(page.locator('#volunteers-upload')).toBeVisible();
  });

  test('should display master file counts', async ({ page }) => {
    // Wait for master files to load
    await page.waitForTimeout(2000);
    
    // Check if status bar shows master file counts
    const masterApplicantsCount = page.locator('#master-applicants-count');
    const masterVolunteersCount = page.locator('#master-volunteers-count');
    
    await expect(masterApplicantsCount).not.toHaveText('-');
    await expect(masterVolunteersCount).not.toHaveText('-');
    
    // Verify counts are reasonable (should be large numbers)
    const applicantsText = await masterApplicantsCount.textContent();
    const volunteersText = await masterVolunteersCount.textContent();
    
    expect(parseInt(applicantsText)).toBeGreaterThan(70000);
    expect(parseInt(volunteersText)).toBeGreaterThan(40000);
  });

  test('should handle file upload via input', async ({ page }) => {
    // Test file upload via input element (more reliable than drag/drop simulation)
    const fileInput = page.locator('#applicants-file');
    
    // Create a test CSV file
    const testCsvContent = 'Name,Email,Phone\nJohn Doe,john@example.com,555-1234\nJane Smith,jane@example.com,555-5678';
    
    // Set the file input
    await fileInput.setInputFiles({
      name: 'test-applicants.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(testCsvContent)
    });

    // Wait for processing
    await page.waitForTimeout(1000);

    // Check if file info is displayed
    await expect(page.locator('#applicants-file-info')).toBeVisible();
    await expect(page.locator('#applicants-file-info')).toContainText('test-applicants.csv');
  });

  test('should enable process button when files are uploaded', async ({ page }) => {
    // Initially process button should be disabled
    await expect(page.locator('#process-btn')).toBeDisabled();

    // Create test file
    const testCsvContent = 'Name,Email,Phone\nJohn Doe,john@example.com,555-1234';
    
    // Upload a file via input
    await page.locator('#applicants-file').setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(testCsvContent)
    });

    // Wait for file processing
    await page.waitForTimeout(1000);

    // Process button should now be enabled
    await expect(page.locator('#process-btn')).toBeEnabled();
  });

  test('should show processing options', async ({ page }) => {
    // Check if processing options are visible
    await expect(page.locator('#skip-header-rows')).toBeVisible();
    await expect(page.locator('#validate-data')).toBeVisible();
    await expect(page.locator('#backup-files')).toBeVisible();
    
    // Check if options are checked by default
    await expect(page.locator('#skip-header-rows')).toBeChecked();
    await expect(page.locator('#validate-data')).toBeChecked();
    await expect(page.locator('#backup-files')).toBeChecked();
  });

  test('should display processing log', async ({ page }) => {
    // Check if log section is present
    await expect(page.locator('#log-content')).toBeVisible();
    
    // Wait for initial log entries
    await page.waitForTimeout(2000);
    
    // Check if log has content
    const logContent = await page.locator('#log-content').textContent();
    expect(logContent.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if main elements are still visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#applicants-upload')).toBeVisible();
    await expect(page.locator('#volunteers-upload')).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toHaveCount(1);
    
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
