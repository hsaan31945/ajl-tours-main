import React, { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

const parsePositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const normalizeMinimum = (min) => parsePositiveInteger(min) || 1;

const ParticipantStepper = ({
  value,
  min = 1,
  onChange,
  className = "",
  inputClassName = "",
}) => {
  const minValue = normalizeMinimum(min);
  const numericValue = Math.max(parsePositiveInteger(value) || minValue, minValue);
  const [draftValue, setDraftValue] = useState(String(numericValue));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(numericValue));
    }
  }, [isEditing, numericValue]);

  const commitValue = (nextValue) => {
    const parsedValue = parsePositiveInteger(nextValue);
    const clampedValue = Math.max(parsedValue || minValue, minValue);
    setDraftValue(String(clampedValue));
    onChange(clampedValue);
  };

  const handleDraftChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setDraftValue(digitsOnly);

    const parsedValue = parsePositiveInteger(digitsOnly);
    if (parsedValue && parsedValue >= minValue) {
      onChange(parsedValue);
    }
  };

  const decrease = () => {
    commitValue(Math.max(numericValue - 1, minValue));
  };

  const increase = () => {
    commitValue(numericValue + 1);
  };

  return (
    <div className={`inline-flex items-center rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 ${className}`}>
      <button
        type="button"
        onClick={decrease}
        disabled={numericValue <= minValue}
        aria-label="Decrease adults"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <Minus size={16} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draftValue}
        onFocus={() => setIsEditing(true)}
        onChange={handleDraftChange}
        onBlur={() => {
          setIsEditing(false);
          commitValue(draftValue);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        aria-label="Adult count"
        className={`h-9 w-12 border-0 bg-transparent px-1 text-center font-semibold text-gray-900 outline-none ${inputClassName}`}
      />
      <button
        type="button"
        onClick={increase}
        aria-label="Increase adults"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default ParticipantStepper;
