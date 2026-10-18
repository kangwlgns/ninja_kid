import { parseServerMessage } from './protocol';
import type { ClientMessage } from './protocol';
import type { MatchTransport, TransportHandlers } from './transport';

export class SocketClient implements MatchTransport {
  private socket?: WebSocket;

  constructor(private readonly url: string) {}

  connect(handlers: TransportHandlers): void {
    this.close();
    handlers.onStatus('connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.onopen = () => handlers.onStatus('connected');
    socket.onclose = () => handlers.onStatus('disconnected');
    socket.onerror = () => handlers.onError('서버에 연결할 수 없습니다. 주소와 서버 실행 상태를 확인하세요.');
    socket.onmessage = event => {
      try {
        if (typeof event.data !== 'string') throw new Error('텍스트 메시지만 지원합니다.');
        handlers.onMessage(parseServerMessage(event.data));
      } catch (error) {
        handlers.onError(error instanceof Error ? error.message : '메시지 처리에 실패했습니다.');
      }
    };
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) throw new Error('서버 연결이 끊어졌습니다.');
    this.socket.send(JSON.stringify(message));
  }

  close(): void {
    if (!this.socket) return;
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onclose = null;
    this.socket.onerror = null;
    this.socket.close();
    this.socket = undefined;
  }
}
