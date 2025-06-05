
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
    "Set it to your application's base URL (e.g., http://localhost:9002 for local development)."
  );
  // Depending on your setup, you might want to throw an error here in development
  // to prevent the server from starting with a critical misconfiguration.
  // For now, we'll log an error and let NextAuth.js potentially handle its absence.
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
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m", // Yellow color for warning
    "WARNING: Missing Google OAuth environment variables (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET). Google login will be disabled."
  );
}

if (githubClientId && githubClientSecret) {
  providers.push(
    GithubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
} else {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "WARNING: Missing GitHub OAuth environment variables (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET). GitHub login will be disabled."
  );
}

if (providers.length === 0) {
    console.error(
    "\x1b[31m%s\x1b[0m",
    "CRITICAL ERROR: No authentication providers are configured due to missing environment variables. Authentication will not work."
  );
  // Add a placeholder provider if none are configured to prevent NextAuth from erroring out on initialization
  // This provider will not actually work but allows the app to start for easier debugging of env vars.
  providers.push(
    GoogleProvider({ clientId: "placeholder", clientSecret: "placeholder" })
  );
}

export const authOptions: NextAuthOptions = {
  providers: providers,
  session: {
    strategy: "jwt",
  },
  // NextAuth.js v5 uses the AUTH_SECRET environment variable automatically.
  // The 'secret' option here is not needed if AUTH_SECRET is set.
  // secret: authSecret, // Only needed if not using AUTH_SECRET env var

  pages: {
    signIn: '/login',
    // error: '/auth/error', // Optional: custom error page for auth errors
  },
  // Enable debug messages for Auth.js in development
  // This can be very helpful for diagnosing "Failed to fetch" or other auth issues
  debug: process.env.NODE_ENV === 'development',

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Persist the OAuth access_token or other details to the token
        // token.accessToken = account.access_token;
        // token.id = user.id; // Ensure your User model has an id
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      // (session.user as any).id = token.id;
      // (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
