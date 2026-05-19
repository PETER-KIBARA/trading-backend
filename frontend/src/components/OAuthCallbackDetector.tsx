import { useEffect } from 'react';
import { forwardToOAuthRedirect, shouldForwardToOAuthRedirect } from '../services/derivAuth';

/**
 * Deriv sometimes redirects to the registered Website URL root instead of /oauth-redirect.
 * This forwards token/code params to the dedicated handler route.
 */
export const OAuthCallbackDetector: React.FC = () => {
  useEffect(() => {
    const { pathname, search, hash } = window.location;

    if (shouldForwardToOAuthRedirect(pathname, search, hash)) {
      forwardToOAuthRedirect();
    }
  }, []);

  return null;
};

export default OAuthCallbackDetector;
