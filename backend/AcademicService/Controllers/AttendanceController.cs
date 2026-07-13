using AcademicService.Helpers;
using AcademicService.Models;
using AcademicService.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceRepository _attendanceRepository;
        private readonly IUserSyncRepository _userSyncRepository;

        public AttendanceController(
            IAttendanceRepository attendanceRepository,
            IUserSyncRepository userSyncRepository)
        {
            _attendanceRepository = attendanceRepository;
            _userSyncRepository = userSyncRepository;
        }

        [HttpPost("scan-qr")]
        public async Task<IActionResult> ScanQr([FromBody] QrScanRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.EnrollmentNumber))
            {
                return BadRequest("Invalid scan payload.");
            }

            var student = await _userSyncRepository.GetByIdentifierAsync(request.EnrollmentNumber);
            if (student == null || student.Role.ToLower() != "student")
            {
                return BadRequest("Enrollment number is invalid or student does not exist.");
            }

            var now = TimeHelper.GetCurrentIst();
            await _attendanceRepository.AddOrUpdateScanAsync(request.ClassSessionId, request.EnrollmentNumber, now);

            var updated = await _attendanceRepository.GetBySessionAndEnrollmentAsync(request.ClassSessionId, request.EnrollmentNumber);

            return Ok(new
            {
                success = true,
                message = $"Successfully processed scan for {student.Name}.",
                data = new
                {
                    enrollmentNumber = updated.EnrollmentNumber,
                    name = student.Name,
                    checkInTime = updated.CheckInTime,
                    checkOutTime = updated.CheckOutTime,
                    status = updated.Status
                }
            });
        }

        [HttpPost("manual")]
        public async Task<IActionResult> ManualAttendance([FromBody] ManualAttendanceRequest request)
        {
            if (request == null || request.Records == null) return BadRequest();

            foreach (var rec in request.Records)
            {
                var existing = await _attendanceRepository.GetBySessionAndEnrollmentAsync(request.ClassSessionId, rec.EnrollmentNumber);
                if (existing != null)
                {
                    existing.Status = rec.Status;
                    existing.IsManual = true;
                    if (rec.Status == "Present")
                    {
                        existing.CheckInTime ??= TimeHelper.GetCurrentIst();
                        existing.CheckOutTime ??= TimeHelper.GetCurrentIst().AddHours(1);
                    }
                    await _attendanceRepository.UpdateAsync(existing);
                }
                else
                {
                    var record = new Attendance
                    {
                        Id = Guid.NewGuid(),
                        ClassSessionId = request.ClassSessionId,
                        EnrollmentNumber = rec.EnrollmentNumber,
                        CheckInTime = rec.Status == "Present" ? TimeHelper.GetCurrentIst() : null,
                        CheckOutTime = rec.Status == "Present" ? TimeHelper.GetCurrentIst().AddHours(1) : null,
                        Status = rec.Status,
                        IsManual = true
                    };
                    await _attendanceRepository.AddAsync(record);
                }
            }

            return Ok(new { success = true, message = "Manual attendance saved successfully." });
        }

        [HttpPut("edit")]
        public async Task<IActionResult> EditAttendance([FromBody] EditAttendanceRequest request)
        {
            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Teachers are not authorized to edit attendance records. Only Lab Admins or Admins can." });
            }

            var record = await _attendanceRepository.GetBySessionAndEnrollmentAsync(request.ClassSessionId, request.EnrollmentNumber);
            if (record == null)
            {
                record = new Attendance
                {
                    Id = Guid.NewGuid(),
                    ClassSessionId = request.ClassSessionId,
                    EnrollmentNumber = request.EnrollmentNumber,
                    CheckInTime = request.Status == "Present" ? TimeHelper.GetCurrentIst() : null,
                    CheckOutTime = request.Status == "Present" ? TimeHelper.GetCurrentIst().AddHours(1) : null,
                    Status = request.Status,
                    IsManual = true
                };
                await _attendanceRepository.AddAsync(record);
            }
            else
            {
                record.Status = request.Status;
                if (request.Status == "Present")
                {
                    record.CheckInTime ??= TimeHelper.GetCurrentIst();
                    record.CheckOutTime ??= TimeHelper.GetCurrentIst().AddHours(1);
                }
                else if (request.Status == "Absent")
                {
                    record.CheckInTime = null;
                    record.CheckOutTime = null;
                }
                record.IsManual = true;
                await _attendanceRepository.UpdateAsync(record);
            }

            return Ok(new { success = true, message = "Attendance record updated by coordinator/admin.", data = record });
        }

        [HttpGet("session/{sessionId}")]
        public async Task<IActionResult> GetSessionAttendance(Guid sessionId)
        {
            var records = await _attendanceRepository.GetBySessionIdAsync(sessionId);
            return Ok(new { success = true, data = records });
        }
    }

    public class QrScanRequest
    {
        public Guid ClassSessionId { get; set; }
        public string EnrollmentNumber { get; set; }
    }

    public class ManualAttendanceRequest
    {
        public Guid ClassSessionId { get; set; }
        public List<ManualRecord> Records { get; set; }
    }

    public class ManualRecord
    {
        public string EnrollmentNumber { get; set; }
        public string Status { get; set; }
    }

    public class EditAttendanceRequest
    {
        public Guid ClassSessionId { get; set; }
        public string EnrollmentNumber { get; set; }
        public string Status { get; set; }
    }
}
