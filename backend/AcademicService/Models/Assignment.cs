using System;

namespace AcademicService.Models
{
    public class Assignment
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime DueDate { get; set; } // in IST
    }
}
