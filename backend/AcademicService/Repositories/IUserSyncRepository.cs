using AcademicService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public interface IUserSyncRepository
    {
        Task<UserSync> GetByIdAsync(Guid id);
        Task<UserSync> GetByEmailAsync(string email);
        Task<UserSync> GetByIdentifierAsync(string identifier); // EmployeeId or Enrollment
        Task<IEnumerable<UserSync>> GetByRoleAsync(string role);
        Task SyncUserAsync(UserSync user);
        Task DeleteUserAsync(Guid id);
    }
}
