---
title: What makes a value valid?
status: draft
summary: A string can be a string and still be wrong for the job. How I want Panackelty's types to carry more of what a program actually needs.
tags:
  - types
  - language-design
  - alpha.15
---

An empty string is a perfectly good string.

It's probably not a very useful name for a button, though. And a pair of integers can each be valid while making no sense together as the start and end of a range.

The basic types tell us something about the values, but they don't tell us everything the program needs to know.

That's what I want to address with validated domain types in Panackelty. The design is agreed for alpha.15; implementation is still ahead. The declarations below show that planned design, rather than code you can run with the current release.

## A string isn't necessarily a label

Suppose I want a label that isn't blank, is no longer than 80 characters, and doesn't contain control characters.

I could check those things wherever I use it. But then every function taking a string has to know whether someone has already checked it, and what they checked.

I'd rather give that requirement a name:

```panackelty
type Label = Str where text =>
  (text.len() >= 1 && text.len() <= 80)
  && text.is_non_blank()
  && text.has_no_control_characters()
```

`text` is the name I've chosen for the value being checked. It only exists inside that condition. I could choose another name if it made the declaration clearer.

The conditions are written out where I define `Label`. Once a value has that type, passing it to another function shouldn't mean starting those checks again from scratch.

That function can ask for a `Label` because it needs a label, rather than accept any string and hope for the best.

## Empty and blank aren't the same thing

`""` is empty. `"   "` isn't, but neither is much use for this label.

That's why the design has a separate `is_non_blank()` check. It requires at least one character outside a defined Unicode whitespace set. The definition is pinned to Unicode 17.0.0, so it won't depend on the machine's locale.

There are some details here that are easy to wave away until they cause a problem.

String length counts Unicode scalar values, not bytes or the visible characters a person might count on screen. An accented letter can be represented by one scalar, or by a letter followed by a combining accent. Those have different lengths under this rule.

And non-blank doesn't guarantee visible text. Some characters, such as a zero-width space, aren't in that whitespace set.

So `Label` means exactly the conditions I've declared. It doesn't mean “every possible thing a user interface might want from a label”. If I need something more, that needs its own design.

## Where does the guarantee come from?

Sometimes the compiler already has enough information to establish that a value meets the requirements.

The planned ordinary construction, `Label(input)`, is for that case. Every requirement has to be proved. If the compiler can't do that, construction is a compile-time error.

It won't quietly insert a runtime check and hope that's what I meant.

But input from a file or an HTTP request usually isn't known in advance. I still need a way to check it while the program runs:

```panackelty
result = validate[Label](input)
```

The planned result type is `Result[Label, ValidationError]`. Success gives me a `Label`; failure gives me details I can handle.

That makes the point where I accept outside data explicit. Before validation, I have a string. After successful validation, I have a value with the guarantees my program asked for.

Validation doesn't trim it, normalise it or change it to make it pass. The input is evaluated once and preserved as it is.

If I want to trim a string first, that's a separate decision in my program.

## Tell me which requirements failed

After the [work on package error messages](/articles/tell-me-what-went-wrong/), I don't want validation to just hand back a Boolean and leave the explanation to everyone else.

An empty string fails two of the conditions in that `Label` declaration. The planned rendered error is:

```text
Cannot validate the value as Label.

Label requires at least 1 Unicode scalar value, but the string is empty.

Label requires at least one character that is not Unicode whitespace, but the string is empty.
```

Both failures are reported. The length limit and control-character check pass, so they don't appear as problems.

The error also has structured information: the target type, the failed constraints, their locations and useful facts such as the actual count. A program can use those details directly instead of parsing a sentence intended for a person.

`ValidationError.render()` will produce the plain-text explanation. It won't print anything itself.

The original input isn't automatically kept in the error or printed in the message either. A failed validation could involve something private; reporting why it failed shouldn't automatically put that value into a log.

## Two valid fields can make an invalid record

Here's another case I want to express:

```panackelty
record Range {
  start: Int,
  end: Int
}

type OrderedRange = Range where range => range.start <= range.end
```

There's nothing wrong with either integer in `Range(10, 3)`. The problem is their relationship.

The planned validation can explain that too:

```text
Cannot validate the value as OrderedRange.

OrderedRange requires field 'start' to be less than or equal to field 'end', but that relationship is not satisfied.
```

For this first version, those relationships are between direct fields of the same record with the same underlying ordered numeric type. I'm not trying to make the compiler prove arbitrary relationships between any expressions you can write.

That keeps the promise something I can define and test properly.

## Changing the value changes the question

A guarantee can't just stick around after an operation that might have broken it.

If I have an ordered range and want to change its start, the design is to construct a complete candidate record and validate the replacement:

```panackelty
candidate = Range(new_start, previous.end)
result = validate[OrderedRange](candidate)
```

The old range stays valid. The replacement has to earn the same guarantee before it can be used as an `OrderedRange`.

The same principle applies to strings and collections. Passing a validated value through a function preserves its type, but producing changed content doesn't automatically preserve every condition. The checker needs to prove that it does, or the result is an ordinary base value that may need validating again.

## It applies to collections too

A list can have the right element type and still contain too many entries for the job:

```panackelty
type SmallNames = [Str] where names =>
  names.len() >= 1 && names.len() <= 20
```

That says there must be between one and twenty strings, inclusive. It doesn't say those strings are non-blank, and it doesn't mean every possible array index is safe.

The planned size constraints cover arrays, maps and sets. Maps count entries; sets count distinct elements.

Again, the type should tell you what it guarantees without suggesting more than it knows.

## Keeping the first version manageable

Panackelty already has numeric guards. This work extends the useful kinds of requirements I can express, and moves guard declarations to the explicit binding syntax shown above.

The new string, collection and record conditions can be joined with `&&`, with parentheses and line breaks to keep them readable. Alternatives for those new families are planned for alpha.16. Existing numeric alternatives are already supported and will be preserved.

I'm also keeping arbitrary user-defined predicates outside this scope. There's a difference between executing a function to get a Boolean and giving the compiler a condition it can reason about.

The [agreed design](https://github.com/sproates/panackelty/blob/main/docs/design/VALIDATED_DOMAIN_TYPES.md) goes into the exact rules, errors and implementation steps.

What I want is quite straightforward: when a function asks for a label or an ordered range, its type should carry the requirements that make that value useful.

Then the rest of the program can get on with using it.
