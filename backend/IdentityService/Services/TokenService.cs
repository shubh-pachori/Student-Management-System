using IdentityService.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace IdentityService.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("name", user.Name),
                new Claim("role", user.Role), // Admin, LabAdmin, Teacher
                new Claim("employeeId", user.EmployeeId),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Email, user.Email)
            };

            return CreateToken(claims);
        }

        public string GenerateToken(Student student)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, student.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, student.Email),
                new Claim("name", student.Name),
                new Claim("role", "Student"),
                new Claim("enrollmentNumber", student.EnrollmentNumber),
                new Claim(ClaimTypes.Role, "Student"),
                new Claim(ClaimTypes.Email, student.Email)
            };

            return CreateToken(claims);
        }

        private string CreateToken(List<Claim> claims)
        {
            var secretKey = _config["JwtSettings:Key"] ?? "super_secret_key_student_management_system_2026_antigravity";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"] ?? "sms_auth_provider",
                audience: _config["JwtSettings:Audience"] ?? "sms_client",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
