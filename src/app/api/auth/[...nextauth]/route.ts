import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async jwt({ token, account, user }) {
			if (account) {
				token.provider = account.provider;
				token.sub = user?.id || token.sub;
				token.name = user?.name || token.name;
				token.email = user?.email || token.email;
				token.picture = user?.image || token.picture;
			}
			return token;
		},
		async session({ session, token }) {
			session.user = {
				id: token.sub || null,
				name: token.name || session.user?.name || null,
				email: token.email || session.user?.email || null,
				image: token.picture || session.user?.image || null,
				provider: token.provider || "google",
			};
			return session;
		},
	},
	pages: {
		signIn: "/auth",
	},
});

export { handler as GET, handler as POST };
