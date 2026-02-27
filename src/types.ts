export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface InboxState {
  address: string;
  emails: Email[];
  isLoading: boolean;
  lastUpdated: Date;
  expiresAt: Date;
}
