---
title: When more output stops helping
status: draft
tags:
  - compiler
  - tooling
summary: Expanding panack explain meant reconsidering how people would use it, and whether a basic text version was worth shipping at all.
---

If you've been following Panackelty's development, you might have noticed a change in direction for `panack explain`. I'm moving it towards an interactive terminal app.

This wasn't where I started. I was expanding what the command could explain, and initially I expected to keep improving the text it printed. But as I worked through more complex examples, it became clear that printing more information wasn't going to be enough.

There's a lesson in that which goes beyond compiler tooling.

## More of the language, more to explain

I've [written before about what I want from compiler explanations](/articles/do-not-underestimate-panack-explain/). I want to be able to ask why Panack accepted or rejected something, what types it worked out, which facts it used and where those facts came from.

An error message can tell you what went wrong. An explanation should help you understand how the compiler arrived there. And it should be useful when the program is accepted too. Sometimes you're trying to understand why something works.

The work I'm doing now expands that ambition dramatically, towards covering almost the whole language. That's the direction of the development, rather than a claim about what's already available in a release.

Which is exciting. But it also gives us a lot more to present.

A small example can make a text report look quite reasonable. There's a function, a decision and some supporting information. Read through it and you can see what's going on.

With a more involved example, there are more decisions, more relationships between them and more details that might matter depending on what you're trying to find out. A report can be accurate and still leave you doing far too much work to understand it.

## The examples changed my mind

Flat text was a good start. It gave me a way to see the explanations and think about what they needed to contain.

But when we ran through the more complex examples, I couldn't see that approach working well for someone actually using the tool.

If I want to understand one decision, I don't necessarily want to read everything the compiler can tell me about the function. I want to find the relevant part, understand the result, and then follow the reasoning if I need more detail.

And I might not know which part I need until I start looking.

That's a different activity from reading a report from top to bottom. The next thing you want to see depends on what you've just learned. Putting everything into a longer report doesn't really help with that, even if the individual explanations are well written.

I could keep improving the wording and ordering, but the examples were showing me that the way you use the information needed attention too.

## Ship the text version first?

I did consider keeping a basic text version for alpha.15 and replacing it with something better later.

The perfect is the enemy of the good. Get something useful out, learn from it and improve it. I don't think that's bad advice.

But “useful” is doing quite a lot of work there.

For the expanded explanations, I didn't think the basic text version would actually be useful to anyone. It might demonstrate that the compiler had information to share, but that wasn't the thing I wanted to deliver. I wanted people to be able to make sense of it.

So why spend the time finishing that version just because it looked like the smaller thing to ship?

This wasn't a case of a useful first version missing a few conveniences. The problem was that the presentation got in the way of the reason for using it. Calling that an initial version wouldn't make the problem go away.

## Something you can explore

That's why the direction is now an interactive terminal app.

The aim is to let you explore the explanation, choosing where to focus and how much detail to follow. I want the tool to help you keep track of what you're looking at, rather than making you reconstruct the connections from a long stream of output.

The terminal is still where you're working with `panack`. The change is that an explanation becomes something you can move through, rather than just something the command prints at you.

This is work in progress. I'm describing why I changed direction, not announcing that the new interface is finished.

There's still plenty of room for a modest first version. It doesn't need every interaction I might eventually want. It does need to make the explanations useful when the example stops being small.

## What counts as a useful first version?

I think it's easy to treat “ship something simple first” as though it settles the decision. But we still need to ask what someone will be able to do with that first version.

In this case, producing the explanation and helping someone understand it are both part of the job. I could make progress on one while leaving the other unresolved, but that wouldn't necessarily give a user something worth having.

The complex examples were useful because they made that visible before I'd committed to finishing the wrong presentation. They gave me a reason to change the plan.

I'm still happy to start small. I just want the small version to help someone understand their program.
