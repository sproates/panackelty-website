---
title: Why I use Cloudflare Web Analytics on Panackelty
summary: I want to know which pages people visit and how they find their way around, without pretending page views tell me whether someone has read or enjoyed an article.
status: draft
tags:
  - website
  - privacy
  - Cloudflare
---

I want to know whether people visit the Panackelty site, which pages and articles they open, and how they find their way around. That gives me something useful to work with when I decide what to explain next or which parts of the site need attention.

I don't need to know who you are. I'm interested in the broad picture: which pages get visited, where visits come from, and whether the site works well for people using different devices and browsers.

## What the numbers can tell me

Cloudflare Web Analytics reports page views, visits, referrers and page performance, including Core Web Vitals. Cloudflare defines a page view as a successful response for an HTML page. Its definition of a visit is based on whether the page view came from another site or a direct link. One visit can include several page views.

That should help me see which articles attract visits and whether people move between parts of the site. But a page view doesn't tell me that someone read an article to the end. It doesn't tell me which paragraph they reached, what they thought, or whether they found the page useful. It records that a page loaded. That's all.

Cloudflare Web Analytics doesn't currently support custom events, so I haven't added tracking for individual button clicks or actions in the playground. I'm not trying to follow a person from page to page.

## What the site sends

Panackelty is hosted on GitHub Pages, so I use Cloudflare's manual JavaScript snippet. The snippet runs in the browser and reads performance information from the browser's own APIs. Cloudflare says the beacon doesn't set or read cookies, local storage or other browser storage, and that it doesn't track individual visitors across customers' websites.

The request still goes to Cloudflare. As with any web request, Cloudflare's service receives the visitor's IP address while handling it. Cloudflare says it discards that address at the nearest data centre and doesn't store it in its core databases or logs. The beacon also reports information such as the page being viewed, its referrer and performance timings. Cloudflare says it doesn't log query strings.

The details matter, so I've linked to [Cloudflare's explanation of the data it collects](https://developers.cloudflare.com/speed/observatory/rum-beacon/) and its [Web Analytics metrics](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/). If the setup changes, this explanation should change with it.

## Why I'm telling you

I don't want a cookie banner for a setup that doesn't use cookies or browser storage. But I also don't want analytics quietly added to the site with no explanation. I use it because I want to understand what people find and how the site is working, then make better decisions about what to improve.

If you don't like the idea, that's fair. At least you can see what's running and why.
