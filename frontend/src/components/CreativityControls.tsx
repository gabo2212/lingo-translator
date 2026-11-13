import {
  TEMP_MAX,
  TEMP_MIN,
  TEMP_STEP,
  TOKENS_MAX,
  TOKENS_MIN,
  TOKENS_STEP,
} from "../lib/constants";

type CreativityControlsProps = {
  temperature: number;
  maxNewTokens: number;
  onTemperatureChange: (value: number) => void;
  onMaxNewTokensChange: (value: number) => void;
};

export function CreativityControls({
  temperature,
  maxNewTokens,
  onTemperatureChange,
  onMaxNewTokensChange,
}: CreativityControlsProps) {
  return (
    <details className="creativity">
      <summary>
        <span>Creativity controls</span>
        <span className="summary-meta">
          Temperature {temperature.toFixed(2)} · {maxNewTokens} tokens
        </span>
      </summary>
      <div className="creativity-body">
        <div>
          <label className="slider-label" htmlFor="temperature">
            Temperature
            <span className="slider-value">{temperature.toFixed(2)}</span>
          </label>
          <input
            id="temperature"
            type="range"
            min={TEMP_MIN}
            max={TEMP_MAX}
            step={TEMP_STEP}
            value={temperature}
            onChange={(event) => onTemperatureChange(Number(event.target.value))}
          />
        </div>
        <div>
          <label className="slider-label" htmlFor="max-new-tokens">
            Max new tokens
            <span className="slider-value">{maxNewTokens}</span>
          </label>
          <input
            id="max-new-tokens"
            type="range"
            min={TOKENS_MIN}
            max={TOKENS_MAX}
            step={TOKENS_STEP}
            value={maxNewTokens}
            onChange={(event) => onMaxNewTokensChange(Number(event.target.value))}
          />
        </div>
      </div>
    </details>
  );
}
