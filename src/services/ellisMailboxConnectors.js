// Phase 2 contract only. Live mailbox access must use OAuth and server-side token storage.
export const ELLIS_MAILBOX_PROVIDERS = Object.freeze({
  gmail: {
    id: "gmail",
    label: "Gmail",
    oauth: "OAuth 2.0 with PKCE",
    status: "planned",
  },
  microsoft: {
    id: "microsoft",
    label: "Microsoft 365 / Outlook",
    oauth: "OAuth 2.0 with PKCE",
    status: "planned",
  },
});

export function createMailboxConnectorContract(provider) {
  return {
    provider,
    async beginOAuth() {
      throw new Error(`${provider} OAuth connection is planned for Ellis Phase 2.`);
    },
    async refreshAccessToken() {
      throw new Error(`${provider} token refresh is planned for Ellis Phase 2.`);
    },
    async listMessages() {
      throw new Error(`${provider} inbox sync is planned for Ellis Phase 2.`);
    },
  };
}
