using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface ISubjectRepository
    {
        Task<Subject> GetByIdAsync(Guid id);
        Task<Subject> GetByCodeAsync(string code);
        Task<IEnumerable<Subject>> GetAllAsync();
        Task AddAsync(Subject subject);
        Task UpdateAsync(Subject subject);
        Task DeleteAsync(Guid id);
    }
}
