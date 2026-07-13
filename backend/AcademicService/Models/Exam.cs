using System;

namespace AcademicService.Models
{
    public class Exam
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public string Title { get; set; }
        public DateTime ExamDate { get; set; } // in IST
        public decimal MaxMarks { get; set; }
    }
}
