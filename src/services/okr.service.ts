import { prisma } from '@/lib/prisma'
import { 
  ObjectiveOwner, 
  OkrCycle, 
  ObjectiveStatus, 
  KeyResultType,
  Prisma
} from '@prisma/client'
import type { 
  CreateObjectiveInput, 
  CreateKeyResultInput, 
  UpdateKeyResultInput,
  CreateCheckInInput,
  ObjectiveWithRelations,
  KeyResultWithProgress,
  OkrAlignment
} from '@/types/okr'

export class OkrService {
  // Objective operations
  static async createObjective(
    organizationId: string,
    input: CreateObjectiveInput
  ): Promise<ObjectiveWithRelations> {
    const objective = await prisma.objective.create({
      data: {
        organizationId,
        ...input,
        status: ObjectiveStatus.DRAFT
      },
      include: {
        organization: true,
        ownerUser: true,
        ownerTeam: true,
        parent: true,
        children: true,
        keyResults: {
          include: {
            owner: true,
            checkIns: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    return this.formatObjectiveWithRelations(objective)
  }

  static async updateObjective(
    objectiveId: string,
    data: Partial<CreateObjectiveInput>
  ): Promise<ObjectiveWithRelations> {
    const objective = await prisma.objective.update({
      where: { id: objectiveId },
      data,
      include: {
        organization: true,
        ownerUser: true,
        ownerTeam: true,
        parent: true,
        children: true,
        keyResults: {
          include: {
            owner: true,
            checkIns: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    return this.formatObjectiveWithRelations(objective)
  }

  static async activateObjective(objectiveId: string): Promise<ObjectiveWithRelations> {
    return this.updateObjective(objectiveId, { status: ObjectiveStatus.ACTIVE } as any)
  }

  static async getObjectiveById(objectiveId: string): Promise<ObjectiveWithRelations | null> {
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
      include: {
        organization: true,
        ownerUser: true,
        ownerTeam: true,
        parent: true,
        children: true,
        keyResults: {
          include: {
            owner: true,
            checkIns: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    return objective ? this.formatObjectiveWithRelations(objective) : null
  }

  static async getOrganizationObjectives(
    organizationId: string,
    filters?: {
      cycle?: OkrCycle
      year?: number
      ownerType?: ObjectiveOwner
      ownerId?: string
      status?: ObjectiveStatus
    }
  ): Promise<ObjectiveWithRelations[]> {
    const where: Prisma.ObjectiveWhereInput = {
      organizationId,
      ...filters
    }

    const objectives = await prisma.objective.findMany({
      where,
      include: {
        organization: true,
        ownerUser: true,
        ownerTeam: true,
        parent: true,
        children: true,
        keyResults: {
          include: {
            owner: true,
            checkIns: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: [
        { ownerType: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return objectives.map(obj => this.formatObjectiveWithRelations(obj))
  }

  static async getOkrAlignment(
    organizationId: string,
    cycle: OkrCycle,
    year: number
  ): Promise<OkrAlignment> {
    const objectives = await this.getOrganizationObjectives(organizationId, {
      cycle,
      year,
      status: ObjectiveStatus.ACTIVE
    })

    const companyObjectives = objectives.filter(obj => obj.ownerType === ObjectiveOwner.COMPANY)
    const teamObjectives = objectives.filter(obj => obj.ownerType === ObjectiveOwner.TEAM)
    const individualObjectives = objectives.filter(obj => obj.ownerType === ObjectiveOwner.INDIVIDUAL)

    // Group by team/individual
    const teamObjectivesByTeam: Record<string, ObjectiveWithRelations[]> = {}
    teamObjectives.forEach(obj => {
      if (obj.ownerTeamId) {
        if (!teamObjectivesByTeam[obj.ownerTeamId]) {
          teamObjectivesByTeam[obj.ownerTeamId] = []
        }
        teamObjectivesByTeam[obj.ownerTeamId].push(obj)
      }
    })

    const individualObjectivesByUser: Record<string, ObjectiveWithRelations[]> = {}
    individualObjectives.forEach(obj => {
      if (obj.ownerUserId) {
        if (!individualObjectivesByUser[obj.ownerUserId]) {
          individualObjectivesByUser[obj.ownerUserId] = []
        }
        individualObjectivesByUser[obj.ownerUserId].push(obj)
      }
    })

    return {
      companyObjectives,
      teamObjectives: teamObjectivesByTeam,
      individualObjectives: individualObjectivesByUser
    }
  }

  // Key Result operations
  static async createKeyResult(input: CreateKeyResultInput): Promise<KeyResultWithProgress> {
    const keyResult = await prisma.keyResult.create({
      data: {
        ...input,
        currentValue: input.type === KeyResultType.METRIC ? input.startValue : undefined,
        progress: 0
      },
      include: {
        objective: true,
        owner: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return this.formatKeyResultWithProgress(keyResult)
  }

  static async updateKeyResult(
    keyResultId: string,
    data: UpdateKeyResultInput
  ): Promise<KeyResultWithProgress> {
    // Calculate progress if currentValue is updated
    let progress = data.progress
    if (data.currentValue !== undefined) {
      const keyResult = await prisma.keyResult.findUnique({
        where: { id: keyResultId }
      })
      
      if (keyResult && keyResult.type === KeyResultType.METRIC && keyResult.targetValue) {
        const range = keyResult.targetValue - (keyResult.startValue || 0)
        const current = data.currentValue - (keyResult.startValue || 0)
        progress = Math.min(Math.max(current / range, 0), 1)
      }
    }

    const keyResult = await prisma.keyResult.update({
      where: { id: keyResultId },
      data: {
        ...data,
        progress
      },
      include: {
        objective: true,
        owner: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return this.formatKeyResultWithProgress(keyResult)
  }

  static async deleteKeyResult(keyResultId: string): Promise<void> {
    await prisma.keyResult.delete({
      where: { id: keyResultId }
    })
  }

  // Check-in operations
  static async createCheckIn(
    userId: string,
    input: CreateCheckInInput
  ): Promise<KeyResultWithProgress> {
    const keyResult = await prisma.keyResult.findUnique({
      where: { id: input.keyResultId }
    })

    if (!keyResult) {
      throw new Error('Key result not found')
    }

    // Create check-in
    await prisma.okrCheckIn.create({
      data: {
        ...input,
        userId,
        previousValue: keyResult.currentValue
      }
    })

    // Update key result with new values
    const updateData: UpdateKeyResultInput = {
      progress: input.progress,
      confidence: input.confidence
    }

    if (input.currentValue !== undefined) {
      updateData.currentValue = input.currentValue
    }

    return this.updateKeyResult(input.keyResultId, updateData)
  }

  static async getCheckInHistory(
    keyResultId: string,
    limit: number = 10
  ) {
    return prisma.okrCheckIn.findMany({
      where: { keyResultId },
      include: {
        user: true,
        keyResult: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Helper methods
  private static formatObjectiveWithRelations(objective: any): ObjectiveWithRelations {
    return {
      ...objective,
      keyResults: objective.keyResults.map((kr: any) => this.formatKeyResultWithProgress(kr))
    }
  }

  private static formatKeyResultWithProgress(keyResult: any): KeyResultWithProgress {
    return {
      ...keyResult,
      latestCheckIn: keyResult.checkIns?.[0] || null
    }
  }

  // Analytics
  static async getOkrSummary(organizationId: string, cycle: OkrCycle, year: number) {
    const objectives = await this.getOrganizationObjectives(organizationId, {
      cycle,
      year
    })

    const keyResults = objectives.flatMap(obj => obj.keyResults)
    
    const summary = {
      totalObjectives: objectives.length,
      activeObjectives: objectives.filter(obj => obj.status === ObjectiveStatus.ACTIVE).length,
      completedObjectives: objectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length,
      averageProgress: keyResults.length > 0 
        ? keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length 
        : 0,
      averageConfidence: keyResults.filter(kr => kr.confidence !== null).length > 0
        ? keyResults.filter(kr => kr.confidence !== null).reduce((sum, kr) => sum + (kr.confidence || 0), 0) / keyResults.filter(kr => kr.confidence !== null).length
        : 0,
      keyResultsByType: {
        metric: keyResults.filter(kr => kr.type === KeyResultType.METRIC).length,
        milestone: keyResults.filter(kr => kr.type === KeyResultType.MILESTONE).length
      },
      objectivesByCycle: objectives.reduce((acc, obj) => {
        acc[obj.cycle] = (acc[obj.cycle] || 0) + 1
        return acc
      }, {} as Record<OkrCycle, number>)
    }

    return summary
  }
}