
import NextAuth, { type NextAuthOptions, type DefaultSession, type User as DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

// --- Type Augmentation for NextAuth ---
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      hasCompletedSetup?: boolean | undefined; // Can be undefined until fetched by API
    } & DefaultSession['user'];
  }
  interface User extends DefaultUser {
    hasCompletedSetup?: boolean | undefined; // For initial population if needed
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    hasCompletedSetup?: boolean | undefined; // Can be undefined until fetched by API
  }
}
// --- End Type Augmentation ---

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;
let envAuthUrl = process.env.AUTH_URL;
const envNextAuthUrl = process.env.NEXTAUTH_URL;

let criticalEnvError = false;
const guidanceMessages: string[] = [];
let effectiveAuthUrlForLogging = envAuthUrl;

console.info("\x1b[34m%s\x1b[0m", "--- NextAuth.js Configuration & Environment Check ---");

if (envAuthUrl && envNextAuthUrl && envAuthUrl !== envNextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    `WARNING: Both \`AUTH_URL\` ("${envAuthUrl}") and \`NEXTAUTH_URL\` ("${envNextAuthUrl}") are set, and they differ. ` +
    "NextAuth.js v4 (used here) might prioritize `NEXTAUTH_URL`. It's strongly recommended to use only `AUTH_URL` (set to your app's base URL like http://localhost:9002) and remove `NEXTAUTH_URL` from your .env.local file."
  );
  effectiveAuthUrlForLogging = envNextAuthUrl;
} else if (envAuthUrl && envNextAuthUrl && envAuthUrl === envNextAuthUrl) {
    console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: Both \`AUTH_URL\` ("${envAuthUrl}") and \`NEXTAUTH_URL\` ("${envNextAuthUrl}") are set and identical. Using this URL. Consider removing \`NEXTAUTH_URL\` for simplicity.`
    );
    effectiveAuthUrlForLogging = envAuthUrl;
} else if (!envAuthUrl && envNextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    `WARNING: Only \`NEXTAUTH_URL\` ("${envNextAuthUrl}") is set. \`AUTH_URL\` is missing. ` +
    "While NextAuth.js v4 uses `NEXTAUTH_URL`, newer Auth.js versions prefer `AUTH_URL`. " +
    "Consider renaming `NEXTAUTH_URL` to `AUTH_URL` in your .env.local file for future compatibility and clarity (e.g., AUTH_URL=http://localhost:9002)."
  );
  effectiveAuthUrlForLogging = envNextAuthUrl;
} else if (envAuthUrl && !envNextAuthUrl) {
  console.info(
    "\x1b[36m%s\x1b[0m",
    `INFO: Only \`AUTH_URL\` ("${envAuthUrl}") is set. \`NEXTAUTH_URL\` is missing. This is the preferred setup. Using \`AUTH_URL\`.`
  );
  effectiveAuthUrlForLogging = envAuthUrl;
}


if (!effectiveAuthUrlForLogging) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: NEITHER `AUTH_URL` NOR `NEXTAUTH_URL` IS SET in your .env.local file. " +
    "One of these is REQUIRED for NextAuth.js. Please set `AUTH_URL` to your application's base URL (e.g., http://localhost:9002 for local development). Ensure it does NOT have a trailing slash."
  );
  criticalEnvError = true;
} else {
  if (effectiveAuthUrlForLogging.endsWith('/')) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      `WARNING: Your effective auth URL ("${effectiveAuthUrlForLogging}") has a TRAILING SLASH. ` +
      "It's strongly recommended to REMOVE it (e.g., use 'http://localhost:9002' instead of 'http://localhost:9002/')."
    );
  }
  if (process.env.NODE_ENV === 'development' && effectiveAuthUrlForLogging.startsWith('https://')) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      `DEVELOPMENT WARNING: Your effective auth URL ("${effectiveAuthUrlForLogging}") starts with 'https://'. ` +
      "For LOCAL DEVELOPMENT, this should typically be 'http://' (e.g., 'http://localhost:9002') as the Next.js dev server runs on HTTP. Using HTTPS locally can lead to ERR_SSL_PROTOCOL_ERROR. Please verify your .env.local file and ensure AUTH_URL starts with 'http://'."
    );
  } else if (process.env.NODE_ENV !== 'development' && !effectiveAuthUrlForLogging.startsWith('https://')) {
     console.warn(
      "\x1b[33m%s\x1b[0m",
      `PRODUCTION WARNING: Your effective auth URL ("${effectiveAuthUrlForLogging}") starts with 'http://'. ` +
      "For PRODUCTION environments, this should typically be 'https://' for security."
    );
  }
  guidanceMessages.push(`\x1b[36mNextAuth.js: Effective auth URL for constructing callbacks: ${effectiveAuthUrlForLogging}\x1b[0m`);
}

if (!authSecret) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: `AUTH_SECRET` environment variable is NOT SET in your .env.local file. " +
    "Authentication will be insecure and may fail. Generate a strong secret (e.g., `openssl rand -base64 32`) and add it to .env.local."
  );
  criticalEnvError = true;
}

const providers = [];

if (googleClientId && googleClientSecret) {
  guidanceMessages.push(`\x1b[36mNextAuth.js: Using Google Client ID: '${googleClientId}' (from GOOGLE_CLIENT_ID in .env.local)\x1b[0m`);
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
  if (effectiveAuthUrlForLogging && !effectiveAuthUrlForLogging.endsWith('/') && !criticalEnvError) {
    const expectedGoogleCallback = `${effectiveAuthUrlForLogging}/api/auth/callback/google`;
    guidanceMessages.push(
      `\x1b[32mGOOGLE DEBUG ACTION:\x1b[0m In your Google Cloud Console, for the OAuth Client ID \x1b[33m'${googleClientId}'\x1b[0m, ensure the following URL is listed EXACTLY under "Authorized redirect URIs": \x1b[33m${expectedGoogleCallback}\x1b[0m`
    );
  } else if (effectiveAuthUrlForLogging) {
    guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise Google callback URL guidance because the effective auth URL ("${effectiveAuthUrlForLogging}") has issues or critical errors exist. Please fix them first.\x1b[0m`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local). Google login will be disabled."
  );
  if (!googleClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_ID is missing.");
  if (!googleClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_SECRET is missing.");
}

if (githubClientId && githubClientSecret) {
  guidanceMessages.push(`\x1b[36mNextAuth.js: Using GitHub Client ID: '${githubClientId}' (from GITHUB_CLIENT_ID in .env.local)\x1b[0m`);
  providers.push(
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
  if (effectiveAuthUrlForLogging && !effectiveAuthUrlForLogging.endsWith('/') && !criticalEnvError) {
    const expectedGitHubCallback = `${effectiveAuthUrlForLogging}/api/auth/callback/github`;
     guidanceMessages.push(
      `\x1b[32mGITHUB DEBUG ACTION:\x1b[0m In your GitHub OAuth App settings, for the Client ID \x1b[33m'${githubClientId}'\x1b[0m, ensure the following URL is set EXACTLY as the "Authorization callback URL": \x1b[33m${expectedGitHubCallback}\x1b[0m`
    );
  } else if (effectiveAuthUrlForLogging) {
     guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise GitHub callback URL guidance because the effective auth URL ("${effectiveAuthUrlForLogging}") has issues or critical errors exist. Please fix them first.\x1b[0m`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing GitHub OAuth environment variables (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env.local). GitHub login will be disabled."
  );
  if (!githubClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_ID is missing.");
  if (!githubClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_SECRET is missing.");
}

if (providers.length === 0 && !criticalEnvError) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: No OAuth providers (Google, GitHub) are configured due to missing Client IDs/Secrets in .env.local. Authentication will NOT work for these providers."
  );
  criticalEnvError = true;
}

if (process.env.AUTH_URL) {
    const currentAuthUrl = process.env.AUTH_URL;
    const currentNextAuthUrl = process.env.NEXTAUTH_URL;

    let authUrlToUse = currentAuthUrl;

    if (process.env.NODE_ENV === 'development' && currentAuthUrl.startsWith('https://')) {
        console.warn(
            "\x1b[33m%s\x1b[0m",
            `RUNTIME DEVELOPMENT WARNING: \`AUTH_URL\` ("${currentAuthUrl}") starts with 'https://'. This is typically for production. ` +
            "For local development, NextAuth.js expects 'http://' (e.g., 'http://localhost:9002') to avoid SSL errors. " +
            "If you see ERR_SSL_PROTOCOL_ERROR in your browser, this is likely the cause. Ensure AUTH_URL in .env.local is 'http://localhost:9002'."
        );
    }


    if (currentNextAuthUrl && currentNextAuthUrl !== authUrlToUse) {
        console.warn(
            "\x1b[33m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`AUTH_URL\` is "${authUrlToUse}" and \`NEXTAUTH_URL\` is "${currentNextAuthUrl}". ` +
            "Since they differ and NextAuth.js v4 can prioritize `NEXTAUTH_URL`, forcing `NEXTAUTH_URL` to match `AUTH_URL` for consistency."
        );
        process.env.NEXTAUTH_URL = authUrlToUse;
         console.info(
            "\x1b[36m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`process.env.NEXTAUTH_URL\` is NOW "${process.env.NEXTAUTH_URL}". NextAuth.js will use this as its base URL.`
        );
    } else if (!currentNextAuthUrl) {
        console.info(
            "\x1b[36m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`AUTH_URL\` is "${authUrlToUse}" and \`NEXTAUTH_URL\` is not set. ` +
            "Setting `NEXTAUTH_URL` to match `AUTH_URL` for NextAuth.js v4."
        );
        process.env.NEXTAUTH_URL = authUrlToUse;
        console.info(
            "\x1b[36m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`process.env.NEXTAUTH_URL\` is NOW "${process.env.NEXTAUTH_URL}". NextAuth.js will use this as its base URL.`
        );
    } else {
         console.info(
            "\x1b[36m%s\x1b[0m",
            `INFO: \`AUTH_URL\` and \`NEXTAUTH_URL\` are both set and identical ("${authUrlToUse}"). No runtime adjustment needed for this. NextAuth.js will use this as its base URL.`
        );
    }
    if (effectiveAuthUrlForLogging !== process.env.NEXTAUTH_URL) {
         guidanceMessages.push(`\x1b[36mNextAuth.js: Effective auth URL for callbacks was updated by runtime adjustment to: ${process.env.NEXTAUTH_URL}\x1b[0m`);
         effectiveAuthUrlForLogging = process.env.NEXTAUTH_URL; // Update for subsequent logging
    }

} else if (process.env.NEXTAUTH_URL) {
    console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: Only \`NEXTAUTH_URL\` ("${process.env.NEXTAUTH_URL}") is set. NextAuth.js v4 will use this as its base URL.`
    );
     if (process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_URL.startsWith('https://')) {
        console.warn(
            "\x1b[33m%s\x1b[0m",
            `RUNTIME DEVELOPMENT WARNING: \`NEXTAUTH_URL\` ("${process.env.NEXTAUTH_URL}") starts with 'https://'. This is typically for production. ` +
            "For local development, ensure this is 'http://' (e.g., 'http://localhost:9002') to avoid SSL errors. Consider using AUTH_URL instead."
        );
    }
    effectiveAuthUrlForLogging = process.env.NEXTAUTH_URL; // Update for subsequent logging
}


if (guidanceMessages.length > 0) {
    guidanceMessages.forEach(msg => console.info(msg));
}

if (criticalEnvError) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "NextAuth.js Initialization Errors: Due to CRITICAL errors listed above, authentication WILL LIKELY FAIL. Please review your .env.local file and OAuth provider configurations in Google Cloud Console / GitHub."
  );
}
console.info("\x1b[34m%s\x1b[0m", "--- End of NextAuth.js Configuration Check ---");

export const authOptions: NextAuthOptions = {
  providers: providers,
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',

  callbacks: {
    async jwt({ token, user, account, trigger, session: newSessionData }) {
      // Initial sign in: user object from provider might contain hasCompletedSetup
      // if the provider is custom or somehow returns it.
      // For Google/GitHub, it won't. So, token.hasCompletedSetup will be undefined.
      // This undefined state will be the trigger for useAuthState to call the external API.
      if (account && user) {
        if (user.hasCompletedSetup !== undefined) {
          token.hasCompletedSetup = user.hasCompletedSetup;
        }
        // If user.hasCompletedSetup is undefined, token.hasCompletedSetup remains undefined.
      }

      // Session update trigger (e.g., from client-side useSession().update() after API call)
      if (trigger === "update" && newSessionData?.user?.hasCompletedSetup !== undefined) {
        token.hasCompletedSetup = newSessionData.user.hasCompletedSetup;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Ensure hasCompletedSetup from token is passed to session.
        // If token.hasCompletedSetup is undefined, session.user.hasCompletedSetup will also be undefined.
        session.user.hasCompletedSetup = token.hasCompletedSetup;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
