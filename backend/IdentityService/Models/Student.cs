using System;

namespace IdentityService.Models
{
    public class Student
    {
        public Guid Id { get; set; }
        public string EnrollmentNumber { get; set; } // ENR-YYYY-XXXX
        public string Name { get; set; }
        public string ProfilePictureUrl { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string PasswordHash { get; set; }
        public int Year { get; set; }
        public string Program { get; set; } // e.g. B.Tech CSE
        public DateTime CreatedAt { get; set; }
    }
}
