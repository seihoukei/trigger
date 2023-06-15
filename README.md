# Trigger

Custom JavaScript event system. There is a svelte-specific version `@seihoukei/trigger-svelte`.

# Usage

You set up handlers for arbitrary triggers and then can trigger them. Both handlers and trigger activations can have any number of arguments. Handler arguments are passed to callback before trigger arguments.

## Set up handlers

Any valid Map key can be a trigger. There are several ways to set up a handler.

There are two types of handlers:

- *Normal* - executes with given arguments and might return a value. Called with `handler(...handlerArguments, ...triggerArguments)`
- *Modifier* - executed with input value in addition to arguments and returns modified value. Called with `handler(input, ...handlerArguments, ...triggerArguments)`

### Vanilla way

Unlike svelte-specific triggers, these can be set up anywhere, but need to be canceled manually.

Normal handlers are set up with `Trigger.createHandler(trigger, handler, ...args)` or `Trigger.on(trigger, handler, ...args)`

Modifying handlers are set up with `Trigger.createModifier(trigger, handler, ...args)`

You can cancel either with `.cancel()` method of returned value.

## Triggering events

### Plain execution

Use `Trigger(trigger, ...args)` to execute normal handlers set up for given trigger. This is similar to `array.forEach`

### Polling results

Use `Trigger.poll(trigger, ...args)` to execute normal handlers set up for given trigger and collect execution results. This is similar to `array.map`

### Value modifications

Use `Trigger.modify(input, trigger, ...args)` to execute modifier handlers set up for the trigger in a chain. This is similar to `array.reduce`.

## Miscellaneous

`Trigger.createTrigger()` returns function that executes triggers with itself as a key. `Trigger.createPoll()` and `Trigger.createModification()` create similar functions for polling and modification.

`Trigger.clearTrigger(trigger)` removes all handlers associated with event and removes entry for it from storage.


# Quick example

```js
function counterCallback(handlerArgument, triggerArgument) {
    console.log(`${handlerArgument} + ${triggerArgument} = ${handlerArgument + triggerArgument}`)
    return handlerArgument + triggerArgument
}

// Set up handlers
const handlers = [
    Trigger.on("count", counterCallback, 1),
    Trigger.on("count", counterCallback, 2),
    Trigger.createModifier("boost", x => x + 1).setPriority(1),
    Trigger.createModifier("boost", x => x * 2).setPriority(0),
]

Trigger("count", 3)
//1 + 3 = 4
//2 + 3 = 5

console.log(Trigger.poll("count", 4))
//1 + 4 = 5
//2 + 4 = 6
//[5, 6]

console.log(Trigger.modify(5, "boost"))
//11

// Clean up handlers
handlers.forEach(handler => handler.cancel())

console.log(Trigger.poll("count", 6))
//[]

console.log(Trigger.modify(7, "boost"))
//7
```
