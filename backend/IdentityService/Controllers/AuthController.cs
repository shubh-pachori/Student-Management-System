using IdentityService.Helpers;
using IdentityService.Models;
using IdentityService.Repositories;
using IdentityService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace IdentityService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudentRepository _studentRepository;
        private readonly IOtpRepository _otpRepository;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserRepository userRepository,
            IStudentRepository studentRepository,
            IOtpRepository otpRepository,
            ITokenService tokenService,
            ILogger<AuthController> logger)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _otpRepository = otpRepository;
            _tokenService = tokenService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, message = "Email and password are required." });
            }

            // 1. Try to find user (Admin, LabAdmin, Teacher)
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user != null && PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                var token = _tokenService.GenerateToken(user);
                return Ok(new
                {
                    success = true,
                    token,
                    user = new { id = user.Id, name = user.Name, email = user.Email, role = user.Role, identifier = user.EmployeeId }
                });
            }

            // 2. Try to find student
            var student = await _studentRepository.GetByEmailAsync(request.Email);
            if (student != null && PasswordHasher.VerifyPassword(request.Password, student.PasswordHash))
            {
                var token = _tokenService.GenerateToken(student);
                return Ok(new
                {
                    success = true,
                    token,
                    user = new { id = student.Id, name = student.Name, email = student.Email, role = "Student", identifier = student.EnrollmentNumber }
                });
            }

            return Unauthorized(new { success = false, message = "Invalid email or password." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { success = false, message = "Email is required." });
            }

            var user = await _userRepository.GetByEmailAsync(request.Email);
            var student = await _studentRepository.GetByEmailAsync(request.Email);

            if (user == null && student == null)
            {
                return NotFound(new { success = false, message = "Email not found in system." });
            }

            var random = new Random();
            var otpCode = random.Next(100000, 999999).ToString();

            await _otpRepository.CreateOtpAsync(request.Email, otpCode);

            _logger.LogInformation("\n==================================================");
            _logger.LogInformation($"PASSWORD RESET OTP FOR {request.Email}: {otpCode}");
            _logger.LogInformation("==================================================\n");

            return Ok(new 
            { 
                success = true, 
                message = "An OTP has been generated for password reset. (Check console logs or copy from response).",
                otpCode = otpCode
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.OtpCode) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { success = false, message = "Email, OTP code, and new password are required." });
            }

            var validOtp = await _otpRepository.GetLatestValidOtpAsync(request.Email, request.OtpCode);
            if (validOtp == null)
            {
                return BadRequest(new { success = false, message = "Invalid or expired OTP code." });
            }

            await _otpRepository.MarkOtpAsUsedAsync(validOtp);

            var hashedNewPassword = PasswordHasher.HashPassword(request.NewPassword);

            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user != null)
            {
                user.PasswordHash = hashedNewPassword;
                await _userRepository.UpdateAsync(user);
                return Ok(new { success = true, message = "Password reset successful." });
            }

            var student = await _studentRepository.GetByEmailAsync(request.Email);
            if (student != null)
            {
                student.PasswordHash = hashedNewPassword;
                await _studentRepository.UpdateAsync(student);
                return Ok(new { success = true, message = "Password reset successful." });
            }

            return BadRequest(new { success = false, message = "User not found." });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; }
        public string OtpCode { get; set; }
        public string NewPassword { get; set; }
    }
}
