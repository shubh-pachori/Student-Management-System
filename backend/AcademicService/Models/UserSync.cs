using System;

namespace AcademicService.Models
{
    public class UserSync
    {
        public Guid Id { get; set; }
        public string Role { get; set; } // Admin, LabAdmin, Teacher, Student
        public string Name { get; set; }
        public string EmployeeIdOrEnrollment { get; set; } // EMP-X or ENR-Y
        public string Email { get; set; }
    }
}
