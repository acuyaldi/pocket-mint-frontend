export interface TelegramConnectionDto {
  status: "ACTIVE" | "NONE";
  linkedAt?: string;
}

export interface TelegramLinkTokenDto {
  token: string;
  expiresAt: string;
}
