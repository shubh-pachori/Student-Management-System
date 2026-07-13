using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class ExamRepository : IExamRepository
    {
        private readonly AcademicDbContext _context;

        public ExamRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<Exam> GetByIdAsync(Guid id)
        {
            return await _context.Exams.FindAsync(id);
        }

        public async Task<IEnumerable<Exam>> GetByClassIdAsync(Guid classId)
        {
            return await _context.Exams.Where(e => e.ClassId == classId).ToListAsync();
        }

        public async Task AddAsync(Exam exam)
        {
            await _context.Exams.AddAsync(exam);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Exam exam)
        {
            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam != null)
            {
                // Clean up marks too
                var marks = _context.ExamMarks.Where(m => m.ExamId == id);
                _context.ExamMarks.RemoveRange(marks);

                _context.Exams.Remove(exam);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<ExamMarks>> GetMarksByExamIdAsync(Guid examId)
        {
            return await _context.ExamMarks.Where(m => m.ExamId == examId).ToListAsync();
        }

        public async Task<ExamMarks> GetStudentMarksAsync(Guid examId, string enrollmentNumber)
        {
            return await _context.ExamMarks
                .FirstOrDefaultAsync(m => m.ExamId == examId && m.EnrollmentNumber.ToLower() == enrollmentNumber.ToLower());
        }

        public async Task SaveMarksAsync(ExamMarks marks)
        {
            var existing = await GetStudentMarksAsync(marks.ExamId, marks.EnrollmentNumber);
            if (existing != null)
            {
                existing.Marks = marks.Marks;
                existing.Remarks = marks.Remarks;
                existing.IsLocked = marks.IsLocked;
                _context.ExamMarks.Update(existing);
            }
            else
            {
                await _context.ExamMarks.AddAsync(marks);
            }
            await _context.SaveChangesAsync();
        }
    }
}
