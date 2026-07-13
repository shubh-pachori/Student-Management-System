using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface IAssignmentRepository
    {
        Task<Assignment> GetByIdAsync(Guid id);
        Task<IEnumerable<Assignment>> GetByClassIdAsync(Guid classId);
        Task<IEnumerable<Assignment>> GetByTeacherIdAsync(Guid teacherId);
        Task AddAsync(Assignment assignment);
        Task UpdateAsync(Assignment assignment);
        Task DeleteAsync(Guid id);

        // Assignment marks
        Task<IEnumerable<AssignmentMarks>> GetMarksByAssignmentIdAsync(Guid assignmentId);
        Task<AssignmentMarks> GetStudentMarksAsync(Guid assignmentId, string enrollmentNumber);
        Task SaveMarksAsync(AssignmentMarks marks);
        Task UpdateMarksAsync(AssignmentMarks marks);
    }
}
