# Console Game Visualization
This Visualization demostrates how console game industry has changed from 1980 to 2003.
During this time, we can inspect what's the proportion of each game consoles at that time. 

## Demo
![](./demo.gif)

## Process
### Detail Implementation
For this project, the core mechanism is to bind the stacked area chart with the scrolling behaviour.

To achieve this mechanism, I use `EventListener` to listen the `scroll` behaviour and calculate the offset of how much I have scrolled on the current page.

And to achieve the drawing effect, I firstly drawed the whole chrat and put a full-size `mask` for each sub-graph. Then, I can bind the offset we got previously with the mask's width. Thus, we can achieve the drawing effect while scrolling.

### Compromise
Using this solution, I can not listen to the apperance of some certain elements in the `HTML`. That is to say, I can not exactly match the text content with the graph.

Apart from that, because of the massive information of console games, I only showed the most important consoles, events, and games. 

### Self-evaluation
Overall, this project can successfully convey what was happening at that time in the console game industry. However, this project does need to build up a more contextual connection, like the console, the game, and the company.

In this way, I could best conveuy my story to the audience.

## Usage

`yarn` OR `npm install`, To install dependencies.

`yarn start` or `npm run start` to start the project.

`yarn build` or `npm run build` to build the project. And you can host the built html file in the public folder.
