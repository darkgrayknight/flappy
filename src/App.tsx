import { Component, type ChangeEvent, type CSSProperties } from "react";
import "./App.css";

const flyers = [
	{ name: "Pterodactyl", start: "flyer-close.png", end: "flyer-open.png" },
	{ name: "Bird", start: "bird-down.png", end: "bird-up.png" },
];

const backColor = "#c9d7e8";

const flyerImage = (file: string) =>
	`url('${file}') center / contain no-repeat ${backColor}`;
const towerColors = [
	"darkgreen",
	"green",
	"forestgreen",
	"darkslategray",
	"seagreen",
	"midnightblue",
];

const defaults = {
	bird: {
		height: 10,
		position: 2,
		boost: 2,
	},
	tower: { minHeight: 3, maxHeight: 7, count: 8, spacing: 4 },
	grid: { height: 20, width: 32 },
	cell: { color: backColor, height: 30, width: 30 },
};

interface Bird {
	height: number;
	position: number;
}

interface Tower {
	position: number;
	height: number;
	upr: boolean;
	color: string;
}

interface GameState {
	grid: string[][];
	bird: Bird;
	towers: Tower[];
	crashed: boolean;
	score: number;
	highScore: number;
	flyerIndex: number;
}

interface GridCellProps {
	cell: string;
}

interface GridRowProps {
	row: string[];
}

interface GridProps {
	grid: string[][];
}

function rand(): number;
function rand(maxInterval: number, minOffset?: number): number;
function rand(maxInterval?: number, minOffset = 0): number {
	if (maxInterval === undefined) {
		return Math.random();
	}
	return Math.floor(Math.random() * maxInterval) + minOffset;
}

function GridCell({ cell }: GridCellProps) {
	const style: CSSProperties = {
		width: defaults.cell.width,
		height: defaults.cell.height,
		border: "1px solid black",
		background: cell,
	};

	return <div style={style} />;
}

function GridRow({ row }: GridRowProps) {
	const style: CSSProperties = { display: "flex" };

	return (
		<div style={style}>
			{row.map((cell, index) => (
				<GridCell key={index} cell={cell} />
			))}
		</div>
	);
}

function Grid({ grid }: GridProps) {
	return (
		<div>
			{grid.map((row, index) => (
				<GridRow key={index} row={row} />
			))}
		</div>
	);
}

class Game extends Component<Record<string, never>, GameState> {
	private timerID: ReturnType<typeof setInterval> | undefined;

	constructor(props: Record<string, never>) {
		super(props);
		const grid = this.makeGridArray();
		const bird = {
			height: defaults.bird.height,
			position: defaults.bird.position,
		};
		const towers = this.makeTowers();
		grid[bird.height][bird.position] = flyerImage(flyers[0].start);
		this.state = {
			grid,
			bird,
			towers,
			crashed: false,
			score: 0,
			highScore: 0,
			flyerIndex: 0,
		};
	}

	componentDidMount() {
		this.timerID = setInterval(() => {
			if (this.state.crashed) {
				return;
			}

			const grid = this.makeGridArray();
			const towers = this.state.towers.map((tower) => ({ ...tower }));
			this.setTowers(towers, grid);
			const bird = {
				...this.state.bird,
				height: this.state.bird.height + 1,
			};
			let crashed = false;

			if (bird.height >= defaults.grid.height || bird.height < 0) {
				bird.height = defaults.bird.height;
				crashed = true;
			}

			for (let i = 0; i < defaults.grid.height; i++) {
				if (
					towerColors.includes(grid[i][defaults.bird.position]) &&
					bird.height === i
				) {
					bird.height = defaults.bird.height;
					crashed = true;
				}
			}

			grid[bird.height][bird.position] = flyerImage(
				flyers[this.state.flyerIndex].end,
			);
			const score = this.state.score + 1;
			const highScore =
				crashed && score > this.state.highScore
					? score
					: this.state.highScore;
			this.setState({ grid, bird, towers, crashed, score, highScore });
		}, 200);
	}

	componentWillUnmount() {
		if (this.timerID !== undefined) {
			clearInterval(this.timerID);
		}
	}

	private getRandTowerHeight() {
		return rand(defaults.tower.maxHeight, defaults.tower.minHeight);
	}

	private setTowers(towers: Tower[], grid: string[][]) {
		for (const tower of towers) {
			tower.position--;
			if (tower.position < 0) {
				tower.position = defaults.grid.width - 1;
				tower.height = this.getRandTowerHeight();
				tower.color = towerColors[rand(towerColors.length)];
			}

			for (let j = 0; j < tower.height; j++) {
				const row = tower.upr ? defaults.grid.height - 1 - j : j;
				grid[row][tower.position] = tower.color;
			}
		}
	}

	private getRandTowerPosition(position: number) {
		return position === 0
			? defaults.bird.position + 1
			: defaults.tower.spacing + position;
	}

	private makeTowers(): Tower[] {
		const towers: Tower[] = [];
		let position = 0;
		for (let i = 0; i < defaults.tower.count; i++) {
			position = this.getRandTowerPosition(position);
			towers.push({
				position,
				height: this.getRandTowerHeight(),
				upr: i % 2 === 0,
				color: towerColors[rand(towerColors.length)],
			});
		}
		return towers;
	}

	private makeGridArray() {
		return Array.from({ length: defaults.grid.height }, () =>
			new Array<string>(defaults.grid.width).fill(defaults.cell.color),
		);
	}

	private handleClick = () => {
		if (this.state.crashed) {
			return;
		}

		const bird = { ...this.state.bird };
		const grid = this.state.grid.map((row) => [...row]);
		grid[bird.height][bird.position] = defaults.cell.color;
		bird.height -= defaults.bird.boost;
		grid[bird.height][bird.position] = flyerImage(
			flyers[this.state.flyerIndex].start,
		);
		this.setState({ bird, grid });
	};

	private handleFlyerChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const flyerIndex = Number(event.target.value);
		const { bird } = this.state;
		const grid = this.state.grid.map((row) => [...row]);
		grid[bird.height][bird.position] = flyerImage(flyers[flyerIndex].start);
		this.setState({ flyerIndex, grid });
	};

	private restart = () => {
		this.setState((state) => ({
			crashed: false,
			score: 0,
			highScore: Math.max(state.highScore, state.score),
		}));
	};

	render() {
		return (
			<div onClick={this.handleClick}>
				<label onClick={(e) => e.stopPropagation()}>
					Flyer:{" "}
					<select
						value={this.state.flyerIndex}
						onChange={this.handleFlyerChange}
					>
						{flyers.map((flyer, index) => (
							<option key={flyer.name} value={index}>
								{flyer.name}
							</option>
						))}
					</select>
				</label>
				<Grid grid={this.state.grid} />
				{this.state.crashed ? (
					<button onClick={this.restart}>Click to Restart</button>
				) : (
					this.state.score
				)}
				<p>
					{this.state.highScore > 0
						? `High Score: ${this.state.highScore}`
						: null}
				</p>
			</div>
		);
	}
}

export default Game;
