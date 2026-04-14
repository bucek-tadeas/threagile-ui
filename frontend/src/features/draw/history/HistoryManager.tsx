/*

HistoryManager keeps track of various changes in the threat model to allow "undo" and "redo" functionality

  - perform method executes the action as well as store the according do and undo functions on the stack
  - undo method pops the last action, performs the "undo" function and pushes it to the redo stack
  - redo method effectivelly reverts the undo. It perform the "do" function and pushes the action to the undo stack
  - clear method clears both undo and redo stacks
  
*/

interface Action {
    do: () => void;
    undo: () => void;
}

export class HistoryManager {
    private undoStack: Action[] = [];
    private redoStack: Action[] = [];
    private maxCapacity: number;
    private listeners: (() => void)[] = [];

    constructor(maxCapacity = 50) {
        this.maxCapacity = maxCapacity;
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    perform(action: Action) {
        action.do();
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxCapacity) this.undoStack.shift();
        this.redoStack = [];
        this.notify();
    }

    undo() {
        const action = this.undoStack.pop();
        if (action) {
            action.undo();
            this.redoStack.push(action);
            this.notify();
        }
    }

    redo() {
        const action = this.redoStack.pop();
        if (action) {
            action.do();
            this.undoStack.push(action);
            this.notify();
        }
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notify();
    }
}
