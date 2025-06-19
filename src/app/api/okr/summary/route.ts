import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/utils'
import { OkrService } from '@/services/okr.service'
import { OkrCycle } from '@prisma/client'
import { z } from 'zod'

const getSummarySchema = z.object({
  cycle: z.nativeEnum(OkrCycle),
  year: z.string().transform(Number)
})

export async function GET(request: NextRequest) {
  try {
    const result = await getUserWithOrganization()
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const { cycle, year } = getSummarySchema.parse(params)
    
    const summary = await OkrService.getOkrSummary(
      result.dbUser.organizationId,
      cycle,
      year
    )

    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error fetching OKR summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OKR summary' },
      { status: 500 }
    )
  }
}