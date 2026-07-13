using System;

namespace AcademicService.Models
{
    public class Subject
    {
        public Guid Id { get; set; }
        public string Code { get; set; } // CS101
        public string Name { get; set; }
        public string Department { get; set; } // CSE
        public DateTime CreatedAt { get; set; }
    }
}
