using System;

namespace AcademicService.Models
{
    public class Class
    {
        public Guid Id { get; set; }
        public string Name { get; set; } // e.g. B.Tech CSE - Year 1
        public int Year { get; set; }
        public string Program { get; set; }
        public Guid LabAdminId { get; set; } // references UserSync
    }
}
