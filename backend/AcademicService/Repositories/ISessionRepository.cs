using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface ISessionRepository
    {
        Task<ClassSession> GetByIdAsync(Guid id);
        Task<IEnumerable<ClassSession>> GetByClassIdAsync(Guid classId);
        Task<IEnumerable<ClassSession>> GetByTeacherIdAsync(Guid teacherId);
        Task AddAsync(ClassSession session);
        Task UpdateAsync(ClassSession session);
        Task DeleteAsync(Guid id);
    }
}
