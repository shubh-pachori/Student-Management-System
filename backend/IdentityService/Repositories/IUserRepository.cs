using IdentityService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public interface IUserRepository
    {
        Task<User> GetByIdAsync(Guid id);
        Task<User> GetByEmailAsync(string email);
        Task<User> GetByEmployeeIdAsync(string employeeId);
        Task<IEnumerable<User>> GetAllAsync();
        Task<IEnumerable<User>> GetByRoleAsync(string role);
        Task AddAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(Guid id);
        Task<string> GenerateNextEmployeeIdAsync();
    }
}
