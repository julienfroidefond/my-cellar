import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashApiToken } from '@/lib/api-token'

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (process.env.AUTH_SECRET && session === process.env.AUTH_SECRET) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length)
    const tokenHash = hashApiToken(token)
    const found = await prisma.apiToken.findUnique({ where: { tokenHash } })
    if (found) {
      await prisma.apiToken.update({ where: { id: found.id }, data: { lastUsedAt: new Date() } })
      return NextResponse.next()
    }
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|wines/|wine-images/).*)'],
}
