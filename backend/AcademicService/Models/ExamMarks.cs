using System;

namespace AcademicService.Models
{
    public class ExamMarks
    {
        public Guid Id { get; set; }
        public Guid ExamId { get; set; }
        public string EnrollmentNumber { get; set; }
        public decimal Marks { get; set; }
        public string Remarks { get; set; }
        public bool IsLocked { get; set; }
    }
}
