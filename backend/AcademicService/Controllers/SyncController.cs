using AcademicService.Models;
using AcademicService.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AcademicService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SyncController : ControllerBase
    {
        private readonly IUserSyncRepository _syncRepository;

        public SyncController(IUserSyncRepository syncRepository)
        {
            _syncRepository = syncRepository;
        }

        [HttpPost("user")]
        public async Task<IActionResult> SyncUser([FromBody] UserSyncDto dto)
        {
            if (dto == null) return BadRequest();

            var userSync = new UserSync
            {
                Id = dto.Id,
                Role = dto.Role,
                Name = dto.Name,
                EmployeeIdOrEnrollment = dto.EmployeeIdOrEnrollment,
                Email = dto.Email
            };

            await _syncRepository.SyncUserAsync(userSync);
            return Ok(new { success = true, message = "User synced successfully." });
        }

        [HttpDelete("user/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _syncRepository.DeleteUserAsync(id);
            return Ok(new { success = true, message = "User unsynced successfully." });
        }
    }

    public class UserSyncDto
    {
        public Guid Id { get; set; }
        public string Role { get; set; }
        public string Name { get; set; }
        public string EmployeeIdOrEnrollment { get; set; }
        public string Email { get; set; }
    }
}
