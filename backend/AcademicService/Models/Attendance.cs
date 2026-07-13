using System;

namespace AcademicService.Models
{
    public class Attendance
    {
        public Guid Id { get; set; }
        public Guid ClassSessionId { get; set; }
        public string EnrollmentNumber { get; set; } // maps to student
        public DateTime? CheckInTime { get; set; } // in IST
        public DateTime? CheckOutTime { get; set; } // in IST
        public string Status { get; set; } // Present, Absent, Partial
        public bool IsManual { get; set; }
    }
}
