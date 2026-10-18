import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const base = process.env.BASE_URL || process.env.UI_BASE_URL || 'http://localhost:5173';
const out = '.taste-skill/inspect/verification';
await mkdir(out, { recursive:true });
const source = await readFile('src/routes.tsx','utf8');
const publicSource = source.slice(source.indexOf('element: <PublicLayout'),source.indexOf('element: <AuthLayout'));
const paths = ['/', ...[...publicSource.matchAll(/path: "([^"]+)"/g)].map(match=>`/${match[1]}`).filter(path=>!path.includes(':')),
  '/cities/uyo','/cities/lagos','/cities/unknown-city','/blog/prepare-for-collection','/blog/unknown-article','/unknown-page'];
const browser = await chromium.launch({ executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox'] });
const result = { routes:[],errors:[],contact:null,menu:null,coverage:null };
try {
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',error=>result.errors.push(error.message));
  for (const path of paths) {
    await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('main').waitFor();
    await page.locator('h1,h2').first().waitFor();
    const title = await page.locator('h1,h2').first().innerText();
    const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    assert.equal(overflow,false,`${path} desktop overflow`);
    assert.ok(!/undefined|Something broke/.test(title),`${path} broken title ${title}`);
    result.routes.push({path,title});
  }
  await page.goto(`${base}/contact?category=Operator%20partnership`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('select').inputValue(),'Operator partnership');
  await page.getByLabel('Your name',{exact:true}).fill('UI Verification');
  await page.getByLabel('Email address',{exact:true}).fill('ui-check@example.test');
  await page.getByLabel('Your message',{exact:true}).fill('Please review a collection request in Uyo.');
  const keys = [];
  let calls = 0;
  await page.route('**/api/enquiries',async route=>{
    keys.push(route.request().headers()['idempotency-key']);
    calls++;
    await route.fulfill({status:calls===1?503:201,contentType:'application/json',body:JSON.stringify(calls===1?{error:{code:'UNAVAILABLE',message:'Service temporarily unavailable. Please retry.'}}:{reference:'ENQ-UI-TEST'})});
  });
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Service temporarily unavailable'}).waitFor();
  assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'UI Verification');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await page.getByText('Your message is saved.',{exact:true}).waitFor();
  assert.ok(keys[0] && keys[0]===keys[1],'Enquiry retry must reuse idempotency key');
  result.contact = 'category query, error preservation, saved reference and stable retry key passed with mocked HTTP responses';
  await page.unroute('**/api/enquiries');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Check your address',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('address-check')===document.activeElement);
  await page.locator('#address-check').fill('Ewet Housing Estate');
  await page.getByRole('button',{name:'Check address',exact:true}).click();
  await page.getByText('Request collection in Ewet Housing Estate.',{exact:true}).waitFor();
  await page.locator('#address-check').fill('Ewet Lagos');
  await page.getByRole('button',{name:'Check address',exact:true}).click();
  await page.getByText("Slate isn't in Ewet Lagos yet.",{exact:true}).waitFor();
  result.coverage = 'supported area, contradictory city and keyboard focus passed';
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('h1').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`home ${width} overflow`);
    if(width===390 || width===1440) await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});
    if(width<1280) {
      await page.getByRole('button',{name:'Open menu',exact:true}).click();
      await page.getByRole('dialog',{name:'Navigation'}).waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog',{name:'Navigation'}).count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
      assert.equal(await page.getByRole('button',{name:'Open menu',exact:true}).evaluate(el=>el===document.activeElement),true);
    }
  }
  result.menu='320/390/768/1024/1440 overflow and mobile menu Escape/focus/scroll restoration passed';
  for (const path of ['/services/households','/contact','/pricing','/for-businesses']) {
    for (const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded'});
      await page.locator('h1').waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`${path} ${width} overflow`);
      await page.screenshot({path:`${out}/${path.replaceAll('/','-').slice(1)}-${width}.png`,fullPage:true});
    }
  }
  assert.deepEqual(result.errors,[],'No browser runtime exceptions');
  console.log(JSON.stringify(result,null,2));
} finally { await writeFile(`${out}/results.json`,JSON.stringify(result,null,2)); await browser.close(); }
