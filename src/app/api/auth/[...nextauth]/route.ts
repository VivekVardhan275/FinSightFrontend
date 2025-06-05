
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

// Ensure environment variables are being accessed correctly
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;
let authUrl = process.env.AUTH_URL;
const nextAuthUrl = process.env.NEXTAUTH_URL; // Check for the older variable

// --- CRITICAL ENVIRONMENT VARIABLE CHECKS ---
let criticalEnvError = false;
let guidanceMessages: string[] = [];

if (authUrl && nextAuthUrl && authUrl !== nextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Both \`AUTH_URL\` ("${authUrl}") and \`NEXTAUTH_URL\` ("${nextAuthUrl}") are set in your environment, and they are different. ` +
    "It's strongly recommended to use only `AUTH_URL` with newer versions of NextAuth.js (Auth.js v5). " +
    "Please remove `NEXTAUTH_URL` or ensure it matches `AUTH_URL` to avoid potential conflicts."
  );
  // You might decide to prioritize one, or halt if they conflict and are different.
  // For now, we'll proceed using AUTH_URL if set, otherwise log further warnings.
} else if (authUrl && nextAuthUrl && authUrl === nextAuthUrl) {
    // Both are set but are the same. Prefer AUTH_URL.
     console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: Both \`AUTH_URL\` and \`NEXTAUTH_URL\` are set to "${authUrl}". Using \`AUTH_URL\`. Consider removing \`NEXTAUTH_URL\`.`
    );
}


if (!authUrl && nextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: \`NEXTAUTH_URL\` ("${nextAuthUrl}") is set, but \`AUTH_URL\` is not. ` +
    "Newer versions of NextAuth.js (Auth.js v5) prefer `AUTH_URL`. " +
    "Using `NEXTAUTH_URL` as a fallback, but consider renaming it to `AUTH_URL` in your .env.local file."
  );
  authUrl = nextAuthUrl; // Use NEXTAUTH_URL as a fallback
}


if (!authUrl) {
  console.error(
    "\x1b[31m%s\x1b[0m", // Red color for error
    "CRITICAL ERROR: `AUTH_URL` (or `NEXTAUTH_URL`) environment variable is NOT SET in your .env.local file. " +
    "This is REQUIRED for NextAuth.js to function correctly. " +
    "Set it to your application's base URL (e.g., http://localhost:9002 for local development). " +
    "Ensure it does NOT have a trailing slash."
  );
  criticalEnvError = true;
} else if (authUrl.endsWith('/')) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Your auth URL ("${authUrl}") in .env.local has a trailing slash. ` +
    "It is strongly recommended to remove it (e.g., use 'http://localhost:9002' instead of 'http://localhost:9002/')."
  );
  // Do not set criticalEnvError = true for this, it's just a warning.
} else {
    guidanceMessages.push(`\x1b[36mNextAuth.js is using auth URL: ${authUrl}\x1b[0m (derived from AUTH_URL or NEXTAUTH_URL)`);
}


if (!authSecret) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: `AUTH_SECRET` environment variable is NOT SET in your .env.local file. " +
    "Authentication will be insecure and may fail. Generate a strong secret (e.g., `openssl rand -base64 32`) and set it."
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
  if (authUrl && !authUrl.endsWith('/')) {
    const expectedGoogleCallback = `${authUrl}/api/auth/callback/google`;
    guidanceMessages.push(
      `\x1b[32mGOOGLE DEBUG ACTION:\x1b[0m In your Google Cloud Console, for the OAuth Client ID \x1b[33m'${googleClientId}'\x1b[0m, ensure the following URL is listed EXACTLY under "Authorized redirect URIs": \x1b[33m${expectedGoogleCallback}\x1b[0m`
    );
  } else if (authUrl) {
    guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise Google callback URL guidance because auth URL ("${authUrl}") has issues. Please fix it first.\x1b[0m`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET). Google login will be disabled."
  );
  if (!googleClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_ID is missing from .env.local.");
  if (!googleClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_SECRET is missing from .env.local.");
}

if (githubClientId && githubClientSecret) {
  guidanceMessages.push(`\x1b[36mNextAuth.js: Using GitHub Client ID: '${githubClientId}' (from GITHUB_CLIENT_ID in .env.local)\x1b[0m`);
  providers.push(
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
  if (authUrl && !authUrl.endsWith('/')) { 
    const expectedGitHubCallback = `${authUrl}/api/auth/callback/github`;
     guidanceMessages.push(
      `\x1b[32mGITHUB DEBUG ACTION:\x1b[0m In your GitHub OAuth App settings, for the Client ID \x1b[33m'${githubClientId}'\x1b[0m, ensure the following URL is set EXACTLY as the "Authorization callback URL": \x1b[33m${expectedGitHubCallback}\x1b[0m`
    );
  } else if (authUrl) {
     guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise GitHub callback URL guidance because auth URL ("${authUrl}") has issues. Please fix it first.\x1b[0m`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing GitHub OAuth environment variables (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET). GitHub login will be disabled."
  );
  if (!githubClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_ID is missing from .env.local.");
  if (!githubClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_SECRET is missing from .env.local.");
}

if (providers.length === 0 && !criticalEnvError) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: No OAuth providers (Google, GitHub) are configured due to missing Client IDs/Secrets in .env.local. Authentication will not work for these providers."
  );
  criticalEnvError = true; // Mark as critical if no providers are set up
}

if (criticalEnvError) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "NextAuth.js Initialization Errors: Due to the critical errors listed above, authentication may not function correctly. Please review your .env.local file and OAuth provider configurations."
  );
}

if (guidanceMessages.length > 0) {
    console.info("\n\x1b[34m%s\x1b[0m", "--- NextAuth.js Configuration Summary & Actions ---");
    guidanceMessages.forEach(msg => console.info(msg));
    console.info("\x1b[34m%s\x1b[0m", "-------------------------------------------------");
}


export const authOptions: NextAuthOptions = {
  providers: providers,
  session: {
    strategy: "jwt", 
  },
  secret: authSecret, // Explicitly using the defined authSecret
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

