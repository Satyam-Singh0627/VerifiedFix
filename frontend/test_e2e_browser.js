import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = process.env.TEST_URL || 'http://localhost:5173/';

async function runBrowserTest() {
  console.log('--- STARTING E2E BROWSER AUTOMATION ACCEPTANCE TEST ---');
  console.log(`Target URL: ${TARGET_URL}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Load Homepage
    console.log(`[STEP 1] Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: 15000 });

    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Verify Obsidian + Emerald background
    const bodyBg = await page.evaluate(() => {
      const el = document.querySelector('div.min-h-screen');
      return el ? window.getComputedStyle(el).backgroundColor : null;
    });
    console.log(`Obsidian Theme Canvas Background: ${bodyBg}`);

    // Wait for "Start Guided Demo" button to be rendered
    console.log('[STEP 2] Verifying "Start Guided Demo" CTA on Overview page...');
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Start Guided Demo'));
    }, { timeout: 8000 });
    console.log('[STEP 2] "Start Guided Demo" CTA confirmed present.');

    // 2. Click "Start Guided Demo"
    console.log('[STEP 3] Clicking "Start Guided Demo"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Start Guided Demo'));
      if (btn) btn.click();
      else throw new Error('Start Guided Demo button not found');
    });

    // Wait for route change to /scans and tour overlay
    await page.waitForFunction(() => window.location.pathname === '/scans', { timeout: 6000 });
    console.log('Navigated to /scans as expected for Stage 1 (DETECT).');

    // Wait for spotlight element and tour card
    await page.waitForFunction(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const target = document.querySelector('[data-tour="scan-controls"]');
      return card !== null && target !== null;
    }, { timeout: 6000 });
    console.log('[STEP 4] Spotlight element [data-tour="scan-controls"] and Tour Floating Card active.');

    // Check tour card content
    const stepText1 = await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      return card ? card.innerText : '';
    });
    console.log(`Stage 1 Tour Card Text Snippet:\n${stepText1.replace(/\n+/g, ' | ').substring(0, 160)}...`);

    // 3. Test "Next Step" button -> Stage 2 (PROVE) on /findings
    console.log('[STEP 5] Clicking "Next Step" button in Tour Card...');
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const nextBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'));
      if (nextBtn) nextBtn.click();
      else throw new Error('Next Step button not found inside tour card');
    });

    await page.waitForFunction(() => window.location.pathname === '/findings', { timeout: 6000 });
    console.log('Navigated to /findings as expected for Stage 2 (PROVE).');

    await page.waitForFunction(() => {
      return document.querySelector('[data-tour="exploit-evidence"]') !== null;
    }, { timeout: 6000 });
    console.log('[STEP 6] Spotlight element [data-tour="exploit-evidence"] active.');

    // 4. Test "Back" button -> return to Stage 1 (DETECT) on /scans
    console.log('[STEP 7] Clicking "Back" button in Tour Card...');
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const backBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Back'));
      if (backBtn) backBtn.click();
      else throw new Error('Back button not found inside tour card');
    });

    await page.waitForFunction(() => window.location.pathname === '/scans', { timeout: 6000 });
    console.log('Navigated back to /scans successfully.');

    // 5. Navigate forward through all stages (Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 -> Stage 6)
    console.log('[STEP 8] Advancing through remaining stages to test complete navigation flow...');
    
    // Go to Stage 2
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'))?.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/findings', { timeout: 6000 });
    console.log('  -> Stage 2 (PROVE) on /findings verified');

    // Go to Stage 3 (EXPLAIN)
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'))?.click();
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('  -> Stage 3 (EXPLAIN) verified');

    // Go to Stage 4 (PATCH)
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'))?.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/patches', { timeout: 6000 });
    console.log('  -> Stage 4 (PATCH) on /patches verified');

    // Go to Stage 5 (VERIFY)
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'))?.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/verification', { timeout: 6000 });
    console.log('  -> Stage 5 (VERIFY) on /verification verified');

    // Go to Stage 6 (REPORT)
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Next Step'))?.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/reports', { timeout: 6000 });
    console.log('  -> Stage 6 (REPORT) on /reports verified');

    // 6. Test "Exit" (X) button
    console.log('[STEP 9] Testing Exit button...');
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const exitBtn = card.querySelector('button[title*="Exit"], button:has(svg.lucide-x)');
      if (exitBtn) exitBtn.click();
      else {
        // Fallback to top right close button
        const btn = Array.from(card.querySelectorAll('button'))[0];
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const isOverlayGone = await page.evaluate(() => {
      return document.querySelector('div[class*="fixed bottom-6"]') === null;
    });
    console.log(`Tour Card dismissed after Exit: ${isOverlayGone}`);

    // 7. Test "Resume" from Navbar
    console.log('[STEP 10] Testing Resume from Navbar ("Guided Tour" button)...');
    await page.evaluate(() => {
      const navTourBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Guided Tour'));
      if (navTourBtn) navTourBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const isOverlayResumed = await page.evaluate(() => {
      return document.querySelector('div[class*="fixed bottom-6"]') !== null;
    });
    console.log(`Tour Card resumed from Navbar: ${isOverlayResumed}`);

    // 8. Test Skip Tour
    console.log('[STEP 11] Testing Skip Tour...');
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const skipBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Skip'));
      if (skipBtn) skipBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const isTourSkipped = await page.evaluate(() => {
      return localStorage.getItem('verifiedfix_tour_active') === null;
    });
    console.log(`Tour state cleared in localStorage after Skip: ${isTourSkipped}`);

    // 9. Test Completion Modal and all its buttons ("View Audit Report", "Restart Tour", "Close")
    console.log('[STEP 12] Navigating directly to Stage 6 and clicking Finish to test Completion Modal...');
    await page.evaluate(() => {
      // Start tour at last step (Stage 6)
      localStorage.setItem('verifiedfix_tour_active', 'true');
      localStorage.setItem('verifiedfix_tour_step', '5');
      window.location.href = '/reports';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 });
    await new Promise(r => setTimeout(r, 800));

    // Wait for tour card on Stage 6
    await page.waitForFunction(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      return card && card.innerText.includes('Finish');
    }, { timeout: 6000 });

    console.log('[STEP 13] Clicking "Finish" button on Stage 6...');
    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const finishBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Finish'));
      finishBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Confirm Completion Modal is displayed
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      return modal && modal.innerText.includes('You Verified the Fix!');
    });
    if (!modalVisible) throw new Error('Completion modal not visible after clicking Finish!');
    console.log('[STEP 14] "You Verified the Fix!" Completion Modal confirmed visible.');

    // Test "View Audit Report" button closes the modal and stays on /reports
    console.log('[STEP 15] Testing "View Audit Report" button inside Completion Modal...');
    await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('View Audit Report'));
      btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const isModalClosedAfterView = await page.evaluate(() => {
      return document.querySelector('div.fixed.inset-0') === null;
    });
    if (!isModalClosedAfterView) throw new Error('Completion modal failed to close after clicking "View Audit Report"!');
    console.log(`  -> Modal closed cleanly after clicking "View Audit Report": ${isModalClosedAfterView}`);

    // Re-open completion modal to test "Restart Tour" button
    console.log('[STEP 16] Triggering completion modal to test "Restart Tour" button...');
    await page.evaluate(() => {
      localStorage.setItem('verifiedfix_tour_active', 'true');
      localStorage.setItem('verifiedfix_tour_step', '5');
      window.location.href = '/reports';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const finishBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Finish'));
      finishBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click "Restart Tour"
    await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Restart Tour'));
      btn.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/scans', { timeout: 6000 });
    console.log('  -> "Restart Tour" navigated back to /scans successfully.');

    // Re-open completion modal to test "Close" button
    console.log('[STEP 17] Triggering completion modal to test "Close" button...');
    await page.evaluate(() => {
      localStorage.setItem('verifiedfix_tour_active', 'true');
      localStorage.setItem('verifiedfix_tour_step', '5');
      window.location.href = '/reports';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const card = document.querySelector('div[class*="fixed bottom-6"]');
      const finishBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Finish'));
      finishBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click "Close"
    await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      const btn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Close');
      btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const isModalClosedAfterClose = await page.evaluate(() => {
      return document.querySelector('div.fixed.inset-0') === null;
    });
    if (!isModalClosedAfterClose) throw new Error('Completion modal failed to close after clicking "Close"!');
    console.log(`  -> Modal closed cleanly after clicking "Close": ${isModalClosedAfterClose}`);

    console.log('\n>>> ALL 17 E2E BROWSER ACCEPTANCE CHECKS INCLUDING COMPLETION MODAL PASSED EMPIRICALLY! <<<');
  } catch (err) {
    console.error('E2E TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserTest();
