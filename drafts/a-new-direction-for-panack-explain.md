---
title: A new direction for panack explain
status: draft
tags:
  - compiler
  - tooling
summary: I'm prototyping an interactive terminal app for panack explain. It's already looking more useful, and I want to get it right before alpha.15.
---

I've been spending a lot of time on `panack explain`, expanding what it can tell you about your program. The intention is to cover almost the whole language, which gives it rather a lot to say.

And while trying to make sense of that output, I realised something. In its current format, it wasn't all that useful. It was basically a dump of information.

The information was interesting. But I was having to work too hard to understand it, and if I was struggling with that, what was it going to be like for someone who hadn't been working on the compiler?

## More information isn't necessarily more help

I've [written before about why I'm excited about `panack explain`](/articles/do-not-underestimate-panack-explain/). I want to understand why the compiler accepted or rejected something, what types it worked out and what information it used to reach a decision.

Sometimes the program is fine and I just want to understand why it works. That's useful too.

With a small example, printing the explanation out as text seemed reasonable. You could read through it and follow what was happening. But as the examples got more involved, that became much harder.

If I'm interested in one decision, I don't want to read everything the compiler knows about the function to find it. And once I've found it, I might have another question about something that contributed to that decision.

That's when it started to feel obvious that this would work a lot better as an interactive terminal application.

## Let me explore it

I want to be able to start with the bit I'm interested in and follow the explanation from there. Look at a decision, see what went into it, then go into more detail if I need to.

I might not even know what I'm looking for until I start looking. That's quite normal when you're trying to understand something.

A long text report makes you do a lot of the work of finding and connecting those details yourself. An interactive app gives me a way to help with that. I can think about how someone moves through the explanation, and what they need to see at each point, instead of just deciding what order to print everything in.

I'm currently prototyping this, and it's already looking a lot more useful.

It's not finished yet. I'm still working out how it should behave, and trying it is part of that. But I feel much happier with this direction than I did with the idea of giving people an increasingly long report to read.

## This means alpha.15 will take a little longer

I did consider releasing the expanded text version first and replacing it later. The perfect is the enemy of the good, and all that. Get something out and improve it.

But I wasn't happy that the text version would actually be useful enough. I could spend time finishing it, knowing that I already wanted to replace the way people used it, or I could spend that time working on the version I thought would help them.

I'd rather do the latter.

So the next release, alpha.15, will take a little longer. I want to get this right. That doesn't mean the first version needs every feature I can think of, but it does need to help you make sense of your program without making you work so hard for it.

## Why I think it's worth it

I truly believe `panack explain` is a game changer.

Being able to ask why the compiler made a decision, and then follow its reasoning, could make a real difference to how we learn a language and work through problems in our programs. Especially when the answer depends on several things that aren't obvious from the line you're looking at.

That's what I want to make useful. There's a lot of knowledge in the compiler, and I want you to be able to get at it without needing to understand how the compiler itself is built.

The prototype is already making me more confident that this is worth the extra time. I'm looking forward to getting it into your hands.
