/*

Helper function for hisotry manager to save information in history after focus/de-focus and not after every character input

*/

import { useRef } from "react";
import type { HistoryManager } from "@features/draw/history/HistoryManager";

export function useHistoryField<T>(
    value: T,
    setValue: (v: T) => void,
    history: HistoryManager
) {
    const initialRef = useRef<T | undefined>(undefined);

    const handleFocus = () => {
        try {
            initialRef.current = typeof structuredClone === "function"
                ? (structuredClone(value) as T)
                : (JSON.parse(JSON.stringify(value)) as T);
        } catch {
            initialRef.current = value;
        }
    };

    const handleBlur = (newVal: T) => {
        const oldVal = initialRef.current === undefined ? value : initialRef.current;

        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
            initialRef.current = undefined;
            return;
        }

        history.perform({
            do: () => setValue(newVal),
            undo: () => setValue(oldVal as T),
        });

        initialRef.current = undefined;
    };

    return { handleFocus, handleBlur };
}
