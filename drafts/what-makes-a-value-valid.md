---
title: What makes a value valid?
status: draft
summary: An empty string is a perfectly good string. But is it a useful label? A look at the domain types I'm planning for Panackelty.
tags:
  - types
  - language-design
  - alpha.15
---

An empty string is a perfectly good string. Some of my favourite strings are empty.

But it’s probably not a very useful name for a button. Two integers can both be valid in themselves while making no sense as the start and end of a range.

Knowing the basic type only gets us so far. Sometimes the program needs to know a bit more about what it's been given.

That's why I'm planning validated domain types for alpha.15. I’ve got a design I’m happy with, but I haven't implemented it yet. The examples here are to show the intention of the design.

## A string isn't necessarily a label

Say I want a label that isn't blank, is no longer than 80 characters, and has no control characters in it.

I could check all that whenever I use it. Or check it once and remember which strings I've checked. Neither seems particularly appealing.

I'd rather write down what I mean by a label:

```panackelty
type Label = Str where text =>
  (text.len() >= 1 && text.len() <= 80)
  && text.is_non_blank()
  && text.has_no_control_characters()
```

I've called the value `text` here. That name only applies inside the condition, and I can choose whatever name makes sense.

Once a value is a `Label`, another function can accept it as one. It doesn't have to wonder whether I checked it, or whether my idea of a valid label was the same as its own.

The requirements are there in the type.

## Empty and blank aren't the same thing

`""` is empty. `"   "` has three spaces in it. Both would make a fairly unhelpful button label.

So checking the length isn't enough. `is_non_blank()` checks that there's at least one character that isn't Unicode whitespace.

I've chosen a fixed definition from Unicode 17.0.0. What counts as whitespace shouldn't change depending on which machine runs the program.

Length needs a bit of care too. Panackelty counts Unicode scalar values, which aren't necessarily the characters you see on screen. An accented letter can be one scalar, or a letter followed by a combining accent. They can look the same and have different lengths.

Non-blank doesn't necessarily mean visible either. A zero-width space isn't in that whitespace set.

That doesn't make the checks useless, but it does mean I need to be clear about what they check. This `Label` type isn't a complete set of rules for every user interface. It's the set I've written down.

## How does a string become a Label?

If the compiler can prove the value meets all the conditions, I can use `Label(input)`.

If it can't, that won't compile. It won't quietly add a runtime check instead.

But the compiler can't know what someone will put in a file or send in an HTTP request. For that, I need to check the value while the program runs:

```panackelty
result = validate[Label](input)
```

That returns `Result[Label, ValidationError]`. Either I get a `Label`, or I get an error explaining why it couldn't be one.

Before that check, it's a string. After a successful check, I can use it wherever a `Label` is needed.

The validation won't tidy it up for me. It evaluates the input once and leaves it unchanged: no trimming, no normalising, no quietly removing things to make it pass.

If I want to trim it first, I can do that myself.

## Tell me what failed

After the [work on package error messages](/articles/tell-me-what-went-wrong/), I'd be a bit disappointed if this just gave me `false` and left me to work out why.

For an empty string, the proposed message is:

```text
Cannot validate the value as Label.

Label requires at least 1 Unicode scalar value, but the string is empty.

Label requires at least one character that is not Unicode whitespace, but the string is empty.
```

There are two failed conditions, so it reports both. Being empty doesn't break the maximum length or introduce control characters, so those don't appear as problems.

The error will also contain the details as data: which type I was trying to create, which conditions failed, where they apply, and facts such as the actual length.

That means I can use them in my program without trying to pick apart the message text. If I want the text, `ValidationError.render()` gives me that. It doesn't print it for me.

And it won't automatically include the original input. I might be validating something private. I'd like to know why it failed without accidentally putting it in a log.

## What about those two integers?

Back to the range from the beginning:

```panackelty
record Range {
  start: Int,
  end: Int
}

type OrderedRange = Range where range => range.start <= range.end
```

`Range(10, 3)` contains two perfectly good integers. They're just the wrong way round for an `OrderedRange`.

The planned validation message makes that distinction:

```text
Cannot validate the value as OrderedRange.

OrderedRange requires field 'start' to be less than or equal to field 'end', but that relationship is not satisfied.
```

For now, this is limited to comparing direct fields in the same record, with the same underlying ordered numeric type. It won't accept arbitrary expressions and somehow work out whether they make sense together.

There's enough to get right here already.

## What if I change it?

Checking a value once doesn't mean every version of it will be valid forever.

If I change the start of a range, I need to check the new range. The design is to make an ordinary record and validate it before using it as the replacement:

```panackelty
candidate = Range(new_start, previous.end)
result = validate[OrderedRange](candidate)
```

That leaves the old range alone. If the candidate fails, it doesn't become an `OrderedRange`.

Strings and collections work the same way. Passing a value around doesn't lose what I know about it, but changing its content might. Unless the compiler can prove the conditions still hold, the changed result is an ordinary base value and may need checking again.

## A list can be the wrong size too

Perhaps I need between one and twenty names:

```panackelty
type SmallNames = [Str] where names =>
  names.len() >= 1 && names.len() <= 20
```

Those bounds include one and twenty. The same sort of size checks are planned for maps and sets, counting entries and distinct elements respectively.

But this declaration only checks how many strings are in the list. It says nothing about whether the strings themselves are blank.

It doesn't make every array index safe either. I still need to check the index I'm using.

## Where I'm starting

Panackelty already has numeric guards. I'm extending that idea to these strings, collections and relationships between fields, and changing declarations to use an explicit name like `text` or `range`.

The new conditions can be joined with `&&`. Parentheses and line breaks let me lay them out so they're readable.

Alternatives for these new kinds of condition are planned for alpha.16. Numeric alternatives already work and will stay supported.

I'm not including arbitrary user-written functions in the conditions. Running a function and getting a Boolean back is one thing. Expecting the compiler to understand what that function proves is quite another.

The [design](https://github.com/sproates/panackelty/blob/main/docs/design/VALIDATED_DOMAIN_TYPES.md) has the full details if you'd like to read them.

What I'm aiming for is to check a value when I need to, give it a type that says what I now know about it, and let the rest of the program use that information.

I shouldn't have to keep asking whether my label is actually a label.
