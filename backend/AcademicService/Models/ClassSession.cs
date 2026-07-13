using System;

namespace AcademicService.Models
{
    public class ClassSession
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public DateTime SessionDateTime { get; set; } // in IST
        public string TopicCovered { get; set; }
        public string Status { get; set; } // Scheduled, Completed, Rescheduled
    }
}
