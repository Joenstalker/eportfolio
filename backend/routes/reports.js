const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes require authentication and admin role
router.use(auth, requireRole('admin'));

// Generate PDF Report
router.post('/generate-pdf', async (req, res) => {
  try {
    const { reportType, data, dateRange, faculty } = req.body;
    
    console.log('📊 Generating PDF report:', { reportType, dateRange, faculty });
    
    let pdfContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'summary':
        pdfContent = generateSummaryReport(data, dateRange, faculty);
        filename = 'faculty-portfolio-summary';
        break;
      case 'activities':
        pdfContent = generateActivitiesReport(data, dateRange, faculty);
        filename = 'faculty-activities-report';
        break;
      case 'performance':
        pdfContent = generatePerformanceReport(data, dateRange, faculty);
        filename = 'faculty-performance-report';
        break;
      case 'seminar-participation':
        pdfContent = generateSeminarParticipationReport(data, dateRange);
        filename = 'seminar-participation-report';
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set content and styles
    await page.setContent(pdfContent);
    await page.addStyleTag({
      content: `
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6;
        }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .summary-card { 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          padding: 15px; 
          margin: 10px 0; 
          background-color: #f9fafb; 
        }
        .stat-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .stat-label { font-weight: bold; }
        .stat-value { color: #2563eb; }
        @media print { body { margin: 10px; } }
      `
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log('✅ PDF report generated successfully:', filename);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF report',
      error: error.message 
    });
  }
});

// Get report data
router.get('/data', async (req, res) => {
  try {
    const { type, startDate, endDate, facultyId } = req.query;
    
    console.log('📊 Fetching report data:', { type, startDate, endDate, facultyId });
    
    let reportData = {};
    
    switch (type) {
      case 'faculty-summary':
        reportData = await getFacultySummaryData(startDate, endDate, facultyId);
        break;
      case 'seminar-stats':
        reportData = await getSeminarStatsData(startDate, endDate);
        break;
      case 'course-analytics':
        reportData = await getCourseAnalyticsData(startDate, endDate);
        break;
      case 'user-activity':
        reportData = await getUserActivityData(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report data type' });
    }
    
    res.json(reportData);
    
  } catch (error) {
    console.error('❌ Error fetching report data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch report data',
      error: error.message 
    });
  }
});

// ==================== REPORT GENERATION FUNCTIONS ====================

function generateSummaryReport(facultyData, dateRange, selectedFaculty) {
  const filteredFaculty = selectedFaculty !== 'all' 
    ? facultyData.filter(f => f._id === selectedFaculty)
    : facultyData;
  
  const activeFaculty = filteredFaculty.filter(f => f.isActive);
  const departments = [...new Set(filteredFaculty.map(f => f.department))];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Faculty Portfolio Summary Report</title>
    </head>
    <body>
      <h1>Faculty Portfolio Summary Report</h1>
      <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Date Range:</strong> ${dateRange.start || 'All Time'} to ${dateRange.end || 'Present'}</p>
      
      <div class="summary-card">
        <h2>Executive Summary</h2>
        <div class="stat-row">
          <span class="stat-label">Total Faculty:</span>
          <span class="stat-value">${filteredFaculty.length}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Active Faculty:</span>
          <span class="stat-value">${activeFaculty.length}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Departments:</span>
          <span class="stat-value">${departments.length}</span>
        </div>
      </div>
      
      <h2>Faculty Details</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          ${filteredFaculty.map(faculty => `
            <tr>
              <td>${faculty.firstName} ${faculty.lastName}</td>
              <td>${faculty.email}</td>
              <td>${faculty.department}</td>
              <td>${faculty.role}</td>
              <td>${faculty.isActive ? 'Active' : 'Inactive'}</td>
              <td>${new Date(faculty.updatedAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Department Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Faculty Count</th>
            <th>Active Faculty</th>
          </tr>
        </thead>
        <tbody>
          ${departments.map(dept => {
            const deptFaculty = filteredFaculty.filter(f => f.department === dept);
            const activeDeptFaculty = deptFaculty.filter(f => f.isActive);
            return `
              <tr>
                <td>${dept}</td>
                <td>${deptFaculty.length}</td>
                <td>${activeDeptFaculty.length}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateActivitiesReport(facultyData, dateRange, selectedFaculty) {
  const filteredFaculty = selectedFaculty !== 'all' 
    ? facultyData.filter(f => f._id === selectedFaculty)
    : facultyData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Faculty Activities Report</title>
    </head>
    <body>
      <h1>Faculty Activities Report</h1>
      <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Date Range:</strong> ${dateRange.start || 'All Time'} to ${dateRange.end || 'Present'}</p>
      
      <h2>Faculty Activities Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Faculty Name</th>
            <th>Department</th>
            <th>Recent Activities</th>
            <th>Seminars Attended</th>
            <th>Courses Assigned</th>
            <th>Last Login</th>
          </tr>
        </thead>
        <tbody>
          ${filteredFaculty.map(faculty => `
            <tr>
              <td>${faculty.firstName} ${faculty.lastName}</td>
              <td>${faculty.department}</td>
              <td>Profile updated, Course assignments</td>
              <td>0</td> <!-- TODO: Implement actual activity tracking -->
              <td>0</td> <!-- TODO: Implement course assignment count -->
              <td>${new Date(faculty.updatedAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generatePerformanceReport(facultyData, dateRange, selectedFaculty) {
  const filteredFaculty = selectedFaculty !== 'all' 
    ? facultyData.filter(f => f._id === selectedFaculty)
    : facultyData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Faculty Performance Report</title>
    </head>
    <body>
      <h1>Faculty Performance Report</h1>
      <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Date Range:</strong> ${dateRange.start || 'All Time'} to ${dateRange.end || 'Present'}</p>
      
      <h2>Performance Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Faculty Name</th>
            <th>Department</th>
            <th>Profile Completion</th>
            <th>Portfolio Items</th>
            <th>Activity Score</th>
            <th>Performance Rating</th>
          </tr>
        </thead>
        <tbody>
          ${filteredFaculty.map(faculty => `
            <tr>
              <td>${faculty.firstName} ${faculty.lastName}</td>
              <td>${faculty.department}</td>
              <td>85%</td> <!-- TODO: Implement actual completion calculation -->
              <td>12</td> <!-- TODO: Implement portfolio item count -->
              <td>Good</td>
              <td>4.2/5.0</td> <!-- TODO: Implement performance scoring -->
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateSeminarParticipationReport(seminarData, dateRange) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Seminar Participation Report</title>
    </head>
    <body>
      <h1>Seminar Participation Report</h1>
      <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Date Range:</strong> ${dateRange.start || 'All Time'} to ${dateRange.end || 'Present'}</p>
      
      <h2>Seminar Participation Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Seminar Title</th>
            <th>Date</th>
            <th>Department</th>
            <th>Participants</th>
            <th>Participation Rate</th>
            <th>Compliance Status</th>
          </tr>
        </thead>
        <tbody>
          ${seminarData.map(seminar => `
            <tr>
              <td>${seminar.title}</td>
              <td>${new Date(seminar.date).toLocaleDateString()}</td>
              <td>${seminar.department || 'N/A'}</td>
              <td>${seminar.participants?.length || 0}</td>
              <td>${Math.round((seminar.participants?.length || 0) / 50 * 100)}%</td> <!-- TODO: Use actual faculty count -->
              <td>${(seminar.participants?.length || 0) >= 25 ? 'Compliant' : 'Non-Compliant'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

// ==================== DATA FETCHING FUNCTIONS ====================

async function getFacultySummaryData(startDate, endDate, facultyId) {
  const User = require('../models/User');
  const query = {};
  
  if (startDate || endDate) {
    query.updatedAt = {};
    if (startDate) query.updatedAt.$gte = new Date(startDate);
    if (endDate) query.updatedAt.$lte = new Date(endDate);
  }
  
  if (facultyId && facultyId !== 'all') {
    query._id = facultyId;
  }
  
  const faculty = await User.find(query).select('firstName lastName email department role isActive updatedAt');
  return faculty;
}

async function getSeminarStatsData(startDate, endDate) {
  const Seminar = require('../models/Seminar');
  const query = {};
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const seminars = await Seminar.find(query)
    .populate('participants', 'firstName lastName email department')
    .sort({ date: -1 });
  
  return seminars;
}

async function getCourseAnalyticsData(startDate, endDate) {
  const Course = require('../models/Course');
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const courses = await Course.find(query);
  return courses;
}

async function getUserActivityData(startDate, endDate) {
  // TODO: Implement user activity logging
  return {
    activities: [],
    totalActivities: 0,
    activeUsers: 0
  };
}

module.exports = router;
