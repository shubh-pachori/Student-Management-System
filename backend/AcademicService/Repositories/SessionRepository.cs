using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class SessionRepository : ISessionRepository
    {
        private readonly AcademicDbContext _context;

        public SessionRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<ClassSession> GetByIdAsync(Guid id)
        {
            return await _context.ClassSessions.FindAsync(id);
        }

        public async Task<IEnumerable<ClassSession>> GetByClassIdAsync(Guid classId)
        {
            return await _context.ClassSessions.Where(s => s.ClassId == classId).ToListAsync();
        }

        public async Task<IEnumerable<ClassSession>> GetByTeacherIdAsync(Guid teacherId)
        {
            return await _context.ClassSessions.Where(s => s.TeacherId == teacherId).ToListAsync();
        }

        public async Task AddAsync(ClassSession session)
        {
            await _context.ClassSessions.AddAsync(session);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ClassSession session)
        {
            _context.ClassSessions.Update(session);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var session = await _context.ClassSessions.FindAsync(id);
            if (session != null)
            {
                // Clean up attendance records for this session too
                var attendances = _context.Attendances.Where(a => a.ClassSessionId == id);
                _context.Attendances.RemoveRange(attendances);

                _context.ClassSessions.Remove(session);
                await _context.SaveChangesAsync();
            }
        }
    }
}
