import Trigger from "../../src/trigger.js"

class Timer {
    #timeout = null
    
    constructor(name, period = 100) {
        this.name = name
        this.period = period
    }
    
    start() {
        if (this.#timeout !== null)
            return
        
        this.#timeout = setTimeout(() => this.tick(this.period), this.period)
    }
    
    tick() {
        this.#timeout = setTimeout(() => this.tick(this.period), this.period)
    }
    
    stop() {
        if (this.#timeout === null)
            return
        
        clearTimeout(this.#timeout)
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
        
        if (timer)
            Trigger.on(timer.tick, this.advance.bind(this))
        //Another approach:
        //Trigger.on(timer.tick, (amount) => this.advance(amount))
        
        this.setValue(0)
    }
    
    advance(amount) {
        let newValue = this.value + amount
        const timesCompleted = Math.floor(newValue / this.max)
        if (timesCompleted > 0) {
            newValue -= timesCompleted * this.max
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
            Trigger.on(timer.tick, () => {
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
    const fastTimer = Trigger.ify(new Timer("fast", 100), 'tick')
    const slowTimer = Trigger.ify(new Timer("slow", 700), 'tick')
    
    new ProgressBar("Fast 2 seconds", 2000, fastTimer)
    new ProgressBar("Fast 5 seconds", 5000, fastTimer)
    new ProgressBar("Slow 2 seconds", 2000, slowTimer)
    new ProgressBar("Slow 5 seconds", 5000, slowTimer)
    const slowest = Trigger.ify(new ProgressBar("Slow 27 seconds", 27000, slowTimer), 'setValue')
    
    new TimerCounter(slowTimer, fastTimer)
    
    fastTimer.start()
    slowTimer.start()
    
    Trigger.on(slowest.setValue, (value) => console.log(value))
}
