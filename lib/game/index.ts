/**
 * GAME ARCHITECTURE INTERFACES & CONTRACTS
 * 
 * In accordance with Vivre's architectural and security guidelines:
 * - All game logic, state transitions, validation, and reward attributions MUST be server-authoritative.
 * - Client applications must never mutate game state directly.
 * - Game history and audit trails must be immutable append-only records.
 * 
 * Note: Core gameplay algorithms are deliberately not implemented here.
 */

export interface GameAction<T = unknown> {
  id: string;
  userId: string;
  actionType: string;
  payload: T;
  clientTimestamp: number;
  serverTimestamp: number;
  signature?: string;
}

export interface GameStateSnapshot {
  version: number;
  userId: string;
  starmapProgress: {
    unlockedNodes: string[];
    currentNodeId: string;
  };
  activeQuestIds: string[];
  completedQuestIds: string[];
  experience: number;
  lastUpdated: string;
}

export interface GameRuleEngine {
  validateAction(action: GameAction, currentState: GameStateSnapshot): Promise<boolean>;
  applyAction(action: GameAction, currentState: GameStateSnapshot): Promise<GameStateSnapshot>;
}
