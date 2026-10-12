import React, {  } from 'react';
import './App.css';

var backColor = '#c9d7e8'
var towerColors = ['darkgreen','green','forestgreen','darkslategray','seagreen','midnightblue']

var defaults = {
	bird: { background: 'url(\'bird-down.png\') ' + backColor, backgroundUp: 'url(\'bird-up.png\') ' + backColor, height: 10, position: 2, boost: 2 },
	tower: { color: 'darkgreen', minHeight: 3, maxHeight: 7, count: 8, spacing: 4 },
	grid: { height: 20, width: 32 },
	cell: { color: backColor, height: 30, width: 30 }
}

function rand(maxInterval, minOffset){
	minOffset = minOffset || 0;
	if (arguments.length){
		return Math.floor(Math.random() * maxInterval) + minOffset;
	} else {
		return Math.random();
	}
}

function GridCell(props) {
	var style = {
		width:defaults.cell.width,
		height:defaults.cell.height,
		border:'1px solid black',
		background:props.cell
	}
	return (
		<div style = {style}>
		</div>
	)
}

function GridRow(props){
	var style = {
		display: 'flex'
	}
	return (
		<div style = {style}>
		{
			props.row.map((cell) => {
				return <GridCell cell={cell}/>
			})
		}
		</div>
	)
}

function Grid(props) {
	return (
		<div>
			{
				props.grid.map((row) => {
					return <GridRow row = {row}/>
				})
			}
		</div>
	)
}

class Game extends React.Component {
	constructor(props) {
		super(props)
		var grid = this.makeGridArray()
		var bird = {
			height: defaults.bird.height,
			position: defaults.bird.position
		}
		var towers = this.makeTowers()
		grid[bird.height][bird.position] = defaults.bird.background
		this.state = { grid: grid, bird: bird, towers: towers, crashed: false, score: 0, highScore: 0 }

		this.timerID = setInterval(() => {
			if (this.state.crashed)
				return
			var gridCopy = this.makeGridArray()
			var towersCopy = this.state.towers.slice()
			this.setTowers(towersCopy, gridCopy);
			var birdCopy = this.state.bird
			birdCopy.height++
			var crashed = false
			if (birdCopy.height >= defaults.grid.height || birdCopy.height < 0) {
				birdCopy.height = defaults.bird.height
				crashed = true
			}
			for (let i = 0; i < defaults.grid.height; i++) {
				if (towerColors.includes(gridCopy[i][defaults.bird.position]) && (birdCopy.height === i)) {
					birdCopy.height = defaults.bird.height
					crashed = true
				}
			}
			gridCopy[birdCopy.height][birdCopy.position] = defaults.bird.backgroundUp
			var newScore = this.state.score + 1
			var highScore = (crashed && (newScore > this.state.highScore)) ? newScore : this.state.highScore
			this.setState({ grid: gridCopy, bird: birdCopy, towers: towersCopy, crashed: crashed, score: newScore, highScore: highScore })
		}, 200)
	}
	getRandTowerHeight() {
		return rand(defaults.tower.maxHeight, defaults.tower.minHeight)
	}
	setTowers(towers, grid) {
		for (let i = 0; i < towers.length; i++) {
			towers[i].position--;
			if (towers[i].position < 0) {
				towers[i].position = defaults.grid.width - 1;
				towers[i].height = this.getRandTowerHeight();
				towers[i].color = towerColors[rand(6)];
			}
			var towerColor = towers[i].color;
			for (let j = 0; j < towers[i].height; j++) {
				let start = (towers[i].upr) ? ((defaults.grid.height - 1) - j) : j;
				grid[start][towers[i].position] = towerColor;
			}
		}
	}
	getRandTowerPosition(pos) {
		return ((pos === 0) ? defaults.bird.position + 1 : defaults.tower.spacing + pos)
	}
	getRandTowerUpr(i) {
		return (i % 2 === 0) ? true : false;
	}
	makeTowers() {
		let towers = []
		let pos = 0
		for (let i = 0; i < defaults.tower.count; i++) {
			towers.push({ position: pos = this.getRandTowerPosition(pos), height: this.getRandTowerHeight(), upr: this.getRandTowerUpr(i), color: towerColors[rand(6)] })
		}
		return towers
	}
	makeGridArray() {
		var grid = []
		for (let i = 0; i < defaults.grid.height; i++) {
			grid.push(new Array(defaults.grid.width).fill(defaults.cell.color))
		}
		return grid
	}
	handleClick() {
		if (this.state.crashed)
			return;
		let birdCopy = this.state.bird;
		let gridCopy = this.state.grid;
		gridCopy[birdCopy.height][birdCopy.position] = defaults.cell.color;
		birdCopy.height -= defaults.bird.boost;
		gridCopy[birdCopy.height][birdCopy.position] = defaults.bird.background;
		this.setState({ bird: birdCopy, grid: gridCopy });
	}
	restart() {
		var highScore = this.state.highScore
		if (highScore < this.state.score)
			highScore = this.state.score
		this.setState({ crashed: false, score: 0, highScore: highScore })
	}
	render() {
		return (
			<div onClick={this.handleClick.bind(this)}>
				<Grid grid={this.state.grid} />
				{this.state.crashed ? <button onClick={this.restart.bind(this)}>Click to Restart</button> : this.state.score}
				<p>
					{this.state.highScore > 0 ? 'High Score: ' + this.state.highScore : null}
				</p>
			</div>
		)
	}
}

export default Game;
