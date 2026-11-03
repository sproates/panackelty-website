---
title: Why I’ve added Cloudflare Analytics to this site
summary: I want to know which pages people visit and how they find their way around, without pretending page views tell me whether someone has read or enjoyed an article.
status: published
date: 2026-11-03
tags:
  - website
  - privacy
  - Cloudflare
---

I wanted to know whether people visit Panackelty, which pages they open, and how they find their way around. So I added Cloudflare Web Analytics. Maybe the numbers will give me a clue about what to work on next or which parts of the site need more explanation.

I'm interested in the general picture, not who you are. I want to know whether the site is being used and whether it works properly for people on different devices and browsers.

## What I can see, and what I can't

Cloudflare shows page views, visits, where people came from, and page performance, including Core Web Vitals. It calls a successful response for an HTML page a page view. A visit is based on whether someone came from another site or followed a direct link, and one visit can include several page views.

That might tell me which articles people open, or whether they move from one part of the site to another. But it can't tell me whether anyone actually read an article to the end, what they thought, or whether they found it useful. It tells me a page loaded. That's all.

I haven't added tracking for button clicks or actions in the playground. Cloudflare Web Analytics doesn't currently support custom events, so I'll be able to see that someone opened the playground page, but not whether they ran a program. I'm not trying to follow an individual person around the site.

## What gets sent to Cloudflare

The site is hosted on GitHub Pages, so I add Cloudflare's JavaScript snippet to the pages. It runs in your browser and reads performance information from the browser's own APIs. Cloudflare says the beacon doesn't set or read cookies, local storage or other browser storage, and doesn't track individual visitors across its customers' websites.

The request still goes to Cloudflare, and Cloudflare receives your IP address while handling it. Cloudflare says it discards the address at the nearest data centre and doesn't store it in its core databases or logs. The beacon also reports the page being viewed, its referrer and performance timings. Cloudflare says it doesn't log query strings.

I've linked to [Cloudflare's explanation of the data it collects](https://developers.cloudflare.com/speed/observatory/rum-beacon/) and its [Web Analytics metrics](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/), so you can check the details for yourself. If I change how analytics works on the site, I'll update this article too.

## Why I'm telling you

I don't want a cookie banner for this setup, which Cloudflare says doesn't use cookies or browser storage. But I don't want to add analytics and keep quiet about it either. I want to know whether people are using the site and how it's working, and I'm happy to explain why I've added it.

If you don't like the idea, that's fair. At least you can see what's running and why.
