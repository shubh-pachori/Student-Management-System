using System;
using System.Threading.Tasks;

namespace IdentityService.Services
{
    public interface ISyncService
    {
        Task SyncUserAsync(Guid id, string role, string name, string identifier, string email);
        Task DeleteUserAsync(Guid id);
    }
}
