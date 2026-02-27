export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface InboxState {
  id: string;
  address: string;
  domain: string;
  emails: Email[];
  isLoading: boolean;
  lastUpdated: Date;
  expiresAt: Date;
  timeLeft: number;
  token?: string;
  accountId?: string;
}

