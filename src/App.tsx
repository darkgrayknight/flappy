import { Component, type CSSProperties, type MouseEvent } from "react";
import "./App.css";
import { type Flyer, type Settings, SettingsPanel } from "./Settings";

const defaultFlyers: Flyer[] = [
	{ name: "Pterodactyl", start: "flyer-close.png", end: "flyer-open.png" },
	{ name: "Bird", start: "bird-down.png", end: "bird-up.png" },
];

const flyerImage = (file: string, backColor: string) =>
	`url('${file}') center / contain no-repeat ${backColor}`;

const defaults = {
	bird: {
		height: 10,
		position: 2,
		boost: 2,
	},
	tower: { minHeight: 3, maxHeight: 7 },
	grid: { height: 20, width: 32 },
	cell: { height: 30, width: 30 },
	settings: {
		pipeGap: 4,
		backColor: "#c9d7e8",
		towerColors: [
			"#006400", // darkgreen
			"#008000", // green
			"#228b22", // forestgreen
			"#2f4f4f", // darkslategray
			"#2e8b57", // seagreen
			"#191970", // midnightblue
		],
		flyerIndex: 0,
	} satisfies Settings,
};

interface Bird {
	height: number;
	position: number;
}

interface Tower {
	position: number;
	height: number;
	upr: boolean;
	// Picks the tower's color from the palette, so palette edits apply to existing towers.
	colorSeed: number;
}

interface GameState {
	bird: Bird;
	towers: Tower[];
	flapping: boolean;
	crashed: boolean;
	paused: boolean;
	started: boolean;
	score: number;
	highScore: number;
	settings: Settings;
	flyers: Flyer[];
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

// Enough towers to span the grid, kept even so top and bottom towers still
// alternate after wrapping around.
function towerCount(pipeGap: number) {
	const count = Math.ceil(defaults.grid.width / pipeGap);
	return count + (count % 2);
}

function towerCovers(tower: Tower, row: number) {
	return tower.upr
		? row >= defaults.grid.height - tower.height
		: row < tower.height;
}

function towerColor(tower: Tower, towerColors: string[]) {
	return towerColors[Math.floor(tower.colorSeed * towerColors.length)];
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
		this.state = {
			bird: {
				height: defaults.bird.height,
				position: defaults.bird.position,
			},
			towers: this.makeTowers(defaults.settings.pipeGap),
			flapping: true,
			crashed: false,
			paused: true,
			started: false,
			score: 0,
			highScore: 0,
			settings: defaults.settings,
			flyers: defaultFlyers,
		};
	}

	componentDidMount() {
		this.timerID = setInterval(this.tick, 200);
	}

	componentWillUnmount() {
		if (this.timerID !== undefined) {
			clearInterval(this.timerID);
		}
	}

	private tick = () => {
		if (this.state.crashed || this.state.paused) {
			return;
		}

		const towers = this.moveTowers(
			this.state.towers,
			this.state.settings.pipeGap,
		);
		const bird = {
			...this.state.bird,
			height: this.state.bird.height + 1,
		};
		const crashed =
			bird.height >= defaults.grid.height ||
			bird.height < 0 ||
			towers.some(
				(tower) =>
					tower.position === bird.position &&
					towerCovers(tower, bird.height),
			);

		if (crashed) {
			bird.height = defaults.bird.height;
		}

		const score = this.state.score + 1;
		const highScore =
			crashed && score > this.state.highScore
				? score
				: this.state.highScore;
		this.setState({
			bird,
			towers,
			flapping: false,
			crashed,
			score,
			highScore,
		});
	};

	private getRandTowerHeight() {
		return rand(defaults.tower.maxHeight, defaults.tower.minHeight);
	}

	private moveTowers(towers: Tower[], pipeGap: number): Tower[] {
		const cycle = towerCount(pipeGap) * pipeGap;
		return towers.map((tower) => {
			const position = tower.position - 1;
			if (position >= 0) {
				return { ...tower, position };
			}
			return {
				...tower,
				position: position + cycle,
				height: this.getRandTowerHeight(),
				colorSeed: rand(),
			};
		});
	}

	private getRandTowerPosition(position: number, pipeGap: number) {
		return position === 0 ? defaults.bird.position + 1 : pipeGap + position;
	}

	private makeTowers(pipeGap: number): Tower[] {
		const towers: Tower[] = [];
		let position = 0;
		for (let i = 0; i < towerCount(pipeGap); i++) {
			position = this.getRandTowerPosition(position, pipeGap);
			towers.push({
				position,
				height: this.getRandTowerHeight(),
				upr: i % 2 === 0,
				colorSeed: rand(),
			});
		}
		return towers;
	}

	private makeGrid() {
		const { bird, towers, flapping, settings, flyers } = this.state;
		const grid = Array.from({ length: defaults.grid.height }, () =>
			new Array<string>(defaults.grid.width).fill(settings.backColor),
		);

		for (const tower of towers) {
			if (tower.position >= defaults.grid.width) {
				continue;
			}
			const color = towerColor(tower, settings.towerColors);
			for (let j = 0; j < tower.height; j++) {
				const row = tower.upr ? defaults.grid.height - 1 - j : j;
				grid[row][tower.position] = color;
			}
		}

		if (bird.height >= 0 && bird.height < defaults.grid.height) {
			const flyer = flyers[settings.flyerIndex];
			grid[bird.height][bird.position] = flyerImage(
				flapping ? flyer.start : flyer.end,
				settings.backColor,
			);
		}
		return grid;
	}

	private handleClick = () => {
		if (this.state.crashed || this.state.paused) {
			return;
		}

		this.setState((state) => ({
			bird: {
				...state.bird,
				height: state.bird.height - defaults.bird.boost,
			},
			flapping: true,
		}));
	};

	private handleSettingsChange = (changes: Partial<Settings>) => {
		this.setState((state) => {
			const settings = { ...state.settings, ...changes };
			// Tower positions depend on the gap, so lay them out again.
			const towers =
				settings.pipeGap === state.settings.pipeGap
					? state.towers
					: this.makeTowers(settings.pipeGap);
			return { settings, towers };
		});
	};

	private handleAddFlyer = (flyer: Flyer) => {
		this.setState((state) => ({
			flyers: [...state.flyers, flyer],
			settings: { ...state.settings, flyerIndex: state.flyers.length },
		}));
	};

	private pause = (event: MouseEvent) => {
		event.stopPropagation();
		this.setState({ paused: true });
	};

	private resume = () => {
		this.setState({ paused: false, started: true });
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
				{this.state.paused ? (
					<SettingsPanel
						settings={this.state.settings}
						flyers={this.state.flyers}
						started={this.state.started}
						onChange={this.handleSettingsChange}
						onAddFlyer={this.handleAddFlyer}
						onResume={this.resume}
					/>
				) : (
					<button onClick={this.pause}>Pause</button>
				)}
				<Grid grid={this.makeGrid()} />
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
