using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface IAttendanceRepository
    {
        Task<Attendance> GetByIdAsync(Guid id);
        Task<Attendance> GetBySessionAndEnrollmentAsync(Guid sessionId, string enrollmentNumber);
        Task<IEnumerable<Attendance>> GetBySessionIdAsync(Guid sessionId);
        Task<IEnumerable<Attendance>> GetByEnrollmentNumberAsync(string enrollmentNumber);
        Task AddAsync(Attendance attendance);
        Task UpdateAsync(Attendance attendance);
        Task AddOrUpdateScanAsync(Guid sessionId, string enrollmentNumber, DateTime scanTime);
        Task SaveChangesAsync();
    }
}
