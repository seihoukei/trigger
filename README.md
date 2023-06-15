# Trigger

Custom JavaScript event system

## Quick example

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
