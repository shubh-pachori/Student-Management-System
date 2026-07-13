using IdentityService.Data;
using IdentityService.Helpers;
using IdentityService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public class OtpRepository : IOtpRepository
    {
        private readonly IdentityDbContext _context;

        public OtpRepository(IdentityDbContext context)
        {
            _context = context;
        }

        public async Task CreateOtpAsync(string email, string code)
        {
            // Invalidate older unused OTPs for this email
            var existingOtps = await _context.Otps
                .Where(o => o.Email.ToLower() == email.ToLower() && !o.IsUsed)
                .ToListAsync();

            foreach (var existing in existingOtps)
            {
                existing.IsUsed = true;
            }

            var otp = new Otp
            {
                Id = Guid.NewGuid(),
                Email = email,
                OtpCode = code,
                ExpiresAt = TimeHelper.GetCurrentIst().AddMinutes(10), // Valid for 10 minutes (IST)
                IsUsed = false
            };

            await _context.Otps.AddAsync(otp);
            await _context.SaveChangesAsync();
        }

        public async Task<Otp> GetLatestValidOtpAsync(string email, string code)
        {
            var now = TimeHelper.GetCurrentIst();
            return await _context.Otps
                .Where(o => o.Email.ToLower() == email.ToLower() 
                            && o.OtpCode == code 
                            && !o.IsUsed 
                            && o.ExpiresAt > now)
                .OrderByDescending(o => o.ExpiresAt)
                .FirstOrDefaultAsync();
        }

        public async Task MarkOtpAsUsedAsync(Otp otp)
        {
            otp.IsUsed = true;
            _context.Otps.Update(otp);
            await _context.SaveChangesAsync();
        }
    }
}
