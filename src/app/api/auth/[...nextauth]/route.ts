
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
let guidanceMessages: string[] = [];
let effectiveAuthUrlForLogging = envAuthUrl;

if (envAuthUrl && envNextAuthUrl && envAuthUrl !== envNextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Both \`AUTH_URL\` ("${envAuthUrl}") and \`NEXTAUTH_URL\` ("${envNextAuthUrl}") are set in your environment, and they are different. ` +
    "NextAuth.js v4 might prioritize `NEXTAUTH_URL`. It's strongly recommended to use only `AUTH_URL` and remove `NEXTAUTH_URL`."
  );
  // For logging purposes, we'll still prefer AUTH_URL if set. The programmatic adjustment later will handle runtime.
  effectiveAuthUrlForLogging = envAuthUrl;
} else if (envAuthUrl && envNextAuthUrl && envAuthUrl === envNextAuthUrl) {
    console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: Both \`AUTH_URL\` and \`NEXTAUTH_URL\` are set to "${envAuthUrl}". Using \`AUTH_URL\`. Consider removing \`NEXTAUTH_URL\`.`
    );
    effectiveAuthUrlForLogging = envAuthUrl;
} else if (!envAuthUrl && envNextAuthUrl) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: \`NEXTAUTH_URL\` ("${envNextAuthUrl}") is set, but \`AUTH_URL\` is not. ` +
    "Newer versions of NextAuth.js (Auth.js v5) prefer `AUTH_URL`. " +
    "Using `NEXTAUTH_URL` as a fallback for now, but consider renaming it to `AUTH_URL` in your .env.local file."
  );
  effectiveAuthUrlForLogging = envNextAuthUrl;
} else if (envAuthUrl && !envNextAuthUrl) {
  effectiveAuthUrlForLogging = envAuthUrl;
   console.info(
        "\x1b[36m%s\x1b[0m",
        `INFO: \`AUTH_URL\` is set to "${envAuthUrl}" and \`NEXTAUTH_URL\` is not set. This is the preferred configuration.`
    );
}


if (!effectiveAuthUrlForLogging) {
  console.error(
    "\x1b[31m%s\x1b[0m", // Red color for error
    "CRITICAL ERROR: Neither `AUTH_URL` nor `NEXTAUTH_URL` environment variable is SET in your .env.local file. " +
    "This is REQUIRED for NextAuth.js to function correctly. " +
    "Set `AUTH_URL` to your application's base URL (e.g., http://localhost:9002 for local development). " +
    "Ensure it does NOT have a trailing slash."
  );
  criticalEnvError = true;
} else if (effectiveAuthUrlForLogging.endsWith('/')) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Your auth URL ("${effectiveAuthUrlForLogging}") in .env.local has a trailing slash. ` +
    "It is strongly recommended to remove it (e.g., use 'http://localhost:9002' instead of 'http://localhost:9002/')."
  );
} else {
    guidanceMessages.push(`\x1b[36mNextAuth.js determined effective auth URL for logging: ${effectiveAuthUrlForLogging}\x1b[0m`);
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
  if (effectiveAuthUrlForLogging && !effectiveAuthUrlForLogging.endsWith('/')) {
    const expectedGoogleCallback = `${effectiveAuthUrlForLogging}/api/auth/callback/google`;
    guidanceMessages.push(
      `\x1b[32mGOOGLE DEBUG ACTION:\x1b[0m In your Google Cloud Console, for the OAuth Client ID \x1b[33m'${googleClientId}'\x1b[0m, ensure the following URL is listed EXACTLY under "Authorized redirect URIs": \x1b[33m${expectedGoogleCallback}\x1b[0m`
    );
  } else if (effectiveAuthUrlForLogging) {
    guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise Google callback URL guidance because effective auth URL ("${effectiveAuthUrlForLogging}") for logging has issues. Please fix it first.\x1b[0m`
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
  if (effectiveAuthUrlForLogging && !effectiveAuthUrlForLogging.endsWith('/')) { 
    const expectedGitHubCallback = `${effectiveAuthUrlForLogging}/api/auth/callback/github`;
     guidanceMessages.push(
      `\x1b[32mGITHUB DEBUG ACTION:\x1b[0m In your GitHub OAuth App settings, for the Client ID \x1b[33m'${githubClientId}'\x1b[0m, ensure the following URL is set EXACTLY as the "Authorization callback URL": \x1b[33m${expectedGitHubCallback}\x1b[0m`
    );
  } else if (effectiveAuthUrlForLogging) {
     guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise GitHub callback URL guidance because effective auth URL ("${effectiveAuthUrlForLogging}") for logging has issues. Please fix it first.\x1b[0m`
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
    console.info("\n\x1b[34m%s\x1b[0m", "--- NextAuth.js Configuration Summary & Actions (before runtime adjustment) ---");
    guidanceMessages.forEach(msg => console.info(msg));
    console.info("\x1b[34m%s\x1b[0m", "--------------------------------------------------------------------------");
}

// Programmatic adjustment to ensure NEXTAUTH_URL is aligned with AUTH_URL if AUTH_URL is correctly set to port 9002.
// This is because NextAuth v4 respects NEXTAUTH_URL.
if (process.env.AUTH_URL && process.env.AUTH_URL.includes(':9002')) {
    const currentNextAuthUrl = process.env.NEXTAUTH_URL;
    if (currentNextAuthUrl !== process.env.AUTH_URL) {
        console.warn(
            "\x1b[33m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`AUTH_URL\` is "${process.env.AUTH_URL}" and \`NEXTAUTH_URL\` is "${currentNextAuthUrl || 'not set'}". ` +
            "Forcing NextAuth.js to use AUTH_URL by setting `process.env.NEXTAUTH_URL`."
        );
        process.env.NEXTAUTH_URL = process.env.AUTH_URL;
         console.info(
            "\x1b[36m%s\x1b[0m",
            `RUNTIME ADJUSTMENT: \`process.env.NEXTAUTH_URL\` is now "${process.env.NEXTAUTH_URL}".`
        );
    }
} else if (process.env.AUTH_URL) {
    console.warn(
        "\x1b[33m%s\x1b[0m",
        `WARNING: \`AUTH_URL\` is "${process.env.AUTH_URL}" but does not seem to be the expected "http://localhost:9002". ` +
        "No runtime adjustment made for `NEXTAUTH_URL` based on this. Ensure your `.env.local` is correct."
    );
}


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

    