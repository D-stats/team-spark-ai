import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/utils'
import { OkrService } from '@/services/okr.service'
import { z } from 'zod'
import { ObjectiveOwner, ObjectiveStatus } from '@prisma/client'

const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ObjectiveStatus).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getUserWithOrganization()
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const objective = await OkrService.getObjectiveById(params.id)
    
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    // Check if user has access to this objective
    if (objective.organizationId !== result.dbUser.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(objective)
  } catch (error) {
    console.error('Error fetching objective:', error)
    return NextResponse.json(
      { error: 'Failed to fetch objective' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getUserWithOrganization()
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateObjectiveSchema.parse(body)

    // Check if objective exists and user has access
    const objective = await OkrService.getObjectiveById(params.id)
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    if (objective.organizationId !== result.dbUser.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check permissions based on owner type
    if (objective.ownerType === ObjectiveOwner.COMPANY && result.dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update company objectives' },
        { status: 403 }
      )
    }

    const updatedObjective = await OkrService.updateObjective(params.id, validatedData as any)

    return NextResponse.json(updatedObjective)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating objective:', error)
    return NextResponse.json(
      { error: 'Failed to update objective' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getUserWithOrganization()
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if objective exists and user has access
    const objective = await OkrService.getObjectiveById(params.id)
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    if (objective.organizationId !== result.dbUser.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow deletion of draft objectives
    if (objective.status !== ObjectiveStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Only draft objectives can be deleted' },
        { status: 400 }
      )
    }

    await OkrService.updateObjective(params.id, { status: ObjectiveStatus.CANCELLED } as any)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting objective:', error)
    return NextResponse.json(
      { error: 'Failed to delete objective' },
      { status: 500 }
    )
  }
}