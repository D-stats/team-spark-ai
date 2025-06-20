/**
 * 全ユーザーストーリーのエクスポート
 */

import { evaluationStories, kudosStories } from './evaluation-stories';
import { checkinStories } from './checkin-stories';

export const allStories = [...evaluationStories, ...kudosStories, ...checkinStories];

export { evaluationStories, kudosStories, checkinStories };
