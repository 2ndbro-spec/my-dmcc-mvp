// 既存の next-auth 設定に追加
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // role付与（暫定: Googleメールで分岐）
      if (user?.email === "tanaka@dennoworks.com") {
        token.role = "denno-admin";
      } else {
        token.role = "user";
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role;
      return session;
    },
  },
});

export { handler as GET, handler as POST };