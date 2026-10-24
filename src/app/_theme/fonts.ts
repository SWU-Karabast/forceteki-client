import { Barlow, Barlow_Semi_Condensed } from 'next/font/google';

export const barlow = Barlow({
    subsets: ['latin'],
    weight: ['400', '600', '800', '900'],
    variable: '--font-barlow',
});

export const barlowSemiCondensed = Barlow_Semi_Condensed({
    subsets: ['latin'],
    weight: ['800'],
    variable: '--font-barlow-semi-condensed',
});
