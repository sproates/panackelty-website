---
title: AI use in Panackelty
status: draft
tags:
  - AI
  - development
summary: I use AI a lot when building Panackelty. Here's how it helps, and why I still want control over where the project goes.
---

I want to talk about how I use AI to help me build Panackelty. I use it a lot, for writing code, tests, documentation, and helping me keep track of the work.

At no point am I claiming that I've written 100% of the Panackelty codebase by hand. That would be madness.

I've updated the [contribution guide](https://github.com/sproates/panackelty/blob/next/CONTRIBUTING.md#how-panackelty-is-developed) to say more about this, including what I expect when someone uses AI to help with a contribution.

## Getting to try things

AI is a fantastic accelerator. We can now explore ideas that would take a long time even to do a proof of concept for. For me, that's probably the most exciting part of it.

Take `panack explain`. I want to be able to ask the compiler why it made a decision, follow the reasoning and understand what it's telling me. That includes when it accepts a program. Sometimes you want to know why something works.

I think that's a cool thing to have in a language. I've [written about it before](/articles/do-not-underestimate-panack-explain/), and I'm now expanding what it can tell you to cover almost the whole language.

Doing all of that by hand would take me ages.

With AI helping, I can get far enough to try it on real examples and see where the idea holds up. And where it doesn't. The flat text output looked fine at first, but once I started working through more complex examples it became clear that it wasn't going to work well for someone actually using it.

So I'm moving it towards an interactive terminal app. That work is still in progress, but I got to make that decision because I could try the thing and see the problem. I wasn't just imagining what it might be like to use.

## I still want to decide what I'm building

This is my project. I decide where it's going, what I want in the language and how I want it to work. I spend a lot of time on the designs and specs, and AI helps me work through those too.

But I want to be happy with a design before going ahead with it. If something doesn't fit, I want to understand why. If there are other ways to do it, I want to think about them. Getting some code written quickly doesn't make those questions go away.

And this is actually why I want AI use to be carefully managed and controlled. Because I want that control.

It's quite easy to imagine asking for a feature and getting an implementation that looks reasonable, but makes decisions you haven't really thought through. How should it interact with another part of the language? What should happen when something goes wrong? Those decisions are part of the design, even if they only become obvious while writing the code.

I don't want them settled just because that's what happened to get generated. I want to understand what I'm agreeing to.

In practice, that means agreeing what a piece of work is supposed to do before starting it, keeping changes focused and checking the result against the spec. If the implementation throws up a design question, I want to come back to that question.

## There's a roadmap to look after too

AI is also a great help with keeping the project on track. There's a lot of detail in a roadmap once you get beyond a list of features you'd like to have.

Something needs doing before something else can start. Part of a feature is finished, but there's still work to do before it's useful. A new idea comes along and you need to work out where it fits, or whether it belongs there at all.

I use AI to help me keep track of that and work out what to do next. I still choose what gets done, but having help with the detail makes it much easier to keep the work organised and disciplined.

I quite like that side of it. It gives me more time to think about the project without losing track of all the things that need doing.

## I like checking things

I am anyway the kind of person who loves verification. I want to know that something works, and I want to know that it still works after I've changed something else. Being able to automate a lot of that is empowering.

There's a serious amount of verification in Panackelty. That's my choice.

There are checks for individual behaviours, complete programs run through the toolchain, and checks that the compiler can rebuild itself reproducibly. I'm building a compiler, so yes, I do want to spend time making sure it does what it's supposed to do.

AI helps me write and maintain those checks. But I still need to think about what they're checking. A test that agrees with the implementation might just be repeating the same mistake. What I want to know is whether the behaviour is right.

The contribution guide says much the same thing about work submitted to the project. Use AI, that's fine. But understand what you're submitting, check it, and be clear about what you've actually verified. I expect that of my own work too.

## I'd like the ideas to go somewhere

I'm not claiming `panack explain` is an entirely novel idea. Other people have thought about helping users understand compilers. But I do think what I'm trying to do with it is different and cool, and I'm pleased that I can actually explore it instead of leaving it as something I'd like to get around to one day.

I kind of hope people pick up concepts like this and incorporate them into mainstream languages, even if they never use Panackelty.
