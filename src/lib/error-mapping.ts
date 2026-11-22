import enMessages from '@/messages/en.json';

const knownCodes = new Set(Object.keys(enMessages.errors));

export function mapErrorCode(code: string | undefined | null): string {
  if (!code) return 'errors.unknown';
  switch (code) {
    case 'UNAUTHORIZED':
      return 'errors.sessionExpired';
    case 'NETWORK_ERROR':
      return 'errors.network';
    case 'TIMEOUT':
      return 'errors.timeout';
    case 'ABORTED':
      return 'errors.aborted';
    default:
      return knownCodes.has(code) ? `errors.${code}` : 'errors.unknown';
  }
}
