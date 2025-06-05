
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

// Critical environment variable checks
if (!authUrl) {
  console.error(
    "\x1b[31m%s\x1b[0m", // Red color for error
    "CRITICAL ERROR: `AUTH_URL` environment variable is not set. " +
    "This is REQUIRED for NextAuth.js to function correctly, especially with OAuth providers. " +
    "Set it to your application's base URL (e.g., http://localhost:9002 for local development). " +
    "Ensure it does NOT have a trailing slash."
  );
} else if (authUrl.endsWith('/')) {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    "WARNING: `AUTH_URL` in your .env.local file has a trailing slash. " +
    "It is recommended to remove it (e.g., use 'http://localhost:9002' instead of 'http://localhost:9002/')."
  );
}


if (!authSecret) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: `AUTH_SECRET` environment variable is not set. " +
    "Authentication will be insecure and may fail. Generate a strong secret and set it."
  );
}

let providers = [];

if (googleClientId && googleClientSecret) {
  console.info("\x1b[36m%s\x1b[0m", `NextAuth.js: Using Google Client ID: ${googleClientId}`);
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
  if (authUrl) {
    console.info(
      "\x1b[36m%s\x1b[0m", // Cyan color for info
      `NextAuth.js: Expected Google callback URL: ${authUrl}/api/auth/callback/google`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    "WARNING: Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET). Google login will be disabled."
  );
  if (!googleClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_ID is missing.");
  if (!googleClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GOOGLE_CLIENT_SECRET is missing.");
}

if (githubClientId && githubClientSecret) {
  console.info("\x1b[36m%s\x1b[0m", `NextAuth.js: Using GitHub Client ID: ${githubClientId}`);
  providers.push(
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
  if (authUrl) {
    console.info(
      "\x1b[36m%s\x1b[0m", // Cyan color for info
      `NextAuth.js: Expected GitHub callback URL: ${authUrl}/api/auth/callback/github`
    );
  }
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing GitHub OAuth environment variables (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET). GitHub login will be disabled."
  );
  if (!githubClientId) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_ID is missing.");
  if (!githubClientSecret) console.warn("\x1b[33m%s\x1b[0m", "  - GITHUB_CLIENT_SECRET is missing.");
}

if (providers.length === 0) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: No authentication providers are configured due to missing environment variables. Authentication will not work. Please check your .env.local file."
  );
  // Add a placeholder provider if none are configured to prevent NextAuth from erroring out on initialization
  // This provider will not actually work but allows the app to start for easier debugging of env vars.
  providers.push(
    GoogleProvider({ clientId: "placeholder_id_check_env", clientSecret: "placeholder_secret_check_env" })
  );
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
