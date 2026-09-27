import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authEnabled = providers.length > 0;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google")
        return profile?.email_verified === true;
      if (account?.provider === "github" && account.access_token) {
        const response = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            Accept: "application/vnd.github+json",
          },
        });
        if (!response.ok) return false;
        const emails = (await response.json()) as {
          email: string;
          primary: boolean;
          verified: boolean;
        }[];
        const verified = emails.find((e) => e.primary && e.verified);
        if (!verified) return false;
        user.email = verified.email;
        return true;
      }
      return false;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.providerSubject = `${account.provider}:${account.providerAccountId}`;
        token.verifiedEmail = true;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.providerSubject =
        typeof token.providerSubject === "string"
          ? token.providerSubject
          : undefined;
      session.user.verifiedEmail = token.verifiedEmail === true;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
