using IdentityService.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace IdentityService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudentRepository _studentRepository;

        public UsersController(IUserRepository userRepository, IStudentRepository studentRepository)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated." });
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = user.Id,
                        role = user.Role,
                        name = user.Name,
                        email = user.Email,
                        phoneNumber = user.PhoneNumber,
                        gender = user.Gender,
                        dateOfBirth = user.DateOfBirth,
                        profilePictureUrl = user.ProfilePictureUrl,
                        identifier = user.EmployeeId
                    }
                });
            }

            var student = await _studentRepository.GetByIdAsync(userId);
            if (student != null)
            {
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = student.Id,
                        role = "Student",
                        name = student.Name,
                        email = student.Email,
                        phoneNumber = student.PhoneNumber,
                        gender = student.Gender,
                        dateOfBirth = student.DateOfBirth,
                        profilePictureUrl = student.ProfilePictureUrl,
                        identifier = student.EnrollmentNumber,
                        year = student.Year,
                        program = student.Program
                    }
                });
            }

            return NotFound(new { success = false, message = "Profile not found." });
        }
    }
}
