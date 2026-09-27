import type { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      providerSubject?: string;
      verifiedEmail?: boolean;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    providerSubject?: string;
    verifiedEmail?: boolean;
  }
}
