import {test, expect} from '@playwright/test';
const routes=['/','/capabilities/','/get-started/','/examples/','/explain/','/under-the-hood/','/roadmap/','/about/','/releases/'];
test('editorial pages have consistent clean navigation at desktop and phone widths',async({page})=>{
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:844});
    for(const route of routes){
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(page.getByRole('link',{name:'Try it online',exact:true})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await expect(page.getByRole('navigation',{name:'Primary navigation'})).toBeVisible();
      await expect(page.getByRole('button',{name:'Menu',exact:true})).toHaveCount(0);
      await expect(page.locator('.closing .closing-links')).toHaveCount(1);
      if (width >= 901) {
        const footer = await page.locator('footer').boundingBox();
        const footerLinks = await page.getByRole('navigation', {name:'Further reading'}).boundingBox();
        expect(footerLinks.x).toBeGreaterThanOrEqual(footer.x - 1);
        expect(footerLinks.x).toBeLessThanOrEqual(footer.x + 1);
        expect(footerLinks.width).toBeGreaterThan(footer.width * .8);
      }
      const links=await page.locator('a[href]').evaluateAll(anchors=>anchors.map(a=>a.getAttribute('href')));
      for(const href of links) if(!/^https?:/.test(href)) expect(href).not.toMatch(/\.html(?:[?#]|$)/);
    }
  }
});
test('release availability and copy controls remain explicit',async({page,context,browserName})=>{
  await page.goto('/roadmap/');
  await expect(page.locator('#next-release')).toContainText('not released');
  await expect(page.locator('#first-non-alpha')).toContainText('not released');
  await expect(page.locator('#alpha-13')).toContainText('not released');
  await expect(page.locator('#alpha-13')).toContainText('HTTP client and server');
  await page.goto('/get-started/');
  const command=page.locator('#optional-install-command');
  await expect(command).toContainText('--version 0.1.0-alpha.11');
  if(browserName==='chromium'){
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    await page.getByRole('button',{name:'Copy installer command',exact:true}).click();
    await expect(page.locator('#optional-install-command-copy-status')).toHaveText('Copied to clipboard.');
    expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(await command.textContent());
  } else {
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});});
    await page.getByRole('button',{name:'Copy installer command',exact:true}).click();
    await expect(page.locator('#optional-install-command-copy-status')).toContainText('Select and copy this text manually');
  }
});

test('manual installation is an optional alternative and explanations are discoverable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/get-started/');
  await expect(page.locator('#optional-install-command')).toBeVisible();
  await expect(page.locator('#quick-run-commands')).toBeVisible();
  await expect(page.locator('#install-linux-commands')).not.toBeVisible();
  await page.locator('#manual-installation > summary').click();
  await expect(page.locator('#install-linux-commands')).toBeVisible();
  await page.locator('#manual-installation > summary').click();
  await expect(page.locator('#install-linux-commands')).not.toBeVisible();
  await page.getByRole('link',{name:'Compiler explanations',exact:true}).click();
  await expect(page).toHaveURL(/\/explain\/$/);
  await expect(page.locator('#explain-command')).toContainText('--function remaining');
  await expect(page.locator('#explain-proof-output')).toContainText('subtraction: proved');
  await expect(page.locator('#explain-effect-output')).toContainText('effect boundary: rejected');
});
