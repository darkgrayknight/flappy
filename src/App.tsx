import { Component, type CSSProperties, type MouseEvent } from "react";
import "./App.css";
import {
	type Flyer,
	pointsPerStep,
	type Settings,
	SettingsPanel,
	type Theme,
} from "./Settings";

const defaultFlyers: Flyer[] = [
	{ name: "Pterodactyl", start: "flyer-close.png", end: "flyer-open.png" },
	{ name: "Bird", start: "bird-down.png", end: "bird-up.png" },
];

const flyerImage = (file: string) => `url('${file}') center / contain no-repeat`;

const cellBorders: Record<Theme, string> = { light: "black", dark: "#555" };

const controlsStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 12,
	marginTop: 8,
};

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
		speed: 5,
		theme: "light",
		colors: {
			light: {
				backColor: "#c9d7e8",
				towerColors: [
					"#006400", // darkgreen
					"#008000", // green
					"#228b22", // forestgreen
					"#2f4f4f", // darkslategray
					"#2e8b57", // seagreen
					"#191970", // midnightblue
				],
			},
			dark: {
				backColor: "#1e2633",
				towerColors: [
					"#3cb371", // mediumseagreen
					"#32cd32", // limegreen
					"#66cdaa", // mediumaquamarine
					"#9acd32", // yellowgreen
					"#20b2aa", // lightseagreen
					"#6495ed", // cornflowerblue
				],
			},
		},
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

interface Cell {
	color: string;
	image?: string;
}

interface GridCellProps {
	cell: Cell;
	theme: Theme;
}

interface GridRowProps {
	row: Cell[];
	theme: Theme;
}

interface GridProps {
	grid: Cell[][];
	theme: Theme;
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

function collides(bird: Bird, towers: Tower[]) {
	return (
		bird.height >= defaults.grid.height ||
		bird.height < 0 ||
		towers.some(
			(tower) =>
				tower.position === bird.position && towerCovers(tower, bird.height),
		)
	);
}

function towerColor(tower: Tower, towerColors: string[]) {
	return towerColors[Math.floor(tower.colorSeed * towerColors.length)];
}

function GridCell({ cell, theme }: GridCellProps) {
	const style: CSSProperties = {
		width: defaults.cell.width,
		height: defaults.cell.height,
		border: `1px solid ${cellBorders[theme]}`,
		background: cell.color,
	};
	// The image sits on its own layer so inverting it leaves the cell color alone.
	const imageStyle: CSSProperties = {
		height: "100%",
		background: cell.image,
		filter: theme === "dark" ? "invert(1)" : undefined,
	};

	return <div style={style}>{cell.image && <div style={imageStyle} />}</div>;
}

function GridRow({ row, theme }: GridRowProps) {
	const style: CSSProperties = { display: "flex" };

	return (
		<div style={style}>
			{row.map((cell, index) => (
				<GridCell key={index} cell={cell} theme={theme} />
			))}
		</div>
	);
}

function Grid({ grid, theme }: GridProps) {
	return (
		<div>
			{grid.map((row, index) => (
				<GridRow key={index} row={row} theme={theme} />
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
		this.startTimer();
		this.applyTheme();
		window.addEventListener("keydown", this.handleKey);
		window.addEventListener("keyup", this.handleKey);
	}

	componentDidUpdate(_: unknown, prevState: GameState) {
		if (prevState.settings.speed !== this.state.settings.speed) {
			this.startTimer();
		}
		this.applyTheme();
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
		window.removeEventListener("keydown", this.handleKey);
		window.removeEventListener("keyup", this.handleKey);
		document.body.classList.remove("dark");
	}

	private startTimer() {
		clearInterval(this.timerID);
		this.timerID = setInterval(this.tick, 1000 / this.state.settings.speed);
	}

	// The theme covers the whole page, not just the game.
	private applyTheme() {
		document.body.classList.toggle("dark", this.state.settings.theme === "dark");
	}

	// Uses an updater so ticks that fire before a render still build on each other.
	private tick = () => {
		this.setState((state) => {
			if (state.crashed || state.paused) {
				return null;
			}

			const towers = this.moveTowers(state.towers, state.settings.pipeGap);
			const bird = { ...state.bird, height: state.bird.height + 1 };
			const score = state.score + pointsPerStep(state.settings);
			return collides(bird, towers)
				? { ...this.crash(state, score), towers }
				: { ...this.fly(state, bird), towers, score };
		});
	};

	private fly(state: GameState, bird: Bird) {
		return {
			bird,
			flapping: bird.height < state.bird.height,
			crashed: false,
			score: state.score,
			highScore: state.highScore,
		};
	}

	private crash(state: GameState, score: number) {
		return {
			bird: { ...state.bird, height: defaults.bird.height },
			flapping: false,
			crashed: true,
			score,
			highScore: Math.max(state.highScore, score),
		};
	}

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
		const colors = settings.colors[settings.theme];
		const grid = Array.from({ length: defaults.grid.height }, () =>
			Array.from(
				{ length: defaults.grid.width },
				(): Cell => ({ color: colors.backColor }),
			),
		);

		for (const tower of towers) {
			if (tower.position >= defaults.grid.width) {
				continue;
			}
			const color = towerColor(tower, colors.towerColors);
			for (let j = 0; j < tower.height; j++) {
				const row = tower.upr ? defaults.grid.height - 1 - j : j;
				grid[row][tower.position] = { color };
			}
		}

		if (bird.height >= 0 && bird.height < defaults.grid.height) {
			const flyer = flyers[settings.flyerIndex];
			grid[bird.height][bird.position].image = flyerImage(
				flapping ? flyer.start : flyer.end,
			);
		}
		return grid;
	}

	private handleClick = () => {
		if (this.state.crashed || this.state.paused) {
			return;
		}

		this.setState((state) => {
			// Check every row the flap passes through, so it can't jump into or
			// over a tower between ticks.
			const bird = { ...state.bird };
			for (let i = 0; i < defaults.bird.boost; i++) {
				bird.height--;
				if (collides(bird, state.towers)) {
					return this.crash(state, state.score);
				}
			}
			return this.fly(state, bird);
		});
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

	// Space flaps like a click while the game is running. Otherwise it's left
	// alone, so it can still type in the settings or press a focused button.
	private handleKey = (event: KeyboardEvent) => {
		if (event.key !== " " || this.state.paused || this.state.crashed) {
			return;
		}
		// Keep space from scrolling the page or pressing a focused button.
		event.preventDefault();
		if (event.type === "keydown" && !event.repeat) {
			this.handleClick();
		}
	};

	private toggleTheme = (event: MouseEvent) => {
		event.stopPropagation();
		this.handleSettingsChange({
			theme: this.state.settings.theme === "dark" ? "light" : "dark",
		});
	};

	private togglePause = (event: MouseEvent) => {
		event.stopPropagation();
		this.setState((state) => ({ paused: !state.paused, started: true }));
	};

	private restart = () => {
		this.setState((state) => ({
			crashed: false,
			paused: false,
			started: true,
			score: 0,
			highScore: Math.max(state.highScore, state.score),
		}));
	};

	private pauseLabel() {
		if (!this.state.paused) {
			return "Pause";
		}
		return this.state.started ? "Resume" : "Start";
	}

	render() {
		return (
			<div onClick={this.handleClick}>
				<Grid grid={this.makeGrid()} theme={this.state.settings.theme} />
				<div style={controlsStyle}>
					<button onClick={this.togglePause}>{this.pauseLabel()}</button>
					{this.state.crashed ? (
						<button onClick={this.restart}>Click to Restart</button>
					) : (
						this.state.score
					)}
					<button onClick={this.toggleTheme}>
						{this.state.settings.theme === "dark" ? "Light mode" : "Dark mode"}
					</button>
				</div>
				<p>
					{this.state.highScore > 0
						? `High Score: ${this.state.highScore}`
						: null}
				</p>
				{this.state.paused && (
					<SettingsPanel
						settings={this.state.settings}
						flyers={this.state.flyers}
						onChange={this.handleSettingsChange}
						onAddFlyer={this.handleAddFlyer}
					/>
				)}
			</div>
		);
	}
}

export default Game;
