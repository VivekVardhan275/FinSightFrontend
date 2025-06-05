
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

// Ensure environment variables are being accessed correctly
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;
let envAuthUrl = process.env.AUTH_URL;
const envNextAuthUrl = process.env.NEXTAUTH_URL;

// --- CRITICAL ENVIRONMENT VARIABLE CHECKS ---
let criticalEnvError = false;
const guidanceMessages: string[] = [];
let effectiveAuthUrlForLogging = envAuthUrl; // Default to AUTH_URL for initial logging

console.info("\x1b[34m%s\x1b[0m", "--- NextAuth.js Configuration & Environment Check ---");

// Check AUTH_URL and NEXTAUTH_URL coexistence and values
if (envAuthUrl && envNextAuthUrl && envAuthUrl !== envNextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Both \`AUTH_URL\` ("${envAuthUrl}") and \`NEXTAUTH_URL\` ("${envNextAuthUrl}") are set, and they differ. ` +
    "NextAuth.js v4 (used here) might prioritize `NEXTAUTH_URL`. It's strongly recommended to use only `AUTH_URL` (set to your app's base URL like http://localhost:9002) and remove `NEXTAUTH_URL` from your .env.local file."
  );
  effectiveAuthUrlForLogging = envNextAuthUrl; // NextAuth v4 might prioritize this
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

// Validate the effectiveAuthUrlForLogging
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
      `WARNING: Your effective auth URL ("${effectiveAuthUrlForLogging}") starts with 'https://'. ` +
      "For LOCAL DEVELOPMENT, this should typically be 'http://' (e.g., 'http://localhost:9002') as the Next.js dev server runs on HTTP. Using HTTPS locally can lead to ERR_SSL_PROTOCOL_ERROR. Please verify your .env.local file."
    );
  } else if (process.env.NODE_ENV !== 'development' && !effectiveAuthUrlForLogging.startsWith('https://')) {
     console.warn(
      "\x1b[33m%s\x1b[0m",
      `WARNING: Your effective auth URL ("${effectiveAuthUrlForLogging}") starts with 'http://'. ` +
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
// --- END CRITICAL ENVIRONMENT VARIABLE CHECKS ---


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
  criticalEnvError = true; // Mark as critical if no providers are set up
}


// Programmatic adjustment to ensure NEXTAUTH_URL is aligned with AUTH_URL for NextAuth.js v4.
// This helps if AUTH_URL is set correctly (e.g. http://localhost:9002) but NEXTAUTH_URL is missing or different.
if (process.env.AUTH_URL) {
    const currentAuthUrl = process.env.AUTH_URL;
    const currentNextAuthUrl = process.env.NEXTAUTH_URL;

    if (currentNextAuthUrl !== currentAuthUrl) {
        if (currentNextAuthUrl) {
            console.warn(
                "\x1b[33m%s\x1b[0m",
                `RUNTIME ADJUSTMENT: \`AUTH_URL\` is "${currentAuthUrl}" and \`NEXTAUTH_URL\` is "${currentNextAuthUrl}". ` +
                "Since they differ and NextAuth.js v4 can prioritize `NEXTAUTH_URL`, forcing `NEXTAUTH_URL` to match `AUTH_URL` for consistency."
            );
        } else {
            console.info(
                "\x1b[36m%s\x1b[0m",
                `RUNTIME ADJUSTMENT: \`AUTH_URL\` is "${currentAuthUrl}" and \`NEXTAUTH_URL\` is not set. ` +
                "Setting `NEXTAUTH_URL` to match `AUTH_URL` for NextAuth.js v4."
            );
        }
        process.env.NEXTAUTH_URL = currentAuthUrl; // THIS IS THE KEY LINE for the programmatic fix
        console.info(
            "\x1b[36m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`process.env.NEXTAUTH_URL\` is NOW "${process.env.NEXTAUTH_URL}". NextAuth.js will use this as its base URL.`
        );
        // Update effectiveAuthUrlForLogging if it was based on a different NEXTAUTH_URL initially
        if (effectiveAuthUrlForLogging !== process.env.NEXTAUTH_URL) {
             guidanceMessages.push(`\x1b[36mNextAuth.js: Effective auth URL for callbacks was updated by runtime adjustment to: ${process.env.NEXTAUTH_URL}\x1b[0m`);
             effectiveAuthUrlForLogging = process.env.NEXTAUTH_URL; // Update for subsequent log lines if needed
        }
    } else {
         console.info(
            "\x1b[36m%s\x1b[0m",
            `INFO: \`AUTH_URL\` and \`NEXTAUTH_URL\` are both set and identical ("${currentAuthUrl}"). No runtime adjustment needed for this. NextAuth.js will use this as its base URL.`
        );
    }
} else if (process.env.NEXTAUTH_URL) {
    // If only NEXTAUTH_URL is set, that's what v4 will use.
    console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: Only \`NEXTAUTH_URL\` ("${process.env.NEXTAUTH_URL}") is set. NextAuth.js v4 will use this as its base URL.`
    );
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
    async jwt({ token, user, account }) {
      return token;
    },
    async session({ session, token }) {
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
