from pathlib import Path
import json,re
p=Path(__file__).parent
services=[]
for r in Path('src/lib/service-catalog.ts').read_text().splitlines():
 if any(x in r for x in ['svc-home-weekly','svc-home-lite','svc-bulk','svc-recycling','svc-special','svc-event']):
  d={}
  for f in ['id','name','frequency','priceFrom','priceUnit','pricingModel']:
   m=re.search(r'\b'+f+r': ("[^"]*"|\d+)',r)
   if m:d[f]=json.loads(m.group(1))
  services.append(d)
(p/'catalog.json').write_text(json.dumps(services,indent=2)+'\n')
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slate request service selection</title><link rel="stylesheet" href="request-design.css"></head><body>'''
foot='''<script src="request-design.js"></script><script src="file:///home/inimfon-udoh/.codex/skills/app-designer/assets/device.js"></script></body></html>'''
brand='''<header class="brand"><img src="file:///home/inimfon-udoh/Slates/public/brand/slate-mark-grey.svg" alt="Slate"><strong>slate</strong><button class="nav" aria-label="Open navigation">☰</button></header>'''
hero='''<div class="hero"><p class="eyebrow">Your Slate account · Uyo</p><h1>Request a<br>collection</h1><p>Tell us what you need. We will review the route, price and date before confirming.</p></div>'''
def field(name,value,extra=''):
 return f'<div class="field"><span class="label">{name}</span><div class="input">{value}</div>{extra}</div>'
def summary(idx):
 s=services[idx]; freq={'Twice weekly':'2 collections per week','Weekly':'1 collection per week','Monthly':'1 collection per month','One-time':'One-time collection'}[s['frequency']]
 return f'From ₦{s["priceFrom"]:,}{s["priceUnit"]} · {freq}'
def form(idx=0,before=False):
 s=services[idx]
 chosen=f'<button class="service-trigger" aria-label="Choose service"><span><strong>{s["name"]}</strong><small class="selected-facts"><span>From ₦{s['priceFrom']:,}{s['priceUnit']}</span><span>{ {'Twice weekly':'2 collections per week','Weekly':'1 collection per week','Monthly':'1 collection per month','One-time':'One-time collection'}[s['frequency']] }</span></small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg></button>'
 if before:chosen=f'<div class="input">{s["name"]}<span>⌄</span></div>'
 return '<div class="form"><div class="field"><span class="label">Service</span>'+chosen+'</div>'+field('Collection address','House number, street and landmark')+field('Area in Uyo','Choose your area <span>⌄</span>')+field('Preferred date','Choose a date <span>⌄</span>')+field('Preferred window','Morning, 7 am to noon')+'<p class="hint">Availability and price need to be confirmed.</p><button class="primary">Send request <span>→</span></button></div>'
def screen(name,content,attrs='',cls=''):
 return f'<section class="screen {cls}" data-name="{name}" data-time="10:28" {attrs}>{content}</section>'
def page(idx=0,before=False):return f'<main class="page" data-scrolls>{brand}{hero}{form(idx,before)}</main>'
def rows(selected=0):
 out=[]
 for i,s in enumerate(services):
  freq={'Twice weekly':'2 collections per week','Weekly':'1 collection per week','Monthly':'1 collection per month','One-time':'One-time collection'}[s['frequency']]
  out.append(f'<button class="option {"chosen" if i==selected else ""}" aria-pressed="{"true" if i==selected else "false"}"><span class="option-copy"><strong>{s["name"]}</strong><small>{freq}</small></span><span class="money"><small>From</small><strong>₦{s["priceFrom"]:,}</strong><small>{s["priceUnit"]}</small></span><span class="check" aria-hidden="true">{"✓" if i==selected else ""}</span></button>')
 return ''.join(out)
def popup(selected=0):
 return '<div class="popup-wrap"><div class="shade" data-behind></div><div class="popup"><div class="grabber" aria-hidden="true"></div><div class="popup-heading" data-float><div><p class="eyebrow">Collection plans</p><h1>Choose a service</h1></div><button class="close" aria-label="Close service selector">×</button></div><p class="popup-intro" data-float>Compare the starting price and collection frequency.</p><p class="scroll-affordance" data-float>Scroll for all 6 services</p><div class="options" data-scrolls>'+rows(selected)+'</div><p class="popup-note" data-float>The team confirms the final price before collection.</p></div></div>'
# Baseline source reconstruction; only existing service control is plain native select.
before=screen('before-source-reconstruction',page(before=True),cls='before')
(p/'before.html').write_text(head+before+foot)
explore=screen('material-tray-light',popup(),cls='explore-a')+screen('depot-board-dark',popup(),attrs='data-theme="dark" data-chrome="light"',cls='explore-b')+screen('collection-notice-yellow',popup(),cls='explore-c')
(p/'explore.html').write_text(head+explore+foot)
mockup=screen('request-selected-home',page())+screen('popup-light',popup())+screen('popup-dark',popup(),attrs='data-theme="dark" data-chrome="light"')+screen('request-selected-bulk',page(2))+screen('signature-open',popup(0))+screen('signature-choice',popup(3),cls='press-state')+screen('signature-recorded',page(3))+'<section class="app-icon" data-name="supplied-slate-icon"><img src="file:///home/inimfon-udoh/Slates/public/brand/slate-mark-white.svg" alt="Supplied Slate mark"></section>'
(p/'mockup.html').write_text(head+mockup+foot)
(p/'before-after.html').write_text(head+before+screen('after-selected-details',page())+foot)

(p/'scroll-check.html').write_text(head+screen('popup-light-scroll-end',popup())+screen('popup-dark-scroll-end',popup(),attrs='data-theme="dark" data-chrome="light"')+'<script>window.addEventListener("load",()=>document.fonts.ready.then(()=>requestAnimationFrame(()=>document.querySelectorAll(".options").forEach(el=>{el.scrollTop=el.scrollHeight}))))</script>'+foot)
