using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface IExamRepository
    {
        Task<Exam> GetByIdAsync(Guid id);
        Task<IEnumerable<Exam>> GetByClassIdAsync(Guid classId);
        Task AddAsync(Exam exam);
        Task UpdateAsync(Exam exam);
        Task DeleteAsync(Guid id);

        // Exam marks
        Task<IEnumerable<ExamMarks>> GetMarksByExamIdAsync(Guid examId);
        Task<ExamMarks> GetStudentMarksAsync(Guid examId, string enrollmentNumber);
        Task SaveMarksAsync(ExamMarks marks);
    }
}
