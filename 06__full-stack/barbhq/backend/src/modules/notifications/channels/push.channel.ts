export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushProvider {
  send(input: PushPayload): Promise<void>;
}

export class DevelopmentPushProvider implements PushProvider {
  public sentPushes: PushPayload[] = [];

  async send(input: PushPayload): Promise<void> {
    this.sentPushes.push(input);
    // console.log(`[Push] Tokens: ${input.tokens.length} | Title: ${input.title}`);
  }

  clearHistory(): void {
    this.sentPushes = [];
  }
}

export class PushChannel {
  private provider: PushProvider;

  constructor(provider?: PushProvider) {
    this.provider = provider || new DevelopmentPushProvider();
  }

  setProvider(provider: PushProvider): void {
    this.provider = provider;
  }

  getProvider(): PushProvider {
    return this.provider;
  }

  async send(payload: PushPayload): Promise<void> {
    if (!payload.tokens || payload.tokens.length === 0) {
      return;
    }
    await this.provider.send(payload);
  }
}

export const pushChannel = new PushChannel();
