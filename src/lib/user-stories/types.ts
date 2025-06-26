/**
 * User story type definitions
 */

export interface UserStory {
  id: string;
  epicId?: string;
  title: string;
  asA: string; // User type
  iWantTo: string; // What I want to achieve
  soThat: string; // Business value
  acceptanceCriteria: AcceptanceCriteria[];
  priority: StoryPriority;
  status: StoryStatus;
  tags: string[];
  implementedIn?: {
    components?: string[];
    apis?: string[];
    tests?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AcceptanceCriteria {
  id: string;
  given: string;
  when: string;
  then: string;
  verified: boolean;
  testIds?: string[]; // Related test IDs
}

export enum StoryPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export enum StoryStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export interface Epic {
  id: string;
  name: string;
  description: string;
  stories: string[]; // Story IDs
}

export interface StoryValidation {
  storyId: string;
  isValid: boolean;
  completedCriteria: number;
  totalCriteria: number;
  missingImplementation: string[];
  testCoverage: number;
}
