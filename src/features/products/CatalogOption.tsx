export function CatalogOption({
  options,
  value,
  onChange,
  disabled = false,
  vi = true,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  vi?: boolean;
}) {
  if (!options.length) return null;
  if (options.length === 1 && value === options[0])
    return (
      <div className="catalogSpecification">
        <strong>{vi ? "Quy cách" : "Product option"}</strong>
        <p style={{ margin: "4px 0", overflowWrap: "anywhere" }}>
          {options[0]}
        </p>
      </div>
    );
  return (
    <label>
      <span className="formLabelText">
        {vi ? "Chọn quy cách" : "Choose product option"}{" "}
        <span className="requiredMark" aria-hidden="true">
          *
        </span>
      </span>
      <select
        value={options.includes(value) ? value : ""}
        required
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {vi ? "Chọn quy cách" : "Choose product option"}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
