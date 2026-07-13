using System;

namespace AcademicService.Models
{
    public class ClassTeacherAssignment
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public string ScheduleTime { get; set; } // e.g. "Mon 10:00 AM, Wed 02:00 PM"
    }
}
