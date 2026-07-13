using IdentityService.Data;
using IdentityService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly IdentityDbContext _context;

        public UserRepository(IdentityDbContext context)
        {
            _context = context;
        }

        public async Task<User> GetByIdAsync(Guid id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<User> GetByEmployeeIdAsync(string employeeId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId.ToLower() == employeeId.ToLower());
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<IEnumerable<User>> GetByRoleAsync(string role)
        {
            return await _context.Users.Where(u => u.Role == role).ToListAsync();
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<string> GenerateNextEmployeeIdAsync()
        {
            int year = DateTime.Now.Year;
            string prefix = $"EMP-{year}-";
            
            var maxIdUser = await _context.Users
                .Where(u => u.EmployeeId.StartsWith(prefix))
                .OrderByDescending(u => u.EmployeeId)
                .FirstOrDefaultAsync();

            int nextNum = 1;
            if (maxIdUser != null)
            {
                var parts = maxIdUser.EmployeeId.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
                {
                    nextNum = lastNum + 1;
                }
            }

            return $"{prefix}{nextNum:D4}";
        }
    }
}
