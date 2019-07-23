export default class CardArray extends Array{

    static querySelectorAll(selectors) {
        const cardArray = new CardArray(...document.querySelectorAll(selectors))
        cardArray.activeIndex = -1
        cardArray.placeholder = document.querySelector('svg-card.placeholder') || document.createElement('svg-card')
        return cardArray
    }

    next() {
        if(this.activeIndex!==-1 && this.activeIndex!==this.length-1) 
            this.cardSwitch(this[this.activeIndex+1])
    }

    prev() {
        if(this.activeIndex!==-1 && this.activeIndex!==0) 
            this.cardSwitch(this[this.activeIndex-1])
    }
    
    
    
    updateOverlay(card) {
        const readableDate = (release) => {
            Date.prototype.getLitteralMonth = function () {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                return monthNames[this.getMonth()]
            }
    
            Date.prototype.getDatePostfix = function () {
                const date = this.getDate()
                if (date > 3 && date < 21)
                    return 'th'
                switch (date % 10) {
                    case 1:
                        return 'st'
                    case 2:
                        return 'nd'
                    case 3:
                        return 'rd'
                    default:
                        return 'th'
                }
            }
            const date = new Date(`${release[1]} / ${release[2]} / ${release[0]}`)
            return `published on ${date.getLitteralMonth()} ${parseInt(release[2])}${date.getDatePostfix()}, ${release[0]}`
        }
    
        overlay.querySelector('.date').innerText = readableDate(card.info.release)
        overlay.querySelector('.credit').innerText = card.info.credit
        overlay.querySelector('.collab a').innerText = card.info.author
        overlay.classList.add('front')
    }
    
    // pop an card in / out of the list view
    cardPop(card, on) {
        // function as a toggle if no behavior is specified by 'on'
        if (on === undefined)
            on = card.state.open === undefined ? true : !card.state.open
        card.state.open = on
    
        // turn OFF case
        if (!on) {
            if(this.activeIndex!==-1 && this[this.activeIndex] === card) {
                this.activeIndex = -1
                document.dispatchEvent(new CustomEvent('open', { detail: { card: {} } }))
            }
            return this.toggle(card, on, true)
        }
        // turn ON case
        else {
            if (this.activeIndex!==-1 && this[this.activeIndex] !== card) {
                this.cardPop(this[this.activeIndex], false)
                this[this.activeIndex].state.active = false
            }
            this.activeIndex = card.key
            return Promise.all([
                this.toggle(card, on, true),
                card.erase()
            ])
            .then(() => this.afterTransition(card))
        }
    }
    
    // switch from one expanded card to another one without going back to list view, mainly used for next / prev
    cardSwitch(card, on) {
        // function as a toggle if no behavior is specified by 'on'
        if (on === undefined)
            on = card.state.open === undefined ? true : !card.state.open
        card.state.open = on
    
        // turn OFF case
        if (!on) {
            return card.erase()
                .then(() => this.toggle(card, on))
                .then(() => card.unerase())
        // turn ON case
        } else {
            if (this.activeIndex===-1 || this[this.activeIndex] === card)
                throw 'cannot just cardSwitch from nothing, nor cardSwitch to itself'
            const previous = this[this.activeIndex]
            this.activeIndex = card.key
            return this.cardSwitch(previous, false)
                .then(() => this.toggle(card, on))
                .then(() => this.afterTransition(card))
        }
    }
    
    afterTransition = (card) => {
        const animate = () => new Promise(resolve => {
            if(card.state.texted) {
                card.play()
                resolve()
            } else {
                card.alphabet()
                .then(() => {
                    card.play()
                    resolve()
                })
            }
        })

        animate()
        // .then(() => { console.log('toggle and fill #overlay') })
        .then(() => {
            if(card.key!==0){
                const otherCard = this[card.key-1]
                if(!otherCard.state.texted)
                    otherCard.alphabet()
            }
            if(card.key!==this.length-1){
                const otherCard = this[card.key+1]
                if(!otherCard.state.texted)
                    otherCard.alphabet()
            }
        })
    }

    toggle(card, on = false, animate = false, duration = .5) {

        const getAction = (resolve) => () => {
            card.state.queued = true
            // memorize
            let orig 
            if(animate) orig = card.getBoundingClientRect()
            // apply
            card.state.front = on
            if(on){
                if(card.classList.contains('featured'))
                    this.placeholder.classList.add('featured')
                card.state.active = true
                card.parentNode.insertBefore(this.placeholder, card)
            } else {
                this.placeholder.classList.remove('featured')
                this.placeholder.remove()
            }
            if(animate)
                animation(orig, resolve)
            else 
                after(resolve)
    
        }
    
        const animation = (orig, resolve) => {
            const dest = card.getBoundingClientRect()
            // transform
            const wRatio = orig.width / dest.width
            const hRatio = orig.height / dest.height
            card.style.transition = `none`
            card.svg.style.transition = `none`
            card.style.transform = `translate(${orig.left - dest.left}px, ${orig.top - dest.top}px) scale(${wRatio}, ${hRatio})`
            card.svg.style.transform = `translate(-50%, -50%) scale(${Math.min(wRatio, hRatio) / wRatio}, ${Math.min(wRatio, hRatio) / hRatio})`
            // release
            requestAnimationFrame(() => {
                card.style.transition = `transform ${duration}s linear`
                card.svg.style.transition = `transform ${duration}s linear`
                card.style.transform = `translate(0, 0) scale(1, 1)`
                card.svg.style.transform = `translate(-50%, -50%) scale(1, 1)`
                setTimeout(() => after(resolve), duration*1000)
            })
        }
    
        const after = (resolve) => {
            if(!on)
                card.state.active = false
            resolve()
            const queued = card.state.queued
            delete card.state.queued
            if(typeof queued === 'function')
                queued()
        }
    
        return new Promise(resolve => {
            const action = getAction(resolve)
            if(card.state.queued)
                card.state.queued = action
            else
                action()
        })
        
    }
}