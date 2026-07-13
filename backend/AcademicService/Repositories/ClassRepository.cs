using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class ClassRepository : IClassRepository
    {
        private readonly AcademicDbContext _context;

        public ClassRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<Class> GetByIdAsync(Guid id)
        {
            return await _context.Classes.FindAsync(id);
        }

        public async Task<IEnumerable<Class>> GetAllAsync()
        {
            return await _context.Classes.ToListAsync();
        }

        public async Task AddAsync(Class @class)
        {
            await _context.Classes.AddAsync(@class);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Class @class)
        {
            _context.Classes.Update(@class);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var @class = await _context.Classes.FindAsync(id);
            if (@class != null)
            {
                // Remove associated assignments as well
                var assignments = _context.ClassTeacherAssignments.Where(a => a.ClassId == id);
                _context.ClassTeacherAssignments.RemoveRange(assignments);

                _context.Classes.Remove(@class);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<ClassTeacherAssignment>> GetAssignmentsByClassIdAsync(Guid classId)
        {
            return await _context.ClassTeacherAssignments.Where(a => a.ClassId == classId).ToListAsync();
        }

        public async Task<IEnumerable<ClassTeacherAssignment>> GetAssignmentsByTeacherIdAsync(Guid teacherId)
        {
            return await _context.ClassTeacherAssignments.Where(a => a.TeacherId == teacherId).ToListAsync();
        }

        public async Task AssignTeacherAsync(ClassTeacherAssignment assignment)
        {
            // Remove existing assignment for same class and subject if any to prevent duplicates
            var existing = await _context.ClassTeacherAssignments
                .FirstOrDefaultAsync(a => a.ClassId == assignment.ClassId && a.SubjectId == assignment.SubjectId);
            
            if (existing != null)
            {
                _context.ClassTeacherAssignments.Remove(existing);
            }

            await _context.ClassTeacherAssignments.AddAsync(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveAssignmentAsync(Guid assignmentId)
        {
            var assignment = await _context.ClassTeacherAssignments.FindAsync(assignmentId);
            if (assignment != null)
            {
                _context.ClassTeacherAssignments.Remove(assignment);
                await _context.SaveChangesAsync();
            }
        }
    }
}
