using IdentityService.Models;

namespace IdentityService.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
        string GenerateToken(Student student);
    }
}
