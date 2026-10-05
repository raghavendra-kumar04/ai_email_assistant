const Email = require('../models/Email');
const logger = require('../utils/logger');

/**
 * Aggregate weekly statistics and retrospective data for Sunday digest
 */
async function getWeeklyDigestData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const totalCount = await Email.countDocuments({ receivedAt: { $gte: sevenDaysAgo } });
  const importantCount = await Email.countDocuments({
    receivedAt: { $gte: sevenDaysAgo },
    category: 'important'
  });
  const actionRequiredCount = await Email.countDocuments({
    receivedAt: { $gte: sevenDaysAgo },
    category: 'action_required'
  });
  const pendingActions = await Email.find({
    receivedAt: { $gte: sevenDaysAgo },
    requiresAction: true
  })
    .sort({ receivedAt: -1 })
    .limit(10);

  const resolvedActionsCount = await Email.countDocuments({
    receivedAt: { $gte: sevenDaysAgo },
    requiresAction: false,
    category: { $in: ['important', 'action_required'] }
  });

  const upcomingDeadlines = await Email.find({
    receivedAt: { $gte: sevenDaysAgo },
    deadline: { $ne: null }
  })
    .sort({ deadline: 1 })
    .limit(5);

  return {
    totalCount,
    importantCount,
    actionRequiredCount,
    pendingActions,
    resolvedActionsCount,
    upcomingDeadlines
  };
}

module.exports = {
  getWeeklyDigestData
};
