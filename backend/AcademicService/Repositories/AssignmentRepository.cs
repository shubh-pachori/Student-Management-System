using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class AssignmentRepository : IAssignmentRepository
    {
        private readonly AcademicDbContext _context;

        public AssignmentRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<Assignment> GetByIdAsync(Guid id)
        {
            return await _context.Assignments.FindAsync(id);
        }

        public async Task<IEnumerable<Assignment>> GetByClassIdAsync(Guid classId)
        {
            return await _context.Assignments.Where(a => a.ClassId == classId).ToListAsync();
        }

        public async Task<IEnumerable<Assignment>> GetByTeacherIdAsync(Guid teacherId)
        {
            return await _context.Assignments.Where(a => a.TeacherId == teacherId).ToListAsync();
        }

        public async Task AddAsync(Assignment assignment)
        {
            await _context.Assignments.AddAsync(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Assignment assignment)
        {
            _context.Assignments.Update(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment != null)
            {
                // Clean up marks too
                var marks = _context.AssignmentMarks.Where(m => m.AssignmentId == id);
                _context.AssignmentMarks.RemoveRange(marks);

                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<AssignmentMarks>> GetMarksByAssignmentIdAsync(Guid assignmentId)
        {
            return await _context.AssignmentMarks.Where(m => m.AssignmentId == assignmentId).ToListAsync();
        }

        public async Task<AssignmentMarks> GetStudentMarksAsync(Guid assignmentId, string enrollmentNumber)
        {
            return await _context.AssignmentMarks
                .FirstOrDefaultAsync(m => m.AssignmentId == assignmentId && m.EnrollmentNumber.ToLower() == enrollmentNumber.ToLower());
        }

        public async Task SaveMarksAsync(AssignmentMarks marks)
        {
            var existing = await GetStudentMarksAsync(marks.AssignmentId, marks.EnrollmentNumber);
            if (existing != null)
            {
                existing.Marks = marks.Marks;
                existing.Remarks = marks.Remarks;
                existing.IsLocked = marks.IsLocked;
                _context.AssignmentMarks.Update(existing);
            }
            else
            {
                await _context.AssignmentMarks.AddAsync(marks);
            }
            await _context.SaveChangesAsync();
        }

        public async Task UpdateMarksAsync(AssignmentMarks marks)
        {
            _context.AssignmentMarks.Update(marks);
            await _context.SaveChangesAsync();
        }
    }
}
