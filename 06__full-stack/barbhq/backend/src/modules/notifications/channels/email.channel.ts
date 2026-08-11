export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(input: EmailPayload): Promise<void>;
}

export class DevelopmentEmailProvider implements EmailProvider {
  public sentEmails: EmailPayload[] = [];

  async send(input: EmailPayload): Promise<void> {
    this.sentEmails.push(input);
    // console.log(`[Email] To: ${input.to} | Subject: ${input.subject}`);
  }

  clearHistory(): void {
    this.sentEmails = [];
  }
}

export class EmailChannel {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || new DevelopmentEmailProvider();
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  getProvider(): EmailProvider {
    return this.provider;
  }

  async send(payload: EmailPayload): Promise<void> {
    await this.provider.send(payload);
  }
}

export const emailChannel = new EmailChannel();
