
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

// Ensure environment variables are being accessed correctly
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET;
const authUrl = process.env.AUTH_URL;

// --- CRITICAL ENVIRONMENT VARIABLE CHECKS ---
let criticalEnvError = false;
let guidanceMessages: string[] = [];

if (!authUrl) {
  console.error(
    "\x1b[31m%s\x1b[0m", // Red color for error
    "CRITICAL ERROR: `AUTH_URL` environment variable is NOT SET in your .env.local file. " +
    "This is REQUIRED for NextAuth.js to function correctly. " +
    "Set it to your application's base URL (e.g., http://localhost:9002 for local development). " +
    "Ensure it does NOT have a trailing slash."
  );
  criticalEnvError = true;
} else if (authUrl.endsWith('/')) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    `WARNING: Your \`AUTH_URL\` ("${authUrl}") in .env.local has a trailing slash. ` +
    "It is strongly recommended to remove it (e.g., use 'http://localhost:9002' instead of 'http://localhost:9002/')."
  );
  // Do not set criticalEnvError = true for this, it's just a warning.
} else {
    guidanceMessages.push(`\x1b[36mNextAuth.js is using AUTH_URL: ${authUrl}\x1b[0m`);
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
  console.info("\x1b[36m%s\x1b[0m", `NextAuth.js: Using Google Client ID: '${googleClientId}' (from GOOGLE_CLIENT_ID in .env.local)`);
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
  if (authUrl && !authUrl.endsWith('/')) { // Only provide guidance if authUrl is correctly formatted
    const expectedGoogleCallback = `${authUrl}/api/auth/callback/google`;
    guidanceMessages.push(
      `\x1b[32mGOOGLE DEBUG ACTION:\x1b[0m In your Google Cloud Console, for the OAuth Client ID \x1b[33m'${googleClientId}'\x1b[0m, ensure the following URL is listed EXACTLY under "Authorized redirect URIs": \x1b[33m${expectedGoogleCallback}\x1b[0m`
    );
  } else if (authUrl) {
    guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise Google callback URL guidance because AUTH_URL ("${authUrl}") has issues. Please fix AUTH_URL first.\x1b[0m`
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
  console.info("\x1b[36m%s\x1b[0m", `NextAuth.js: Using GitHub Client ID: '${githubClientId}' (from GITHUB_CLIENT_ID in .env.local)`);
  providers.push(
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
  if (authUrl && !authUrl.endsWith('/')) { // Only provide guidance if authUrl is correctly formatted
    const expectedGitHubCallback = `${authUrl}/api/auth/callback/github`;
     guidanceMessages.push(
      `\x1b[32mGITHUB DEBUG ACTION:\x1b[0m In your GitHub OAuth App settings, for the Client ID \x1b[33m'${githubClientId}'\x1b[0m, ensure the following URL is set EXACTLY as the "Authorization callback URL": \x1b[33m${expectedGitHubCallback}\x1b[0m`
    );
  } else if (authUrl) {
     guidanceMessages.push(
        `\x1b[33mWARNING: Cannot generate precise GitHub callback URL guidance because AUTH_URL ("${authUrl}") has issues. Please fix AUTH_URL first.\x1b[0m`
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
  criticalEnvError = true;
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
    strategy: "jwt", // Using JWT for session strategy
  },
  // NextAuth.js v5 uses the AUTH_SECRET environment variable automatically if set.
  // The 'secret' option here is not needed if AUTH_SECRET is set.
  // secret: authSecret,

  pages: {
    signIn: '/login',
    // error: '/auth/error', // Optional: custom error page for auth errors
  },
  // Enable debug messages for Auth.js in development
  // This can be very helpful for diagnosing "Failed to fetch" or other auth issues
  debug: process.env.NODE_ENV === 'development',

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account && user) {
        // token.accessToken = account.access_token; // Example: if you need provider's access token
        // token.id = user.id; // user object might have id from provider
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      // (session.user as any).id = token.id; // Example
      // (session as any).accessToken = token.accessToken; // Example
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
