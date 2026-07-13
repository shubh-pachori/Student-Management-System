using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface IClassRepository
    {
        Task<Class> GetByIdAsync(Guid id);
        Task<IEnumerable<Class>> GetAllAsync();
        Task AddAsync(Class @class);
        Task UpdateAsync(Class @class);
        Task DeleteAsync(Guid id);

        // Teacher assignments
        Task<IEnumerable<ClassTeacherAssignment>> GetAssignmentsByClassIdAsync(Guid classId);
        Task<IEnumerable<ClassTeacherAssignment>> GetAssignmentsByTeacherIdAsync(Guid teacherId);
        Task AssignTeacherAsync(ClassTeacherAssignment assignment);
        Task RemoveAssignmentAsync(Guid assignmentId);
    }
}
