---
title: AI use in Panackelty
status: draft
tags:
  - AI
  - development
summary: How I use AI to help build Panackelty, what it makes possible, and why keeping control of the project matters to me.
---

I want to talk about how I use AI to help me build Panackelty. It makes a substantial contribution to the project, including implementation, tests, documentation, verification and the admin that goes along with all of that.

At no point am I claiming that I've written 100% of the Panackelty codebase by hand. That would be madness.

I've updated the [contribution guide](https://github.com/sproates/panackelty/blob/next/CONTRIBUTING.md#how-panackelty-is-developed) to make this explicit, and to explain what I expect from contributions that use AI. But I also wanted to write about how it fits into the way I work, because there's quite a lot more to it than generating code.

## Ideas I can actually try

AI is a fantastic accelerator. We can now explore ideas that would previously have taken a long time even to get to a proof of concept.

That's a big deal for a project like this. I can have an idea about how something ought to work, spend time on the design, and then get far enough with an implementation to find out whether the idea is any good. Doing all of that by hand would take me ages.

And sometimes the useful result is finding out that the first approach isn't good enough.

The work on `panack explain` is a good example. I'm expanding what it can explain dramatically, towards covering almost the whole language. As I worked through more complex examples, it became clear that the flat text output wasn't going to work well for users. There was more information, but it was becoming harder to make sense of it.

So I'm moving towards an interactive terminal app. I want people to be able to explore the explanation and follow the parts they're interested in. That work is still in progress, but being able to try the ideas is what helped me see that the presentation needed to change.

Having help with the implementation gives me more opportunities to make those discoveries. It doesn't make the decision for me.

## It's still my project

I decide the direction of Panackelty. I spend a lot of time working through designs and specifications, thinking about what belongs in the language and what doesn't. I define the requirements, consider the options and review how the result behaves.

I care about those decisions. Quite a lot, actually.

That's why using AI needs to be carefully managed. I want that control, and getting an implementation quickly isn't much use if it quietly takes the project somewhere I didn't intend to go.

A specification gives me something concrete to work from. What should this feature do? How should it behave when it can't do that? How does it fit with the rest of the language? If those questions haven't been answered, generating more code doesn't answer them for me.

AI can help me work through the questions too. I can explore alternatives and challenge an approach before committing to it. But I'm responsible for deciding what to accept, including when the right decision is to stop and rethink it.

## Keeping track of the work

Some of the most useful help is with the roadmap.

There's a lot to keep track of when you're building a language. An idea can turn into several pieces of work, which depend on other pieces of work, and it's quite easy for the interesting new thing to distract you from finishing something you've already started.

I use AI to help manage that. Keeping the roadmap organised, working through dependencies and making the next steps explicit helps me keep the project disciplined. I still decide the priorities, but I have help maintaining the detail that makes those priorities useful.

I don't want the roadmap to become a list of things that sounded good in a conversation and were then forgotten.

## I like verification

I'm anyway the kind of person who wants to check things. If I think a program should behave a particular way, I want evidence that it does. And I want to know that it still does after the next change.

Being able to automate a lot of that is empowering.

Panackelty has a serious amount of verification because I've chosen to put it there. The checks include individual behaviours, complete programs run through the toolchain and a reproducible bootstrap check. I'm building a compiler, so I want to be able to make changes with some confidence that I haven't broken the things it already does.

AI helps with writing and maintaining that verification, but a generated test still needs scrutiny. Does it check the behaviour I intended, or does it just agree with the implementation? A passing test is useful evidence only if we're asking it a useful question.

The contribution guide makes the responsibility clear: understand, review and validate what you submit. Check claims about results, and report the checks you actually ran. Using AI doesn't transfer that responsibility to the tool.

That's how I want the project to work, including my own contributions.

## What I'd like to come out of it

I've [written before about `panack explain`](/articles/do-not-underestimate-panack-explain/), and it's one of the ideas I'm particularly pleased to be able to explore. I want the compiler to help you understand its reasoning, including when your program is accepted and you're trying to understand why.

I'm not claiming that nobody has ever thought about compiler explanations before. But I do think there's something different and cool in what I'm trying to build, and AI makes it practical for me to prove more of it out.

I kind of hope that people pick up ideas like this and incorporate them into mainstream languages. Even if they never use Panackelty.

I'd be very happy to see something I explored here become a tool that helps people understand their programs somewhere else.
