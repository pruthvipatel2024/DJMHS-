const prisma = require('../config/db');

/**
 * Get all notifications for the authenticated user
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all unread notifications for the user as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a single notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { id, recipientId: userId },
    });

    res.status(200).json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create / Broadcast an in-app notification to users or roles
 */
const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, targetRole, recipientId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required.' });
    }

    let recipientIds = [];
    if (recipientId) {
      recipientIds = [recipientId];
    } else {
      const userFilter = { deletedAt: null, isActive: true };
      if (targetRole && targetRole !== 'ALL') {
        const role = await prisma.role.findUnique({ where: { name: targetRole } });
        if (role) userFilter.roleId = role.id;
      }
      const targetUsers = await prisma.user.findMany({
        where: userFilter,
        select: { id: true },
      });
      recipientIds = targetUsers.map((u) => u.id);
    }

    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map((rId) => ({
          recipientId: rId,
          title,
          message,
          channel: 'IN_APP',
          isRead: false,
          sentAt: new Date(),
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: `Notification dispatched to ${recipientIds.length} recipient(s).`,
      count: recipientIds.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
};
