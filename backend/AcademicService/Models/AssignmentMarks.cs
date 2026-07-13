using System;

namespace AcademicService.Models
{
    public class AssignmentMarks
    {
        public Guid Id { get; set; }
        public Guid AssignmentId { get; set; }
        public string EnrollmentNumber { get; set; }
        public decimal Marks { get; set; }
        public string Remarks { get; set; }
        public bool IsLocked { get; set; } // Once Teacher submits, it's locked. Only Lab Admin/Admin can edit.
    }
}
