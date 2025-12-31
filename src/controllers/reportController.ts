import { Request, Response } from 'express';
import { format } from 'date-fns';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';

export const generateInactivityLog = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    // Fetch inactivity logs from the database
    const inactivityLogs = await prisma.inactivityLog.findMany({
      where: {
        startTime: {
          gte: new Date(fromDate as string),
          lte: new Date(toDate as string),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: 'inactivity_log.csv',
      header: [
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'startTime', title: 'Start Time' },
        { id: 'endTime', title: 'End Time' },
        { id: 'duration', title: 'Duration (minutes)' },
        { id: 'type', title: 'Type' },
        { id: 'reason', title: 'Reason' },
      ],
    });

    // Format data for CSV
    const records = inactivityLogs.map(log => ({
      userName: log.user.name,
      userEmail: log.user.email,
      startTime: format(log.startTime, 'yyyy-MM-dd HH:mm:ss'),
      endTime: log.endTime ? format(log.endTime, 'yyyy-MM-dd HH:mm:ss') : 'Ongoing',
      duration: log.durationMinutes,
      type: log.type,
      reason: log.reason || 'N/A',
    }));

    // Write to CSV
    await csvWriter.writeRecords(records);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inactivity_log.csv');

    // Send the file
    res.download('inactivity_log.csv');
  } catch (error) {
    console.error('Error generating inactivity log:', error);
    res.status(500).json({ error: 'Failed to generate inactivity log' });
  }
};

export const generateUserActivityExport = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    // Fetch user activity data
    const userActivities = await prisma.userActivity.findMany({
      where: {
        date: {
          gte: new Date(fromDate as string),
          lte: new Date(toDate as string),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Activity');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'User Email', key: 'userEmail', width: 30 },
      { header: 'Total Hours', key: 'totalHours', width: 15 },
      { header: 'Active Hours', key: 'activeHours', width: 15 },
      { header: 'Idle Hours', key: 'idleHours', width: 15 },
      { header: 'Activity Percentage', key: 'activityPercentage', width: 20 },
    ];

    // Add data rows
    userActivities.forEach(activity => {
      worksheet.addRow({
        date: format(activity.date, 'yyyy-MM-dd'),
        userName: activity.user.name,
        userEmail: activity.user.email,
        totalHours: activity.totalHours.toFixed(2),
        activeHours: activity.activeHours.toFixed(2),
        idleHours: activity.idleHours.toFixed(2),
        activityPercentage: `${activity.activityPercentage.toFixed(1)}%`,
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=user_activity.xlsx');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating user activity export:', error);
    res.status(500).json({ error: 'Failed to generate user activity export' });
  }
}; 