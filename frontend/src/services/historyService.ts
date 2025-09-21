import React from 'react';

interface HistoryAction {
  id: string;
  timestamp: Date;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'PATIENT' | 'APPOINTMENT' | 'INVOICE' | 'TREATMENT';
  entityId: string;
  description: string;
  previousData?: any;
  newData?: any;
  userId: string;
  undoable: boolean;
}

class HistoryService {
  private static instance: HistoryService;
  private history: HistoryAction[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  public addAction(action: Omit<HistoryAction, 'id' | 'timestamp'>): void {
    const newAction: HistoryAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
    };

    // Si estamos en medio del historial, eliminar todo lo posterior
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Añadir nueva acción
    this.history.push(newAction);
    this.currentIndex++;

    // Limitar el tamaño del historial
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
      this.currentIndex = this.history.length - 1;
    }

    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public canUndo(): boolean {
    return this.currentIndex >= 0 && this.history[this.currentIndex]?.undoable === true;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public async undo(): Promise<HistoryAction | null> {
    if (!this.canUndo()) return null;

    const action = this.history[this.currentIndex];
    this.currentIndex--;
    
    this.saveToLocalStorage();
    this.notifyListeners();
    
    return action;
  }

  public async redo(): Promise<HistoryAction | null> {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const action = this.history[this.currentIndex];
    
    this.saveToLocalStorage();
    this.notifyListeners();
    
    return action;
  }

  public getHistory(): HistoryAction[] {
    return [...this.history];
  }

  public getRecentActions(limit: number = 10): HistoryAction[] {
    return this.history.slice(-limit).reverse();
  }

  public getCurrentAction(): HistoryAction | null {
    return this.history[this.currentIndex] || null;
  }

  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(): void {
    try {
      const data = {
        history: this.history,
        currentIndex: this.currentIndex,
      };
      localStorage.setItem('clinic_history', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('clinic_history');
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.history || [];
        this.currentIndex = data.currentIndex ?? -1;
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
  }
}

export default HistoryService;

// Hook para usar el servicio en componentes React
export const useHistory = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const historyService = HistoryService.getInstance();

  React.useEffect(() => {
    return historyService.subscribe(forceUpdate);
  }, []);

  return {
    canUndo: historyService.canUndo(),
    canRedo: historyService.canRedo(),
    undo: () => historyService.undo(),
    redo: () => historyService.redo(),
    getRecentActions: (limit?: number) => historyService.getRecentActions(limit),
    addAction: (action: any) => historyService.addAction(action),
  };
};