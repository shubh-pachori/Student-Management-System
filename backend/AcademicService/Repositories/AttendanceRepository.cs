using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly AcademicDbContext _context;

        public AttendanceRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<Attendance> GetByIdAsync(Guid id)
        {
            return await _context.Attendances.FindAsync(id);
        }

        public async Task<Attendance> GetBySessionAndEnrollmentAsync(Guid sessionId, string enrollmentNumber)
        {
            return await _context.Attendances
                .FirstOrDefaultAsync(a => a.ClassSessionId == sessionId && a.EnrollmentNumber.ToLower() == enrollmentNumber.ToLower());
        }

        public async Task<IEnumerable<Attendance>> GetBySessionIdAsync(Guid sessionId)
        {
            return await _context.Attendances.Where(a => a.ClassSessionId == sessionId).ToListAsync();
        }

        public async Task<IEnumerable<Attendance>> GetByEnrollmentNumberAsync(string enrollmentNumber)
        {
            return await _context.Attendances.Where(a => a.EnrollmentNumber.ToLower() == enrollmentNumber.ToLower()).ToListAsync();
        }

        public async Task AddAsync(Attendance attendance)
        {
            await _context.Attendances.AddAsync(attendance);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Attendance attendance)
        {
            _context.Attendances.Update(attendance);
            await _context.SaveChangesAsync();
        }

        public async Task AddOrUpdateScanAsync(Guid sessionId, string enrollmentNumber, DateTime scanTime)
        {
            var record = await GetBySessionAndEnrollmentAsync(sessionId, enrollmentNumber);
            if (record == null)
            {
                // First Scan: Check-In
                record = new Attendance
                {
                    Id = Guid.NewGuid(),
                    ClassSessionId = sessionId,
                    EnrollmentNumber = enrollmentNumber,
                    CheckInTime = scanTime,
                    CheckOutTime = null,
                    Status = "Partial", // Entered class but not checked out yet
                    IsManual = false
                };
                await _context.Attendances.AddAsync(record);
            }
            else if (record.CheckOutTime == null)
            {
                // Second Scan: Check-Out
                record.CheckOutTime = scanTime;
                record.Status = "Present"; // Complete attendance
                _context.Attendances.Update(record);
            }
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
