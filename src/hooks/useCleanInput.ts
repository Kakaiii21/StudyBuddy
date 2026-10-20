// src/hooks/useCleanInput.ts
import { useState } from "react";
import { containsBadWords } from "../utils/contentFilter";

export function useCleanInput(initial = "") {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  const onChange = (next: string) => {
    if (containsBadWords(next)) {
      setError("Inappropriate language isn't allowed.");
      return; // reject the keystroke or paste
    }
    setError("");
    setValue(next);
  };

  return { value, setValue, onChange, error };
}