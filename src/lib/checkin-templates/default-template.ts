import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function createDefaultCheckInTemplate(organizationId: string) {
  // Note: These are the default English questions. The actual display text
  // should be handled by the i18n system using the question IDs as keys.
  const defaultTemplate = {
    name: 'Standard Weekly Check-in',
    description: 'Standard weekly check-in template',
    frequency: 'WEEKLY' as const,
    questions: [
      {
        id: 'achievements',
        type: 'textarea',
        text: 'What did you accomplish this week?',
        required: true,
      },
      {
        id: 'challenges',
        type: 'textarea',
        text: 'What challenges or difficulties did you face this week?',
        required: false,
      },
      {
        id: 'next_goals',
        type: 'textarea',
        text: 'What are your goals for next week?',
        required: true,
      },
      {
        id: 'energy_level',
        type: 'rating',
        text: 'How was your energy level this week? (1: Low - 5: High)',
        required: false,
      },
      {
        id: 'support_needed',
        type: 'select',
        text: 'Are there any areas where you need support from your team or manager?',
        required: false,
        options: [
          'None',
          'Technical Support',
          'Project Management',
          'Communication',
          'Resources',
          'Other',
        ],
      },
    ],
    isDefault: true,
    isActive: true,
    organizationId,
  };

  try {
    const template = await prisma.checkInTemplate.create({
      data: defaultTemplate,
    });

    return template;
  } catch (error) {
    logError(error as Error, 'createDefaultCheckInTemplate');
    throw error;
  }
}

export async function ensureDefaultTemplate(organizationId: string) {
  // Check if default template already exists
  const existingDefault = await prisma.checkInTemplate.findFirst({
    where: {
      organizationId,
      isDefault: true,
      isActive: true,
    },
  });

  if (existingDefault) {
    return existingDefault;
  }

  // Create default template if it doesn't exist
  return createDefaultCheckInTemplate(organizationId);
}
