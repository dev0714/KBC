import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'

export const portalDisplay = Archivo({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-portal-display' })
export const portalSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-portal-sans' })
export const portalMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-portal-mono' })

export const portalFontVars = `${portalDisplay.variable} ${portalSans.variable} ${portalMono.variable}`
