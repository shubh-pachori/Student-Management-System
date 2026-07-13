using IdentityService.Models;
using System.Threading.Tasks;

namespace IdentityService.Repositories
{
    public interface IOtpRepository
    {
        Task CreateOtpAsync(string email, string code);
        Task<Otp> GetLatestValidOtpAsync(string email, string code);
        Task MarkOtpAsUsedAsync(Otp otp);
    }
}
