import Trigger from "../../src/trigger.js"

class Timer {
    #timeout = null
    
    constructor(name, period = 100) {
        this.name = name
        this.period = period
        
        this.triggers = Trigger.createTriggers('start', 'tick', 'stop')
    }
    
    start() {
        if (this.#timeout !== null)
            return
        
        this.#timeout = setTimeout(this.tick.bind(this), this.period)
        
        this.triggers.start()
    }
    
    tick() {
        this.triggers.tick(this.period)
        
        this.#timeout = setTimeout(this.tick.bind(this), this.period)
    }
    
    stop() {
        if (this.#timeout === null)
            return
        
        clearTimeout(this.#timeout)
        
        this.triggers.stop()
    }
}

class ProgressBar {
    constructor(name = "Bar", max = 1000, timer = null) {
        this.max = max
        this.name = name
        this.value = 0
        
        this.display = document.createElement("div")
        this.display.className = "bar"
        document.getElementById("container").appendChild(this.display)
        
        this.setValue(0)
        
        if (timer)
            Trigger.on(timer.triggers.tick, this.advance.bind(this))
        //Another approach:
        //Trigger.on(timer.triggers.tick, (amount) => this.advance(amount))
        
        this.triggers = Trigger.createTriggers("completed")
    }
    
    advance(amount) {
        let newValue = this.value + amount
        const timesCompleted = Math.floor(newValue / this.max)
        if (timesCompleted > 0) {
            newValue -= timesCompleted * this.max
            this.triggers.completed(timesCompleted)
        }
        this.setValue(newValue)
    }
    
    setValue(value) {
        this.value = value
        const progress = this.value / this.max * 100
        this.display.style.setProperty('--progress', progress)
        this.display.innerText = `${this.name}: ${progress.toFixed(0)}%`
    }
}

class TimerCounter {
    results = {}
    
    constructor(...timers) {
        this.display = document.createElement("pre")
        this.display.className = "results"
        document.getElementById("container").appendChild(this.display)
        
        timers.forEach(timer =>
            Trigger.on(timer.triggers.tick, () => {
                this.results[timer.name] = (this.results[timer.name] ?? 0) + 1
                this.updateDisplay()
            })
        );
    }
    
    updateDisplay() {
        this.display.innerText = Object.entries(this.results)
            .map(([name, value]) => `Timer "${name}" ticked ${value} times`)
            .join("\n")
    }
}

window.onload = () => {
    const fastTimer = new Timer("fast", 100)
    const slowTimer = new Timer("slow", 700)
    
    new ProgressBar("Fast 2 seconds", 2000, fastTimer)
    const slowestFast = new ProgressBar("Fast 5 seconds", 5000, fastTimer)
    new ProgressBar("Slow 2 seconds", 2000, slowTimer)
    new ProgressBar("Slow 5 seconds", 5000, slowTimer)
    const slowestSlow = new ProgressBar("Slow 27 seconds", 6000, slowTimer)
    
    new TimerCounter(slowTimer, fastTimer)
    
    fastTimer.start()
    slowTimer.start()
    
/*
     First trigger has ASYNC mode so that event handlers is called only after triggering function finishes.
*/
    Trigger.once(slowestFast.triggers.completed, () => {
        console.log("stopping the first timer")
        fastTimer.stop()
    }).setMode(Trigger.MODES.ASYNC)

/*
    Second trigger uses default mode in this example, which results in calling `Timer.stop` before
    `Timer.tick` sets up next tick. I'm leaving this in as an example of a way things can go wrong
    with immediate triggers. Notice how second timer won't stop.
*/
    const secondTrigger = Trigger.once(slowestSlow.triggers.completed, () => {
        console.log("stopping the second timer fails")
        slowTimer.stop()
    })
}
