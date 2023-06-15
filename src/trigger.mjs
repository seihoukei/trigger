//default callback
const doNothing = () => {}

/**
 * @callback HandlerCallback
 * @param {...any} args - own arguments, passed before trigger's arguments
 * @returns {any} - return value for .poll (optional)
 */

/**
 * @callback TransformativeCallback
 * @param {any} input - initial value of return value of previous TransformativeHandler
 * @param {...any} args - own arguments, passed before trigger's arguments
 * @returns {any} - modified value
 */

/**
 * @callback TriggerFunction
 * function that calls Trigger.execute with itself as key
 * @param {...any} args - arguments, passed to handler after own arguments
 */

/**
 * @callback PollFunction
 * function that calls Trigger.poll with itself as key
 * @param {...any} args - arguments, passed to handler after own arguments
 * @returns {[any]} - return values of handlers
 */

/**
 * @callback ModifierFunction
 * function that calls Trigger.modify with itself as key
 * @param {any} input - initial value
 * @param {...any} args - arguments, passed to handler after own arguments
 * @returns {any} - initial value or return value of last handler
 */


/**
 * @class
 * @classdesc handler for an event, associated with a trigger
 */
class TriggerHandler {
    #once = false
    #list = null
    #args = []
    #callback = doNothing()
    #priority = 0
    #cancelled = false
    
    constructor(list, callback = this.#callback, args = this.#args) {
        this.#list = list
        this.#args = args
        this.#callback = callback
    }
    
    // used by handler list
    /**
     * @private
     * executes handler in a non-transformative way
     *
     * used by TriggerHandlerList
     * @param {...any} args - arguments to be passed after own arguments
     * @returns {any} - hand;er's return value
     */
    execute(args) {
        if (this.#once)
            this.cancel()
        
        return this.#callback(...this.#args, ...args)
    }
    
    /**
     * @private
     * executes handler in a transformative way
     *
     * used by TriggerHandlerList
     * @param {any} input - initial value
     * @param {...any} args - arguments to be passed after own arguments
     * @returns {any} - modified value
     */
    modify(input, args) {
        if (this.#once)
            this.cancel()
        
        return this.#callback(input, ...this.#args, ...args)
    }
    
    /**
     * @private
     * returns current #priority value
     *
     * used by TriggerHandlerList
     * @returns {number} - current priority
     */
    getPriority() {
        return this.#priority
    }
    
    /**
     * @private
     * returns current #cancelled value
     *
     * used by TriggerHandlerList
     * @returns {boolean} - current state
     */
    isCancelled() {
        return this.#cancelled
    }
    
    // general purpose
    
    /**
     * cancels a handler so it never executes anymore and queues it for removal
     * @returns {TriggerHandler} itself
     */
    cancel() {
        this.#cancelled = true
        this.#list.queuePurge()
        return this
    }
    
    /**
     * sets priority (higher = executed later)
     * @param {number} value - new value (default is 0)
     * @returns {TriggerHandler} itself
     */
    setPriority(value = 0) {
        this.#priority = value
        this.#list.queuePriorityUpdate()
        return this
    }
    
    /**
     * sets flag for cancellation after next execution
     * @param {boolean} value - new value
     * @returns {TriggerHandler} itself
     */
    setOnce(value = true) {
        this.#once = value
        return this
    }
}

// utility class for internal use
class TriggerHandlerList {
    #handlers = []
    #usesPriorities = false
    #needsPriorityUpdate = false
    #needsPurge = false
    
    constructor(trigger) {
        this.trigger = trigger
    }
    
    addHandler(callback, args) {
        const handler = new TriggerHandler(this, callback, args)
        this.#handlers.push(handler)
        
        if (this.#usesPriorities)
            this.queuePriorityUpdate()
        
        return handler
    }
    
    execute(args) {
        if (this.#needsPriorityUpdate)
            this.#updatePriorities()
        
        for (const handler of this.#handlers)
            if (!handler.isCancelled())
                handler.execute(args)
    }
    
    poll(args) {
        this.#updatePriorities()

        const result = []
        for (const handler of this.#handlers)
            if (!handler.isCancelled())
                result.push(handler.execute(args))
        
        this.#purge()
        
        return result
    }
    
    modify(input, args) {
        if (this.#needsPriorityUpdate)
            this.#updatePriorities()
        
        let result = input
        for (const handler of this.#handlers)
            if (!handler.isCancelled())
                result = handler.modify(result, args)
        
        return result
    }
    
    clear() {
        for (const handler of this.#handlers)
            handler.cancel()
        this.#handlers.clear()
    }
    
    queuePriorityUpdate() {
        this.#needsPriorityUpdate = true
        this.#usesPriorities = true
    }
    
    queuePurge() {
        this.#needsPurge = true
    }
    
    #updatePriorities() {
        if (!this.#needsPriorityUpdate)
            return
        
        this.#purge()
        
        this.#handlers.sort((x,y) => x.getPriority() - y.getPriority())
        this.#needsPriorityUpdate = false
    }
    
    #purge() {
        if (!this.#needsPurge)
            return
        
        this.#handlers = this.#handlers.filter(x => !x.isCancelled())
        this.#needsPurge = false
    }
}

// list for non-transformative handlers
const handlers = new Map()

// list for transformative handlers
const modifiers = new Map()

// private functions
function getHandlerList(lists, trigger, create = false) {
    const list = lists.get(trigger)
    if (list)
        return list
    
    if (!create)
        return null
    
    const newList = new TriggerHandlerList(trigger)
    lists.set(trigger, newList)
    
    return newList
}

function createHandler(lists, trigger, callback, ...args) {
    const list = getHandlerList(lists, trigger, true)
    const handler = list.addHandler(callback, args)
    return handler
}

/**
 * Event handling system
 *
 * Can be used as shorthand for Trigger.execute(trigger, ...args)
 * executes all non-transformative handlers associated with trigger (like array.forEach)
 * @type function
 * @param {any} trigger - trigger key
 * @param {...any} args - arguments provided to each handler after its own arguments
 */
// Trigger() as shorthand for Trigger.execute()
const Trigger = Object.assign(function(trigger, ...args) {
    Trigger.execute(trigger, ...args)
    
}, {
    
    // executors
    
    /**
     * executes all non-transformative handlers associated with trigger
     * (like array.forEach)
     * @param {any} trigger - trigger key
     * @param {...any} args - arguments provided to each handler after its own arguments
     */
    execute(trigger, ...args) {
        getHandlerList(handlers, trigger)?.execute(args)
    },
    
    /**
     * collects return values of all non-transformative handlers associated with trigger
     * (like array.map)
     * @param {any} trigger - trigger key
     * @param {...any} args - arguments provided to each handler after its own arguments
     * @returns {[any]} - array of values returned by handlers
     */
    poll(trigger, ...args) {
        return getHandlerList(handlers, trigger)?.poll(args) ?? []
    },
    
    /**
     * applies all transformative handlers associated with trigger
     * in a chain
     * (like array.reduce)
     * @param {any} input - initial value
     * @param {any} trigger - trigger key
     * @param {...any} args - arguments provided to each handler after its own arguments
     * @returns {any} - value returned by last handler
     */
    modify(input, trigger, ...args) {
        return getHandlerList(modifiers, trigger)?.modify(input, args) ?? input
    },
    
    
    // vanilla constructors
    
    /**
     * creates non-transformative handler
     * @param {any} trigger - trigger key
     * @param {HandlerCallback} callback - function
     * @param {...any} args - arguments passed to handler before trigger arguments
     * @returns {TriggerHandler} handler
     */
    createHandler(trigger, callback, ...args) {
        return createHandler(handlers, trigger, callback, ...args)
    },
    
    /**
     * creates transformative handler
     * @param {any} trigger - trigger key
     * @param {TransformativeCallback} callback - function that transforms input
     * @param {...any} args - arguments passed to handler before trigger arguments
     * @returns {TriggerHandler} handler
     */
    createModifier(trigger, callback, ...args) {
        return createHandler(modifiers, trigger, callback, ...args)
    },
    
    // general use
    
    /**
     *  creates function that triggers using itself as a key
     * @returns {TriggerFunction}
     */
    createTrigger() {
        return function trigger (...args) {
            Trigger.execute(trigger, ...args)
        }
    },
    
    /**
     *  creates function that triggers using itself as a key
     * @returns {PollFunction}
     */
    createPoll() {
        return function trigger (...args) {
            return Trigger.poll(trigger, ...args)
        }
    },
    
    /**
     *  creates function that triggers using itself as a key
     * @returns {ModifierFunction}
     */
    createModification() {
        return function trigger (input, ...args) {
            return Trigger.modify(input, trigger, ...args)
        }
    },
    
    
    /**
     * cancels all handlers for a trigger and removes it from lists
     * @param {any} trigger - trigger key
     */
    clearTrigger(trigger) {
        getHandlerList(handlers, trigger, false).clear()
        handlers.delete(trigger)
    
        getHandlerList(modifiers, trigger, false).clear()
        modifiers.delete(trigger)
    },
    
    // shorthands to handles
    // different behavior in vanilla version (createHandle)
    
    /**
     * creates non-transformative handler that exists for component's lifetime
     *
     * shorthand to Trigger.createHandler()
     * @param {any} trigger - trigger key
     * @param {HandlerCallback} callback - function
     * @param {...any} args - arguments passed to handler before trigger arguments
     * @returns {TriggerHandler} - trigger handler
     */
    on(trigger, callback, ...args) {
        return createHandler(handlers, trigger, callback, ...args)
    },
    
    /**
     * creates non-transformative handler that exists for component's lifetime
     * or until first execution
     *
     * shorthand to Trigger.createHandler().setOnce()
     * @param {any} trigger - trigger key
     * @param {HandlerCallback} callback - function
     * @param {...any} args - arguments passed to handler before trigger arguments
     * @returns {TriggerHandler} - trigger handler
     */
    once(trigger, callback, ...args) {
        return createHandler(handlers, trigger, callback, ...args).setOnce()
    },
})

export default Trigger
