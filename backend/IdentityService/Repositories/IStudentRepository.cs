using IdentityService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public interface IStudentRepository
    {
        Task<Student> GetByIdAsync(Guid id);
        Task<Student> GetByEmailAsync(string email);
        Task<Student> GetByEnrollmentNumberAsync(string enrollmentNumber);
        Task<IEnumerable<Student>> GetAllAsync();
        Task AddAsync(Student student);
        Task UpdateAsync(Student student);
        Task DeleteAsync(Guid id);
        Task<string> GenerateNextEnrollmentNumberAsync();
    }
}
