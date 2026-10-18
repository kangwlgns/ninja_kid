import type { ClientMessage, ServerMessage } from './protocol';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface TransportHandlers {
  onMessage(message: ServerMessage): void;
  onStatus(status: ConnectionStatus): void;
  onError(message: string): void;
}

export interface MatchTransport {
  connect(handlers: TransportHandlers): void;
  send(message: ClientMessage): void;
  close(): void;
}
