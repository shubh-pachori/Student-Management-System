using IdentityService.Data;
using IdentityService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly IdentityDbContext _context;

        public StudentRepository(IdentityDbContext context)
        {
            _context = context;
        }

        public async Task<Student> GetByIdAsync(Guid id)
        {
            return await _context.Students.FindAsync(id);
        }

        public async Task<Student> GetByEmailAsync(string email)
        {
            return await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == email.ToLower());
        }

        public async Task<Student> GetByEnrollmentNumberAsync(string enrollmentNumber)
        {
            return await _context.Students.FirstOrDefaultAsync(s => s.EnrollmentNumber.ToLower() == enrollmentNumber.ToLower());
        }

        public async Task<IEnumerable<Student>> GetAllAsync()
        {
            return await _context.Students.ToListAsync();
        }

        public async Task AddAsync(Student student)
        {
            await _context.Students.AddAsync(student);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Student student)
        {
            _context.Students.Update(student);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student != null)
            {
                _context.Students.Remove(student);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<string> GenerateNextEnrollmentNumberAsync()
        {
            int year = DateTime.Now.Year;
            string prefix = $"ENR-{year}-";
            
            var maxIdStudent = await _context.Students
                .Where(s => s.EnrollmentNumber.StartsWith(prefix))
                .OrderByDescending(s => s.EnrollmentNumber)
                .FirstOrDefaultAsync();

            int nextNum = 1;
            if (maxIdStudent != null)
            {
                var parts = maxIdStudent.EnrollmentNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
                {
                    nextNum = lastNum + 1;
                }
            }

            return $"{prefix}{nextNum:D4}";
        }
    }
}
