
## FUNC LIST for extras

- [ ] "contact" is a drawable canvas
- [ ] while loading a card, draw scribble (stick figures, sun, house, heart, smiley, hashtag, dicks, math equations, mini graphs) on it and erase them when loaded
- [ ] archive's tag list is scrollable so that the sidebar never exceeds 100vh ? (i still like better the old option: sibebar is sticky if taller than content)
- [ ] on hover, prev and next buttons show keyboard arrow keys (images) to indicate that you can use your keyboard (and archive shows escape key)
- [ ] on list view, arrow keys allow to select a card (w/ style change) and ENTER key pops card. a previously poped card remains the active one until arrow keys navigate


## TECH LIST for technologies to implement

- [ ] find out how to switch to HTTP2
- [ ] add service worker (exclusively for .svg requests): can cache raw .svg (well put stringified versions of PROCESSED svgs (w/ alphabet replaced) in IndexedDB)


## TODO LIST in order of priority

- [ ] prevent scrolling when an <card> is front
- [ ] fix issue when graph is toggled OFF during animation and toggled back ON while animation isn't finished => isn't able to restart properly and we see the animation running from 2 ≠ timelines at the same time
- [ ] figure out why first path of a replaces <span> is always late
- [ ] make processArticleSVG stack callbacks if called several times (it takes time (a little) so it can potentially be called several times while executing)
- [ ] make a getter for SVGs in card.js to harmonize the process of querySelector || request from worker => process
- [ ] on pop-out, card animation seems to start w/ bigger height than 100vh => this is because card padding remains the same amount of px in list && in pop-out, instead it should grow proportionnaly

## PERF LIST for non-blocking performance improvements

- [ ] some cards get called twice on .alphabet(). This is fixed (using state.texted flag) but should be investigated for performance
- [ ] optimization: remove querySelector as much as possible (and cache DOM into variables instead) (especially in the costly alphabet section) (other methods of getting DOM elements are barely faster, no need to optimize for this except in extreme cases)
- [ ] use simple CSS selectors (id is best, classes are preferred, then tags, and then compositing many items)
- [ ] boredom processing of graphs => clearTimeout on IntersectionObserver, load graph on requestIdleCallback, make sure the entire SVG processing has a way to be done async in succession of requestIdleCallbacks (have a 'priority' flag argument for when the processing is for the viewport? or do everything with the same priority but clearTimeout on more UI events) — worker can send a message every time it loads a graph that would have a ≠ structure (not get caught by any customWorkerResponses) and add to a list of graphs that can be bordedom processed
- [ ] batch DOM changes
- [ ] store server-side processed svg to reduce time-to-first-byte
- [ ] preload all modules with <link> attributes
- [ ] *??* perf => add event listeners to cards from within cards.js
- [ ] in list mode, display <text>, in front mode, display <path data-type="writing"> to limit number of nodes (has to be done w/ display:none to get the perf enhancements, will need to wait for current animation to be over before switching)

## TRY LIST for things to investigate

- [ ] *??* separate immediately-needed JS and later-is-fine JS into 2 separate script files
- [ ] *??* use onload="preloadFinished()" on <link> to start worker tasks


----

KEEP IN MIND: both path should start up in parallel 
- path 1: interactivity, pop, event listener, 1st graph opened
- path 2: archives, loading SVGs, processing, intersectionObserver, worker