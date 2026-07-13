using AcademicService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly AcademicDbContext _context;

        public ReportController(AcademicDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummaryReport(
            [FromQuery] Guid? classId, 
            [FromQuery] Guid? subjectId, 
            [FromQuery] int? year, 
            [FromQuery] string program)
        {
            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && !role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Access Denied. Reports are only accessible by the Principal/Admin." });
            }

            var sessionsQuery = _context.ClassSessions.AsQueryable();

            if (classId.HasValue)
            {
                sessionsQuery = sessionsQuery.Where(s => s.ClassId == classId.Value);
            }

            if (subjectId.HasValue)
            {
                sessionsQuery = sessionsQuery.Where(s => s.SubjectId == subjectId.Value);
            }

            if (year.HasValue || !string.IsNullOrEmpty(program))
            {
                var matchingClasses = _context.Classes.AsQueryable();
                if (year.HasValue)
                {
                    matchingClasses = matchingClasses.Where(c => c.Year == year.Value);
                }
                if (!string.IsNullOrEmpty(program))
                {
                    matchingClasses = matchingClasses.Where(c => c.Program.ToLower() == program.ToLower());
                }

                var classIds = await matchingClasses.Select(c => c.Id).ToListAsync();
                sessionsQuery = sessionsQuery.Where(s => classIds.Contains(s.ClassId));
            }

            var sessionIds = await sessionsQuery.Select(s => s.Id).ToListAsync();

            var attendanceRecords = await _context.Attendances
                .Where(a => sessionIds.Contains(a.ClassSessionId))
                .ToListAsync();

            var totalAttendanceRecords = attendanceRecords.Count;
            var presentCount = attendanceRecords.Count(a => a.Status == "Present");
            var partialCount = attendanceRecords.Count(a => a.Status == "Partial");
            var absentCount = attendanceRecords.Count(a => a.Status == "Absent");

            double attendanceRate = totalAttendanceRecords > 0 
                ? (double)(presentCount + (partialCount * 0.5)) / totalAttendanceRecords * 100 
                : 100;

            var assignmentsQuery = _context.Assignments.AsQueryable();
            if (classId.HasValue) assignmentsQuery = assignmentsQuery.Where(a => a.ClassId == classId.Value);
            if (subjectId.HasValue) assignmentsQuery = assignmentsQuery.Where(a => a.SubjectId == subjectId.Value);
            
            var assignmentIds = await assignmentsQuery.Select(a => a.Id).ToListAsync();

            var assignmentMarks = await _context.AssignmentMarks
                .Where(m => assignmentIds.Contains(m.AssignmentId))
                .ToListAsync();

            var avgAssignmentMarks = assignmentMarks.Any() ? assignmentMarks.Average(m => m.Marks) : 0;

            var examsQuery = _context.Exams.AsQueryable();
            if (classId.HasValue) examsQuery = examsQuery.Where(e => e.ClassId == classId.Value);
            if (subjectId.HasValue) examsQuery = examsQuery.Where(e => e.SubjectId == subjectId.Value);

            var examIds = await examsQuery.Select(e => e.Id).ToListAsync();

            var examMarks = await _context.ExamMarks
                .Where(m => examIds.Contains(m.ExamId))
                .ToListAsync();

            var avgExamMarks = examMarks.Any() ? examMarks.Average(m => m.Marks) : 0;

            var subjectReport = await _context.Subjects
                .Select(sub => new
                {
                    subjectCode = sub.Code,
                    subjectName = sub.Name,
                    averageMarks = _context.AssignmentMarks
                        .Where(am => _context.Assignments.Where(a => a.SubjectId == sub.Id).Select(a => a.Id).Contains(am.AssignmentId))
                        .Select(am => (double?)am.Marks)
                        .Average() ?? 0.0,
                    attendanceRate = _context.Attendances
                        .Where(a => _context.ClassSessions.Where(s => s.SubjectId == sub.Id).Select(s => s.Id).Contains(a.ClassSessionId))
                        .Any() 
                            ? (double)_context.Attendances.Where(a => _context.ClassSessions.Where(s => s.SubjectId == sub.Id).Select(s => s.Id).Contains(a.ClassSessionId)).Count(a => a.Status == "Present") 
                              / _context.Attendances.Where(a => _context.ClassSessions.Where(s => s.SubjectId == sub.Id).Select(s => s.Id).Contains(a.ClassSessionId)).Count() * 100 
                            : 100.0
                }).ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    totalSessions = sessionIds.Count,
                    attendanceStats = new
                    {
                        totalRecords = totalAttendanceRecords,
                        present = presentCount,
                        partial = partialCount,
                        absent = absentCount,
                        percentage = Math.Round(attendanceRate, 2)
                    },
                    marksStats = new
                    {
                        averageAssignmentMarks = Math.Round(avgAssignmentMarks, 2),
                        averageExamMarks = Math.Round(avgExamMarks, 2)
                    },
                    subjectBreakdown = subjectReport
                }
            });
        }
    }
}
