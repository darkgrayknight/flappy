import type { CSSProperties, FormEvent } from "react";

export interface Flyer {
	name: string;
	start: string;
	end: string;
}

export type Theme = "light" | "dark";

export interface Colors {
	backColor: string;
	towerColors: string[];
}

export interface Settings {
	pipeGap: number;
	// Steps per second: how fast the pipes move and the flyer falls.
	speed: number;
	theme: Theme;
	// Each theme keeps its own colors; the panel edits the active theme's.
	colors: Record<Theme, Colors>;
	flyerIndex: number;
}

export const pipeGapRange = { min: 2, max: 16 };
export const speedRange = { min: 2, max: 12 };

interface SettingsPanelProps {
	settings: Settings;
	flyers: Flyer[];
	onChange: (changes: Partial<Settings>) => void;
	onAddFlyer: (flyer: Flyer) => void;
}

const panelStyle: CSSProperties = {
	display: "flex",
	flexWrap: "wrap",
	alignItems: "center",
	gap: "8px 24px",
	margin: "8px 0",
};

const rowStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 4,
};

export function SettingsPanel({
	settings,
	flyers,
	onChange,
	onAddFlyer,
}: SettingsPanelProps) {
	const colors = settings.colors[settings.theme];
	const { towerColors } = colors;

	const setColors = (changes: Partial<Colors>) =>
		onChange({
			colors: { ...settings.colors, [settings.theme]: { ...colors, ...changes } },
		});

	const setTowerColor = (index: number, color: string) =>
		setColors({
			towerColors: towerColors.map((c, i) => (i === index ? color : c)),
		});

	const removeTowerColor = (index: number) =>
		setColors({ towerColors: towerColors.filter((_, i) => i !== index) });

	const addTowerColor = () =>
		setColors({ towerColors: [...towerColors, towerColors[towerColors.length - 1]] });

	const handleAddFlyer = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const start = data.get("start");
		const end = data.get("end");
		if (!(start instanceof File) || !(end instanceof File)) {
			return;
		}
		const name =
			String(data.get("name") ?? "").trim() || `Custom ${flyers.length + 1}`;
		onAddFlyer({
			name,
			start: URL.createObjectURL(start),
			end: URL.createObjectURL(end),
		});
		form.reset();
	};

	return (
		<fieldset style={panelStyle} onClick={(e) => e.stopPropagation()}>
			<legend>Settings</legend>
			<label style={rowStyle}>
				Pipe gap:
				<input
					type="range"
					min={pipeGapRange.min}
					max={pipeGapRange.max}
					value={settings.pipeGap}
					onChange={(e) => onChange({ pipeGap: Number(e.target.value) })}
				/>
				<output>{settings.pipeGap}</output>
			</label>
			<label style={rowStyle}>
				Speed:
				<input
					type="range"
					min={speedRange.min}
					max={speedRange.max}
					value={settings.speed}
					onChange={(e) => onChange({ speed: Number(e.target.value) })}
				/>
				<output>{settings.speed}</output>
			</label>
			<label style={rowStyle}>
				Background:
				<input
					type="color"
					value={colors.backColor}
					onChange={(e) => setColors({ backColor: e.target.value })}
				/>
			</label>
			<div style={rowStyle}>
				Pipe colors:
				{towerColors.map((color, index) => (
					<span key={index} style={rowStyle}>
						<input
							type="color"
							aria-label={`Pipe color ${index + 1}`}
							value={color}
							onChange={(e) => setTowerColor(index, e.target.value)}
						/>
						<button
							type="button"
							aria-label={`Remove pipe color ${index + 1}`}
							disabled={towerColors.length === 1}
							onClick={() => removeTowerColor(index)}
						>
							&times;
						</button>
					</span>
				))}
				<button type="button" onClick={addTowerColor}>
					Add color
				</button>
			</div>
			<label style={rowStyle}>
				Flyer:
				<select
					value={settings.flyerIndex}
					onChange={(e) => onChange({ flyerIndex: Number(e.target.value) })}
				>
					{flyers.map((flyer, index) => (
						<option key={index} value={index}>
							{flyer.name}
						</option>
					))}
				</select>
			</label>
			<form style={rowStyle} onSubmit={handleAddFlyer}>
				Custom flyer:
				<input name="name" placeholder="Name" size={10} />
				<label>
					Wings down <input name="start" type="file" accept="image/*" required />
				</label>
				<label>
					Wings up <input name="end" type="file" accept="image/*" required />
				</label>
				<button type="submit">Add flyer</button>
			</form>
		</fieldset>
	);
}
