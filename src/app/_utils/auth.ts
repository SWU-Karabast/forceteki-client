import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import type { JWT } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';


const TwoMonthsInSeconds = 60 * 24 * 60 * 60; // 60 days
export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
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
    session: {
        strategy: 'jwt',
        maxAge: TwoMonthsInSeconds
    },
    cookies: {
        sessionToken: {
            name: 'next-auth.session-token',
            options: {
                ...(process.env.NODE_ENV === 'development' ? {} : { domain: '.karabast.net' }),
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        },
        callbackUrl: {
            name: 'next-auth.callback-url',
            options: {
                ...(process.env.NODE_ENV === 'development' ? {} : { domain: '.karabast.net' }),
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        },
        csrfToken: {
            name: 'next-auth.csrf-token',
            options: {
                ...(process.env.NODE_ENV === 'development' ? {} : { domain: '.karabast.net' }),
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    },
    jwt: {
        // Provide your own encode/decode so NextAuth doesn't encrypt
        async encode({ secret, token }) {
            // token will be the object returned from `jwt` callback
            const tokenWithExpiry = {
                ...token,
                exp: Math.floor(Date.now() / 1000) + TwoMonthsInSeconds,
                iat: Math.floor(Date.now() / 1000),
            };
            return jwt.sign(tokenWithExpiry as object, secret, { algorithm: 'HS256' });
        },
        async decode({ secret, token }) {
            try {
                const decoded = jwt.verify(token!, secret, {
                    clockTolerance: 60 // Allow 60 seconds clock skew
                }) as JWT;
                return decoded;
            } catch (error) {
                // Token expired or invalid
                console.error('JWT decode error:', error);
                return null;
            }
        },
    },
    callbacks: {
        async jwt({ token, account, user, trigger, session }) {
            if (trigger === 'update' && session?.userId) {
                token.userId = session.userId;
            }
            if (account) {
                token.id = `${account.provider}_${user?.id}`;  // Add the properly formatted ID
                token.provider = account.provider;
                token.providerId = user?.id;  // Keep the original provider ID
                token.sub = user?.id || token.sub;
                token.name = user?.name || token.name;
                token.email = user?.email || token.email;
                token.picture = user?.image || token.picture;
            }
            // On every JWT callback (including updates) extend expiration
            token.exp = Math.floor(Date.now() / 1000) + TwoMonthsInSeconds;
            return token;
        },
        async session({ session, token }) {
            const rawToken = jwt.sign(token as object, process.env.NEXTAUTH_SECRET!, { algorithm: 'HS256' });
            session.jwtToken = rawToken
            session.user = {
                id: token.id as string || null,
                name: token.name || session.user?.name || null,
                email: token.email || session.user?.email || null,
                image: token.picture || session.user?.image || null,
                provider: token.provider as string || 'unknown',
                userId: token.userId ?? null
            };
            return session;
        },
    },
    pages: {
        signIn: '/auth',
    },
};