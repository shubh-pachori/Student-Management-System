using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class SubjectRepository : ISubjectRepository
    {
        private readonly AcademicDbContext _context;

        public SubjectRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<Subject> GetByIdAsync(Guid id)
        {
            return await _context.Subjects.FindAsync(id);
        }

        public async Task<Subject> GetByCodeAsync(string code)
        {
            return await _context.Subjects.FirstOrDefaultAsync(s => s.Code.ToLower() == code.ToLower());
        }

        public async Task<IEnumerable<Subject>> GetAllAsync()
        {
            return await _context.Subjects.ToListAsync();
        }

        public async Task AddAsync(Subject subject)
        {
            await _context.Subjects.AddAsync(subject);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Subject subject)
        {
            _context.Subjects.Update(subject);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject != null)
            {
                _context.Subjects.Remove(subject);
                await _context.SaveChangesAsync();
            }
        }
    }
}
