import Trigger from "../../src/trigger.js"

class ProgressBar {
    constructor(name = "Bar", max = 1000) {
        this.max = max
        this.name = name
        this.value = 0
        
        this.display = document.createElement("div")
        this.display.className = "bar"
        document.getElementById("container").appendChild(this.display)
        
        Trigger.on('advance', this.advance.bind(this))
        //Another approach:
        // Trigger.on('advance', (amount) => this.advance(amount))
        
        this.setValue(0)
    }
    
    advance(amount) {
        let newValue = this.value + amount
        const timesCompleted = Math.floor(newValue / this.max)
        if (timesCompleted > 0) {
            newValue -= timesCompleted * this.max
            Trigger('bar-completed', this.name, timesCompleted)
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

class ProgressCounter {
    results = {}
    elapsed = 0
    
    constructor() {
        this.display = document.createElement("pre")
        this.display.className = "results"
        document.getElementById("container").appendChild(this.display)
        
        Trigger.on('bar-completed', (name, times) => {
            this.results[name] = (this.results[name] ?? 0) + times
            this.updateDisplay()
        })
        
        Trigger.on('advance', (amount) => {
            this.elapsed += amount
            this.updateDisplay()
        })
    }
    
    updateDisplay() {
        this.display.innerText = `Time elapsed : ${
            this.elapsed | 0
        }ms.\nBars completed:\n${
            Object.entries(this.results)
            .map(([name, value]) => `Bar "${name}" completed ${value} times`)
            .join("\n")
        }`
    }
}

window.onload = () => {
    new ProgressBar("80 milliseconds", 80)
    new ProgressBar("1 second", 1000)
    new ProgressBar("3 seconds", 3000)
    new ProgressBar("9 seconds", 9000)
    new ProgressBar("27 seconds", 27000)
    new ProgressCounter()
}

let delay = 0

function randomTimeStep() {
    Trigger("advance", delay)
    delay = Math.random() * 100 + 50
    setTimeout(randomTimeStep, delay)
}

randomTimeStep()
