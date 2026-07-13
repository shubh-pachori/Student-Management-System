using AcademicService.Data;
using AcademicService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AcademicService.Repositories
{
    public class UserSyncRepository : IUserSyncRepository
    {
        private readonly AcademicDbContext _context;

        public UserSyncRepository(AcademicDbContext context)
        {
            _context = context;
        }

        public async Task<UserSync> GetByIdAsync(Guid id)
        {
            return await _context.UserSyncs.FindAsync(id);
        }

        public async Task<UserSync> GetByEmailAsync(string email)
        {
            return await _context.UserSyncs.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<UserSync> GetByIdentifierAsync(string identifier)
        {
            return await _context.UserSyncs
                .FirstOrDefaultAsync(u => u.EmployeeIdOrEnrollment.ToLower() == identifier.ToLower());
        }

        public async Task<IEnumerable<UserSync>> GetByRoleAsync(string role)
        {
            return await _context.UserSyncs.Where(u => u.Role.ToLower() == role.ToLower()).ToListAsync();
        }

        public async Task SyncUserAsync(UserSync user)
        {
            var existing = await GetByIdAsync(user.Id);
            if (existing != null)
            {
                existing.Name = user.Name;
                existing.Email = user.Email;
                existing.EmployeeIdOrEnrollment = user.EmployeeIdOrEnrollment;
                existing.Role = user.Role;
                _context.UserSyncs.Update(existing);
            }
            else
            {
                await _context.UserSyncs.AddAsync(user);
            }
            await _context.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var user = await GetByIdAsync(id);
            if (user != null)
            {
                _context.UserSyncs.Remove(user);
                await _context.SaveChangesAsync();
            }
        }
    }
}
