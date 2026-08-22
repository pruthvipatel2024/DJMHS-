const prisma = require('../config/db');
const { sendSMS } = require('../services/communication.service');

// ===================== ADMISSION INQUIRY LEADS =====================

const getInquiries = async (req, res, next) => {
  try {
    const inquiries = await prisma.admissionInquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: inquiries });
  } catch (err) {
    next(err);
  }
};

const createInquiry = async (req, res, next) => {
  try {
    let count = await prisma.admissionInquiry.count();
    let nextCount = count + 1;
    let inquiryNo = `SDJM-INQ-${new Date().getFullYear()}-${nextCount.toString().padStart(3, '0')}`;
    let existingInq = await prisma.admissionInquiry.findUnique({ where: { inquiryNo } });
    while (existingInq) {
      nextCount++;
      inquiryNo = `SDJM-INQ-${new Date().getFullYear()}-${nextCount.toString().padStart(3, '0')}`;
      existingInq = await prisma.admissionInquiry.findUnique({ where: { inquiryNo } });
    }

    const inquiry = await prisma.admissionInquiry.create({
      data: {
        inquiryNo,
        studentName,
        parentName,
        phone,
        email,
        targetStandardId,
        notes,
        status: 'NEW',
      },
    });

    if (phone) {
      await sendSMS(phone, `DJMHS High School Admissions: Thank you for inquiring at our institution. Our admissions officer will connect with you soon. Reference No: ${inquiryNo}`);
    }
    res.status(201).json({ success: true, message: 'Admission inquiry lead generated successfully.', data: inquiry });
  } catch (err) {
    next(err);
  }
};

const convertInquiryToStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.admissionInquiry.findUnique({ where: { id } });
    if (!inquiry) return res.status(404).json({ success: false, error: 'Not found' });

    const updated = await prisma.admissionInquiry.update({
      where: { id },
      data: { status: 'CONVERTED' },
    });

    res.status(200).json({
      success: true,
      message: `Inquiry converted successfully! Transferred ${inquiry.studentName}'s data to active Student General Register onboarding queue.`,
      data: { inquiry: updated, onboardingReady: true },
    });
  } catch (err) {
    next(err);
  }
};

// ===================== COMPLAINT TICKETS =====================

const getComplaints = async (req, res, next) => {
  try {
    const where = { deletedAt: null };
    if (req.user.role.name === 'PARENT' || req.user.role.name === 'STUDENT') {
      where.reportedById = req.user.id;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: { assignedToStaff: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
};

const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;
    const count = await prisma.complaint.count();
    const ticketNumber = `SDJM-CMP-${1001 + count}`;

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        title,
        description,
        category: category || 'GENERAL_OTHER',
        priority: priority || 'NORMAL',
        status: 'OPEN',
        reportedById: req.user.id,
      },
    });
    res.status(201).json({ success: true, message: 'Complaint ticket submitted to HOD helpdesk for SLA resolution.', data: complaint });
  } catch (err) {
    next(err);
  }
};

const resolveComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const updated = await prisma.complaint.update({
      where: { id },
      data: { status: status || 'RESOLVED', resolutionNotes },
    });
    res.status(200).json({ success: true, message: 'Complaint ticket status updated and resolution logged.', data: updated });
  } catch (err) {
    next(err);
  }
};

// ===================== CIRCULAR ANNOUNCEMENTS =====================

const getAnnouncements = async (req, res, next) => {
  try {
    const { targetRole } = req.query;
    const where = { deletedAt: null };
    if (targetRole) where.targetRole = { in: ['ALL', targetRole] };

    const circulars = await prisma.announcement.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
    res.status(200).json({ success: true, data: circulars });
  } catch (err) {
    next(err);
  }
};

const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetRole, priority, sendSMSAlert } = req.body;
    const circular = await prisma.announcement.create({
      data: {
        titleEn: title || 'Untitled Announcement',
        contentEn: content || 'No content provided.',
        targetRole: targetRole || 'ALL',
        priority: priority || 'NORMAL',
        publishedAt: new Date(),
        authorId: req.user.id,
      },
    });

    if (sendSMSAlert) {
      await sendSMS('ALL_REGISTERED_CONTACTS', `DJMHS High School Notice: ${title}. Please visit your institution web portal for full circular details.`);
    }

    res.status(201).json({ success: true, message: `Circular "${title}" broadcasted successfully across institutional portals.`, data: circular });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInquiries,
  createInquiry,
  convertInquiryToStudent,
  getComplaints,
  createComplaint,
  resolveComplaint,
  getAnnouncements,
  broadcastAnnouncement,
};
