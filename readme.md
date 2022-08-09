# Trigger
JavaScript library to handle custom triggered events.

## Why

Triggered events allow you to separate and organize differently related events that happen within different entities.
There are several examples provided that demonstrate various use patterns of this library.

## Primitive example

```js
//listener
event = Trigger.on("tick", (now) => console.log(now))

setInterval(() => {
    //trigger
    Trigger("tick", Date.now())
}, 1000)
```

## Usage

### Global triggers

Listener:
```js
Trigger.on(eventKey, callback, [...handlerArguments])
//or to execute just once:
Trigger.once(eventKey, callback, [...eventArguments])
```

Event trigger: 
```js
Trigger(eventKey, ...arguments)
```

Any valid `Map` key can be eventKey. When event is triggered, callback is called with handler arguments follower by event arguments:
```js
callback(...handlerArguments, ...eventArguments)
```

Event listener can be cancelled:
```js
listener = Trigger.on('test', (x) => console.log(x))
listener.cancel()
```

Event can also be reattached to same or another trigger, retaining all arguments:
```js
listener = Trigger.on('tick', (x) => console.log(x), 'ticked')
listener.reattach('tock') //now it triggers on 'tock' instead of 'tick', but still says 'ticked'
```

For example, if two listeners are set up with 

```js
function log(name, number) {
    console.log(name, number)
}

firstListener = Trigger.on('log-event', log,  'first')
secondListener = Trigger.once('log-event', log, 'second')
```

and then triggered with 

```js
Trigger('log-event', 1)
Trigger('log-event', 2)
secondListener.reattach('log-event')
Trigger('log-event', 3)
firstListener.cancel()
Trigger('log-event', 4)
```

result is going to be similar to:
```js
//Trigger('log-event', 1)
log('first', 1)
log('second', 1)
//Trigger('log-event', 2)
log('first', 2) 
//second listener is not called because it was set to only trigger once
//Trigger('log-event', 3)
log('first', 3)
log('second', 3) //second listener was reattached by secondListener.reattach() 
//Trigger('log-event', 4)
//first listener was cancelled manually and second was still set up to only trigger once
```

with output 
```
first 1
second 1
first 2
first 3
second 3
```

More elaborate example in `examples/global`

### Object triggers

`Trigger.createTriggers` creates an object with field that act as functions that call events with themselves as keys.

For example:
```js
const triggers = Trigger.createTriggers('first', 'second', 'third')

function log(name, number) {
    console.log(name, number)
}

Trigger.on(triggers.first, log, '1st')
Trigger.on(triggers.second, log, '2nd')

triggers.second(1)
triggers.first(2)
```

will output
```
2nd 1
1st 2
```

More elaborate example in `examples/triggers`

### Triggerified object

`Trigger.ify` function wraps specified methods oof passed object into triggers.

Example:

```js
let  element = {
    text : "",
    
    setText(text) {
        this.text = text  
    },
}

element = Trigger.ify(element, 'setText')

function log(name, number) {
    console.log(name, number)
}

Trigger.on(element.setText, log, 'Set text to ')

element.setText("123")
```

will output

```
Set text to 123
```

More elaborate example in `examples/ify`

### Advanced: Trigger modes

There are 4 triggering modes that affect sequencing of concurrent events:
- NOW - callback is called immediately
- NEXT - callback is called immediately unless another trigger callback is already executing, in which case current callback will be placed next in queue
- QUEUE - callback is called immediately unless another trigger callback is already executing, in which case current callback will be placed in the end of callback queue
- ASYNC - callback is set on zero-millisecond timeout to execute as soon as JS engine is free. This ensures callback does not interrupt executing code.

Default mode is NOW, as mixture of concurrent triggers can cause a confusing mess otherwise, but in some cases you need different behavior.

There are several methods to control modes:
- Set `Trigger.mode` to and of `Trigger.MODES.<name>` constants
- Use specific handler's `setMode` to set its execution mode
- Use special functions `Trigger.now`, `Trigger.next`, `Trigger.queue` and `Trigger.async` to trigger an event instead of plain `Trigger`, which uses current `Trigger.mode`.
