using System;

namespace IdentityService.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string EmployeeId { get; set; } // EMP-YYYY-XXXX
        public string Name { get; set; }
        public string ProfilePictureUrl { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } // Admin, LabAdmin, Teacher
        public DateTime CreatedAt { get; set; }
    }
}
